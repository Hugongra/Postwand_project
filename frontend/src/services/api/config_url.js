// API base: in dev, '' uses the Vite dev server origin so `/api/*` is proxied (see vite.config.js).
// Override with VITE_API_BASE_URL when needed. Production defaults to the live API host.
const explicit = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL =
  explicit !== undefined && explicit !== null && String(explicit).length > 0
    ? String(explicit).replace(/\/$/, '')
    : import.meta.env.DEV
      ? ''
      : 'https://app.postwand.io';
