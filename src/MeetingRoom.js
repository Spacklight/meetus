export class MeetingRoom {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    // When the HOST clicks start, they send a POST request to create the room
    if (request.method === "POST") {
      await this.state.storage.put("active", true);
      return new Response("Room created");
    }
    
    // When a JOINER checks the ID, they send a GET request
    if (request.method === "GET") {
      const isActive = await this.state.storage.get("active");
      if (isActive) {
        return new Response("Room exists");
      } else {
        // If the room doesn't exist, return a 404 error
        return new Response("Not found", { status: 404 });
      }
    }
    
    return new Response("Method not allowed", { status: 405 });
  }
}
