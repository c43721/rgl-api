import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { RglService } from '../../rgl/rgl.service';
import { CronNames } from '../../enums/crons.enum';
import { Ban } from '../bans.interface';
import { ConfigService } from '@nestjs/config';
import { Ban as BanClass, BanSchema } from '../schemas/bans.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CacheService } from 'src/cache/cache.service';
import { Events } from 'src/events/events';

@Injectable()
export class BansService {
  private STARTING_BAN: string;
  private BAN_LIMIT = 10;
  private logger = new Logger(BansService.name);

  constructor(
    private rglService: RglService,
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService,
    private cacheService: CacheService,
    private events: Events,
    @InjectModel(BanClass.name)
    private readonly banModel: Model<BanSchema>,
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

  async setNewStartingBan(steamId: string) {
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

    await this.cacheService.setBanCache(bans);

    this.events.parseBanScrape.next({ bans, startingBan: this.STARTING_BAN });

    return bans;
  }

  get cron() {
    return this.schedulerRegistry.getCronJob(CronNames.CRON_BAN);
  }

  async getBans(limit: number = this.BAN_LIMIT) {
    let returnedBans: Ban[] | Ban = null;

    const bans =
      (await this.cacheService.getBanCache()) ?? (await this.scrapeBans());

    limit > 1
      ? (returnedBans = bans.slice(0, limit))
      : (returnedBans = bans[0]);

    return {
      bans: returnedBans,
      nextScheduled: this.cron.nextDates().toDate(),
      lastScheduled: this.cron.lastDate() || null,
    };
  }
}
