import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { TimeInterceptor } from 'src/lib/interceptors/timer.interceptor';
import { BansService } from './services/bans.service';

@Controller('bans')
export class BansController {
  constructor(private bansService: BansService) {}

  @Get('/latest')
  @UseInterceptors(TimeInterceptor)
  async index(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.bansService.getBans(limit);
  }
}
