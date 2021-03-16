import { Controller, Get, Param } from '@nestjs/common';
import { SteamId64Pipe } from 'src/pipes/steamid.pipe';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
	constructor(private profileService: ProfileService) {}

	@Get(':steamid')
	async index(@Param('steamid', new SteamId64Pipe()) steamId: string) {
		return this.profileService.getProfile(steamId);
	}
}
