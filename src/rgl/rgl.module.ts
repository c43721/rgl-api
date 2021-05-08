import { HttpModule, Module } from '@nestjs/common';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { RglService } from './rgl.service';

@Module({
  imports: [HttpModule],
  providers: [RglService, PuppeteerService],
})
export class RglModule {}
