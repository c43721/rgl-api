import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from 'src/cache/cache.service';
import { RglService } from 'src/rgl/rgl.service';
import { Experience, Profile, ProfileBanDetails } from './profile.interface';

@Injectable()
export class ProfileService {
  private logger = new Logger(ProfileService.name);

  constructor(
    private rglService: RglService,
    private cacheService: CacheService,
  ) {}

  async getBulkProfiles(
    steamIdArray: string[],
    formats: string[],
    onlyActive: boolean,
    slim: boolean,
  ) {
    this.logger.verbose(
      `Parsing bulk profiles with ${steamIdArray.length} ids`,
    );
    this.logger.debug(`Profiles:\n${steamIdArray.join(' ')}`);
    /*
      This all deserves an explaination:

      Basically, we want to ensure that each profile coming is 3 things:
        1) Unique
        2) Cached or not Cached
        3) Real Id

      1 and 3 are mostly done by pipes and transforms, but 2 is needed to be done here.

      The way to achieve that could just be a foreach over the steamids and do a GET from Redis.
      This comes at a huge performance penalty at both Redis and Service level

      So instead, we grab the cached profiles first, then we create the differences array and scrape those only

      And we can push the cached and scraped profiles to the final profile array, which will parse how we want it to (like for single profiles)

      In the end, we end up doing n less operations to Redis by using mget and mset
    */
    const cachedProfiles = await this.cacheService.getBulkProfileCache(
      steamIdArray,
    );

    const cachedIds = cachedProfiles.map(p => p.steamId);
    const diffIds = steamIdArray.filter(id => !cachedIds.includes(id));

    const bulkProfiles = await this.rglService.getBulkProfiles(diffIds);

    const registeredPlayers = bulkProfiles.filter((p: any) => !p.message);

    const toCacheIds: string[] = [];
    const toCacheProfiles: Profile[] = [];
    registeredPlayers.forEach(p => {
      toCacheIds.push(p.steamId);
      toCacheProfiles.push(p);
    });

    await this.cacheService.setBulkProfileCache(toCacheIds, toCacheProfiles);

    return [...cachedProfiles, ...bulkProfiles].map(profile => {
      // Hacky, but worth.
      if ((profile as any).message) return profile;

      let { experience, banHistory, ...rest } = profile;

      if (formats) {
        experience = this.filterExperience(experience, formats);
      }

      if (onlyActive) {
        experience = experience.filter(
          experience => experience.isCurrentTeam === true,
        );
      }

      return slim
        ? { steamId: rest.steamId, name: rest.name, experience }
        : { ...rest, experience };
    });
  }

  async getProfile(steamId: string, disableCache?: boolean) {
    const cachedProfile = disableCache
      ? await this.rglService.getProfile(steamId)
      : await this.cacheService.getProfileCache(steamId);

    if (!cachedProfile) {
      const profile = await this.rglService.getProfile(steamId);

      await this.cacheService.setProfileCache(steamId, profile);

      return profile;
    }

    return cachedProfile;
  }

  async getProfileBans(
    steamid: string,
    showDetails: boolean,
    showPrevious: boolean,
  ): Promise<ProfileBanDetails> {
    const { banHistory, ...profile } = await this.getProfile(steamid);

    let profileToReturn: Omit<ProfileBanDetails, 'details' | 'previous'> = {
      steamId: profile.steamId,
      banned: profile.status.banned,
      probation: profile.status.probation,
      verified: profile.status.verified,
    };

    if (showDetails && banHistory[0].isCurrentBan) {
      profileToReturn = {
        ...profileToReturn,
        details: banHistory[0],
      } as ProfileBanDetails;
    }

    if (showPrevious) {
      profileToReturn = {
        ...profileToReturn,
        previous: banHistory,
      } as ProfileBanDetails;
    }

    return profileToReturn as ProfileBanDetails;
  }

  filterExperience(experience: Experience[], formats: string[]): Experience[] {
    return (
      experience.filter(team =>
        formats.some(format => team.season.startsWith(format)),
      ) || []
    );
  }
}
