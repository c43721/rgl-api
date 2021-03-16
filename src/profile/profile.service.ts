import { Injectable } from '@nestjs/common';
import { RglPages } from 'src/rgl/rgl.enum';
import { RglService } from 'src/rgl/rgl.service';
import { ProfileBanDetails } from './profile.interface';

@Injectable()
export class ProfileService {
	constructor(private rglService: RglService) {}

	private async getCachedProfile(steamId: string) {
		return this.rglService.getProfile(steamId);
	}

	async getProfile(steamid: string) {
		return this.getCachedProfile(steamid);
	}

	async getProfileBans(steamid: string, showDetails: boolean, showPrevious: boolean): Promise<ProfileBanDetails> {
		const profile = await this.getCachedProfile(steamid);

		let profileToReturn: Omit<ProfileBanDetails, "details"> = {
			steamId: profile.steamId,
			banned: profile.status.banned,
			probation: profile.status.probation,
			verified: profile.status.verified,
		}

		if (showDetails) {
			profileToReturn = {...profileToReturn, details: {}} as ProfileBanDetails
		}

		if (showPrevious) {
			profileToReturn = {...profileToReturn} as ProfileBanDetails
		}

		return profileToReturn as ProfileBanDetails;
	}
}
