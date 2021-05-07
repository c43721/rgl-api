import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/cache/cache.service';
import { RglService } from 'src/rgl/rgl.service';
import { Experience, ProfileBanDetails } from './profile.interface';

@Injectable()
export class ProfileService {
  constructor(
    private rglService: RglService,
    private cacheService: CacheService,
  ) {}

  async getBulkProfiles(
    steamIdArray: string[],
    formats: string[],
    onlyActive: boolean,
  ) {
    const bulkProfiles = await this.rglService.getBulkProfiles(steamIdArray);

    return bulkProfiles.map(profile => {
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

      return { ...rest, experience };
    });
  }

  async getProfile(steamId: string, disableCache: boolean = false) {
    if (disableCache) return await this.rglService.getProfile(steamId);

    const cachedProfile = await this.cacheService.getProfileCache(steamId);

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
