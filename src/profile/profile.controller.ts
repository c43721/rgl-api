import {
	Controller,
	DefaultValuePipe,
	Get,
	Param,
	ParseBoolPipe,
	Query,
} from '@nestjs/common';
import { SteamId64Pipe } from 'src/pipes/steamid.pipe';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
	constructor(private profileService: ProfileService) {}

	@Get(':steamid')
	async index(@Param('steamid', new SteamId64Pipe()) steamId: string) {
		return this.profileService.getProfile(steamId);
	}

	@Get(':steamid/bans')
	async bans(
		@Param('steamid', new SteamId64Pipe()) steamId: string,
		@Query('details', new DefaultValuePipe(false), new ParseBoolPipe())
		details: boolean,
		@Query('previous', new DefaultValuePipe(false), new ParseBoolPipe())
		previous: boolean,
	) {
		return this.profileService.getProfileBans(steamId, details, previous);
	}
}
