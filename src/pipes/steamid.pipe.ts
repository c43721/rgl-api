import {
	PipeTransform,
	Injectable,
	ArgumentMetadata,
	BadRequestException,
} from '@nestjs/common';
import * as SteamID from 'steamid';

@Injectable()
export class SteamId64Pipe implements PipeTransform<string, string> {
	transform(value: string, metadata: ArgumentMetadata) {
		try {
			const steamid = new SteamID(value);
			if (!steamid.isValid()) {
				throw new BadRequestException('SteamId is not valid');
			}
			return steamid.getSteamID64();
		} catch (error) {
			throw new BadRequestException('SteamId is not valid');
		}
	}
}
