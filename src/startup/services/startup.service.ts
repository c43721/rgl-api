import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BansService } from 'src/bans/services/bans.service';
import { Events } from 'src/events/events';
import { Configuration, ConfigurationSchema } from '../schemas/startup.schema';

@Injectable()
export class StartupService implements OnModuleInit {
  private logger = new Logger(StartupService.name);
  private STARTING_BAN: string;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => BansService))
    private banService: BansService,
    private events: Events,
    @InjectModel(Configuration.name)
    private readonly startupSchema: Model<ConfigurationSchema>,
  ) {}

  onModuleInit() {
    this.events.parseBanScrape.subscribe(({ bans }) =>
      this.setNewStartingBan(bans[0].steamId),
    );
  }

  get startingBan() {
    return this.STARTING_BAN;
  }

  private async setNewStartingBan(steamId: string): Promise<void> {
    await this.startupSchema.findOneAndUpdate({}, { startingBan: steamId });
    this.STARTING_BAN = steamId;
    this.logger.debug('Successfully set new starting ban.');
  }

  private async createConfiguration(startingBan: string) {
    return await this.startupSchema.create({
      startingBan,
    });
  }

  async createStartingConfiguration(): Promise<void> {
    const envStartingBan = this.configService.get<string>('STARTING_BAN');
    const mongoStartingBan = await this.startupSchema.findOne({});

    const DEBUG_MODE = this.configService.get<string>('DEBUG');

    if (DEBUG_MODE) {
      this.STARTING_BAN = envStartingBan;
      this.logger.warn('Debug mode is enabled!');
      return this.logger.warn('Starting ban will be from env.');
    }

    if (!!envStartingBan && !mongoStartingBan?.startingBan) {
      const ban = await this.banService.getLatestFreshBan();
      this.STARTING_BAN = ban.steamId;
      return this.logger.log('Starting ban will be from fresh scrape.');
    }

    if (!mongoStartingBan?.startingBan) {
      try {
        await this.createConfiguration(envStartingBan);
        this.STARTING_BAN = envStartingBan;

        return this.logger.log('Starting ban will come from env.');
      } catch (err) {
        this.STARTING_BAN = envStartingBan;
        return this.logger.error(
          'Cannot save schema! Starting ban will not be saved in MongoDB.',
        );
      }
    }

    this.STARTING_BAN = mongoStartingBan.startingBan;
    return this.logger.log('Starting ban will come from MongoDB.');
  }
}
