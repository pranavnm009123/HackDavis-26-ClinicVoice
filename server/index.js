import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import Anthropic from '@anthropic-ai/sdk';
import { createGeminiSession } from './geminiSession.js';
import { isValidMode } from './intakeTemplates.js';
import * as storage from './storage.js';
import * as apptStorage from './appointments.js';
import * as doctorStorage from './doctors.js';
import * as facilityStorage from './facilities.js';
import * as userStorage from './users.js';
import { listBarriers, createBarrier, getAccessScoreForFacility, getFacilitiesWithScores } from './supportServices.js';
import { sendWelcomeEmail } from './email.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(serverDir, '../.env') });
dotenv.config({ path: path.join(serverDir, '.env') });

const PORT = process.env.PORT || 3001;
const app = express();
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
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
    service: 'CowmunityCare',
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
    service: 'CowmunityCare',
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

app.use(express.json());

app.get('/appointments', async (_req, res) => {
  try {
    res.json(await apptStorage.getAll());
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.post('/appointments', async (req, res) => {
  try {
    const appt = await apptStorage.saveAppointment({ ...req.body, source: 'staff' });
    broadcastStaff({ type: 'NEW_APPOINTMENT', appointment: appt });
    res.status(201).json(appt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/doctors', async (_req, res) => {
  try {
    const doctors = await doctorStorage.getAllDoctors();
    const withSlots = await Promise.all(
      doctors.map(async (d) => ({ ...d, slots: await doctorStorage.getDoctorSlots(d.id) }))
    );
    res.json(withSlots);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/doctors', async (req, res) => {
  try {
    const doctor = await doctorStorage.saveDoctor(req.body);
    res.status(201).json(doctor);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/doctors/:doctorId/slots', async (req, res) => {
  try {
    const slot = await doctorStorage.addSlot({ ...req.body, doctor_id: req.params.doctorId });
    broadcastStaff({ type: 'SLOT_ADDED', slot });
    res.status(201).json(slot);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/facilities', async (_req, res) => {
  try {
    res.json(await getFacilitiesWithScores());
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/facilities', async (req, res) => {
  try {
    const facility = await facilityStorage.saveFacility(req.body);
    broadcastStaff({ type: 'NEW_FACILITY', facility });
    res.status(201).json(facility);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/facilities/:id/access-score', async (req, res) => {
  try {
    const result = await getAccessScoreForFacility(req.params.id);
    if (!result) return res.status(404).json({ error: 'Facility not found' });
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/barriers', async (req, res) => {
  try {
    res.json(await listBarriers(req.query.facility_id || null));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/barriers', async (req, res) => {
  try {
    const report = await createBarrier(req.body);
    broadcastStaff({ type: 'BARRIER_REPORTED', report });
    res.status(201).json(report);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/users', async (req, res) => {
  try {
    const { email, phone, name, language } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const { user, isNew } = await userStorage.createUser({ email, phone, name, language });
    if (isNew) {
      sendWelcomeEmail({ to: email, userId: user.userId, name: user.name }).catch((e) =>
        console.warn('[Email] welcome failed:', e.message),
      );
    }
    res.status(isNew ? 201 : 200).json({ user, isNew });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/users/:userId', async (req, res) => {
  try {
    const user = await userStorage.lookupUser(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

app.post('/translate', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.json({ translated: text });
  if (!anthropicClient) {
    console.warn('[translate] ANTHROPIC_API_KEY not set');
    return res.status(503).json({ error: 'Translation service not configured — set ANTHROPIC_API_KEY' });
  }
  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Translate the following text to English. The text may be in Hindi (Devanagari script), Hinglish (Hindi words written in English/Latin letters), or mixed Hindi-English. Output only the English translation — nothing else, no explanation:\n\n${text}`,
      }],
    });
    res.json({ translated: response.content[0].text.trim() });
  } catch (e) {
    console.error('[translate]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.patch('/appointments/:id', async (req, res) => {
  try {
    const appt = await apptStorage.updateAppointment(req.params.id, req.body);
    if (!appt) return res.status(404).json({ error: 'Not found' });
    broadcastStaff({ type: 'APPOINTMENT_UPDATED', appointment: appt });
    res.json(appt);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  let sessionUser = null;

  console.log('Patient WS connected');
  sendJson(ws, { type: 'session', status: 'ready' });

  function startSession({ mode = 'clinic', languagePreference = 'auto', user = null }) {
    sessionUser = user;
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
      userContext: sessionUser,
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
  await apptStorage.seedIfEmpty();
  await facilityStorage.seedIfEmpty();
  await doctorStorage.seedIfEmpty();
  console.log('CowmunityCare MongoDB connected');
} catch (error) {
  console.warn(`CowmunityCare MongoDB unavailable: ${error.message}`);
}

server.listen(PORT, () => {
  console.log(`CowmunityCare server listening on http://localhost:${PORT}`);
});

export { app, server, broadcastStaff };
