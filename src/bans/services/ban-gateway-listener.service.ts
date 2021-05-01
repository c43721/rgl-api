import { Injectable, OnModuleInit } from '@nestjs/common';
import { Events } from 'src/events/events';
import { Ban } from '../interfaces/bans.interface';
import { BanGateway } from '../gateways/ban.gateway';
import {
  BanGatewayEvent,
  BanGatewayRoom,
} from '../interfaces/bans-gateway.interface';

@Injectable()
export class BanGatewayListenerService implements OnModuleInit {
  constructor(private events: Events, private banGateway: BanGateway) {}

  onModuleInit() {
    this.events.newBans.subscribe(({ bans }) => this.notifyListeners(bans));
  }

  async notifyListeners(bans: Ban[]) {
    this.banGateway.server
      .to(BanGatewayRoom.NEW_BAN_NOTIFICATION)
      .emit(BanGatewayEvent.NEW_BANS, bans);
  }
}
