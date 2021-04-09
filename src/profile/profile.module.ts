import { HttpModule, Module } from '@nestjs/common';
import { CacheModule } from 'src/cache/cache.module';
import { RglModule } from 'src/rgl/rgl.module';
import { RglService } from 'src/rgl/rgl.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [RglModule, HttpModule, CacheModule],
  providers: [RglService, ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
