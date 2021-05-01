import {
  WebSocketServer,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { BanGatewayRoom } from '../interfaces/bans-gateway.interface';

@WebSocketGateway({
  namespace: 'bans',
})
export class BanGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(socket: Socket) {
    socket.join(BanGatewayRoom.NEW_BAN_NOTIFICATION);
  }

  handleDisconnect(socket: Socket) {
    socket.leave(BanGatewayRoom.NEW_BAN_NOTIFICATION);
  }
}
