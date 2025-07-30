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
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const params = parsedUrl.searchParams;

  // ✅ Prioritize targetHost/targetPort
  const targetHost = params.get('targetHost') || params.get('host');
  const targetPort = parseInt(params.get('targetPort'), 10) || parseInt(params.get('port'), 10) || 5900;

  if (!targetHost) {
    console.error('❌ No targetHost or host parameter provided');
    ws.close(1008, 'No target host');
    return;
  }

  console.log(`🔗 Proxy → ${targetHost}:${targetPort}`);

  const tcp = net.connect(targetPort, targetHost, () => {
    console.log(`✅ Connected to ${targetHost}:${targetPort}`);
  });

  tcp.on('data', data => ws.send(data));
  tcp.on('end', () => ws.close());
  tcp.on('error', err => {
    console.error(`❌ TCP error: ${err.message}`);
    ws.close(1011, 'TCP connection failed');
  });

  ws.on('message', msg => tcp.write(msg));
  ws.on('close', () => tcp.end());
});



// Serve static assets
app.use('/novnc', express.static('noVNC'));
app.use('/', express.static('public'));

server.listen(3000, () => {
  console.log('🚀 Remote GUI Viewer running at http://localhost:3000');
});
