import {
	CacheInterceptor,
	Controller,
	DefaultValuePipe,
	Get,
	Logger,
	ParseIntPipe,
	Query,
	UseInterceptors,
} from '@nestjs/common';
import { TimeInterceptor } from 'src/interceptors/timer.interceptor';
import { RglService } from 'src/rgl/rgl.service';

@Controller('bans')
export class BansController {
	private logger = new Logger(BansController.name);

	constructor(private rglService: RglService) {}

	@Get()
	@UseInterceptors(TimeInterceptor, CacheInterceptor)
	async index(
		@Query('limit', new DefaultValuePipe(10), new ParseIntPipe())
		limit: number,
	) {
		this.logger.debug('Stale cache: Gathering fresh data.');
		const newBans = await this.rglService.getBans(limit);
		return { bans: newBans };
	}
}
