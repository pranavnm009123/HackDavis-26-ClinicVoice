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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const cameraTimerRef = useRef(null);

  const handleSocketMessage = useCallback((message) => {
    if (message.type === 'session') {
      if (message.status === 'connected') {
        setSessionStarted(true);
        setSessionLoading(false);
        setSessionStatus(`${modes.find((item) => item.id === message.mode)?.label || 'VoiceBridge'} mode is live.`);
      }

      if (message.status === 'ready') {
        setSessionStatus('Choose a help type to begin.');
      }

      if (message.status === 'error') {
        setSessionStarted(false);
        setSessionLoading(false);
        setSessionStatus(message.message || 'Session error.');
      }
    }

    if (message.type !== 'transcript' || !message.text) {
      return;
    }

    setConversation((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        role: message.role,
        text: message.text,
      },
    ]);

    if (message.role === 'model') {
      setLanguageBadge((current) =>
        current === 'AUTO' ? detectLanguageBadge(message.text) : current,
      );
    }
  }, []);

  const { connected, lastMessage, error: socketError, send } = useSocket('/ws/patient', {
    onMessage: handleSocketMessage,
  });
  const { recording, audioLevel, isPlaying, error: audioError, toggleRecording, stopRecording } = useAudio({
    send,
    incomingMessage: lastMessage,
  });

  function startSession() {
    setConversation([]);
    setSessionLoading(true);
    setLanguageBadge(languagePreference === 'auto' ? 'AUTO' : languagePreference.slice(0, 2).toUpperCase());
    setSessionStatus('Connecting to VoiceBridge...');
    send({
      type: 'start_session',
      mode,
      languagePreference,
    });
  }

  function startNewIntake() {
    stopRecording();
    window.location.reload();
  }

  async function toggleCamera() {
    if (cameraOn) {
      window.clearInterval(cameraTimerRef.current);
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      setCameraOn(false);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraStreamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    setCameraOn(true);

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
  }

  useEffect(
    () => () => {
      window.clearInterval(cameraTimerRef.current);
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
