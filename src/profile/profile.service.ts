import { Injectable } from '@nestjs/common';
import { RglPages } from 'src/rgl/rgl.enum';
import { RglService } from 'src/rgl/rgl.service';

@Injectable()
export class ProfileService {
	constructor(private rglService: RglService) {}

	private async scrapeProfilePage(page: RglPages) {}

	async getProfile(steamid: string) {
		return true;
	}
}
