import { Module } from '@nestjs/common';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { DiscordService } from './discord.service';

@Module({
  providers: [DiscordService, PuppeteerService],
  exports: [DiscordService],
})
export class DiscordModule {}
