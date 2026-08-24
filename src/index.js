import { MeetingRoom } from "./MeetingRoom";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- BACKEND API ROUTES ---
    // If the user is checking/creating a room, talk to the Durable Object
    if (url.pathname.startsWith("/api/room/")) {
      const meetingId = url.pathname.split("/api/room/")[1];
      const id = env.MEETING_ROOM.idFromName(meetingId);
      const room = env.MEETING_ROOM.get(id);
      return room.fetch(request);
    }

    // --- FRONTEND HTML UI ---
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
          background-color: #f0f2f5;
          display: flex; justify-content: center; align-items: center;
          height: 100vh; margin: 0;
        }
        .container {
          background: white; padding: 40px; border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center;
          max-width: 400px; width: 90%;
        }
        h1 { color: #1a73e8; margin-bottom: 10px; }
        p { color: #5f6368; margin-bottom: 20px; }
        .btn-group { display: flex; flex-direction: column; gap: 15px; }
        button {
          padding: 15px; font-size: 16px; border: none; border-radius: 8px;
          cursor: pointer; font-weight: bold;
        }
        button:active { transform: scale(0.98); }
        .btn-host { background-color: #1a73e8; color: white; }
        .btn-join { background-color: #e8f0fe; color: #1a73e8; }
        
        #waiting-room, #join-room { display: none; }
        .meeting-id-box {
          background: #f0f2f5; padding: 15px; border-radius: 8px;
          margin: 20px 0; font-size: 24px; font-weight: bold;
          letter-spacing: 3px; color: #1a73e8;
        }
        .video-placeholder {
          background: #000; height: 150px; border-radius: 8px;
          margin-bottom: 20px; display: flex; align-items: center;
          justify-content: center; color: white; font-size: 14px;
        }
        input {
          width: 100%; padding: 15px; font-size: 18px; border: 2px solid #e0e0e0;
          border-radius: 8px; text-align: center; letter-spacing: 3px;
          box-sizing: border-box; margin-bottom: 15px; outline: none;
        }
        input:focus { border-color: #1a73e8; }
        .error-msg { color: #d93025; font-size: 14px; margin-top: -10px; margin-bottom: 15px; display: none; }
      </style>
    </head>
    <body>
      
      <div class="container" id="main-menu">
        <h1>MeetUs</h1>
        <p>Connect with up to 3 students via live audio and video.</p>
        <div class="btn-group">
          <button class="btn-host" onclick="handleHost()">Host a Meeting</button>
          <button class="btn-join" onclick="showJoinUI()">Join a Meeting</button>
        </div>
      </div>

      <div class="container" id="waiting-room">
        <h1>Hosting...</h1>
        <p>Share this Meeting ID:</p>
        <div class="meeting-id-box" id="host-id">---</div>
        <button class="btn-host" style="margin-bottom: 20px;" onclick="copyId()">Copy Meeting ID</button>
        <div class="video-placeholder">Your video will appear here</div>
      </div>

      <div class="container" id="join-room">
        <h1>Join a Meeting</h1>
        <p>Enter the Meeting ID provided by the host:</p>
        <input type="number" id="join-id-input" placeholder="e.g. 123456" maxlength="6">
        <div class="error-msg" id="join-error">Meeting ID not available</div>
        <button class="btn-host" onclick="checkMeetingId()">Join</button>
        <button class="btn-join" style="margin-top:10px;" onclick="backToMenu()">Back</button>
      </div>

      <script>
        let currentMeetingId = null;

        function generateId() {
          return Math.floor(100000 + Math.random() * 900000);
        }

        async function handleHost() {
          currentMeetingId = generateId();
          document.getElementById('host-id').innerText = currentMeetingId;
          document.getElementById('main-menu').style.display = 'none';
          document.getElementById('waiting-room').style.display = 'block';
          
          // Tell Cloudflare to create this room in the database
          await fetch('/api/room/' + currentMeetingId, { method: 'POST' });
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
          
          // Ask Cloudflare if this room exists
          const response = await fetch('/api/room/' + enteredId);
          
          if (response.ok) {
            errorDiv.style.display = 'none';
            alert("Success! Meeting found. We will connect the video next.");
          } else {
            // If room doesn't exist, show the fake ID error
            errorDiv.style.display = 'block';
          }
        }

        function copyId() {
          navigator.clipboard.writeText(currentMeetingId).then(() => {
            alert("Copied: " + currentMeetingId);
          });
        }
      </script>
    </body>
    </html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  },
};
export { MeetingRoom };
