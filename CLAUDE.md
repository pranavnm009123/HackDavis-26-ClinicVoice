# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run both client and server in dev mode (from repo root)
npm run dev

# Run server only
npm run dev:server

# Run client only (Vite on port 5174)
npm run dev:client

# Build client for production
npm run build

# Lint client
cd client && npm run lint

# Test individual server modules (each file is self-executing when run directly)
cd server && node storage.js      # saves a demo record to MongoDB
cd server && node claude.js       # calls Claude API with a demo intake
cd server && node functions.js    # tests tag_urgency + lookup_resources
```

## Environment Setup

Copy `.env.example` to `.env` in the repo root:
```
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
MONGODB_URI=mongodb://localhost:27017/voicebridge
JWT_SECRET=your-random-secret-here

# Optional — Backboard RAG for richer resource matching
BACKBOARD_API_KEY=
BACKBOARD_ASSISTANT_ID=
```

The server loads `.env` from the repo root (`../` relative to `server/`).

## Architecture

**CowmunityCare** (formerly ClinicVoice/VoiceBridge) is a real-time voice intake system for frontline social-good organizations (free clinics, shelters, food aid). A patient speaks to an AI voice agent; a structured intake card is produced and pushed live to a staff dashboard.

### Data Flow

1. **Patient browser** (`/patient`) opens a WebSocket to `/ws/patient`
2. Server starts a **Gemini Live** session (`gemini-3.1-flash-live-preview`) that receives PCM audio chunks in real time and streams audio back
3. Gemini calls one of three **tool functions** during the conversation:
   - `tag_urgency` — immediately broadcasts a `URGENCY_ALERT` to all staff
   - `lookup_resources` — returns local resources (clinics, shelters, food banks, etc.) from static data
   - `finalize_intake` — sends intake args to **Claude** (`claude-sonnet-4-6`) to generate a structured JSON card, saves it to MongoDB, then broadcasts `NEW_INTAKE` to staff
4. **Staff browser** (`/staff`) receives live WebSocket pushes (`NEW_INTAKE`, `URGENCY_ALERT`, `INTAKE_SNAPSHOT`) and can update intake status

### Auth & Profile Flow

- JWT-based auth (7-day expiry, stored in localStorage). `JWT_SECRET` env var required in production.
- On `start_session` WebSocket message, if a `token` field is present, the server verifies it and fetches the full user profile from MongoDB, injecting it into the Gemini system prompt so the AI can greet returning patients with their info pre-loaded.
- Guest mode (no token) works unchanged — AI asks all questions from scratch.
- All profile write endpoints (`PUT /api/profile*`) require `Authorization: Bearer <token>`.

### Server (`server/`)

| File | Role |
|------|------|
| `index.js` | Express + two WebSocket servers (`patientWss`, `staffWss`), REST `/health` and `/intakes`; mounts `/auth` and `/api` routes; JWT verification on `start_session` |
| `geminiSession.js` | Creates and manages a Gemini Live session; routes audio/video/text in, routes audio/transcripts/tool calls out |
| `functions.js` | Implements `tag_urgency`, `finalize_intake`, `lookup_resources`; dispatches Gemini tool calls |
| `claude.js` | Calls Anthropic SDK to convert raw intake args into a normalized JSON card schema |
| `intakeTemplates.js` | Defines three intake modes with required fields and urgency rules; `buildSystemInstruction(mode, langPref, userProfile)` injects saved profile data |
| `storage.js` | Mongoose `Intake` model + CRUD helpers; falls back gracefully if MongoDB is unavailable |
| `models/User.js` | Mongoose `AuthUser` model — email, passwordHash, nested profile (name, phone, bloodGroup, insurance, allergies, emergencyContact, etc.) |
| `middleware/authMiddleware.js` | `verifyToken` Express middleware — reads `Authorization: Bearer` header, verifies JWT |
| `routes/auth.js` | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| `routes/profile.js` | `GET/PUT /api/profile`, `PUT /api/profile/password`, `PUT /api/profile/email` — all JWT-protected |
| `email.js` | Nodemailer helpers for sending confirmation emails |
| `appointments.js` / `doctors.js` / `facilities.js` | Appointment booking, doctor lookup, facility data |
| `backboardRag.js` / `backboardMatch.js` | Backboard SDK integration for semantic resource matching |

### Client (`client/src/`)

| File | Role |
|------|------|
| `App.jsx` | Router + `AuthProvider` wrapper; routes: `/` landing, `/login`, `/signup`, `/settings`, `/patient`, `/staff`; all global CSS lives here |
| `useAuth.jsx` | Auth context — `login`, `signup`, `logout`, `updateProfile`, `changePassword`, `changeEmail`; rehydrates from localStorage on mount via `GET /auth/me` |
| `LandingPage.jsx` | Hero with park background + dark overlay, yellow headline, two CTA buttons (white outline → yellow on hover), 3 feature cards |
| `AuthPage.jsx` | Combined login/signup with tab toggle, password strength bar (0–5 score), requirements checklist, live passwords-match feedback |
| `SettingsPage.jsx` | Profile form with 6 sections (personal, insurance, health, emergency contact, change email, change password); each section has its own Save button |
| `PatientView.jsx` | Mode picker, language selector, session start, mic/camera controls, transcript; top nav with My Profile + red Log out when logged in |
| `StaffView.jsx` | Live queue of intake cards with urgency alert banner, filter bar, status update buttons |
| `IntakeCard.jsx` | Renders a single intake card (urgency badge, structured fields, resources, next step) |
| `useSocket.js` | WebSocket hook — connects to the server, reconnects on drop, exposes `send` and `lastMessage` |
| `useAudio.js` | Microphone capture via `AudioWorkletNode` (`audioWorklet.js`), PCM→base64 encoding, PCM playback queue for Gemini audio responses |

**Important:** JSX must live in `.jsx` files. Vite's OXC transformer skips JSX in `.js` files — this will cause a runtime parse error.

### Intake Modes

Three modes share the same pipeline but have different required fields and urgency rules:
- `clinic` — free clinic medical intake
- `shelter` — housing/shelter intake
- `food_aid` — food assistance intake

Mode is selected by the patient on the `/patient` page and passed in `start_session`. The Gemini system prompt is built dynamically per mode in `intakeTemplates.buildSystemInstruction()`.

### WebSocket Message Protocol

**Patient ↔ Server:**
- Client sends: `{ type: "start_session", mode, languagePreference, token? }`, `{ type: "audio", data: base64 }`, `{ type: "video", data: base64 }`, `{ type: "text", text }`
- Server sends: `{ type: "session", status }`, `{ type: "audio", data, sampleRate }`, `{ type: "audio_interrupted" }`, `{ type: "transcript", role, text }`

**Staff ↔ Server:**
- Client sends: `{ type: "UPDATE_STATUS", id, status }`
- Server sends: `{ type: "INTAKE_SNAPSHOT", cards }`, `{ type: "NEW_INTAKE", card }`, `{ type: "INTAKE_UPDATED", card }`, `{ type: "URGENCY_ALERT", ... }`
