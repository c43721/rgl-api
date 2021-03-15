import { HttpModule, Module } from '@nestjs/common';
import { BansModule } from './bans/bans.module';
import { RglService } from './rgl/rgl.service';
import { RglModule } from './rgl/rgl.module';

@Module({
	imports: [BansModule, RglModule, HttpModule],
	providers: [RglService],
})
export class AppModule {}
