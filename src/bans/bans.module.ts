import { CacheModule, HttpModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { RglService } from 'src/rgl/rgl.service';
import { BansController } from './bans.controller';
import { BansService } from './bans.service';

@Module({
	imports: [
		HttpModule,
		CacheModule.register({
			ttl: null,
		}),
		ScheduleModule.forRoot(),
		ConfigModule.forRoot(),
	],
	providers: [RglService, BansService],
	controllers: [BansController],
})
export class BansModule {}
