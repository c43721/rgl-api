import { HttpModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from 'src/cache/cache.module';
import { RglService } from 'src/rgl/rgl.service';
import { BansController } from './bans.controller';
import { BansService } from './services/bans.service';
import { BanEventListenerService } from './services/ban-event-listener.service';
import { BanGateway } from './gateways/ban.gateway';
import { BanGatewayListenerService } from './services/ban-gateway-listener.service';
import { StartupModule } from 'src/startup/startup.module';
import { forwardRef } from '@nestjs/common';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CacheModule,
    HttpModule,
    forwardRef(() => StartupModule),
  ],
  providers: [
    PuppeteerService,
    RglService,
    BansService,
    BanEventListenerService,
    BanGateway,
    BanGatewayListenerService,
  ],
  exports: [BansService, BanEventListenerService, BanGatewayListenerService],
  controllers: [BansController],
})
export class BansModule {}
