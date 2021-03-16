import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { RglService } from '../rgl/rgl.service';
import { CronNames } from '../enums/crons.enum';
import { Caches } from '../enums/cache.enum';
import { Ban } from './bans.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BansService {
	private STARTING_BAN: string;
	private BAN_LIMIT = 10;
	private logger = new Logger(BansService.name);

	constructor(
		private rglService: RglService,
		private schedulerRegistry: SchedulerRegistry,
		readonly configService: ConfigService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {
		this.STARTING_BAN = configService.get<string>('STARTING_BAN');
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

		this.checkForNewBan(bans);

		return bans;
	}

	public checkForNewBan(parsedArray: Ban[]): Ban[] {
		this.logger.log('Checking for new banned players');

		for (let i = 0; i < parsedArray.length; i++) {
			const ban = parsedArray[i];
			if (ban.steamId === this.STARTING_BAN) {
				if (i === 0) break;

				// New ban(s) detected
				const newBansArray = parsedArray.slice(0, i);
				this.logger.debug(`${newBansArray.length} new bans detected.`);
				this.logger.debug(
					`Names: ${newBansArray.map(ban => ban.name).join(', ')}`,
				);

				// First ban which is latest ban is now the new starting ban for next scrape
				this.STARTING_BAN = newBansArray[0].steamId;

				return newBansArray;
			}
		}

		if (parsedArray[parsedArray.length - 1].steamId === this.STARTING_BAN) {
			// Situation. There's too many bans (lol!) and we don't have a way of reaching the 10 + ith ban (yet)
			// @TODO: Find way to reach 10+ith ban
			this.logger.warn(
				'10 new bans detected, but there was more. Ignoring unaccessable bans.',
			);

			return parsedArray;
		}

		this.logger.debug('No new bans');
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
