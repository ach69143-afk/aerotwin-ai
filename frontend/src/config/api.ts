/**
 * Centralized API configuration.
 *
 * In production, set the VITE_API_URL environment variable to the backend URL
 * (e.g. https://aerotwin-ai.onrender.com). For local development the default
 * falls back to http://localhost:8000.
 *
 * The WebSocket URL is derived automatically by converting the protocol:
 *   https:  →  wss:
 *   http:   →  ws:
 */

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000';
const CONTROL_TOKEN = import.meta.env.VITE_CONTROL_TOKEN as string | undefined;

// Strip any trailing slash so callers can safely append paths.
export const API_BASE = API_URL.replace(/\/+$/, '');

export const WS_BASE = API_BASE
  .replace(/^https:/, 'wss:')
  .replace(/^http:/, 'ws:');

/** Full WebSocket telemetry endpoint. */
export const WS_TELEMETRY_URL = `${WS_BASE}/ws/telemetry`;

/**
 * Optional operator credential for protected control endpoints. Do not put a
 * production secret in a public dashboard; use an authenticated proxy instead.
 */
export const API_AUTH_HEADERS: Record<string, string> = CONTROL_TOKEN
  ? { Authorization: `Bearer ${CONTROL_TOKEN}` }
  : {};
