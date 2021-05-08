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

  async getBulkProfileCache(steamIdArray: string[]): Promise<Profile[]> {
    const valuesFromCache = await this.cacheManager.store.mget(
      steamIdArray.map(id => Caches.PROFILE_CACHE + id),
    );

    return valuesFromCache.filter((v: Profile) => v !== null) ?? [];
  }

  async setProfileCache(steamId: string, profile: Profile) {
    return await this.cacheManager.set(
      Caches.PROFILE_CACHE + steamId,
      profile,
      { ttl: CacheTimes.ONE_WEEK },
    );
  }

  async setBulkProfileCache(
    steamIdArray: string[],
    profiles: Profile[],
  ): Promise<void> {
    const msetArray = [];

    for (let i = 0; i < steamIdArray.length; i++) {
      const cacheKey = Caches.PROFILE_CACHE + steamIdArray[i];
      const cacheValue = profiles[i];
      msetArray.push(cacheKey, cacheValue);
    }

    // Haha! We can set TTL from MSET! Swag.
    await this.cacheManager.store.mset(...msetArray, {
      ttl: CacheTimes.ONE_DAY * 3,
    });
  }
}
