export class MeetingRoom {
  constructor(ctx, env) {
    this.ctx = ctx; // 'state' is now 'ctx' for hibernatable websockets
    this.env = env;
    this.sockets = [];
  }

  async fetch(request) {
    // 1. Host creates the room
    if (request.method === "POST") {
      await this.ctx.storage.put("active", true);
      return new Response("Room created");
    }
    
    // 2. Joiner checks if room exists
    if (request.method === "GET") {
      const isActive = await this.ctx.storage.get("active");
      if (isActive) return new Response("Room exists");
      return new Response("Not found", { status: 404 });
    }

    // 3. Users connect via WebSocket
    if (request.headers.get("Upgrade") === "websocket") {
      // Enforce 3-student limit
      if (this.sockets.length >= 3) {
        return new Response("Room is full", { status: 403 });
      }
      
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      // Track the socket
      this.sockets.push(server);
      
      // Use the modern Hibernatable WebSocket accept method
      this.ctx.acceptWebSocket(server);

      return new Response(null, { status: 101, webSocket: client });
    }
    
    return new Response("Method not allowed", { status: 405 });
  }

  // Triggered automatically when a user sends a message
  async webSocketMessage(ws, message) {
    this.sockets.forEach(s => {
      // Send the message to everyone EXCEPT the person who sent it
      if (s !== ws) {
        s.send(message);
      }
    });
  }

  // Triggered automatically when a user closes the tab
  async webSocketClose(ws) {
    this.sockets = this.sockets.filter(s => s !== ws);
  }

  // Triggered automatically on connection error
  async webSocketError(ws, error) {
    this.sockets = this.sockets.filter(s => s !== ws);
  }
}
