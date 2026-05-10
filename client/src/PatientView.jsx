import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio } from './useAudio.js';
import { useSocket } from './useSocket.js';

const modes = [
  {
    id: 'clinic',
    label: 'Free Clinic',
    description: 'Symptoms, duration, urgency, accessibility, insurance, next step.',
  },
  {
    id: 'shelter',
    label: 'Shelter',
    description: 'Housing status, safety, family size, pets, mobility, bed/resource need.',
  },
  {
    id: 'food_aid',
    label: 'Food Aid',
    description: 'Household size, diet needs, transport limits, zip code, supplies.',
  },
];

const languages = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'Mandarin', label: 'Mandarin' },
  { value: 'French', label: 'French' },
  { value: 'sign_language', label: 'Sign Language (ASL/visual)' },
];

function detectLanguageBadge(text) {
  const normalized = text.toLowerCase();

  if (/[¿¡ñáéíóú]/.test(normalized) || /\b(hola|gracias|dolor|tiene|puede)\b/.test(normalized)) {
    return 'ES';
  }

  if (/\b(bonjour|merci|douleur|vous)\b/.test(normalized)) {
    return 'FR';
  }

  if (/\b(你好|谢谢|疼|痛)\b/.test(normalized)) {
    return 'ZH';
  }

  return 'AUTO';
}

export default function PatientView() {
  const [conversation, setConversation] = useState([]);
  const [languageBadge, setLanguageBadge] = useState('AUTO');
  const [mode, setMode] = useState('clinic');
  const [languagePreference, setLanguagePreference] = useState('auto');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('Choose a help type to begin.');
  const [cameraOn, setCameraOn] = useState(false);

  // User identification
  const [isReturning, setIsReturning] = useState(false);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [userError, setUserError] = useState('');
  const [sessionUser, setSessionUser] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const cameraTimerRef = useRef(null);

  // Fix #2: accumulate transcript chunks into one bubble per speaker turn
  const handleSocketMessage = useCallback((message) => {
    if (message.type === 'session') {
      if (message.status === 'connected') {
        setSessionStarted(true);
        setSessionLoading(false);
        setSessionStatus(`${modes.find((item) => item.id === message.mode)?.label || 'VoiceBridge'} mode is live.`);
      }
      if (message.status === 'ready') setSessionStatus('Choose a help type to begin.');
      if (message.status === 'error') {
        setSessionStarted(false);
        setSessionLoading(false);
        setSessionStatus(message.message || 'Session error.');
      }
    }

    if (message.type !== 'transcript' || !message.text) return;

    setConversation((current) => {
      const last = current[current.length - 1];
      if (last && last.role === message.role) {
        return [...current.slice(0, -1), { ...last, text: last.text + ' ' + message.text }];
      }
      return [...current, { id: `${Date.now()}-${current.length}`, role: message.role, text: message.text }];
    });

    if (message.role === 'model') {
      setLanguageBadge((current) => current === 'AUTO' ? detectLanguageBadge(message.text) : current);
    }
  }, []);

  const { connected, lastMessage, error: socketError, send } = useSocket('/ws/patient', {
    onMessage: handleSocketMessage,
  });
  const { recording, audioLevel, isPlaying, error: audioError, toggleRecording, stopRecording } = useAudio({
    send,
    incomingMessage: lastMessage,
  });

  async function startSession() {
    setUserError('');
    let user = sessionUser;

    if (!user) {
      if (isReturning) {
        if (!userId.trim()) { setUserError('Enter your VoiceBridge ID.'); return; }
        try {
          const res = await fetch(`http://${window.location.hostname}:3001/users/${userId.trim().toUpperCase()}`);
          if (!res.ok) { setUserError('ID not found. Check your ID or register as a new patient.'); return; }
          const data = await res.json();
          user = data.user;
        } catch { setUserError('Could not reach server.'); return; }
      } else if (email.trim()) {
        try {
          const res = await fetch(`http://${window.location.hostname}:3001/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), phone: phone.trim(), name: userName.trim(), language: languagePreference }),
          });
          const data = await res.json();
          user = data.user;
          if (data.isNew) setSessionStatus(`Welcome! Your VoiceBridge ID is ${user.userId}`);
        } catch { setUserError('Could not register. Continuing as guest.'); }
      }
    }

    setSessionUser(user);
    setConversation([]);
    setSessionLoading(true);
    setLanguageBadge(
      languagePreference === 'auto' ? 'AUTO'
      : languagePreference === 'sign_language' ? 'ASL'
      : languagePreference.slice(0, 2).toUpperCase()
    );
    if (!sessionStatus.startsWith('Welcome')) setSessionStatus('Connecting to VoiceBridge...');
    send({ type: 'start_session', mode, languagePreference, user });
  }

  function startNewIntake() {
    stopRecording();
    window.location.reload();
  }

  const visualPingRef = useRef(null);

  async function toggleCamera() {
    if (cameraOn) {
      window.clearInterval(cameraTimerRef.current);
      window.clearInterval(visualPingRef.current);
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      setCameraOn(false);
      if (sessionStarted) {
        send({ type: 'text', text: "I'm done. Please interpret what you just saw — any sign language, document, card, or text — and continue the intake." });
      }
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraStreamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    setCameraOn(true);

    if (sessionStarted) {
      send({ type: 'text', text: 'The patient has turned on their camera. Watch for documents, cards, pill bottles, or sign language. Respond to what you see.' });
    }

    cameraTimerRef.current = window.setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !video.videoWidth) {
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const jpeg = canvas.toDataURL('image/jpeg', 0.72).split(',')[1];
      send({ type: 'video', mimeType: 'image/jpeg', data: jpeg });
    }, 1000);

    if (languagePreference === 'sign_language' && sessionStarted) {
      visualPingRef.current = window.setInterval(() => {
        send({ type: 'text', text: 'What is the patient signing right now?' });
      }, 4000);
    }
  }

  useEffect(
    () => () => {
      window.clearInterval(cameraTimerRef.current);
      window.clearInterval(visualPingRef.current);
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  return (
    <main className="patient-shell">
      <section className="patient-card">
        <header className="patient-header">
          <div>
            <p className="eyebrow">Clinics · shelters · mutual aid</p>
            <h1>VoiceBridge</h1>
          </div>
          <div className={connected ? 'connection is-live' : 'connection'}>
            <span />
            {connected ? 'Live' : 'Connecting'}
          </div>
        </header>

        <div className="language-strip">
          <span>{modes.find((item) => item.id === mode)?.label} mode</span>
          <strong>{languageBadge}</strong>
        </div>

        <section className="mode-strip" aria-label="Help type selector">
          <div>
            <p className="eyebrow">Help type</p>
            <div className="mode-tabs">
              {modes.map((item) => (
                <button
                  className={mode === item.id ? 'mode-tab is-selected' : 'mode-tab'}
                  disabled={sessionStarted}
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {sessionStarted && (
            <button className="new-intake-button" type="button" onClick={startNewIntake}>
              Change mode / new intake
            </button>
          )}
        </section>

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
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>

            <label className="language-select">
              Language preference
              <select value={languagePreference} onChange={(event) => setLanguagePreference(event.target.value)}>
                {languages.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="user-id-section">
              <label className="returning-toggle">
                <input type="checkbox" checked={isReturning} onChange={(e) => { setIsReturning(e.target.checked); setUserError(''); }} />
                I have a VoiceBridge ID (returning patient)
              </label>
              {isReturning ? (
                <input
                  className="user-id-input"
                  placeholder="VoiceBridge ID — e.g. VB-0001"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              ) : (
                <div className="new-user-fields">
                  <input placeholder="Email address (optional — for confirmation)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input placeholder="Phone number (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <input placeholder="Your name (optional)" value={userName} onChange={(e) => setUserName(e.target.value)} />
                </div>
              )}
              {userError && <p className="user-error">{userError}</p>}
            </div>

            <button className="start-session-button" disabled={!connected} type="button" onClick={startSession}>
              Start VoiceBridge intake
            </button>
            <p className="session-status">{sessionStatus}</p>
          </section>
        )}

        <div className="conversation" aria-live="polite">
          {sessionLoading ? (
            <div className="welcome-bubble">
              <div className="session-loading">
                <div className="spinner" aria-hidden />
                Connecting to VoiceBridge…
              </div>
            </div>
          ) : conversation.length === 0 ? (
            <div className="welcome-bubble">
              {sessionStarted
                ? 'Tap the microphone and answer one spoken question at a time.'
                : 'Pick Clinic, Shelter, or Food Aid mode first. Then the voice intake will adapt to that workflow.'}
            </div>
          ) : (
            conversation.map((message) => (
              <div
                className={message.role === 'user' ? 'bubble patient-bubble' : 'bubble ai-bubble'}
                key={message.id}
              >
                {message.text}
              </div>
            ))
          )}
        </div>

        {(socketError || audioError) && (
          <p className="inline-error">{socketError || audioError}</p>
        )}

        <div className="patient-controls">
          <button
            className={recording ? 'mic-button is-recording' : 'mic-button'}
            disabled={!connected || !sessionStarted}
            type="button"
            onClick={toggleRecording}
          >
            {recording && (
              <>
                <div
                  aria-hidden
                  className="mic-ring"
                  style={{ inset: `${-6 - audioLevel * 20}px`, opacity: 0.45 + audioLevel * 0.3 }}
                />
                <div
                  aria-hidden
                  className="mic-ring"
                  style={{ inset: `${-16 - audioLevel * 34}px`, opacity: 0.2 + audioLevel * 0.15 }}
                />
              </>
            )}
            <span className="mic-core" style={{ transform: `scale(${1 + audioLevel * 0.18})` }} />
            {recording ? 'Listening' : 'Mic'}
          </button>
          <button className="camera-button" type="button" onClick={toggleCamera}>
            {cameraOn ? 'Stop camera' : 'Camera'}
          </button>
        </div>

        <div className="ai-indicator">
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

        <video className={cameraOn ? 'camera-preview is-visible' : 'camera-preview'} ref={videoRef} muted playsInline />
        <canvas ref={canvasRef} hidden />
      </section>
    </main>
  );
}
