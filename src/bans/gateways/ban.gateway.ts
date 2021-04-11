import {
  WebSocketServer,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Subject } from 'rxjs';

@WebSocketGateway({
  namespace: 'bans',
})
export class BanGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private _subscriber = new Subject<Socket>();
  private _unsubscribers = new Subject<Socket>();

  @WebSocketServer()
  server: Server;

  get subscribers() {
    return this._subscriber.asObservable();
  }

  get unsubscribers() {
    return this._unsubscribers.asObservable();
  }

  handleConnection(socket: Socket) {
    this._subscriber.next(socket);
  }

  handleDisconnect(socket: Socket) {
    this._unsubscribers.next(socket);
  }
}
