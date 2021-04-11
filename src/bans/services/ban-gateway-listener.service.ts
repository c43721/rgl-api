import { Injectable, OnModuleInit } from '@nestjs/common';
import { Events } from 'src/events/events';
import { Ban } from '../bans.interface';
import { BanGateway } from '../gateways/ban.gateway';

@Injectable()
export class BanGatewayListenerService implements OnModuleInit {
  constructor(private events: Events, private banGateway: BanGateway) {}

  onModuleInit() {
    this.events.newBans.subscribe(({ bans }) => this.notifyListeners(bans));
    this.banGateway.subscribers.subscribe(socket => {
      socket.join('ban-notifications-room');
    });
    this.banGateway.unsubscribers.subscribe(socket => {
      socket.leave('ban-notifications-room');
    });
  }

  async notifyListeners(bans: Ban[]) {
    this.banGateway.server.to('ban-notifications-room').emit('new-bans', bans);
  }
}
