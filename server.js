// server.js - Final Version
import fs from 'fs';
import http from 'http';
import https from 'https';
import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

// 📂 Resolve project paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ✅ Serve noVNC static files
app.use('/novnc', express.static(path.join(__dirname, 'noVNC')));
app.use('/', express.static(path.join(__dirname, 'public')));

// ✅ HTTPS Support (Set to true if you have certs)
const USE_HTTPS = false;
let server;

if (USE_HTTPS) {
  server = https.createServer({
    key: fs.readFileSync('ssl/key.pem'),
    cert: fs.readFileSync('ssl/cert.pem')
  }, app);
} else {
  server = http.createServer(app);
}

// ✅ WebSocket Proxy
const wss = new WebSocketServer({ server, path: '/websockify' });

wss.on('connection', (ws, req) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const params = parsedUrl.searchParams;

    // ✅ Prioritize targetHost/targetPort, fallback to host/port
    const targetHost = params.get('targetHost') || params.get('host');
    const targetPort = parseInt(params.get('targetPort'), 10) || parseInt(params.get('port'), 10) || 5900;

    if (!targetHost) {
      console.error('❌ No target host specified in query parameters.');
      ws.close(1008, 'Missing target host');
      return;
    }

    console.log(`🔗 Proxying WebSocket → ${targetHost}:${targetPort}`);
    const tcp = net.connect(targetPort, targetHost, () => {
      console.log(`✅ Connected to ${targetHost}:${targetPort}`);
    });

    // ✅ TCP → WS
    tcp.on('data', data => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    // ✅ TCP End/Error
    tcp.on('end', () => ws.close());
    tcp.on('error', err => {
      console.error(`❌ TCP Error: ${err.message}`);
      ws.close(1011, 'TCP connection failed');
    });

    // ✅ WS → TCP
    ws.on('message', msg => tcp.write(msg));
    ws.on('close', () => tcp.end());

  } catch (err) {
    console.error(`❌ Proxy Error: ${err.message}`);
    ws.close(1011, 'Internal Server Error');
  }
});

// ✅ Start Server
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Remote GUI Viewer running at http://localhost:${PORT}`);
});
