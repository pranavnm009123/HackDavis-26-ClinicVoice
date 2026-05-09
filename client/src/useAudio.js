import { useCallback, useEffect, useRef, useState } from 'react';

const PLAYBACK_VOLUME_BOOST = 6;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

function calculateLevel(buffer) {
  const samples = new Int16Array(buffer);
  let peak = 0;

  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample));
  }

  return Math.min(1, peak / 32768);
}

export function useAudio({ send, incomingMessage }) {
  const [recording, setRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState('');
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const workletRef = useRef(null);
  const silenceRef = useRef(null);
  const workletLoadedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackTimeRef = useRef(0);
  const playbackSourcesRef = useRef(new Set());

  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
      workletLoadedRef.current = false;
      playbackTimeRef.current = 0;
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  const stopPlayback = useCallback(() => {
    for (const source of playbackSourcesRef.current) {
      try {
        source.stop();
      } catch {
        // A source can only be stopped before or during playback.
      }
    }

    playbackSourcesRef.current.clear();
    playbackTimeRef.current = audioContextRef.current?.currentTime || 0;
    setIsPlaying(false);
  }, []);

  const playPcmAudio = useCallback(
    async ({ data, sampleRate = 24000 }) => {
      const context = await getAudioContext();
      const int16 = new Int16Array(base64ToArrayBuffer(data));
      const audioBuffer = context.createBuffer(1, int16.length, sampleRate);
      const channel = audioBuffer.getChannelData(0);

      for (let i = 0; i < int16.length; i += 1) {
        channel[i] = int16[i] / 32768;
      }

      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      const gainNode = context.createGain();
      gainNode.gain.value = PLAYBACK_VOLUME_BOOST;
      source.connect(gainNode);
      gainNode.connect(context.destination);

      const startAt = Math.max(context.currentTime + 0.02, playbackTimeRef.current);
      source.start(startAt);
      playbackTimeRef.current = startAt + audioBuffer.duration;
      setIsPlaying(true);
      playbackSourcesRef.current.add(source);
      source.onended = () => {
        playbackSourcesRef.current.delete(source);
        if (playbackSourcesRef.current.size === 0) setIsPlaying(false);
      };
    },
    [getAudioContext],
  );

  const stopRecording = useCallback(() => {
    workletRef.current?.disconnect();
    sourceRef.current?.disconnect();
    silenceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());

    workletRef.current = null;
    sourceRef.current = null;
    silenceRef.current = null;
    streamRef.current = null;
    setRecording(false);
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(async () => {
    if (recording) {
      return;
    }

    try {
      setError('');
      const context = await getAudioContext();

      if (!workletLoadedRef.current) {
        await context.audioWorklet.addModule(new URL('./audioWorklet.js', import.meta.url));
        workletLoadedRef.current = true;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = context.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(context, 'pcm-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });
      const silence = context.createGain();
      silence.gain.value = 0;

      worklet.port.onmessage = (event) => {
        const buffer = event.data;
        setAudioLevel(calculateLevel(buffer));

        send({
          type: 'audio',
          data: arrayBufferToBase64(buffer),
        });
      };

      source.connect(worklet);
      worklet.connect(silence);
      silence.connect(context.destination);

      streamRef.current = stream;
      sourceRef.current = source;
      workletRef.current = worklet;
      silenceRef.current = silence;
      setRecording(true);
    } catch (startError) {
      setError(startError.message || 'Unable to start microphone.');
      stopRecording();
    }
  }, [getAudioContext, recording, send, stopRecording]);

  useEffect(() => {
    if (incomingMessage?.type === 'audio' && incomingMessage.data) {
      playPcmAudio(incomingMessage).catch((playbackError) => {
        setError(playbackError.message || 'Unable to play Gemini audio.');
      });
    }

    if (incomingMessage?.type === 'audio_interrupted') {
      stopPlayback();
    }
  }, [incomingMessage, playPcmAudio, stopPlayback]);

  useEffect(() => stopRecording, [stopRecording]);

  return {
    recording,
    audioLevel,
    isPlaying,
    error,
    startRecording,
    stopRecording,
    toggleRecording: recording ? stopRecording : startRecording,
  };
}
