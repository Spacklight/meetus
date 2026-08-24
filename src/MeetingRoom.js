export class MeetingRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    // 1. Host creates the room
    if (request.method === "POST") {
      await this.state.storage.put("active", true);
      return new Response("Room created");
    }
    
    // 2. Joiner checks if room exists
    if (request.method === "GET") {
      const isActive = await this.state.storage.get("active");
      if (isActive) return new Response("Room exists");
      return new Response("Not found", { status: 404 });
    }

    // 3. WebSocket Connection
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      // Tell Cloudflare to manage this WebSocket hibernation state
      this.state.acceptWebSocket(server);

      return new Response(null, { status: 101, webSocket: client });
    }
    
    return new Response("Method not allowed", { status: 405 });
  }

  // Automatically triggered when a user sends a message
  async webSocketMessage(ws, message) {
    // Ask Cloudflare for the list of connected WebSockets in this room
    const sockets = this.state.getWebSockets();
    
    // Broadcast the message to everyone EXCEPT the person who sent it
    sockets.forEach(s => {
      if (s !== ws) {
        s.send(message);
      }
    });
  }
}
