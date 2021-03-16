import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscordService } from './discord.service';

@Module({
    imports: [ConfigModule.forRoot({})],
	providers: [DiscordService],
	exports: [DiscordService],
})
export class DiscordModule {}
