import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Caches } from 'src/enums/cache.enum';
import { RglService } from 'src/rgl/rgl.service';
import { Profile, ProfileBanDetails } from './profile.interface';

@Injectable()
export class ProfileService {
	constructor(
		private rglService: RglService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {}

	async getProfile(steamId: string) {
		const cachedProfile = await this.cacheManager.get<Profile>(Caches.PROFILE_CACHE + steamId)

		if (!cachedProfile) {
			const profile = await this.rglService.getProfile(steamId);

			await this.cacheManager.set(Caches.PROFILE_CACHE + steamId, profile);

			return profile;
		}

		return cachedProfile;
	}

	async getProfileBans(steamid: string, showDetails: boolean, showPrevious: boolean): Promise<ProfileBanDetails> {
		const profile = await this.getProfile(steamid);

		let profileToReturn: Omit<ProfileBanDetails, "details" | "previous"> = {
			steamId: profile.steamId,
			banned: profile.status.banned,
			probation: profile.status.probation,
			verified: profile.status.verified,
		}

		if (showDetails && profile.banHistory[0].isCurrentBan) {
			profileToReturn = {...profileToReturn, details: profile.banHistory[0]} as ProfileBanDetails
		}

		if (showPrevious) {
			profileToReturn = {...profileToReturn, previous: profile.banHistory} as ProfileBanDetails
		}

		return profileToReturn as ProfileBanDetails;
	}
}
