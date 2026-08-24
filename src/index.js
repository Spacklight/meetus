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
          background-color: #212121; /* Dark mode looks better for video */
          display: flex; justify-content: center; align-items: center;
          height: 100vh; margin: 0; color: white;
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
        video {
          width: 100%; height: 180px; border-radius: 8px;
          margin-bottom: 10px; background: #000; object-fit: cover;
        }
        .status-text { font-size: 12px; color: #4da3ff; font-weight: bold; margin-bottom: 10px; }
        input {
          width: 100%; padding: 15px; font-size: 18px; border: 2px solid #444;
          border-radius: 8px; text-align: center; letter-spacing: 3px;
          box-sizing: border-box; margin-bottom: 15px; outline: none;
          background: #1a1a1a; color: white;
        }
        input:focus { border-color: #1a73e8; }
        .error-msg { color: #ff4d4d; font-size: 14px; margin-top: -10px; margin-bottom: 15px; display: none; }
      </style>
    </head>
    <body>
      
      <div class="container" id="main-menu">
        <h1>MeetUs</h1>
        <p>Connect with up to 3 students securely.</p>
        <div class="btn-group">
          <button class="btn-host" onclick="handleHost()">Host a Meeting</button>
          <button class="btn-join" onclick="showJoinUI()">Join a Meeting</button>
        </div>
      </div>

      <div class="container" id="waiting-room">
        <h1 id="room-title">Hosting...</h1>
        <p id="room-subtitle">Share this Meeting ID:</p>
        <div class="meeting-id-box" id="host-id">---</div>
        <button class="btn-host" style="margin-bottom: 10px;" onclick="copyId()">Copy Meeting ID</button>
        <div class="status-text" id="ws-status">Connecting...</div>
        
        <video id="remote-video" autoplay playsinline></video>
        <video id="local-video" autoplay muted playsinline></video>
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
        let localStream;
        let ws;
        let peerConnection;
        let isJoiner = false;

        const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

        function generateId() { return Math.floor(100000 + Math.random() * 900000); }

        async function startLocalVideo() {
          try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            document.getElementById('local-video').srcObject = localStream;
          } catch (error) { alert("Camera/Mic permission denied."); }
        }

        // --- WEBRTC MAGIC ---
        function createPeerConnection() {
          peerConnection = new RTCPeerConnection(config);
          
          // Add your local video/audio tracks to the connection
          localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
          });

          // When the OTHER user's video arrives, show it
          peerConnection.ontrack = (event) => {
            document.getElementById('remote-video').srcObject = event.streams[0];
          };

          // Find network paths and send them to the other user
          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              ws.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
            }
          };
        }

        async function initiateCall() {
          await startLocalVideo();
          createPeerConnection();
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          ws.send(JSON.stringify({ type: 'offer', offer: offer }));
        }

        // --- WEBSOCKET & SIGNALING ---
        function connectSignalingServer(meetingId) {
          const wsUrl = "wss://" + window.location.host + "/api/room/" + meetingId;
          ws = new WebSocket(wsUrl);
          
          ws.onopen = () => {
            document.getElementById('ws-status').innerText = "Connected! Linking video...";
            // If you are the joiner, start the WebRTC handshake
            if (isJoiner) initiateCall();
          };
          
          ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === 'offer') {
              // HOST receives offer from JOINER
              if (!localStream) await startLocalVideo();
              createPeerConnection();
              await peerConnection.setRemoteDescription(msg.offer);
              const answer = await peerConnection.createAnswer();
              await peerConnection.setLocalDescription(answer);
              ws.send(JSON.stringify({ type: 'answer', answer: answer }));
            } 
            else if (msg.type === 'answer') {
              // JOINER receives answer from HOST
              await peerConnection.setRemoteDescription(msg.answer);
            } 
            else if (msg.type === 'ice-candidate') {
              // Both users exchange network paths
              if (peerConnection) {
                await peerConnection.addIceCandidate(msg.candidate);
              }
            }
          };
        }

        // --- UI LOGIC ---
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
            isJoiner = true; // Mark as joiner for WebSocket trigger
            
            document.getElementById('join-room').style.display = 'none';
            document.getElementById('waiting-room').style.display = 'block';
            document.getElementById('room-title').innerText = "Joining...";
            document.getElementById('room-subtitle').innerText = "Connecting to host.";
            document.getElementById('host-id').style.display = 'none';
            document.querySelector('.btn-host').style.display = 'none'; // Hide copy button
            
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
