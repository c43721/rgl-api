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
import { ProfileQueryDto } from './dto/profile-query.dto';
import { ProfileService } from './profile.service';

@Controller('profiles')
@UseInterceptors(TimeInterceptor)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get(':steamid')
  async index(
    @Param('steamid', SteamId64Pipe) steamId: string,
    @Query(new ValidationPipe({ transform: true }))
    { formats, onlyActive }: ProfileQueryDto,
  ) {
    const profile = await this.profileService.getProfile(steamId);
    let { experience, banHistory, ...rest } = profile;

    if (formats) {
      experience = this.profileService.filterExperience(experience, formats);
    }

    if (onlyActive) {
      experience = experience.filter(experience => experience.isCurrentTeam === true);
    }

    return { ...rest, experience };
  }

  @Get(':steamid/bans')
  async bans(
    @Param('steamid', SteamId64Pipe) steamId: string,
    @Query('details', new DefaultValuePipe(false), ParseBoolPipe)
    details: boolean,
    @Query('previous', new DefaultValuePipe(false), ParseBoolPipe)
    previous: boolean,
  ) {
    return this.profileService.getProfileBans(steamId, details, previous);
  }
}
