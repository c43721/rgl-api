import { HttpService, Injectable, Logger } from '@nestjs/common';
import { load } from 'cheerio';
import { toDate } from 'date-fns';
import { Ban } from 'src/bans/bans.interface';
import { RglPages } from './rgl.enum';

@Injectable()
export class RglService {
	private logger = new Logger(RglService.name);

	constructor(private httpService: HttpService) {}

	private getPage(page: RglPages) {
		return this.httpService
			.get(page, {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
				},
			})
			.toPromise();
	}

	public async getBans(): Promise<Ban[]> {
		this.logger.debug('Querying RGL page...');
		const { data: bansPage } = await this.getPage(RglPages.BAN_PAGE);

		this.logger.debug('RGL page loaded, parsing.');
		const $ = load(bansPage);

		const players = [];
		const reasons = [];

		this.logger.debug('Looping through DOM, finding elements.');
		$('tbody > tr').each((index, element) => {
			// This is necessary, since each "block" of user/reasons are separated by tr's
			if (index % 2 === 0) {
				const steamid = $($(element).find('td')[0]).text().trim();
				const div = $($(element).find('td')[2]).text().trim() ?? null;
				const teamId = $($(element).find('td')[3])
					.find('a')
					.attr('href')
					.split('=')[1];

				let teamDetails = null;
				if (div) {
					teamDetails = {
						div,
						currentTeam: $($(element).find('td')[3]).text().trim(),
						teamId: parseInt(teamId),
						teamLink: `${RglPages.TEAM_PAGE}${teamId}`,
					};
				}

				const expiresAtString = $($(element).find('td')[4])
					.text()
					.trim();

				players.push({
					steamId: steamid,
					name: $($(element).find('td')[1]).text().trim(),
					link: `${RglPages.BAN_PAGE}${steamid}`,
					expiresAt: toDate(new Date(expiresAtString)),
					teamDetails,
				});
			} else {
				reasons.push($(element).text().trim());
			}
		});
		this.logger.debug('Finished scrape');

		const playerWithReason = players.map(
			(val, i) => (val = { ...val, reason: reasons[i] }),
		);

		return playerWithReason;
	}
}
