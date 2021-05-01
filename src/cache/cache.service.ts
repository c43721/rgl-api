import { Injectable, CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Ban } from 'src/bans/interfaces/bans.interface';
import { Profile } from 'src/profile/profile.interface';
import { CacheTimes, Caches } from './enums/cache.enum';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getBanCache(): Promise<Ban[] | null> {
    return await this.cacheManager.get(Caches.BAN_CACHE);
  }

  async setBanCache(newBans: Ban[]) {
    return await this.cacheManager.set(Caches.BAN_CACHE, newBans);
  }

  async getProfileCache(steamId: string): Promise<Profile | null> {
    return await this.cacheManager.get(Caches.PROFILE_CACHE + steamId);
  }

  async setProfileCache(steamId: string, profile: Profile) {
    return await this.cacheManager.set(
      Caches.PROFILE_CACHE + steamId,
      profile,
      { ttl: CacheTimes.ONE_WEEK },
    );
  }
}
