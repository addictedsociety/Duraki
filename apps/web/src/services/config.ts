const explicit = import.meta.env.VITE_SERVER_URL?.trim();
const port = import.meta.env.VITE_SERVER_PORT ?? "3001";

/**
 * Backend base URL.
 *
 * By default this is derived from the host the app is served from, so opening
 * the app on a phone via the dev machine's LAN IP (e.g. http://192.168.x.x:5173)
 * automatically targets the same machine's server. Set VITE_SERVER_URL to
 * override (e.g. for a deployed backend).
 */
export const serverUrl =
  explicit && explicit.length > 0
    ? explicit
    : `${window.location.protocol}//${window.location.hostname}:${port}`;
