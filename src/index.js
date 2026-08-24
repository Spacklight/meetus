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
        h1 {
          color: #1a73e8;
          margin-bottom: 10px;
        }
        p {
          color: #5f6368;
          margin-bottom: 30px;
        }
        .btn-group {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        button {
          padding: 15px;
          font-size: 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: transform 0.1s, box-shadow 0.1s;
        }
        button:active {
          transform: scale(0.98);
        }
        .btn-host {
          background-color: #1a73e8;
          color: white;
          box-shadow: 0 2px 5px rgba(26, 115, 232, 0.3);
        }
        .btn-join {
          background-color: #e8f0fe;
          color: #1a73e8;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>MeetUs</h1>
        <p>Connect with up to 3 students via live audio and video.</p>
        <div class="btn-group">
          <button class="btn-host" onclick="handleHost()">Host a Meeting</button>
          <button class="btn-join" onclick="handleJoin()">Join a Meeting</button>
        </div>
      </div>

      <script>
        function handleHost() {
          alert("You clicked Host! We will build the Host room next.");
        }
        function handleJoin() {
          alert("You clicked Join! We will build the Join verification next.");
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
