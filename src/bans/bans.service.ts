import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { RglService } from '../rgl/rgl.service';
import { CronNames } from '../enums/crons.enum';
import { Caches } from '../enums/cache.enum';
import { Ban } from './bans.interface';
import { ConfigService } from '@nestjs/config';
import { DiscordService } from 'src/discord/discord.service';
import { Ban as BanClass, BanSchema } from './schemas/bans.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class BansService {
  private STARTING_BAN: string;
  private BAN_LIMIT = 10;
  private logger = new Logger(BansService.name);

  constructor(
    private rglService: RglService,
    private schedulerRegistry: SchedulerRegistry,
    private discordService: DiscordService,
    private configService: ConfigService,
    @InjectModel(BanClass.name)
    private readonly banModel: Model<BanSchema>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async setStartingBan(): Promise<void> {
    const envStartingBan = this.configService.get<string>('STARTING_BAN');
    const mongoStartingBan = await this.banModel.findOne({});

    if (!mongoStartingBan?.startingBan) {
      try {
        const newMongoStartingBan = new this.banModel({
          startingBan: envStartingBan,
        });
        await newMongoStartingBan.save();
        this.logger.log('Starting ban will come from env.');

        this.STARTING_BAN = envStartingBan;
        return;
      } catch (err) {
        this.logger.error(
          'Cannot save schema! Starting ban will not be saved in MongoDB.',
        );
      }
    }

    this.STARTING_BAN = mongoStartingBan.startingBan;
  }

  private async setNewStartingBan(steamId: string) {
    try {
      const steamIdFromDb = await this.banModel.findOne({});

      steamIdFromDb.startingBan = steamId;
      this.STARTING_BAN = steamId;

      this.logger.debug('Successfully saved new starting steamid');
      return await steamIdFromDb.save();
    } catch (err) {
      this.logger.error(`Failed to save id ${steamId}!`);
    }
  }

  @Cron('*/20 * * * *', {
    name: CronNames.CRON_BAN,
  })
  private async scrapeBans(): Promise<Ban[]> {
    this.logger.log('Scraping bans page...');
    const bans = await this.rglService.getBans();

    await this.cacheManager.set<Ban[]>(Caches.BAN_CACHE, bans, {
      ttl: null,
    });

    // Don't await this! It will still send the message
    // @TODO: Convert to use event-emitter instead?
    this.checkForNewBan(bans);

    return bans;
  }

  public async checkForNewBan(parsedArray: Ban[]): Promise<Ban[]> {
    this.logger.log('Checking for new banned players...');

    for (let i = 0; i < parsedArray.length; i++) {
      const ban = parsedArray[i];
      if (ban.steamId === this.STARTING_BAN) {
        if (i === 0) break;

        // New ban(s) detected
        const newBansArray = parsedArray.slice(0, i);
        this.logger.debug(`${newBansArray.length} new bans detected:`);
        this.logger.debug(newBansArray.map(ban => ban.steamId).join(', '));

        // First ban which is latest ban is now the new starting ban for next scrape
        this.logger.verbose(
          `New starting ban: ${this.STARTING_BAN} -> ${newBansArray[0].steamId}`,
        );
        await this.setNewStartingBan(newBansArray[0].steamId);

        await this.discordService.sendDiscordNotification(newBansArray);

        return newBansArray;
      }
    }

    if (parsedArray[parsedArray.length - 1].steamId !== this.STARTING_BAN) {
      // Situation. There's too many bans (lol!) and we don't have a way of reaching the 10 + ith ban (yet)
      // @TODO: Find way to reach 10+ith ban
      this.logger.warn(
        '10 new bans detected, but there was more. Ignoring unaccessable bans.',
      );

      // Notify that there is new starting ban, and set it again (since we don't want to do this loop-de-loop)
      this.logger.verbose(
        `New starting ban: ${this.STARTING_BAN} -> ${parsedArray[0].steamId}`,
      );
      await this.setNewStartingBan(parsedArray[0].steamId);

      await this.discordService.sendDiscordNotification(parsedArray);

      return parsedArray;
    }

    this.logger.log('No new bans');
    return [];
  }

  private async getCachedBans() {
    const cachedBans = await this.cacheManager.get<Ban[]>(Caches.BAN_CACHE);

    if (!cachedBans) {
      await this.scrapeBans();
      return await this.cacheManager.get<Ban[]>(Caches.BAN_CACHE);
    }

    return cachedBans;
  }

  getCron() {
    return this.schedulerRegistry.getCronJob(CronNames.CRON_BAN);
  }

  async getBans(limit: number = this.BAN_LIMIT) {
    let returnedBans: Ban[] | Ban = null;

    const bans = await this.getCachedBans();

    limit > 1
      ? (returnedBans = bans.slice(0, limit))
      : (returnedBans = bans[0]);

    const cron = this.getCron();

    return {
      bans: returnedBans,
      nextScheduled: cron.nextDates().toDate(),
      lastScheduled: cron.lastDate() || null,
    };
  }
}
