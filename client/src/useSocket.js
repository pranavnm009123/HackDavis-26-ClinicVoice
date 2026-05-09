import { useCallback, useEffect, useRef, useState } from 'react';

function resolveWsUrl(path) {
  if (path.startsWith('ws://') || path.startsWith('wss://')) {
    return path;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.hostname}:3001${path}`;
}

export function useSocket(path, { reconnect = true, onMessage } = {}) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const manuallyClosedRef = useRef(false);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    function connect() {
      const socket = new WebSocket(resolveWsUrl(path));
      socketRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
        setError('');
      };

      socket.onmessage = (event) => {
        let parsed;

        try {
          parsed = JSON.parse(event.data);
        } catch {
          parsed = { type: 'raw', data: event.data };
        }

        setLastMessage(parsed);
        onMessageRef.current?.(parsed);
      };

      socket.onerror = () => {
        setError('WebSocket connection error.');
      };

      socket.onclose = () => {
        setConnected(false);

        if (!manuallyClosedRef.current && reconnect) {
          reconnectTimerRef.current = window.setTimeout(connect, 1200);
        }
      };
    }

    manuallyClosedRef.current = false;
    connect();

    return () => {
      manuallyClosedRef.current = true;
      window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [path, reconnect]);

  const send = useCallback((payload) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      return false;
    }

    socketRef.current.send(
      typeof payload === 'string' ? payload : JSON.stringify(payload),
    );
    return true;
  }, []);

  return {
    connected,
    lastMessage,
    error,
    send,
  };
}
