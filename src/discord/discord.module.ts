import { Module } from '@nestjs/common';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { DiscordEventListenerService } from './services/discord-event-listener.service';
import { DiscordService } from './services/discord.service';

@Module({
  providers: [DiscordService, PuppeteerService, DiscordEventListenerService],
  exports: [DiscordService],
})
export class DiscordModule {}
