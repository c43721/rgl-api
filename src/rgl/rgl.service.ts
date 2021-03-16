import {
	HttpService,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { load } from 'cheerio';
import { Ban } from '../bans/bans.interface';
import { Ban as ProfileBan } from '../profile/profile.interface';
import { Profile } from '../profile/profile.interface';
import { RglPages } from './rgl.enum';
import ProfileHelper from './rgl.helper';

@Injectable()
export class RglService {
	private logger = new Logger(RglService.name);

	constructor(private httpService: HttpService) {}

	private getPage(page: RglPages | string) {
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
		this.logger.debug('Querying RGL bans page...');
		const { data: bansPage } = await this.getPage(RglPages.BAN_PAGE);

		this.logger.debug('RGL page loaded, parsing.');
		const $ = load(bansPage);

		const players = [];
		const reasons = [];

		this.logger.debug('Looping through DOM, finding elements.');
		$('tbody > tr').each((index, element) => {
			// This is necessary, since each "block" of user/reasons are separated by tr's
			if (index % 2 === 0) {
				const banId = $(element).attr('id');
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
						teamId: teamId,
						teamLink: `${RglPages.TEAM_PAGE}${teamId}`,
					};
				}

				const expiresAtString = $($(element).find('td')[4])
					.text()
					.trim();

				players.push({
					banId,
					steamId: steamid,
					name: $($(element).find('td')[1]).text().trim(),
					link: `${RglPages.PROFILE_PAGE}${steamid}`,
					expiresAt: new Date(expiresAtString),
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

	public async getProfile(steamId: string): Promise<Profile> {
		this.logger.debug('Querying RGL profile page...');
		const { data: profilePage } = await this.getPage(
			RglPages.PROFILE_PAGE + steamId,
		);

		this.logger.debug('RGL page loaded, parsing.');
		const $ = load(profilePage);

		const hasProfile = $(ProfileHelper.player.hasAccount).text().trim();
		if (!!hasProfile) throw new NotFoundException(steamId, hasProfile);

		const trophiesRaw = $(ProfileHelper.player.trophies)
			.text()
			.split(/\s+/);

		const name = $(ProfileHelper.player.name).text();
		const verified = !!$(ProfileHelper.player.verified).length;
		const probation = !!$(ProfileHelper.player.probation).length;
		const banned = !!$(ProfileHelper.player.banned).length;
		const avatar = $(ProfileHelper.player.avatar).attr().src;

		const totalEarnings =
			parseInt($(ProfileHelper.player.totalEarnings).text()) || 0;

		const trophies = {
			gold: parseInt(trophiesRaw[0]) || 0,
			silver: parseInt(trophiesRaw[1]) || 0,
			bronze: parseInt(trophiesRaw[2]) || 0,
		};

		const experience = [];
		$(ProfileHelper.player.leagueHeading).each((i, heading) => {
			/**
			 * Category - RGL - Format
			 */
			const $h = $(heading);
			const hText = $h.text();
			const hTextParts = hText.split(' - ');

			const category = hTextParts[0].toLowerCase();
			const format = hTextParts[2].toLowerCase();

			const $t = $h
				.parent()
				.nextAll(ProfileHelper.player.leagueTable._)
				.first();

			const seasons = $t
				.find(ProfileHelper.player.leagueTable.season)
				.map((i, elem) => $(elem).text().trim());
			const divs = $t
				.find(ProfileHelper.player.leagueTable.div)
				.map((i, elem) => $(elem).text().trim());
			const teams = $t
				.find(ProfileHelper.player.leagueTable.team)
				.map((i, elem) => $(elem).text().trim());
			const endRanks = $t
				.find(ProfileHelper.player.leagueTable.endRank)
				.map((i, elem) => $(elem).text().trim());
			const recordsWith = $t
				.find(ProfileHelper.player.leagueTable.recordWith)
				.map((i, elem) => $(elem).text().trim());
			const recordsWithout = $t
				.find(ProfileHelper.player.leagueTable.recordWithout)
				.map((i, elem) => $(elem).text().trim());
			const amountsWon = $t
				.find(ProfileHelper.player.leagueTable.amountWon)
				.map((i, elem) => $(elem).text().trim());
			const joined = $t
				.find(ProfileHelper.player.leagueTable.joined)
				.map((i, elem) => $(elem).text().trim());
			const left = $t
				.find(ProfileHelper.player.leagueTable.left)
				.map((i, elem) => $(elem).text().trim());

			for (let i = 0; i < seasons.length; i++) {
				experience.push({
					category,
					format,
					season: String(seasons[i]).toLowerCase(),
					div: String(divs[i]).toLowerCase(),
					team: teams[i],
					endRank: endRanks[i],
					recordWith: recordsWith[i],
					recordWithout: recordsWithout[i] || null,
					amountWon: amountsWon[i],
					joined: new Date(String(joined[i])),
					left: new Date(String(left[i])) || null,
					isCurrentTeam: !!left[i],
				});
			}
		});

		const banElementArray = $(
			ProfileHelper.player.banHistory.banStartSelector,
		).nextUntil(ProfileHelper.player.banHistory.banEndSelector);

		const allBans: ProfileBan[] = [];
		banElementArray.each(function (_i, _element) {
			const banRow = $(this);
			allBans.push({
				reason: $($(banRow).find("td")[4]).text().trim(),
				date: new Date($($(banRow).find("td")[2]).text().trim()),
				expires: new Date($($(banRow).find("td")[3]).text().trim()),
				isCurrentBan: !!$(banRow).attr('style').trim()
			});
		});

		return {
			steamId,
			avatar,
			name,
			status: {
				banned,
				probation,
				verified,
			},
			totalEarnings,
			trophies,
			experience,
			banHistory: allBans.reverse(), // Reversing so that we get new bans on top
		};
	}
}
