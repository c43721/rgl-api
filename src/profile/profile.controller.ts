import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  Post,
  Query,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { TimeInterceptor } from 'src/lib/interceptors/timer.interceptor';
import { SteamId64Pipe } from 'src/lib/pipes/steamid.pipe';
import { BulkProfileQueryDto, ProfileQueryDto } from './dto/profile-query.dto';
import { ProfileService } from './profile.service';

@Controller('profiles')
@UseInterceptors(TimeInterceptor)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Post('/bulk')
  @HttpCode(HttpStatus.OK)
  bulkProfiles(
    @Body(new ValidationPipe({ transform: true }))
    { profiles, formats, onlyActive, slim }: BulkProfileQueryDto,
  ) {
    const distinctProfiles = [...new Set(profiles)];
    return this.profileService.getBulkProfiles(
      distinctProfiles,
      formats,
      onlyActive,
      slim
    );
  }

  @Get(':steamid')
  async index(
    @Param('steamid', SteamId64Pipe) steamId: string,
    @Query(new ValidationPipe({ transform: true }))
    { formats, onlyActive, disableCache }: ProfileQueryDto,
  ) {
    const profile = await this.profileService.getProfile(steamId, disableCache);
    let { experience, banHistory, ...rest } = profile;

    if (formats) {
      experience = this.profileService.filterExperience(experience, formats);
    }

    if (onlyActive) {
      experience = experience.filter(
        experience => experience.isCurrentTeam === true,
      );
    }

    return { ...rest, experience };
  }

  @Get(':steamid/experience')
  async experience(
    @Param('steamid', SteamId64Pipe) steamId: string,
    @Query(new ValidationPipe({ transform: true }))
    { formats, onlyActive, disableCache }: ProfileQueryDto,
  ) {
    const profile = await this.profileService.getProfile(steamId, disableCache);
    let { experience, name } = profile;

    if (formats) {
      experience = this.profileService.filterExperience(experience, formats);
    }

    if (onlyActive) {
      experience = experience.filter(
        experience => experience.isCurrentTeam === true,
      );
    }

    return { steamId, name, experience };
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
