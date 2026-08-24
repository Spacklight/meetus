export class MeetingRoom {
  constructor(state, env) {
    this.state = state;
    this.sockets = []; // Will hold up to 3 students
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

    // 3. Users connect via WebSocket for video signaling
    if (request.headers.get("Upgrade") === "websocket") {
      // Enforce the 3-student limit
      if (this.sockets.length >= 3) {
        return new Response("Room is full (max 3 students)", { status: 403 });
      }
      
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      // Accept the connection
      server.accept();
      this.sockets.push(server);
      
      // When a user sends a message, broadcast it to the OTHER users
      server.addEventListener("message", (event) => {
        this.sockets.forEach(s => {
          if (s !== server && s.readyState === 1) { // 1 = OPEN
            s.send(event.data);
          }
        });
      });

      // Remove user when they leave
      server.addEventListener("close", () => {
        this.sockets = this.sockets.filter(s => s !== server);
      });

      return new Response(null, { status: 101, webSocket: client });
    }
    
    return new Response("Method not allowed", { status: 405 });
  }
}
