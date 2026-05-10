import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio } from './useAudio.js';
import { useSocket } from './useSocket.js';

const modes = [
  { id: 'clinic', label: 'Free Clinic', description: 'Symptoms, duration, urgency, accessibility, insurance, next step.' },
  { id: 'shelter', label: 'Shelter', description: 'Housing status, safety, family size, pets, mobility, bed/resource need.' },
  { id: 'food_aid', label: 'Food Aid', description: 'Household size, diet needs, transport limits, zip code, supplies.' },
  { id: 'support_services', label: 'Access & Support', description: 'Find care, shelter, or services you can actually reach — matched to your language, mobility, and transport needs.' },
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

function detectLanguageBadge(text) {
  const normalized = text.toLowerCase();
  if (/[ऀ-ॿ]/.test(text)) return 'HI';
  if (/[¿¡ñáéíóú]/.test(normalized) || /\b(hola|gracias|dolor|tiene|puede)\b/.test(normalized)) return 'ES';
  if (/\b(bonjour|merci|douleur|vous)\b/.test(normalized)) return 'FR';
  if (/\b(你好|谢谢|疼|痛)\b/.test(normalized)) return 'ZH';
  return 'AUTO';
}

const CamSvg = () => (
  <svg width="54" height="54" viewBox="0 0 64 64" aria-hidden>
    <circle
      cx="32"
      cy="32"
      fill="none"
      r="24"
      stroke="currentColor"
      strokeDasharray="18 7"
      strokeWidth="12"
      transform="rotate(-8 32 32)"
    />
    <circle cx="32" cy="32" fill="#fffefb" r="17" />
    <circle cx="32" cy="32" fill="#f0f2f4" r="14" />
    <circle cx="32" cy="32" fill="#3d4248" r="10" />
    <circle cx="32" cy="32" fill="#24282d" r="7" />
    <circle cx="26" cy="25" fill="#cfd5dc" r="4" />
    <circle cx="39" cy="38" fill="#ffffff" r="2.2" />
  </svg>
);

const HangUpSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
  </svg>
);

export default function PatientView() {
  const [conversation, setConversation] = useState([]);
  const [languageBadge, setLanguageBadge] = useState('AUTO');
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


  const videoRef = useRef(null);
  const canvasRef = useRef(null);
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
      setLanguageBadge((current) => current === 'AUTO' ? detectLanguageBadge(message.text) : current);
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

  async function startSession(langPref = languagePreference) {
    setConversation([]);
    setSessionLoading(true);
    setSignedResponsePending(false);
    signedResponseCountRef.current = 0;
    window.clearTimeout(aslAutoTimerRef.current);
    setLanguageBadge(
      langPref === 'auto' ? 'AUTO'
      : langPref === 'sign_language' ? 'ASL'
      : langPref.slice(0, 2).toUpperCase(),
    );
    setSessionStatus('Connecting to VoiceBridge...');
    send({ type: 'start_session', mode, languagePreference: langPref, user: null });
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
      <section className={sessionStarted ? 'patient-card session-active' : 'patient-card session-setup'}>
        <header className="patient-header">
          <div className="brand-lockup">
            <p className="eyebrow">Accessible Community Intake</p>
            <h1>CowmunityCare</h1>
            <p className="brand-tagline">
              Multilingual voice intake for clinics, shelters, and community care — speak naturally; staff get a structured
              record.
            </p>
          </div>
          <div className={connected ? 'connection is-live' : 'connection'} role="status" aria-live="polite">
            <span />
            {connected ? 'Live' : 'Connecting'}
          </div>
        </header>

        <div className="language-strip">
          <span>{modes.find((item) => item.id === mode)?.label} mode</span>
          <strong>{languageBadge}</strong>
        </div>

        {!sessionStarted && (
          <section className="mode-picker">
            <div>
              <p className="eyebrow">Choose help type</p>
              <h2>Speak in your own language. Staff receive a structured case record.</h2>
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
                <small>Tap to start listening</small>
              </button>
              <button
                className="input-mode-btn is-camera"
                disabled={!connected || sessionLoading}
                type="button"
                onClick={startWithCamera}
              >
                <CamSvg />
                <span>ASL / Sign Language</span>
                <small>Camera input</small>
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

        <div className="conversation" aria-live="polite" aria-label="Conversation transcript">
          {sessionLoading ? (
            <div className="welcome-bubble">
              <div className="session-loading">
                <div className="spinner" aria-hidden />
                Connecting to VoiceBridge…
              </div>
            </div>
          ) : conversation.length === 0 ? (
            <div className="welcome-bubble">
              {sessionStarted && languagePreference === 'sign_language'
                ? 'Turn on the camera and sign after each question. VoiceBridge will interpret automatically.'
                : sessionStarted
                  ? "You're connected — speech input is active. Speak naturally."
                  : 'Pick a help type, then tap the mic to speak or the camera for sign language.'}
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
        </div>

        {(socketError || audioError) && (
          <p className="inline-error" role="alert">{socketError || audioError}</p>
        )}

        {sessionStarted && (
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
        )}

        <div className="ai-indicator" role="status" aria-live="polite">
          {isPlaying && (
            <>
              <span className="speaking-dots" aria-hidden>
                <span className="speaking-dot" />
                <span className="speaking-dot" />
                <span className="speaking-dot" />
              </span>
              VoiceBridge is speaking
            </>
          )}
        </div>

        <video aria-label="Camera preview" className={cameraOn ? 'camera-preview is-visible' : 'camera-preview'} ref={videoRef} muted playsInline />
        <canvas ref={canvasRef} hidden />
      </section>
    </main>
  );
}
