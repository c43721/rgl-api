import { HttpService, Injectable, Logger } from '@nestjs/common';
import { load } from 'cheerio';

@Injectable()
export class RglService {
	private logger = new Logger(RglService.name);

	public static BAN_PAGE = 'https://rgl.gg/Public/PlayerBanList.aspx';
	public static PROFILE_PAGE = 'https://rgl.gg/Public/PlayerProfile.aspx?p=';
	public static TEAM_PAGE = 'https://rgl.gg/Public/Team.aspx?t=';

	constructor(private httpService: HttpService) {}

	private getPage(page: string) {
		return this.httpService
			.get(page, {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
				},
			})
			.toPromise();
	}

	public async getBans(limit: number) {
		this.logger.debug('Querying RGL page...');
		const { data: bansPage } = await this.getPage(RglService.BAN_PAGE);

		this.logger.debug('RGL page loaded, parsing.');
		const $ = load(bansPage);

		const players = [];
		const reasons = [];

		this.logger.debug('Looping through DOM, finding elements.');
		$('tbody > tr').each((index, element) => {
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
						teamLink: `${RglService.TEAM_PAGE}${teamId}`,
					};
				}

				players.push({
					steamId: steamid,
					name: $($(element).find('td')[1]).text().trim(),
					link: `${RglService.PROFILE_PAGE}${steamid}`,
					expiresAt: $($(element).find('td')[4]).text().trim(),
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

		return playerWithReason.splice(0, limit);
	}
}
