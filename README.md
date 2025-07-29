# RemoteAccessPrototype

Web Based Remote Access Prototype for Linux and Windoes


Requires the folowing dependices to be installed serverside to run

npm init -y
npm install express ws


Also Required to Run

noVNC - vnc.html file modified

Changes made

const params = new URLSearchParams(window.location.search);
const targetHost = params.get('targetHost');
const targetPort = params.get('targetPort') || 5900;

const wsUrl = `ws://${window.location.host}/websockify?host=${targetHost}&port=${targetPort}`;

const rfb = new RFB(document.getElementById('screen'), wsUrl, {
  credentials: {}
});

rfb.scaleViewport = true;
rfb.background = '#000';



noVNC must be installed on target machine