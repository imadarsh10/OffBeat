import { Capacitor } from '@capacitor/core';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();

const isNative = (() => {
	try {
		if (Capacitor?.isNativePlatform) return Capacitor.isNativePlatform();
		if (Capacitor?.getPlatform) return Capacitor.getPlatform() !== 'web';
		return false;
	} catch {
		return false;
	}
})();

// Dev defaults:
// - Browser dev: localhost
// - Android emulator: 10.0.2.2 (maps to your computer's localhost)
// Production/native builds should set VITE_API_URL to your hosted backend.
const devDefault = isNative ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export const API_URL = configuredApiUrl || (import.meta.env.DEV ? devDefault : '');

export const getApiUrl = (path) => `${API_URL}${path}`;
