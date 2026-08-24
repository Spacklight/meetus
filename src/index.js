export default {
  async fetch(request, env) {
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
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 400px;
          width: 90%;
        }
        h1 { color: #1a73e8; margin-bottom: 10px; }
        p { color: #5f6368; margin-bottom: 30px; }
        .btn-group { display: flex; flex-direction: column; gap: 15px; }
        button {
          padding: 15px; font-size: 16px; border: none; border-radius: 8px;
          cursor: pointer; font-weight: bold; transition: transform 0.1s;
        }
        button:active { transform: scale(0.98); }
        .btn-host { background-color: #1a73e8; color: white; }
        .btn-join { background-color: #e8f0fe; color: #1a73e8; }
        
        /* Waiting Room Styles */
        #waiting-room { display: none; }
        .meeting-id-box {
          background: #f0f2f5; padding: 15px; border-radius: 8px;
          margin: 20px 0; font-size: 24px; font-weight: bold;
          letter-spacing: 3px; color: #1a73e8;
        }
        .video-placeholder {
          background: #000; height: 200px; border-radius: 8px;
          margin-bottom: 20px; display: flex; align-items: center;
          justify-content: center; color: white; font-size: 14px;
        }
      </style>
    </head>
    <body>
      
      <!-- MAIN MENU -->
      <div class="container" id="main-menu">
        <h1>MeetUs</h1>
        <p>Connect with up to 3 students via live audio and video.</p>
        <div class="btn-group">
          <button class="btn-host" onclick="handleHost()">Host a Meeting</button>
          <button class="btn-join" onclick="handleJoin()">Join a Meeting</button>
        </div>
      </div>

      <!-- HOST WAITING ROOM -->
      <div class="container" id="waiting-room">
        <h1>Hosting...</h1>
        <p>Share this Meeting ID with your friends:</p>
        <div class="meeting-id-box" id="host-id">---</div>
        <button class="btn-host" style="margin-bottom: 20px;" onclick="copyId()">Copy Meeting ID</button>
        
        <div class="video-placeholder" id="local-video">
            Your video will appear here
        </div>
        <p style="font-size: 12px; color: #888;">Waiting for others to join...</p>
      </div>

      <script>
        function generateId() {
          // Generates a random 6-digit number
          return Math.floor(100000 + Math.random() * 900000);
        }

        function handleHost() {
          const meetingId = generateId();
          document.getElementById('host-id').innerText = meetingId;
          document.getElementById('main-menu').style.display = 'none';
          document.getElementById('waiting-room').style.display = 'block';
          
          // We will connect the real camera in a later step!
        }

        function handleJoin() {
          alert("You clicked Join! We will build the Join verification next.");
        }

        function copyId() {
          const id = document.getElementById('host-id').innerText;
          navigator.clipboard.writeText(id).then(() => {
            alert("Meeting ID copied: " + id);
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
