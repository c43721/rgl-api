import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { Ban } from 'src/bans/bans.interface';

@Injectable()
export class Events {
  readonly parseBanScrape = new Subject<{ bans: Ban[]; startingBan: string }>();

  readonly newBans = new Subject<{ bans: Ban[] }>();
}
