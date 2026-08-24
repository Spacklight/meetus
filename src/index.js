import { MeetingRoom } from "./MeetingRoom";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/room/")) {
      const meetingId = url.pathname.split("/api/room/")[1];
      const id = env.MEETING_ROOM.idFromName(meetingId);
      const room = env.MEETING_ROOM.get(id);
      return room.fetch(request);
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MeetUs</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #212121; color: white;
          display: flex; justify-content: center; align-items: center;
          height: 100vh; margin: 0;
        }
        .container {
          background: #2d2d2d; padding: 20px; border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5); text-align: center;
          max-width: 400px; width: 95%;
        }
        h1 { color: #4da3ff; margin-bottom: 10px; }
        p { color: #bbb; margin-bottom: 20px; }
        .btn-group { display: flex; flex-direction: column; gap: 15px; }
        button {
          padding: 15px; font-size: 16px; border: none; border-radius: 8px;
          cursor: pointer; font-weight: bold; color: white;
        }
        button:active { transform: scale(0.98); }
        .btn-host { background-color: #1a73e8; }
        .btn-join { background-color: #3c4043; }
        
        #waiting-room, #join-room { display: none; }
        .meeting-id-box {
          background: #1a73e8; padding: 15px; border-radius: 8px;
          margin: 20px 0; font-size: 28px; font-weight: bold;
          letter-spacing: 5px; color: white;
        }
        .status-text { 
          font-size: 12px; font-weight: bold; margin-bottom: 10px; 
          background: #1a1a1a; padding: 8px; border-radius: 5px;
          word-wrap: break-word;
        }
        input {
          width: 100%; padding: 15px; font-size: 18px; border: 2px solid #444;
          border-radius: 8px; text-align: center; letter-spacing: 3px;
          box-sizing: border-box; margin-bottom: 15px; outline: none;
          background: #1a1a1a; color: white;
        }
        input:focus { border-color: #1a73e8; }
        .error-msg { color: #ff4d4d; font-size: 14px; margin-top: -10px; margin-bottom: 15px; display: none; }
        
        #chat-container {
          text-align: left; height: 200px; overflow-y: auto; 
          background: #1a1a1a; padding: 10px; border-radius: 8px; 
          margin-bottom: 10px; font-size: 14px; border: 1px solid #444;
        }
        .chat-msg { margin-bottom: 8px; word-wrap: break-word; }
        .chat-them { color: #4da3ff; }
        .chat-you { color: #34a853; text-align: right; }
        #chat-input { text-align: left; letter-spacing: normal; font-size: 14px; padding: 10px; margin: 0;}
      </style>
    </head>
    <body>
      
      <div class="container" id="main-menu">
        <h1>MeetUs</h1>
        <p>Test connection via text chat.</p>
        <div class="btn-group">
          <button class="btn-host" onclick="handleHost()">Host a Meeting</button>
          <button class="btn-join" onclick="showJoinUI()">Join a Meeting</button>
        </div>
      </div>

      <div class="container" id="waiting-room">
        <h1 id="room-title">Hosting...</h1>
        <p id="room-subtitle">Share this Meeting ID:</p>
        
        <div id="host-controls">
          <div class="meeting-id-box" id="host-id">---</div>
          <button class="btn-host" style="margin-bottom: 20px;" onclick="copyId()">Copy Meeting ID</button>
        </div>

        <!-- This will now show us exactly what is happening -->
        <div class="status-text" id="ws-status" style="color: #ff4d4d;">Starting...</div>
        
        <div id="chat-container"></div>
        <div style="display: flex; gap: 10px;">
          <input type="text" id="chat-input" placeholder="Type a message...">
          <button class="btn-host" style="width: 80px; padding: 0 15px;" onclick="sendChat()">Send</button>
        </div>
      </div>

      <div class="container" id="join-room">
        <h1>Join a Meeting</h1>
        <p>Enter the Meeting ID:</p>
        <input type="number" id="join-id-input" placeholder="e.g. 123456" maxlength="6">
        <div class="error-msg" id="join-error">Meeting ID not available</div>
        <button class="btn-host" onclick="checkMeetingId()">Join</button>
        <button class="btn-join" style="margin-top:10px;" onclick="backToMenu()">Back</button>
      </div>

      <script>
        let currentMeetingId = null;
        let ws;
        let isJoiner = false;

        function generateId() { return Math.floor(100000 + Math.random() * 900000); }

        function connectSignalingServer(meetingId) {
          const wsUrl = "wss://" + window.location.host + "/api/room/" + meetingId;
          const statusEl = document.getElementById('ws-status');
          
          statusEl.innerText = "Connecting to: " + wsUrl;
          statusEl.style.color = "#ffaa00";
          
          ws = new WebSocket(wsUrl);
          
          ws.onopen = () => {
            statusEl.innerText = "CONNECTED! You can chat now.";
            statusEl.style.color = "#34a853";
            // REMOVED the broken initiateCall() command here
          };
          
          ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'chat') {
              const chatBox = document.getElementById('chat-container');
              chatBox.innerHTML += '<div class="chat-msg chat-them">Them: ' + msg.text + '</div>';
              chatBox.scrollTop = chatBox.scrollHeight;
            }
          };

          // Make invisible errors visible on the screen
          ws.onerror = (error) => {
            statusEl.innerText = "WEBSOCKET ERROR! Check console.";
            statusEl.style.color = "#ff4d4d";
          };

          ws.onclose = (event) => {
            statusEl.innerText = "CLOSED. Code: " + event.code + " Reason: " + event.reason;
            statusEl.style.color = "#ff4d4d";
          };
        }

        function sendChat() {
          const input = document.getElementById('chat-input');
          if (!input.value || !ws) return;
          
          const chatBox = document.getElementById('chat-container');
          chatBox.innerHTML += '<div class="chat-msg chat-you">You: ' + input.value + '</div>';
          chatBox.scrollTop = chatBox.scrollHeight;
          
          ws.send(JSON.stringify({ type: 'chat', text: input.value }));
          input.value = '';
        }

        async function handleHost() {
          currentMeetingId = generateId();
          document.getElementById('host-id').innerText = currentMeetingId;
          document.getElementById('main-menu').style.display = 'none';
          document.getElementById('waiting-room').style.display = 'block';
          
          await fetch('/api/room/' + currentMeetingId, { method: 'POST' });
          connectSignalingServer(currentMeetingId);
        }

        function showJoinUI() {
          document.getElementById('main-menu').style.display = 'none';
          document.getElementById('join-room').style.display = 'block';
        }

        function backToMenu() {
          document.getElementById('join-room').style.display = 'none';
          document.getElementById('join-error').style.display = 'none';
          document.getElementById('main-menu').style.display = 'block';
        }

        async function checkMeetingId() {
          const enteredId = document.getElementById('join-id-input').value;
          const errorDiv = document.getElementById('join-error');
          if (!enteredId) return;
          
          const response = await fetch('/api/room/' + enteredId);
          if (response.ok) {
            errorDiv.style.display = 'none';
            currentMeetingId = enteredId;
            isJoiner = true;
            
            document.getElementById('join-room').style.display = 'none';
            document.getElementById('waiting-room').style.display = 'block';
            document.getElementById('room-title').innerText = "In Meeting";
            document.getElementById('room-subtitle').style.display = 'none';
            document.getElementById('host-controls').style.display = 'none';
            
            connectSignalingServer(currentMeetingId);
          } else {
            errorDiv.style.display = 'block';
          }
        }

        function copyId() {
          navigator.clipboard.writeText(currentMeetingId).then(() => alert("Copied: " + currentMeetingId));
        }
      </script>
    </body>
    </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html" } });
  },
};

export { MeetingRoom };
