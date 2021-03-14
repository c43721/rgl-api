import { CacheModule, HttpModule, Module } from '@nestjs/common';
import { RglService } from 'src/rgl/rgl.service';
import { BansController } from './bans.controller';

@Module({
	imports: [
		HttpModule,
		CacheModule.register({
			ttl: 60,
		}),
	],
	providers: [RglService],
	controllers: [BansController],
})
export class BansModule {}
