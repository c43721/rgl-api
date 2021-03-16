import { HttpModule, Module } from '@nestjs/common';
import { BansModule } from './bans/bans.module';
import { RglModule } from './rgl/rgl.module';
import { ProfileModule } from './profile/profile.module';

@Module({
	imports: [BansModule, RglModule, HttpModule, ProfileModule],
})
export class AppModule {}
