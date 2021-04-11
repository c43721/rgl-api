import { Injectable, OnModuleInit } from '@nestjs/common';
import { Ban } from 'src/bans/bans.interface';
import { Events } from 'src/events/events';
import { DiscordService } from './discord.service';

@Injectable()
export class DiscordEventListenerService implements OnModuleInit {
  constructor(private discordService: DiscordService, private events: Events) {}

  onModuleInit() {
    this.events.newBans.subscribe(({ bans }) => this.newBans(bans));
  }

  async newBans(bans: Ban[]) {
    await this.discordService.sendDiscordNotification(bans);
  }
}
