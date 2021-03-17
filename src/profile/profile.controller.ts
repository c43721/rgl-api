import {
	Controller,
	DefaultValuePipe,
	Get,
	Param,
	ParseBoolPipe,
	Query,
	UseInterceptors,
	ValidationPipe,
} from '@nestjs/common';
import { TimeInterceptor } from 'src/interceptors/timer.interceptor';
import { SteamId64Pipe } from 'src/pipes/steamid.pipe';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseInterceptors(TimeInterceptor)
export class ProfileController {
	constructor(private profileService: ProfileService) {}

	@Get(':steamid')
	async index(
		@Param('steamid', new SteamId64Pipe()) steamId: string,
		@Query('category', new ValidationPipe({ transform: true }))
		category: string[],
	) {
		const profile = await this.profileService.getProfile(steamId);
		if (!category) return profile;

		let { experience, ...rest } = profile;

		experience = experience.filter(team =>
			category.includes(team.category),
		);

		return { ...rest, experience };
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
