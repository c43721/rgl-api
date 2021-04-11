import { HttpModule, Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from 'src/cache/cache.module';
import { RglService } from 'src/rgl/rgl.service';
import { BansController } from './bans.controller';
import { BansService } from './services/bans.service';
import { BanSchema, Ban } from './schemas/bans.schema';
import { BanEventListenerService } from './services/ban-event-listener.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ban.name, schema: BanSchema }]),
    ScheduleModule.forRoot(),
    CacheModule,
    HttpModule,
  ],
  providers: [RglService, BansService, BanEventListenerService],
  controllers: [BansController],
})
export class BansModule implements OnModuleInit {
  constructor(private banService: BansService) {}

  async onModuleInit() {
    await this.banService.setStartingBan();
  }
}
