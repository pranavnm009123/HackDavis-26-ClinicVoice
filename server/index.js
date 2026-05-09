import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { createGeminiSession } from './geminiSession.js';
import { isValidMode } from './intakeTemplates.js';
import * as storage from './storage.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(serverDir, '../.env') });
dotenv.config({ path: path.join(serverDir, '.env') });

const PORT = process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);
const patientWss = new WebSocketServer({ noServer: true });
const staffWss = new WebSocketServer({ noServer: true });
const staffClients = new Set();

function safeJsonParse(data) {
  try {
    return JSON.parse(data.toString());
  } catch {
    return null;
  }
}

function sendJson(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastStaff(payload) {
  const message = JSON.stringify(payload);

  for (const ws of staffClients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

app.get('/', (_req, res) => {
  res.json({
    service: 'VoiceBridge',
    status: 'running',
    routes: {
      health: '/health',
      intakes: '/intakes',
      patientWebSocket: '/ws/patient',
      staffWebSocket: '/ws/staff',
    },
    ui: {
      patient: 'http://localhost:5173/patient',
      staff: 'http://localhost:5173/staff',
    },
  });
});

app.get('/health', async (_req, res) => {
  let intakeCount = 0;

  try {
    intakeCount = (await storage.getAll()).length;
  } catch {
    intakeCount = 0;
  }

  res.json({
    ok: true,
    service: 'VoiceBridge',
    database: storage.getDatabaseStatus(),
    staffClients: staffClients.size,
    intakes: intakeCount,
  });
});

app.get('/intakes', async (_req, res) => {
  try {
    res.json(await storage.getAll());
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

staffWss.on('connection', (ws) => {
  staffClients.add(ws);
  storage
    .getAll()
    .then((cards) => sendJson(ws, { type: 'INTAKE_SNAPSHOT', cards }))
    .catch((error) => sendJson(ws, { type: 'ERROR', message: error.message }));

  ws.on('message', async (data) => {
    const message = safeJsonParse(data);

    if (message?.type === 'UPDATE_STATUS') {
      const updated = await storage.updateStatus(message.id, message.status || 'reviewed');

      if (updated) {
        broadcastStaff({ type: 'INTAKE_UPDATED', card: updated });
      } else {
        sendJson(ws, {
          type: 'ERROR',
          message: `No intake found for id ${message.id}`,
        });
      }
    }
  });

  ws.on('close', () => {
    staffClients.delete(ws);
  });
});

patientWss.on('connection', (ws) => {
  let geminiSession = null;
  let sessionPromise = null;
  let closed = false;
  let audioChunkCount = 0;

  console.log('Patient WS connected');
  sendJson(ws, { type: 'session', status: 'ready' });

  function startSession({ mode = 'clinic', languagePreference = 'auto' }) {
    if (!isValidMode(mode)) {
      sendJson(ws, {
        type: 'session',
        status: 'error',
        message: `Unsupported intake mode: ${mode}`,
      });
      return null;
    }

    console.log(`Starting patient session in ${mode} mode`);
    sessionPromise = createGeminiSession({
      patientWs: ws,
      broadcast: broadcastStaff,
      storage,
      mode,
      languagePreference,
    })
      .then((session) => {
        geminiSession = session;
        return session;
      })
      .catch((error) => {
        sendJson(ws, {
          type: 'session',
          status: 'error',
          message: error.message,
        });
        ws.close(1011, 'Gemini session failed');
        return null;
      });

    return sessionPromise;
  }

  ws.on('message', async (data) => {
    const message = safeJsonParse(data);

    if (message?.type === 'start_session') {
      startSession(message);
      return;
    }

    const session = geminiSession || (sessionPromise ? await sessionPromise : null);

    if (!session || closed) {
      sendJson(ws, {
        type: 'session',
        status: 'waiting_for_start',
        message: 'Choose an intake mode before sending audio.',
      });
      return;
    }

    if (message?.type === 'audio' && message.data) {
      audioChunkCount += 1;
      if (audioChunkCount === 1 || audioChunkCount % 50 === 0) {
        console.log(`Received patient audio chunk ${audioChunkCount}`);
      }
      session.sendAudio(message.data);
      return;
    }

    if (message?.type === 'video' && message.data) {
      session.sendVideo(message.data);
      return;
    }

    if (message?.type === 'text' && message.text) {
      session.sendText(message.text);
      return;
    }

    if (!message && data.length) {
      session.sendAudio(data.toString());
    }
  });

  ws.on('close', async () => {
    closed = true;
    console.log(`Patient WS closed after ${audioChunkCount} audio chunks`);
    const session = geminiSession || (sessionPromise ? await sessionPromise : null);
    session?.close();
  });
});

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);

  if (pathname === '/ws/patient') {
    patientWss.handleUpgrade(request, socket, head, (ws) => {
      patientWss.emit('connection', ws, request);
    });
    return;
  }

  if (pathname === '/ws/staff') {
    staffWss.handleUpgrade(request, socket, head, (ws) => {
      staffWss.emit('connection', ws, request);
    });
    return;
  }

  socket.destroy();
});

try {
  await storage.connectDatabase();
  console.log('VoiceBridge MongoDB connected');
} catch (error) {
  console.warn(`VoiceBridge MongoDB unavailable: ${error.message}`);
}

server.listen(PORT, () => {
  console.log(`VoiceBridge server listening on http://localhost:${PORT}`);
});

export { app, server, broadcastStaff };
