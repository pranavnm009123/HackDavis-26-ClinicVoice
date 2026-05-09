# ClinicVoice — VoiceBridge

> Real-time AI voice intake for frontline social-good organizations.

ClinicVoice lets a patient speak naturally to an AI voice agent. Within seconds, a structured intake card appears on a live staff dashboard — no forms, no typing, no barriers.

Built for **HackDavis 2026**.

---

## What It Does

A patient visits `/patient`, picks an intake mode (free clinic, shelter, or food aid), and starts talking. On the other side, a staff member on `/staff` watches intake cards appear in real time, with urgency alerts surfaced instantly so critical cases are never missed.

**Patient experience:** voice-first, multilingual, one question at a time, no forms.  
**Staff experience:** live card queue, urgency banners, one-click status updates, analytics view.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Voice AI | Google Gemini Live (`gemini-2.0-flash-live-preview`) |
| Intake structuring | Anthropic Claude (`claude-sonnet-4-6`) |
| Backend | Node.js + Express + WebSocket (`ws`) |
| Database | MongoDB via Mongoose |
| Frontend | React 19 + Vite + React Router |
| Charts | Recharts |

---

## Architecture & Data Flow

```
Patient Browser (/patient)
        │  PCM audio chunks (base64, WebSocket)
        ▼
  /ws/patient  ──────────────────────────────────────────────────────────┐
        │                                                                  │
        ▼                                                                  │
  Gemini Live Session                                                      │
  (geminiSession.js)                                                       │
        │                                                                  │
        ├─ tool call: tag_urgency ──────────────────────────────► broadcastStaff ──► /ws/staff
        │                                                                  │
        ├─ tool call: lookup_resources                                     │
        │       └─► returns local clinics/shelters/food banks             │
        │                                                                  │
        └─ tool call: finalize_intake                                      │
                │                                                          │
                ▼                                                          │
          Claude API (claude.js)                                           │
          Structured JSON intake card                                       │
                │                                                          │
                ▼                                                          │
          MongoDB (storage.js)                                             │
                │                                                          │
                └─► broadcastStaff NEW_INTAKE ───────────────────► /ws/staff
                                                                           │
                                                              Staff Browser (/staff)
```

### Step-by-step

1. Patient browser opens a WebSocket to `/ws/patient` and sends `start_session` with a mode and language preference.
2. The server creates a **Gemini Live** session that receives PCM audio and streams audio back to the patient.
3. Gemini conducts the intake interview, asking one question at a time. When it detects something notable, it calls one of three tools:
   - **`tag_urgency`** — immediately broadcasts an `URGENCY_ALERT` to all connected staff clients.
   - **`lookup_resources`** — returns local resources (clinics, shelters, food banks, pharmacies, interpreter lines, emergency lines) from a curated static dataset for the Yolo County / Davis, CA area.
   - **`finalize_intake`** — sends the raw intake data to **Claude** to generate a normalized JSON card, saves it to MongoDB, and broadcasts `NEW_INTAKE` to staff.
4. The staff dashboard receives live WebSocket pushes and displays cards as they arrive.

---

## Intake Modes

Three modes share the same pipeline but differ in required fields and urgency rules:

### `clinic` — Free Clinic
Collects: name, reason for visit, symptom duration, severity (1–10), urgent warning signs, insurance/cost concerns, accessibility needs, interpreter needs.  
Escalates immediately for: chest pain, trouble breathing, severe bleeding, stroke symptoms, unsafe home situation.

### `shelter` — Housing / Shelter
Collects: current housing status, location, safety risk, family size, pets, mobility needs, bed/resource need, contact method.  
Escalates immediately for: immediate danger, domestic violence, overnight exposure risk, unsupervised minors.

### `food_aid` — Food / Mutual Aid
Collects: household size, zip code, dietary restrictions, transportation limitations, requested supplies, food urgency, accessibility needs, contact method.  
Escalates immediately for: no food today, infants without food, medically fragile household members, inability to travel.

---

## Project Structure

```
.
├── package.json          # Root: dev/build scripts using concurrently
├── .env.example          # Environment variable template
│
├── server/
│   ├── index.js          # Express app, HTTP server, two WebSocket servers
│   ├── geminiSession.js  # Gemini Live session lifecycle and audio routing
│   ├── functions.js      # Tool implementations: tag_urgency, finalize_intake, lookup_resources
│   ├── claude.js         # Anthropic SDK call → structured intake card JSON
│   ├── intakeTemplates.js# Mode definitions, required fields, Gemini system prompt builder
│   └── storage.js        # Mongoose model (Intake) + CRUD helpers; graceful fallback if MongoDB is down
│
└── client/
    ├── index.html
    └── src/
        ├── App.jsx           # Router: /patient → PatientView, /staff → StaffView; global CSS
        ├── PatientView.jsx   # Mode picker, language selector, mic/camera controls, transcript
        ├── StaffView.jsx     # Live card queue, urgency alert banner, filter bar, status buttons
        ├── IntakeCard.jsx    # Single intake card: urgency badge, structured fields, resources, next step
        ├── AnalyticsView.jsx # Charts and summary stats over intake data
        ├── useSocket.js      # WebSocket hook: auto-reconnect, send, lastMessage
        ├── useAudio.js       # AudioWorkletNode mic capture, PCM→base64, playback queue
        └── audioWorklet.js   # AudioWorklet processor for real-time PCM streaming
```

---

## WebSocket Protocol

### Patient ↔ Server (`/ws/patient`)

| Direction | Message |
|---|---|
| Client → Server | `{ type: "start_session", mode, languagePreference }` |
| Client → Server | `{ type: "audio", data: "<base64 PCM>" }` |
| Client → Server | `{ type: "video", data: "<base64>" }` |
| Client → Server | `{ type: "text", text }` |
| Server → Client | `{ type: "session", status }` |
| Server → Client | `{ type: "audio", data, sampleRate }` |
| Server → Client | `{ type: "audio_interrupted" }` |
| Server → Client | `{ type: "transcript", role, text }` |

### Staff ↔ Server (`/ws/staff`)

| Direction | Message |
|---|---|
| Client → Server | `{ type: "UPDATE_STATUS", id, status }` |
| Server → Client | `{ type: "INTAKE_SNAPSHOT", cards }` — sent on connection |
| Server → Client | `{ type: "NEW_INTAKE", card }` |
| Server → Client | `{ type: "INTAKE_UPDATED", card }` |
| Server → Client | `{ type: "URGENCY_ALERT", mode, level, reason, ... }` |

---

## REST API

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service status, DB status, connected staff count, intake count |
| GET | `/intakes` | All intake cards from MongoDB |

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Google Gemini API key
- Anthropic API key

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd HackDavis-26-ClinicVoice

# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env and fill in your keys:
#   GEMINI_API_KEY=...
#   ANTHROPIC_API_KEY=...
#   MONGODB_URI=mongodb://localhost:27017/voicebridge
```

### Running

```bash
# Run both client (port 5173) and server (port 3001) together
npm run dev

# Or run separately
npm run dev:server   # Express + WebSocket server on :3001
npm run dev:client   # Vite dev server on :5173
```

Open:
- **Patient view:** http://localhost:5173/patient
- **Staff dashboard:** http://localhost:5173/staff

### Testing Individual Modules

```bash
cd server

node storage.js      # saves a demo record to MongoDB
node claude.js       # calls Claude API with a demo intake
node functions.js    # tests tag_urgency + lookup_resources
```

---

## Local Resources (Yolo County / Davis, CA)

The `lookup_resources` tool returns real local resources including:

- **Clinics:** Davis Community Clinic, CommuniCare Health Centers
- **Shelters:** Fourth and Hope (Woodland), Empower Yolo
- **Food:** Yolo Food Bank, Davis Community Meals and Housing
- **Emergency:** 911, 988 Suicide and Crisis Lifeline
- **Interpreter:** Yolo County Language Access Line, Community Interpreter Network

---

## Multilingual Support

Language is auto-detected by Gemini from the patient's speech. Patients can also explicitly select a language before starting. Gemini responds in the detected or selected language throughout the entire intake.

---

## Notes

- MongoDB is optional. The server logs a warning and continues if the database is unavailable; intake cards will not persist but live WebSocket broadcasts still work.
- The server loads `.env` from the repo root (`../` relative to `server/`).
- Audio is streamed as raw PCM over WebSocket (base64-encoded) and processed via `AudioWorkletNode` in the browser for minimal latency.
