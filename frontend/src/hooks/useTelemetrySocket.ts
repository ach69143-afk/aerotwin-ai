import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import type { Telemetry } from '../store/useStore';

export function useTelemetrySocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempt = useRef(0);
  const mountedRef = useRef(true);

  // Stable refs to avoid dependency-triggered reconnections
  const setTelemetryRef = useRef(useStore.getState().setTelemetry);
  const setConnectedRef = useRef(useStore.getState().setConnected);

  useEffect(() => {
    setTelemetryRef.current = useStore.getState().setTelemetry;
    setConnectedRef.current = useStore.getState().setConnected;
  });

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket Connected');
      reconnectAttempt.current = 0;
      setConnectedRef.current(true);
    };

    ws.onmessage = (event) => {
      try {
        const data: Telemetry = JSON.parse(event.data);
        setTelemetryRef.current(data);
      } catch (e) {
        console.error('Failed to parse telemetry data', e);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setConnectedRef.current(false);

      // Reconnect with exponential backoff (max 10s)
      if (mountedRef.current) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 10000);
        reconnectAttempt.current++;
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempt.current})...`);
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror, which triggers reconnect
    };
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { ws: wsRef.current };
}
