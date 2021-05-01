import { Injectable, OnModuleInit } from '@nestjs/common';
import { Ban } from 'src/bans/interfaces/bans.interface';
import { Events } from 'src/events/events';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { DiscordService } from './discord.service';

@Injectable()
export class DiscordEventListenerService implements OnModuleInit {
  constructor(
    private discordService: DiscordService,
    private puppeteerService: PuppeteerService,
    private events: Events,
  ) {}

  onModuleInit() {
    this.events.newBans.subscribe(({ bans }) => this.newBans(bans));
  }

  async newBans(bans: Ban[]) {
    const screenshots: Buffer[] = await this.puppeteerService.generateBulkBanScreenshots(
      bans.map(ban => ban.banId),
    );
    await this.discordService.sendDiscordEmbeds(bans, screenshots);
  }
}
