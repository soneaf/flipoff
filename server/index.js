import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { apiRouter } from './routes/api.js';
import { weatherRouter } from './routes/weather.js';
import { mastertourRouter } from './routes/mastertour.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3008;
const CONFIG_PATH = join(__dirname, 'config.json');

// Load or create config
function loadConfig() {
  if (existsSync(CONFIG_PATH)) {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  }
  const defaults = {
    theme: 'classic',
    activeMode: 'auto',
    enabledModes: ['clock', 'weather', 'quotes', 'tour'],
    modeRotationInterval: 30000,
    openWeatherMapKey: '',
    mastertourUrl: 'http://localhost:3010',
    customMessages: []
  };
  writeFileSync(CONFIG_PATH, JSON.stringify(defaults, null, 2));
  return defaults;
}

function saveConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

const config = loadConfig();

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));

// Make config available to routes
app.locals.config = config;
app.locals.saveConfig = saveConfig;

// API routes
app.use('/api', apiRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/tour', mastertourRouter);

// Remote control page
app.get('/remote', (req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'remote.html'));
});

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);

  // Send current state on connect
  ws.send(JSON.stringify({
    type: 'state',
    config: {
      theme: config.theme,
      activeMode: config.activeMode,
      enabledModes: config.enabledModes,
      modeRotationInterval: config.modeRotationInterval
    }
  }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      handleWsMessage(msg, ws);
    } catch (e) {
      // ignore malformed messages
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcast(msg, excludeWs) {
  const data = JSON.stringify(msg);
  for (const client of clients) {
    if (client !== excludeWs && client.readyState === 1) {
      client.send(data);
    }
  }
}

function handleWsMessage(msg, senderWs) {
  switch (msg.type) {
    case 'setMode':
      config.activeMode = msg.mode;
      saveConfig(config);
      broadcast(msg, null);
      break;

    case 'setTheme':
      config.theme = msg.theme;
      saveConfig(config);
      broadcast(msg, null);
      break;

    case 'sendMessage':
      broadcast({ type: 'sendMessage', lines: msg.lines }, null);
      break;

    case 'toggleSound':
      broadcast({ type: 'toggleSound' }, senderWs);
      break;

    case 'requestFullscreen':
      broadcast({ type: 'requestFullscreen' }, senderWs);
      break;

    case 'nextMessage':
      broadcast({ type: 'nextMessage' }, senderWs);
      break;

    case 'prevMessage':
      broadcast({ type: 'prevMessage' }, senderWs);
      break;
  }
}

// Make broadcast available to routes
app.locals.broadcast = broadcast;

server.listen(PORT, () => {
  console.log(`FlipOff server running on http://localhost:${PORT}`);
  console.log(`Remote control: http://localhost:${PORT}/remote`);
});
