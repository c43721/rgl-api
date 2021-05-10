import { HttpService, Injectable, Logger } from '@nestjs/common';
import { load } from 'cheerio';
import { Ban, TeamDetails } from '../bans/interfaces/bans.interface';
import { ProfileBan, Profile } from '../profile/profile.interface';
import ProfileNotFoundException from './exceptions/ProfileNotFoundException';
import { RglPages } from './enums/rgl.enum';
import ProfileHelper from './rgl.helper';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';

@Injectable()
export class RglService {
  private logger = new Logger(RglService.name);

  constructor(
    private httpService: HttpService,
    private puppeteerService: PuppeteerService,
  ) {}

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

  private parseProfilePage(
    steamId: string,
    page: string,
    throwError: boolean = true,
  ) {
    const $ = load(page);
    const hasProfile = $(ProfileHelper.player.hasAccount).text().trim();
    if (!!hasProfile && throwError) {
      throw new ProfileNotFoundException(steamId, hasProfile);
    } else if (!!hasProfile && !throwError) {
      // Can't throw exceptions on bulk profiles.
      return {
        steamId,
        message: hasProfile,
      } as any;
    }
    const trophiesRaw = $(ProfileHelper.player.trophies).text().split(/\s+/);

    const name = $(ProfileHelper.player.name).text();
    const verified = !!$(ProfileHelper.player.verified).length;
    const probation = !!$(ProfileHelper.player.probation).length;
    const banned = !!$(ProfileHelper.player.banned).length;
    const avatar = $(ProfileHelper.player.avatar).attr().src;

    const totalEarnings =
      $(ProfileHelper.player.totalEarnings).text().slice(1) || '0';

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

      const $tables = $h
        .parent()
        .nextAll(ProfileHelper.player.leagueTable._)
        .first();

      const seasons = $tables
        .find(ProfileHelper.player.leagueTable.season)
        .map((i, elem) => $(elem).text().trim());
      const divs = $tables
        .find(ProfileHelper.player.leagueTable.div)
        .map((i, elem) => $(elem).text().trim());
      const teams = $tables
        .find(ProfileHelper.player.leagueTable.team)
        .map((i, elem) => $(elem).text().trim());
      const endRanks = $tables
        .find(ProfileHelper.player.leagueTable.endRank)
        .map((i, elem) => $(elem).text().trim());
      const recordsWith = $tables
        .find(ProfileHelper.player.leagueTable.recordWith)
        .map((i, elem) => $(elem).text().trim().slice(1, -1));
      const recordsWithout = $tables
        .find(ProfileHelper.player.leagueTable.recordWithout)
        .map((i, elem) => $(elem).text().trim().slice(1, -1));
      const amountsWon = $tables
        .find(ProfileHelper.player.leagueTable.amountWon)
        .map((i, elem) => $(elem).text().trim());
      const joined = $tables
        .find(ProfileHelper.player.leagueTable.joined)
        .map((i, elem) => $(elem).text().trim());
      const left = $tables
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
          amountWon: amountsWon[i] || null,
          joined: new Date(String(joined[i])),
          left: new Date(String(left[i])) || null,
          isCurrentTeam: !left[i],
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
        reason: $(banRow.find('td')[4]).text().trim(),
        date: new Date($(banRow.find('td')[2]).text().trim()),
        expires: new Date($(banRow.find('td')[3]).text().trim()),
        isCurrentBan: !!banRow.attr('style').trim(),
      });
    });

    return {
      steamId,
      avatar,
      name,
      link: RglPages.PROFILE_PAGE + steamId,
      status: {
        banned,
        probation,
        verified,
      },
      totalEarnings: parseInt(totalEarnings),
      trophies,
      experience,
      banHistory: allBans.reverse(), // Reversing so that we get new bans on top
    };
  }

  async getBans(): Promise<Ban[]> {
    const timer = Date.now();
    this.logger.debug('Querying bans page from RGL...');
    const { data: bansPage } = await this.getPage(RglPages.BAN_PAGE);

    this.logger.debug(`Bans page loaded in ${Date.now() - timer} ms`);
    const $ = load(bansPage);

    const players = [];
    const reasons = [];

    $('tbody > tr').each((index, element) => {
      const currentElement = $(element);
      // This is necessary, since each "block" of user/reasons are separated by tr's
      if (index % 2 !== 0) return reasons.push(currentElement.text().trim());

      const banId = currentElement.attr('id');
      const steamid = $(currentElement.find('td')[0]).text().trim();
      const div = $(currentElement.find('td')[2]).text().trim() ?? null;
      const teamId = $(currentElement.find('td')[3])
        .find('a')
        .attr('href')
        .split('=')[1];

      let teamDetails: TeamDetails = null;
      if (div) {
        teamDetails = {
          div,
          name: $(currentElement.find('td')[3]).text().trim(),
          id: teamId,
          link: `${RglPages.TEAM_PAGE}${teamId}`,
        };
      }

      const expiresAtString = $(currentElement.find('td')[4]).text().trim();

      players.push({
        banId,
        steamId: steamid,
        name: $(currentElement.find('td')[1]).text().trim(),
        link: `${RglPages.PROFILE_PAGE}${steamid}`,
        expiresAt: new Date(expiresAtString),
        teamDetails,
      });
    });

    const playerWithReason = players.map(
      (val, i) => (val = { ...val, reason: reasons[i] }),
    );

    return playerWithReason;
  }

  async getBulkProfiles(steamIdArray: string[]): Promise<Profile[]> {
    // We don't want to do unneeded puppeteer instantiation if we don't have to
    if (steamIdArray.length === 1) {
      const { data: page } = await this.getPage(
        RglPages.PROFILE_PAGE + steamIdArray[0],
      );

      // Return array so that we don't have more branch conditions
      return [this.parseProfilePage(steamIdArray[0], page, false)];
    }
    
    const documents = await this.puppeteerService.scrapeBulkProfilePages(
      steamIdArray,
    );

    const profiles: Profile[] = [];
    for (let i = 0; i < documents.length; i++) {
      const steamId = steamIdArray[i];
      const document = documents[i];

      profiles.push(this.parseProfilePage(steamId, document, false));
    }

    return profiles;
  }

  async getProfile(steamId: string): Promise<Profile> {
    this.logger.debug(`Querying profile page (${steamId}) from RGL...`);

    const timer = Date.now();
    const { data: profilePage } = await this.getPage(
      RglPages.PROFILE_PAGE + steamId,
    );

    this.logger.debug(
      `Profile (${steamId}) page loaded in ${Date.now() - timer} ms`,
    );

    return this.parseProfilePage(steamId, profilePage);
  }
}
