const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const net = require('net');
const url = require('url');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/websockify' });

// WebSocket Proxy: Browser <-> Node <-> VNC Server
wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.replace('/websockify?', ''));

  // ✅ Use targetHost/targetPort (real VNC server)
  const targetHost = params.get('targetHost');
  const targetPort = parseInt(params.get('targetPort'), 10) || 5900;

  if (!targetHost) {
    console.error('❌ Missing targetHost parameter');
    ws.close();
    return;
  }

  console.log(`🔗 Proxying WebSocket → ${targetHost}:${targetPort}`);
  const tcp = net.connect(targetPort, targetHost, () => {
    console.log(`✅ Connected to ${targetHost}:${targetPort}`);
  });

  // Raw TCP forwarding
  ws.on('message', msg => tcp.write(msg));
  tcp.on('data', data => ws.send(data));
  ws.on('close', () => tcp.end());
  tcp.on('end', () => ws.close());
});


// Serve static assets
app.use('/novnc', express.static('noVNC'));
app.use('/', express.static('public'));

server.listen(3000, () => {
  console.log('🚀 Remote GUI Viewer running at http://localhost:3000');
});
