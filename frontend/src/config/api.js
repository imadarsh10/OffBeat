const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();

// Use localhost only for local development; production must provide VITE_API_URL.
export const API_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000' : '');

export const getApiUrl = (path) => `${API_URL}${path}`;
