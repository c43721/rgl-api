import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Events } from 'src/events/events';
import { Ban } from '../bans.interface';

@Injectable()
export class BanEventListenerService implements OnModuleInit {
  private logger = new Logger(BanEventListenerService.name);

  constructor(private events: Events) {}

  onModuleInit() {
    this.events.parseBanScrape.subscribe(({ bans, startingBan }) =>
      this.checkBans(bans, startingBan),
    );
  }

  private checkBans(banArray: Ban[], startingBan: string) {
    this.logger.log('Checking for new banned players...');

    for (let i = 0; i < banArray.length; i++) {
      const ban = banArray[i];

      if (ban.steamId === startingBan) {
        if (i === 0) break;

        // New ban(s) detected
        const newBansArray = banArray.slice(0, i);
        this.logger.debug(`${newBansArray.length} new bans detected:`);
        this.logger.debug(newBansArray.map(ban => ban.steamId).join(', '));

        // First ban which is latest ban is now the new starting ban for next scrape
        this.logger.verbose(
          `New starting ban: ${startingBan} -> ${newBansArray[0].steamId}`,
        );

        return this.events.newBans.next({ bans: newBansArray });
      }
    }

    // @TODO: This doesn't work for when bans are >10 and the bans haven't changed
    if (banArray[banArray.length - 1].steamId === startingBan) {
      // Situation. There's too many bans (lol!) and we don't have a way of reaching the 10 + ith ban (yet)
      // @TODO: Find way to reach 10+ith ban
      this.logger.warn(
        '10 new bans detected, but there was more. Ignoring unaccessable bans.',
      );

      // Notify that there is new starting ban, and set it again (since we don't want to do this loop-de-loop)
      this.logger.verbose(
        `New starting ban: ${startingBan} -> ${banArray[0].steamId}`,
      );

      return this.events.newBans.next({ bans: banArray });
    }

    this.logger.log('No new bans');
  }
}
