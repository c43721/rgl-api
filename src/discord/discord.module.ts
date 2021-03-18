import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { DiscordService } from './discord.service';

@Module({
  imports: [ConfigModule.forRoot({})],
  providers: [DiscordService, PuppeteerService],
  exports: [DiscordService],
})
export class DiscordModule {}
