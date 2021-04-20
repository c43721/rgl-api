import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { RglService } from '../../rgl/rgl.service';
import { CronNames } from '../../enums/crons.enum';
import { Ban } from '../bans.interface';
import { CacheService } from 'src/cache/cache.service';
import { Events } from 'src/events/events';
import { StartupService } from 'src/startup/services/startup.service';

@Injectable()
export class BansService {
  private logger = new Logger(BansService.name);

  constructor(
    private rglService: RglService,
    private schedulerRegistry: SchedulerRegistry,
    private cacheService: CacheService,
    @Inject(forwardRef(() => StartupService))
    private startupService: StartupService,
    private events: Events,
  ) {}

  @Cron('*/20 * * * *', {
    name: CronNames.CRON_BAN,
  })
  private async scrapeBans(): Promise<Ban[]> {
    this.logger.log('Scraping bans page...');
    const bans = await this.rglService.getBans();

    await this.cacheService.setBanCache(bans);

    this.events.parseBanScrape.next({
      bans,
      startingBan: this.startupService.startingBan,
    });

    return bans;
  }

  get cron() {
    return this.schedulerRegistry.getCronJob(CronNames.CRON_BAN);
  }

  async getLatestFreshBan() {
    const bans = await this.scrapeBans();

    return bans[0];
  }

  async getBans(limit: number = 10) {
    let returnedBans: Ban[] | Ban = null;

    const bans =
      (await this.cacheService.getBanCache()) ?? (await this.scrapeBans());

    limit > 1
      ? (returnedBans = bans.slice(0, Math.min(limit, 10)))
      : (returnedBans = bans[0]);

    return {
      bans: returnedBans,
      nextScheduled: this.cron.nextDates().toDate(),
      lastScheduled: this.cron.lastDate() || null,
    };
  }
}
