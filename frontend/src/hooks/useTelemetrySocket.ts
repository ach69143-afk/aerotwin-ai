import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Telemetry } from '../store/useStore';

export function useTelemetrySocket(url: string) {
  const setTelemetry = useStore((state) => state.setTelemetry);
  const setConnected = useStore((state) => state.setConnected);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const data: Telemetry = JSON.parse(event.data);
        setTelemetry(data);
      } catch (e) {
        console.error('Failed to parse telemetry data', e);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, setTelemetry, setConnected]);

  return { ws: ws.current };
}
