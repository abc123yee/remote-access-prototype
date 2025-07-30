const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const httpProxy = require('http-proxy');

const app = express();
const server = http.createServer(app);

// Serve static files (our UI and noVNC)
app.use(express.static('public'));

// WebSocket proxy for VNC connections
const proxy = httpProxy.createProxyServer({
  target: 'ws://127.0.0.1:5900', // default target, overridden dynamically
  ws: true
});

// Create a WebSocket server to dynamically forward connections
const wss = new WebSocketServer({ server, path: '/websockify' });

wss.on('connection', (ws, req) => {
  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const targetIP = urlParams.get('ip');
  const targetPort = urlParams.get('port');

  const target = `ws://${targetIP}:${targetPort}`;
  console.log(`Proxying WebSocket to ${target}`);

  const clientSocket = new (require('ws'))(target);

  // Pipe client <-> target
  ws.on('message', msg => clientSocket.send(msg));
  clientSocket.on('message', msg => ws.send(msg));

  ws.on('close', () => clientSocket.close());
  clientSocket.on('close', () => ws.close());
});

// Start server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
