import { forwardRef, Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BansModule } from 'src/bans/bans.module';
import { Events } from 'src/events/events';
import { Configuration, ConfigurationSchema } from './schemas/startup.schema';
import { StartupService } from './services/startup.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Configuration.name, schema: ConfigurationSchema },
    ]),
    forwardRef(() => BansModule),
  ],
  providers: [StartupService, Events],
  exports: [StartupService],
})
export class StartupModule implements OnModuleInit {
  constructor(private startupService: StartupService) {}

  async onModuleInit() {
    await this.startupService.createStartingConfiguration();
  }
}
