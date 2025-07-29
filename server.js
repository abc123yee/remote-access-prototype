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
  const params = url.parse(req.url, true).query;
  const targetHost = params.host;
  const targetPort = parseInt(params.port, 10) || 5900;

  if (!targetHost) {
    ws.close(1008, 'Missing host parameter');
    return;
  }

  console.log(`🔗 Proxying to ${targetHost}:${targetPort}`);

  const tcpSocket = net.connect(targetPort, targetHost, () => {
    console.log(`✅ Connected to ${targetHost}:${targetPort}`);
  });

  // Data forwarding
  ws.on('message', (msg) => tcpSocket.write(msg));
  tcpSocket.on('data', (data) => ws.send(data));

  ws.on('close', () => tcpSocket.end());
  tcpSocket.on('end', () => ws.close());
});

// Serve static assets
app.use('/novnc', express.static('noVNC'));
app.use('/', express.static('public'));

server.listen(3000, () => {
  console.log('🚀 Remote GUI Viewer running at http://localhost:3000');
});
