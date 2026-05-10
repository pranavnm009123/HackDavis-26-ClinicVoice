import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAudio } from './useAudio.js';
import { useSocket } from './useSocket.js';
import { useAuth } from './useAuth.jsx';

const DRAFT_FIELDS = {
  clinic: [
    { key: 'name', label: 'Name' },
    { key: 'chiefComplaint', label: 'Chief complaint' },
    { key: 'duration', label: 'Duration' },
    { key: 'urgency', label: 'Urgency' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'allergies', label: 'Allergies' },
  ],
  shelter: [
    { key: 'name', label: 'Name' },
    { key: 'situation', label: 'Situation' },
    { key: 'familySize', label: 'Family size' },
    { key: 'pets', label: 'Pets' },
    { key: 'mobility', label: 'Mobility' },
  ],
  food_aid: [
    { key: 'name', label: 'Name' },
    { key: 'householdSize', label: 'Household size' },
    { key: 'zip', label: 'ZIP code' },
    { key: 'dietary', label: 'Dietary needs' },
    { key: 'transport', label: 'Transport' },
  ],
  support_services: [
    { key: 'name', label: 'Name' },
    { key: 'language', label: 'Language' },
    { key: 'helpType', label: 'Help needed' },
    { key: 'mobility', label: 'Mobility' },
  ],
};

const DRAFT_SUGGESTIONS = {
  clinic: [
    'UC Davis Student Health Center — (530) 752-2349',
    'Yolo County free pharmacy assistance available',
    'For emergencies call 911 immediately',
  ],
  shelter: [
    'Yolo County Homeless & Poverty Services — (530) 661-2750',
    'Statewide crisis hotline: 211 (free, 24/7)',
    'Salvation Army Davis — (530) 756-9218',
  ],
  food_aid: [
    'Yolo Food Bank — open Tue/Thu 9 am–1 pm',
    'CalFresh same-day assistance available',
    'USDA SNAP application at benefits.gov',
  ],
  support_services: [
    '211 connects you to all local social services',
    'Yolo Bus reduced-fare ADA transit available',
    'Interpreter services available — just ask',
  ],
};

function extractDraft(msgs, mode) {
  if (!msgs.length) return {};
  const all = msgs.map((m) => m.text).join(' ');
  const modelText = msgs.filter((m) => m.role === 'model').map((m) => m.text).join(' ');
  const f = {};

  const nm = all.match(/(?:name(?:\s+is|\s*'s)?\s+([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?)|I(?:'m| am)\s+([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?))/);
  if (nm) f.name = (nm[1] || nm[2] || '').trim();

  if (mode === 'clinic') {
    const sx = modelText.match(/(?:you(?:'re| are) (?:experiencing|having|suffering from)|you(?:'ve| have) mentioned|noted:?)\s+([^.!?]{6,80})/i);
    if (sx) f.chiefComplaint = sx[1].replace(/\s+/g, ' ').trim();

    const dur = all.match(/(?:for|about|the past|last)\s+(\d+\s+(?:day|week|month|hour|year)s?)/i);
    if (dur) f.duration = dur[1];

    if (/no\s+insurance|uninsured|don'?t have insurance/i.test(all)) f.insurance = 'None';
    else {
      const ins = all.match(/(?:insurance(?:\s+is|:| through| with)\s+)([A-Za-z][a-zA-Z\s]{2,28}?)(?:[.!?,]|$)/i);
      if (ins) f.insurance = ins[1].trim();
    }

    if (/no\s+(?:known\s+)?allerg/i.test(all)) f.allergies = 'None known';
    else {
      const al = all.match(/allerg(?:ic\s+to|ies?(?:\s+include)?:?\s*)([^.!?]{3,50})/i);
      if (al) f.allergies = al[1].trim();
    }

    if (/severe|emergency|can't breathe|chest pain|unconscious/i.test(all)) f.urgency = 'High';
    else if (/moderate|getting worse|significant pain/i.test(all)) f.urgency = 'Medium';
    else if (/mild|minor|not urgent/i.test(all)) f.urgency = 'Low';
  }

  if (mode === 'shelter') {
    const fam = all.match(/(\d+)\s+(?:people|persons?|family members?|children|kids?|adults?)/i);
    if (fam) f.familySize = fam[1] + ' people';

    if (/(?:have (?:a )?pet|bring (?:my )?(?:dog|cat)|traveling with (?:a )?pet)/i.test(all)) f.pets = 'Yes';
    else if (/no\s+pets?/i.test(all)) f.pets = 'No';

    if (/wheelchair|mobility (?:aid|scooter|device)/i.test(all)) f.mobility = 'Wheelchair/aid needed';

    if (/sleeping outside|in (?:my )?car|on the street|no shelter|unsheltered/i.test(all)) f.situation = 'Unsheltered';
    else if (/at[- ]risk|about to (?:lose|be evicted)|facing eviction/i.test(all)) f.situation = 'At risk';
  }

  if (mode === 'food_aid') {
    const hs = all.match(/(?:household of|family of|(\d+)\s+(?:people|persons?))/i);
    if (hs) f.householdSize = (hs[1] || '?') + ' people';

    const zip = all.match(/\b(\d{5})\b/);
    if (zip) f.zip = zip[1];

    if (/vegan/i.test(all)) f.dietary = 'Vegan';
    else if (/vegetarian/i.test(all)) f.dietary = 'Vegetarian';
    else if (/halal/i.test(all)) f.dietary = 'Halal';
    else if (/kosher/i.test(all)) f.dietary = 'Kosher';
    else if (/gluten/i.test(all)) f.dietary = 'Gluten-free';
    else if (/no (?:diet|restriction)/i.test(all)) f.dietary = 'No restrictions';

    if (/no (?:car|transport|bus)/i.test(all)) f.transport = 'No personal vehicle';
    else if (/(?:have a car|can drive|own a car)/i.test(all)) f.transport = 'Has vehicle';
  }

  if (mode === 'support_services') {
    if (/spanish|español/i.test(all)) f.language = 'Spanish';
    else if (/french|français/i.test(all)) f.language = 'French';
    else if (/mandarin|chinese/i.test(all)) f.language = 'Mandarin';
    else if (/arabic/i.test(all)) f.language = 'Arabic';
    else if (/vietnamese/i.test(all)) f.language = 'Vietnamese';

    if (/wheelchair/i.test(all)) f.mobility = 'Wheelchair user';
    else if (/limited mobility|hard to walk/i.test(all)) f.mobility = 'Limited mobility';

    const ht = modelText.match(/(?:you(?:'re| are) looking for|help with|assistance (?:with|for))\s+([^.!?]{5,60})/i);
    if (ht) f.helpType = ht[1].trim();
  }

  return f;
}

const modes = [
  { id: 'clinic', label: 'Healthcare', description: 'Symptoms, duration, urgency, accessibility, insurance, next step.' },
  { id: 'shelter', label: 'Housing', description: 'Housing status, safety, family size, pets, mobility, bed/resource need.' },
  { id: 'food_aid', label: 'Hunger', description: 'Household size, diet needs, transport limits, zip code, supplies.' },
  { id: 'support_services', label: 'Here-to-Help', description: 'Find services you can actually reach — matched to your language, mobility, and transport needs.' },
];

const TRANSCRIPT_MERGE_WINDOW_MS = 2200;
const ASL_AUTO_INTERPRET_DELAY_MS = 7000;

// Regex captures http(s) URLs and bare domains ending in common TLDs
const LINK_RE = /(https?:\/\/[^\s]+|\b[a-z0-9.-]+\.(?:edu|org|gov|com|net|io)(?:\/[^\s]*)?)/gi;

function renderWithLinks(text) {
  const parts = text.split(LINK_RE);
  if (parts.length <= 1) return text;
  return parts.map((part, i) => {
    if (i % 2 === 0) return part || null;
    // Strip trailing punctuation that was not part of the URL
    const clean = part.replace(/[.,!?;:)"']+$/, '');
    const trailing = part.slice(clean.length);
    const href = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    return (
      <span key={i}>
        <a className="chat-link" href={href} rel="noopener noreferrer" target="_blank">{clean}</a>
        {trailing}
      </span>
    );
  });
}

const CamSvg = () => (
  <svg width="58" height="46" viewBox="0 0 110 86" aria-hidden>
    <path
      d="M16 60V24c0-6 4-10 10-10h28l4-10h23l4 10h11c6 0 10 4 10 10v36"
      fill="#fffefb"
      stroke="#0d274e"
      strokeLinejoin="round"
      strokeWidth="4"
    />
    <rect x="26" y="24" width="14" height="7" rx="2" fill="none" stroke="#0d274e" strokeWidth="3" />
    <circle cx="70" cy="41" r="20" fill="#fffefb" stroke="#0d274e" strokeWidth="4" />
    <circle cx="70" cy="41" r="12" fill="#0d274e" />
    <circle cx="77" cy="35" r="5" fill="#fffefb" />
    <path
      d="M6 66c17-8 34-9 52 0 18 10 34 8 50-4"
      fill="none"
      stroke="#0d274e"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <path
      d="M6 66c18-4 33-2 51 7 15 7 30 6 45-2"
      fill="none"
      stroke="#0d274e"
      strokeLinecap="round"
      strokeWidth="3"
    />
  </svg>
);

const HangUpSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
  </svg>
);

export default function PatientView() {
  const [conversation, setConversation] = useState([]);
  const [mode, setMode] = useState('clinic');
  const [languagePreference, setLanguagePreference] = useState('auto');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [signedResponsePending, setSignedResponsePending] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [translations, setTranslations] = useState({});
  const [mapBanner, setMapBanner] = useState(null); // { url, query }

  const { token, user: authUser, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const intakeDraft = useMemo(() => extractDraft(conversation, mode), [conversation, mode]);

  useEffect(() => {
    if (!mapBanner) return;
    const a = document.createElement('a');
    a.href = mapBanner.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [mapBanner]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const conversationRef = useRef(null);
  const conversationEndRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const cameraTimerRef = useRef(null);
  const pendingAutoStartRef = useRef(null);
  const aslAutoTimerRef = useRef(null);
  const signedResponseCountRef = useRef(0);

  const addConversationBubble = useCallback((role, text) => {
    setConversation((current) => [
      ...current,
      { id: `local-${Date.now()}-${current.length}`, role, text, receivedAt: Date.now() },
    ]);
  }, []);

  const handleSocketMessage = useCallback((message) => {
    if (message.type === 'NAVIGATE_REQUEST') {
      const q = encodeURIComponent(message.query || '');
      setMapBanner({ url: `/navigate${q ? `?q=${q}` : ''}`, query: message.query || 'a location' });
      return;
    }
    if (message.type === 'session') {
      if (message.status === 'connected') {
        setSessionStarted(true);
        setSessionLoading(false);
        setSessionStatus(
          languagePreference === 'sign_language'
            ? 'ASL mode is live. Turn on the camera and sign after each question.'
            : `${modes.find((item) => item.id === message.mode)?.label || 'CowmunityCare'} mode is live.`,
        );
      }
      if (message.status === 'ready') setSessionStatus('');
      if (message.status === 'error') {
        setSessionStarted(false);
        setSessionLoading(false);
        setSignedResponsePending(false);
        setSessionStatus(message.message || 'Session error.');
      }
      if (message.status === 'closed') {
        setSessionEnded(true);
      }
    }

    if (message.type !== 'transcript' || !message.text) return;

    const receivedAt = Date.now();
    const normalizedText = message.text.trim().replace(/\s+/g, ' ').toLowerCase();

    setConversation((current) => {
      const last = current[current.length - 1];

      if (languagePreference !== 'sign_language') {
        if (last && last.role === message.role) {
          return [...current.slice(0, -1), { ...last, text: `${last.text} ${message.text}` }];
        }
        return [...current, { id: `${Date.now()}-${current.length}`, role: message.role, text: message.text }];
      }

      if (
        last &&
        last.role === message.role &&
        last.text.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedText &&
        receivedAt - (last.receivedAt || 0) < 8000
      ) {
        return current;
      }

      if (
        last &&
        last.role === message.role &&
        receivedAt - (last.receivedAt || 0) < TRANSCRIPT_MERGE_WINDOW_MS
      ) {
        return [...current.slice(0, -1), { ...last, text: `${last.text} ${message.text}`, receivedAt }];
      }

      return [...current, { id: `${receivedAt}-${current.length}`, role: message.role, text: message.text, receivedAt }];
    });

    if (message.role === 'model') {
      setSignedResponsePending(false);
      if (languagePreference === 'sign_language') {
        setSessionStatus('Sign your response now. CowmunityCare will interpret automatically.');
      }
    }
  }, [languagePreference]);

  const { connected, lastMessage, error: socketError, send } = useSocket('/ws/patient', {
    onMessage: handleSocketMessage,
  });
  const { isPlaying, error: audioError, toggleRecording, stopRecording } = useAudio({
    send,
    incomingMessage: lastMessage,
  });

  async function toggleCamera() {
    if (cameraOn) {
      window.clearInterval(cameraTimerRef.current);
      window.clearTimeout(aslAutoTimerRef.current);
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      setCameraOn(false);
      setSignedResponsePending(false);
      if (sessionStarted) {
        send({
          type: 'text',
          text: languagePreference === 'sign_language'
            ? 'The patient has turned off the camera. Pause visual ASL intake until the camera is on again.'
            : 'The patient has turned off the camera. Continue the intake using voice only.',
        });
      }
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraStreamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    setCameraOn(true);

    if (sessionStarted) {
      send({
        type: 'text',
        text: languagePreference === 'sign_language'
          ? 'The patient has turned on their camera for ASL. Ask exactly one short intake question, then wait for an automatic client cue before interpreting the signed answer. Do not repeat the same question while waiting. Do not combine fields in one question. If asking duration or urgency timing, include concrete choices like hours, days, weeks, today, tomorrow, or later this week.'
          : 'The patient has turned on their camera. Watch for documents, cards, pill bottles, or other visual information. Respond when visual information is clearly presented.',
      });
    }

    cameraTimerRef.current = window.setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !video.videoWidth) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const jpeg = canvas.toDataURL('image/jpeg', 0.72).split(',')[1];
      send({ type: 'video', mimeType: 'image/jpeg', data: jpeg });
    }, 1000);
  }

  function startSession(langPref = languagePreference) {
    setConversation([]);
    setSessionLoading(true);
    setSignedResponsePending(false);
    signedResponseCountRef.current = 0;
    window.clearTimeout(aslAutoTimerRef.current);
    setSessionStatus('Connecting to CowmunityCare...');
    send({ type: 'start_session', mode, languagePreference: langPref, token: token || null });
  }

  async function startWithSpeech() {
    setLanguagePreference('auto');
    pendingAutoStartRef.current = 'speech';
    await startSession('auto');
  }

  async function startWithCamera() {
    setLanguagePreference('sign_language');
    pendingAutoStartRef.current = 'camera';
    await startSession('sign_language');
  }

  function hangUp() {
    stopRecording();
    window.clearInterval(cameraTimerRef.current);
    window.clearTimeout(aslAutoTimerRef.current);
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    window.location.reload();
  }

  async function translateMessage(id, text) {
    if (translations[id]) return; // 'pending', a result, or an error — don't retry
    setTranslations((prev) => ({ ...prev, [id]: 'pending' }));
    try {
      const res = await fetch(`http://${window.location.hostname}:3001/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setTranslations((prev) => ({ ...prev, [id]: data.translated || '[Translation unavailable]' }));
    } catch {
      setTranslations((prev) => ({ ...prev, [id]: '[Translation unavailable]' }));
    }
  }

  function toggleEnglish() {
    const next = !showEnglish;
    setShowEnglish(next);
    if (next) {
      conversation.forEach((msg) => translateMessage(msg.id, msg.text));
    }
  }


  // Auto-redirect to fresh start when session closes naturally
  useEffect(() => {
    if (!sessionEnded) return;
    stopRecording();
    const timer = setTimeout(() => window.location.reload(), 3000);
    return () => clearTimeout(timer);
  }, [sessionEnded, stopRecording]);

  // Auto-start speech or camera once the session connects
  useEffect(() => {
    if (!sessionStarted || !pendingAutoStartRef.current) return;
    const type = pendingAutoStartRef.current;
    let alive = true;
    const timer = setTimeout(() => {
      if (!alive || pendingAutoStartRef.current !== type) return;
      pendingAutoStartRef.current = null;
      if (type === 'speech') toggleRecording();
      else if (type === 'camera') toggleCamera();
    }, 500);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStarted]);

  useEffect(() => {
    window.clearTimeout(aslAutoTimerRef.current);

    if (
      languagePreference !== 'sign_language' ||
      !sessionStarted ||
      !cameraOn ||
      signedResponsePending
    ) {
      return undefined;
    }

    const lastMessage = conversation[conversation.length - 1];
    if (!lastMessage || lastMessage.role !== 'model') {
      return undefined;
    }

    aslAutoTimerRef.current = window.setTimeout(() => {
      signedResponseCountRef.current += 1;
      addConversationBubble('user', `Signed response ${signedResponseCountRef.current} captured automatically.`);
      setSignedResponsePending(true);
      setSessionStatus('Interpreting signed response...');
      send({
        type: 'text',
        text: 'The patient has had a short signing window after your last question. Interpret only the latest signing from the recent camera frames. Briefly confirm what you understood, then ask exactly one next intake question for one missing field. Do not repeat the previous question unless the signing was unclear. Do not combine fields in one question. If asking duration or urgency timing, include concrete choices like hours, days, weeks, today, tomorrow, or later this week.',
      });
    }, ASL_AUTO_INTERPRET_DELAY_MS);

    return () => {
      window.clearTimeout(aslAutoTimerRef.current);
    };
  }, [
    addConversationBubble,
    cameraOn,
    conversation,
    languagePreference,
    send,
    sessionStarted,
    signedResponsePending,
  ]);

  useEffect(() => {
    if (!showEnglish || conversation.length === 0) return;
    const last = conversation[conversation.length - 1];
    if (last && !translations[last.id]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      translateMessage(last.id, last.text);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, showEnglish]);

  useEffect(() => {
    if (!sessionStarted) return undefined;
    const frame = window.requestAnimationFrame(() => {
      conversationEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
      if (conversationRef.current) {
        conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [conversation, sessionLoading, sessionStarted, showEnglish, translations]);

  useEffect(
    () => () => {
      window.clearInterval(cameraTimerRef.current);
      window.clearTimeout(aslAutoTimerRef.current);
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  if (sessionEnded) {
    return (
      <main className="patient-shell" id="main-content">
        <section className="patient-card session-ended-card">
          <div>
            <p className="eyebrow">CowmunityCare</p>
            <h2>Thank you</h2>
            <p>Your intake is complete. Staff will follow up shortly.</p>
            <p className="session-ended-sub">Returning to home…</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="patient-shell" id="main-content">
      <nav className="patient-topnav">
        <Link className="patient-topnav-brand" to="/">CowmunityCare</Link>
        <div className="patient-topnav-actions">
          <Link className="patient-topnav-link" to="/navigate">Find a place</Link>
          {isLoggedIn ? (
            <>
              <span className="patient-topnav-user">{authUser?.profile?.name || authUser?.email}</span>
              <Link className="patient-topnav-link" to="/settings">My Profile</Link>
              <button className="patient-topnav-link is-danger" type="button" onClick={() => { logout(); navigate('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link className="patient-topnav-link" to="/login">Log in</Link>
              <Link className="patient-topnav-link is-primary" to="/signup">Sign up</Link>
            </>
          )}
        </div>
      </nav>
      <section className={sessionStarted ? 'patient-card session-active' : 'patient-card session-setup'}>
        <header className="patient-header">
          <div className="brand-lockup">
            <p className="eyebrow">Accessible Community Intake</p>
            <h1>CowmunityCare</h1>
            <p className="brand-tagline">
              Accessible intake for healthcare, housing, hunger, and everyday help — speak, sign, or share what you need.
            </p>
          </div>
          <div className={connected ? 'connection is-live' : 'connection'} role="status" aria-live="polite">
            <span />
            {connected ? 'Live' : 'Connecting'}
          </div>
        </header>

        <div className="language-strip">
          <span>{modes.find((item) => item.id === mode)?.label} mode</span>
        </div>

        {!sessionStarted && (
          <section className="mode-picker">
            <div>
              <p className="eyebrow">Choose help type</p>
              <h2>Say it, sign it, share it — Care starts with being understood.</h2>
            </div>

            <div className="mode-grid">
              {modes.map((item) => (
                <button
                  className={mode === item.id ? 'mode-option is-selected' : 'mode-option'}
                  aria-pressed={mode === item.id}
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>

            <div className="input-mode-btns">
              <button
                className="input-mode-btn is-speech"
                disabled={!connected || sessionLoading}
                type="button"
                onClick={startWithSpeech}
              >
                <span className="voice-mark" aria-hidden>
                  <span className="voice-wave">
                    <span />
                    <span />
                    <span />
                  </span>
                </span>
                <span>Speech</span>
                <small>Tap to start talking</small>
              </button>
              <button
                className="input-mode-btn is-camera"
                disabled={!connected || sessionLoading}
                type="button"
                onClick={startWithCamera}
              >
                <CamSvg />
                <span>ASL / Sign Language</span>
                <small>Video input</small>
              </button>
            </div>

            <p className="setup-helper-text">
              Pick a help type, then choose Speech or ASL / Sign Language.
            </p>

            {sessionLoading && (
              <div className="session-loading">
                <div className="spinner" aria-hidden />
                Connecting to CowmunityCare…
              </div>
            )}
            {sessionStatus && !sessionLoading && (
              <p className="session-status" role="status" aria-live="polite">{sessionStatus}</p>
            )}
          </section>
        )}

        {sessionStarted && (
          <div className="session-split-body">
            <div className="session-left">
              {mapBanner && (
                <div className="map-banner">
                  <span>Map ready for <strong>{mapBanner.query}</strong></span>
                  <a href={mapBanner.url} target="_blank" rel="noopener noreferrer" className="map-banner-btn" onClick={() => setMapBanner(null)}>Open map</a>
                  <button className="map-banner-close" onClick={() => setMapBanner(null)} aria-label="Dismiss">✕</button>
                </div>
              )}
              {conversation.length > 0 && (
                <div className="transcript-toolbar">
                  <button
                    className={showEnglish ? 'translate-toggle is-active' : 'translate-toggle'}
                    type="button"
                    onClick={toggleEnglish}
                  >
                    {showEnglish ? '✓ Showing English' : '↔ Translate to English'}
                  </button>
                </div>
              )}

              <div className="conversation" ref={conversationRef} aria-live="polite" aria-label="Conversation transcript">
                {sessionLoading ? (
                  <div className="welcome-bubble">
                    <div className="session-loading">
                      <div className="spinner" aria-hidden />
                      Connecting to CowmunityCare…
                    </div>
                  </div>
                ) : conversation.length === 0 ? (
                  <div className="welcome-bubble">
                    {languagePreference === 'sign_language'
                      ? 'Turn on the camera and sign after each question. CowmunityCare will interpret automatically.'
                      : "You're connected — speech input is active. Speak naturally."}
                  </div>
                ) : (
                  conversation.map((message) => (
                    <div
                      className={message.role === 'user' ? 'bubble patient-bubble' : 'bubble ai-bubble'}
                      key={message.id}
                    >
                      {showEnglish && translations[message.id] && translations[message.id] !== 'pending'
                        ? renderWithLinks(translations[message.id])
                        : renderWithLinks(message.text)}
                      {showEnglish && translations[message.id] === 'pending' && (
                        <span className="translating-indicator">translating…</span>
                      )}
                    </div>
                  ))
                )}
                <div className="conversation-end" ref={conversationEndRef} aria-hidden />
              </div>

              {(socketError || audioError) && (
                <p className="inline-error" role="alert">{socketError || audioError}</p>
              )}

              <div className="patient-controls">
                <div className="session-side-controls">
                  <button className="camera-button" type="button" aria-pressed={cameraOn} onClick={toggleCamera}>
                    {cameraOn ? 'Stop camera' : 'Camera'}
                  </button>
                  <button className="hangup-button" type="button" onClick={hangUp}>
                    <HangUpSvg />
                    Hang up
                  </button>
                </div>
              </div>
            </div>

            <aside className="session-right">
              <div className="draft-panel">
                <div className="draft-panel-header">
                  <span>Intake in progress</span>
                  <span className="draft-dot" />
                </div>
                <div className="draft-fields">
                  {(DRAFT_FIELDS[mode] || []).map(({ key, label }) => (
                    <div className="draft-field" key={key}>
                      <span className="draft-label">{label}</span>
                      <span className={intakeDraft[key] ? 'draft-value is-filled' : 'draft-value'}>
                        {intakeDraft[key] || '—'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="draft-suggestions">
                  <div className="draft-suggestions-title">Helpful resources</div>
                  {(DRAFT_SUGGESTIONS[mode] || []).map((text, i) => (
                    <div className="draft-suggestion" key={i}>{text}</div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        <div className="ai-indicator" role="status" aria-live="polite">
          {isPlaying && (
            <>
              <span className="speaking-dots" aria-hidden>
                <span className="speaking-dot" />
                <span className="speaking-dot" />
                <span className="speaking-dot" />
              </span>
              CowmunityCare is speaking
            </>
          )}
        </div>

        <video aria-label="Camera preview" className={cameraOn ? 'camera-preview is-visible' : 'camera-preview'} ref={videoRef} muted playsInline />
        <canvas ref={canvasRef} hidden />
      </section>
    </main>
  );
}
