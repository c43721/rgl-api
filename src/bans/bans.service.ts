import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { RglService } from '../rgl/rgl.service';
import { CronNames } from '../enums/crons.enum';
import { Caches } from '../enums/cache.enum';
import { Ban, LatestBanResponse } from './bans.model';

@Injectable()
export class BansService {
	private BAN_LIMIT = 10;
	private logger = new Logger(BansService.name);

	constructor(
		private rglService: RglService,
		private schedulerRegistry: SchedulerRegistry,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {}

	@Cron('*/20 * * * *', {
		name: CronNames.CRON_BAN,
	})
	private async scrapeBans() {
		this.logger.log('Cron job: Scraping bans page...');
		const bans = await this.rglService.getBans();

		await this.cacheManager.set<Ban[]>(Caches.BAN_CACHE, bans, {
			ttl: null,
		});

		return await this.cacheManager.get<Ban[]>(Caches.BAN_CACHE);
	}

	private async getCachedBans() {
		const cachedBans = await this.cacheManager.get<Ban[]>(
			'LATEST_RGL_BANS',
		);

		if (!cachedBans) return await this.scrapeBans();

		return cachedBans;
	}

	getCron() {
		return this.schedulerRegistry.getCronJob(CronNames.CRON_BAN);
	}

	async getBans(limit: number = this.BAN_LIMIT): Promise<LatestBanResponse> {
		let returnedBans: Ban[] | Ban = null;

		const bans = await this.getCachedBans();

		if (limit)
			bans.length > 1
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