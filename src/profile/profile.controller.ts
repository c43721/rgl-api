import {
  ClassSerializerInterceptor,
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
    { formats }: ProfileQueryDto,
  ) {
    const profile = await this.profileService.getProfile(steamId);
    let { experience, ...rest } = profile;

    if (formats) {
      const newExperience = this.profileService.filterExperience(
        experience,
        formats,
      );
      experience = newExperience;
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
