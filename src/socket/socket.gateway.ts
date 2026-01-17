// socket.gateway.ts
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RedisService } from "src/redis/redis.service";
import { SocketService } from "./socket.service";

@WebSocketGateway({
  cors: {
    origin: ["https://petattix.merinasib.shop", "http://localhost:4500"],
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  afterInit() {
    console.log("✅ Socket.IO server initialized");
  }

  constructor(
    private readonly _socketService: SocketService,
    private readonly _redisService: RedisService
  ) {}

  // handleConnection(client: Socket): void {
  //   console.log("Client connected:", client.id);
  //   this._socketService.handleConnection(client, this.server); // pass server
  // }
  async handleConnection(socket: Socket) {
    // console.log(socket);
    const userId = socket.handshake.query.userId as string;
    if (!userId) return socket.disconnect(true);
    // ✅ ONLY this line is needed for routing
    const room = [`user:3001`, `user:3002`];
    room?.forEach((element) => {
      socket.join(element);
    });
    // 🔥 Store in Redis: userId → socket.id
    await this._redisService.getClient().hSet("online_users", userId, socket.id);
    console.log(`🟢 ${userId} is online (socket: ${socket.id})`);
    // Optional: broadcast to others
    socket.broadcast.emit("user-online", { userId });
  }
  handleDisconnect(client: any) {
    console.log(client.handshake.query.userId);
    this._redisService
      .getClient()
      .hDel("online_users", client.handshake.query.userId)
      .then((res) => {
        console.log(`🔴 ${client.handshake.query.userId} went offline`, res);
      })
      .catch((err) => {
        console.log(err);
      });
    this._socketService.handleDisconnection(client);
  }
  // @SubscribeMessage("message")
  // async handleMessage(@MessageBody() data: any) {
  //   console.log('📩 Received "message" via @SubscribeMessage:', data);
  //   return await this._socketService.handleIncomingMessage(data, this.server);
  // }

  @SubscribeMessage("message")
  handleMessage(@MessageBody() data: any) {
    const room = `user:${data.to}`;

    console.log(this.server);
    this.server.to(room).emit("message", data);
  }

  @SubscribeMessage("ping")
  handlePing(@MessageBody() data: any) {
    console.log("🏓 Received ping");
    return { value: "pong" }; // This sends acknowledgment back
  }

  // async handleMessage(client: Socket, @MessageBody() data: any) {
  //   // console.log(client);
  //   // console.log('📩 Received "message" event:', data);
  //   return await this._socketService.handleMessage(client, this.server, data);
  // }
}
