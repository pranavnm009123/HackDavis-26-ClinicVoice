# CowmunityCare

> Accessible community intake for healthcare, housing, hunger, and everyday help.

CowmunityCare helps people ask for support in the way that works for them: speech, ASL/sign language through video, or simple form details. Staff receive a structured intake record with urgency, accessibility needs, resource matches, and next steps.

Built for **HackDavis 2026** with an Aggie-inspired name and a care-first experience.

---

## Product Summary

CowmunityCare is a real-time intake system for clinics, shelters, food programs, and community support teams.

Patient-facing flow:

1. A person opens `/patient`.
2. They choose one of four help categories:
   - **Healthcare**
   - **Housing**
   - **Hunger**
   - **Here-to-Help**
3. They choose **Speech** or **ASL / Sign Language**.
4. The assistant asks one short question at a time.
5. The system creates a staff-ready record.

Staff-facing flow:

1. Staff open `/staff`.
2. Intake cards appear live.
3. Urgency alerts surface immediately.
4. Staff can update intake status, review appointments, manage facilities/doctors, and view analytics.

Core headline:

> Say it, sign it, share it — Care starts with being understood.

---

## Key Features

| Feature | What it does |
|---|---|
| Speech intake | Streams browser audio to Gemini Live and receives spoken responses. |
| ASL / sign-language intake | Uses video frames and timed signing windows so users can respond visually. |
| Four help categories | Healthcare, Housing, Hunger, and Here-to-Help share the same pipeline but collect different fields. |
| Live staff queue | New structured cards broadcast to staff over WebSocket. |
| Urgency alerts | Critical or high-risk signals are broadcast immediately before the intake is complete. |
| Structured case records | Claude normalizes raw intake data into a staff-facing JSON card. |
| Resource matching | Local resources are matched from curated data, optional Backboard RAG, and access scoring. |
| Accessibility-first UI | Keyboard focus, skip link, semantic landmarks, live regions, labels, reduced-motion support, and high-contrast palette. |
| Appointments | Staff can view, complete, cancel, add doctors, add facilities, and manage availability. |
| Analytics | Intake volume, urgency mix, modes, languages, appointments, and category trends. |

---

## Help Categories

The frontend uses friendly public labels. The backend keeps stable internal mode ids so existing server logic continues to work.

| Public label | Internal mode | Collects |
|---|---|---|
| Healthcare | `clinic` | Symptoms, duration, severity, red flags, insurance/cost concern, accessibility needs, interpreter needs, support contact. |
| Housing | `shelter` | Housing status, safety, timeline, family size, pets, budget, mobility needs, location, contact method. |
| Hunger | `food_aid` | Household size, location, dietary restrictions, transport limits, requested supplies, urgency, accessibility needs. |
| Here-to-Help | `support_services` | Type of help needed, location, mobility, language, transportation, cost concern, support contact, reachable options. |

Here-to-Help is access-first: it focuses on whether a person can actually reach a useful service, considering language, mobility, transportation, and known barriers.

---

## Accessibility Approach

CowmunityCare is designed for people who may be Deaf or hard of hearing, blind or low vision, speech-impaired or nonspeaking, multilingual, or navigating stressful circumstances.

Implemented UI accessibility work:

- Native buttons, inputs, selects, and links.
- Visible keyboard focus rings.
- Skip link to main content.
- Semantic page landmarks with `main` and labeled navigation.
- Screen-reader labels for filters, search, fields, camera preview, charts, and actions.
- `aria-live`, `role="status"`, and `role="alert"` for dynamic connection, loading, error, and speaking states.
- `aria-pressed` for selected filters and category choices.
- Reduced-motion fallback with `prefers-reduced-motion`.
- Blue/gold/white palette with WCAG AA contrast checks for key text pairs.
- Text transcript bubbles for spoken and signed interactions.

Important: this is not a legal accessibility certification. Before deployment, test manually with keyboard-only navigation, VoiceOver/NVDA, browser zoom at 200-400%, mobile touch, Deaf/ASL users, and blind/low-vision users.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router |
| Styling | Global CSS in `client/src/App.jsx` |
| Charts | Recharts |
| Backend | Node.js, Express, WebSocket (`ws`) |
| Live AI session | Google Gemini Live, `gemini-3.1-flash-live-preview` |
| Structured card generation | Anthropic Claude, `claude-sonnet-4-6` |
| Storage | MongoDB with Mongoose |
| Email | Nodemailer, Gmail/custom SMTP/Ethereal fallback |
| Optional resource intelligence | Backboard RAG |

---

## Architecture

```text
Patient Browser (/patient)
  | start_session: mode + languagePreference + optional user
  | audio/video/text over WebSocket
  v
Server /ws/patient
  v
Gemini Live Session
  | asks intake questions
  | streams transcripts/audio back
  | calls tools
  v
Tool functions
  | tag_urgency          -> broadcast URGENCY_ALERT to staff
  | lookup_resources     -> local/Backboard resource matching
  | check_resource_access-> access scoring for Here-to-Help
  | get_available_slots  -> appointment options
  | book_appointment     -> slot booking
  | finalize_intake      -> Claude structured card + MongoDB save
  v
Staff Browser (/staff)
  | receives INTAKE_SNAPSHOT, NEW_INTAKE, INTAKE_UPDATED, URGENCY_ALERT
  v
Staff dashboard, appointments, facilities, analytics
```

---

## Repository Layout

```text
.
├── package.json
├── README.md
├── .env.example
├── client/
│   ├── index.html
│   └── src/
│       ├── App.jsx              # Router and global CSS
│       ├── PatientView.jsx      # Patient setup, Speech/ASL flow, transcript
│       ├── StaffView.jsx        # Live intake queue
│       ├── IntakeCard.jsx       # Staff-facing intake card
│       ├── AppointmentsView.jsx # Appointments, doctors, facilities
│       ├── AnalyticsView.jsx    # Dashboard charts
│       ├── useSocket.js         # WebSocket hook
│       ├── useAudio.js          # Audio capture/playback hook
│       └── audioWorklet.js      # PCM audio worklet
└── server/
    ├── index.js                 # Express, REST routes, WebSocket servers
    ├── geminiSession.js         # Gemini Live session and tool declarations
    ├── functions.js             # Tool implementations
    ├── intakeTemplates.js       # Mode fields, urgency rules, prompts
    ├── claude.js                # Claude card normalization
    ├── storage.js               # Intake model/storage
    ├── appointments.js          # Appointment storage
    ├── doctors.js               # Doctors and slots
    ├── facilities.js            # Facility data
    ├── supportServices.js       # Accessibility scoring and barriers
    ├── users.js                 # Returning patient IDs
    ├── email.js                 # Welcome and appointment emails
    ├── backboardMatch.js        # Optional Backboard resource enrichment
    └── data/yolo_resources.md   # Curated local resource guide
```

---

## Environment Variables

Copy `.env.example` to `.env` in the repo root.

```bash
cp .env.example .env
```

Required:

```bash
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
MONGODB_URI=mongodb://localhost:27017/cowmunitycare
```

Optional Backboard RAG:

```bash
BACKBOARD_API_KEY=
BACKBOARD_ASSISTANT_ID=
```

Optional email settings:

```bash
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

If SMTP is not configured, the server uses an Ethereal test account for local development.

---

## Install And Run

Prerequisites:

- Node.js 20+
- MongoDB local or Atlas
- Gemini API key
- Anthropic API key

Install dependencies from the repo root:

```bash
npm install
```

Run client and server together:

```bash
npm run dev
```

Run separately:

```bash
npm run dev:server
npm run dev:client
```

Default local URLs:

```text
Patient app:     http://localhost:5173/patient
Staff queue:     http://localhost:5173/staff
Appointments:    http://localhost:5173/staff/appointments
Analytics:       http://localhost:5173/staff/analytics
Server health:   http://localhost:3001/health
```

Vite may move to another port, such as `5174`, if `5173` is already in use.

---

## Common Commands

```bash
# Run both client and server
npm run dev

# Run only the server
npm run dev:server

# Run only the client
npm run dev:client

# Build production client
npm run build

# Lint client
cd client && npm run lint

# Start server in production-style mode
npm run start
```

Server module checks:

```bash
cd server
node storage.js
node claude.js
node functions.js
```

---

## Patient WebSocket Protocol

Endpoint: `/ws/patient`

Client to server:

```json
{ "type": "start_session", "mode": "clinic", "languagePreference": "auto", "user": null }
```

```json
{ "type": "audio", "data": "base64_pcm_audio" }
```

```json
{ "type": "video", "mimeType": "image/jpeg", "data": "base64_jpeg" }
```

```json
{ "type": "text", "text": "The patient has turned on their camera." }
```

Server to client:

```json
{ "type": "session", "status": "ready|connected|error|closed" }
```

```json
{ "type": "transcript", "role": "user|model", "text": "..." }
```

```json
{ "type": "audio", "data": "base64_pcm_audio", "sampleRate": 24000 }
```

---

## Staff WebSocket Protocol

Endpoint: `/ws/staff`

Client to server:

```json
{ "type": "UPDATE_STATUS", "id": "intake-id", "status": "reviewed" }
```

Server to client:

```json
{ "type": "INTAKE_SNAPSHOT", "cards": [] }
```

```json
{ "type": "NEW_INTAKE", "card": {} }
```

```json
{ "type": "INTAKE_UPDATED", "card": {} }
```

```json
{ "type": "URGENCY_ALERT", "mode": "clinic", "level": "HIGH", "reason": "..." }
```

```json
{ "type": "NEW_APPOINTMENT", "appointment": {} }
```

---

## REST API

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Service summary and route hints |
| GET | `/health` | Server, DB, staff client, and intake status |
| GET | `/intakes` | All intake cards |
| GET | `/appointments` | All appointments |
| POST | `/appointments` | Create staff appointment |
| PATCH | `/appointments/:id` | Update appointment status |
| GET | `/doctors` | Doctors with slots |
| POST | `/doctors` | Add doctor |
| POST | `/doctors/:doctorId/slots` | Add availability slot |
| GET | `/facilities` | Facilities with access scores |
| POST | `/facilities` | Add facility |
| GET | `/facilities/:id/access-score` | Access score details |
| GET | `/barriers` | Barrier reports, optionally by facility |
| POST | `/barriers` | Add barrier report |
| POST | `/users` | Create or retrieve returning patient account |
| GET | `/users/:userId` | Look up returning patient |

---

## How ASL / Sign Language Intake Works

1. The patient chooses **ASL / Sign Language**.
2. The client starts the Gemini session with `languagePreference: "sign_language"`.
3. The camera turns on and sends JPEG frames every second.
4. The assistant asks exactly one short question.
5. The client waits for the signing window.
6. The client sends a text cue asking Gemini to interpret the recent signing.
7. The transcript shows captured signed responses as chat bubbles.
8. On finalize, the server creates a pending staff follow-up appointment for ASL intakes.

ASL prompt rules intentionally avoid repeated questions and multi-question turns.

---

## Resource Matching

CowmunityCare uses several resource layers:

1. Static fallback resources in `server/functions.js`.
2. Facility and access metadata from MongoDB.
3. Optional Backboard RAG enrichment using `server/data/yolo_resources.md`.

Here-to-Help uses `check_resource_access` to score reachable facilities against needs such as:

- wheelchair access
- ASL or language interpreter support
- transportation availability
- proximity to the patient city
- known staff-reported barriers

---

## Staff Workflow

Open `/staff`.

Staff can:

- review live intake cards
- filter by category, urgency, status, and search text
- switch grid/list layout
- dismiss urgency alerts
- mark cards reviewed, referred, or resolved

Open `/staff/appointments`.

Staff can:

- view bot-confirmed appointments
- complete or cancel appointments
- add doctors
- add facilities
- add appointment slots
- review facility networks

Open `/staff/analytics`.

Staff can review:

- intake volume over time
- appointment count
- urgency breakdown
- category breakdown
- languages spoken
- housing and hunger-specific metrics

---

## Design System Notes

Current brand:

- Product: **CowmunityCare**
- Tagline: **Accessible Community Intake**
- Main categories: **Healthcare**, **Housing**, **Hunger**, **Here-to-Help**
- Palette: UC Davis-inspired navy blue, gold, and white

Current patient page copy:

```text
Accessible intake for healthcare, housing, hunger, and everyday help — speak, sign, or share what you need.
```

```text
Say it, sign it, share it — Care starts with being understood.
```

The UI intentionally avoids making AI the lead message. The product promise is understanding, access, and staff-ready next steps.

---

## Known Limitations

- The product is not a medical diagnostic tool.
- The app can escalate urgent warning signs but does not replace emergency services.
- ASL interpretation depends on camera quality, lighting, user framing, and model performance.
- Accessibility implementation still needs real assistive-tech and user testing before deployment.
- Backend logs, prompts, and website-facing UI use the CowmunityCare name.
- MongoDB is required for durable storage. Without it, live WebSocket behavior can still run, but persistence will fail.

---

## Deployment Checklist

Before demo or deployment:

1. Create `.env` with required API keys.
2. Confirm MongoDB connection.
3. Run `npm run build`.
4. Run `cd client && npm run lint`.
5. Start server with `npm run dev:server`.
6. Start client with `npm run dev:client`.
7. Test `/patient` Speech flow.
8. Test `/patient` ASL / Sign Language flow.
9. Open `/staff` in another browser and verify live cards.
10. Verify `/staff/appointments` and `/staff/analytics`.
11. Test keyboard navigation and screen reader basics.

---

## Quick Troubleshooting

If the client starts on `5174` instead of `5173`:

```text
Port 5173 was already in use. Use the URL Vite prints.
```

If the server fails to create a Gemini session:

```text
Check GEMINI_API_KEY in .env.
```

If structured cards fail:

```text
Check ANTHROPIC_API_KEY in .env.
```

If cards do not persist:

```text
Check MONGODB_URI and MongoDB network access.
```

If emails do not send:

```text
Configure SMTP_* variables or use the Ethereal test-account logs.
```

If resource enrichment does not run:

```text
Set BACKBOARD_API_KEY and BACKBOARD_ASSISTANT_ID.
```
