import { Module, CacheModule as NestCacheModule } from '@nestjs/common';
import { CacheService } from './cache.service';
import * as store from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store,
        max: 512,
        ttl: null,
        url: configService.get('REDIS_URL'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
