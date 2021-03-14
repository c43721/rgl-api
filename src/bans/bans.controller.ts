import {
	CacheInterceptor,
	Controller,
	Get,
	Logger,
	Query,
	UseInterceptors,
} from '@nestjs/common';
import { TimeInterceptor } from 'src/interceptors/timer.interceptor';
import { RglService } from 'src/rgl/rgl.service';
import { BanDto } from './dto/bans.dto';

@Controller('bans')
export class BansController {
	private logger = new Logger(BansController.name);

	constructor(private rglService: RglService) {}

	@Get()
	@UseInterceptors(TimeInterceptor, CacheInterceptor)
	async index(@Query() query: BanDto) {
		this.logger.verbose('Stale cache: Gathering fresh data.');
		const newBans = await this.rglService.getBans(query.limit);
		return { bans: newBans };
	}
}
