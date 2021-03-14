import { HttpModule, Module } from '@nestjs/common';
import { RglService } from './rgl.service';

@Module({
	imports: [HttpModule],
	providers: [RglService],
})
export class RglModule {}
