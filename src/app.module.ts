import { HttpModule, Module } from '@nestjs/common';
import { BansModule } from './bans/bans.module';
import { RglModule } from './rgl/rgl.module';
import { ProfileModule } from './profile/profile.module';
import { DiscordModule } from './discord/discord.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
	imports: [
		BansModule,
		RglModule,
		HttpModule,
		ProfileModule,
		DiscordModule,
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				uri: configService.get<string>('MONGO_URI'),
				useNewUrlParser: true,
				useUnifiedTopology: true,
			}),
			inject: [ConfigService],
		}),
	],
})
export class AppModule {}
