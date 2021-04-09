import { Injectable, CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Ban } from 'src/bans/bans.interface';
import { Caches } from 'src/enums/cache.enum';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getBanCache(): Promise<Ban[] | null> {
    return await this.cacheManager.get<Ban[]>(Caches.BAN_CACHE);
  }

  async setBanCache(newBans: Ban[]) {
    return await this.cacheManager.set<Ban[]>(Caches.BAN_CACHE, newBans);
  }
}
