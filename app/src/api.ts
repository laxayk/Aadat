import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Expo Secure Store has no web implementation; localStorage is the web fallback
// (web is used for previews and tests, not the shipped app).
const store = {
  async get(k: string) {
    return Platform.OS === 'web' ? window.localStorage.getItem(k) : SecureStore.getItemAsync(k);
  },
  async set(k: string, v: string) {
    if (Platform.OS === 'web') window.localStorage.setItem(k, v);
    else await SecureStore.setItemAsync(k, v);
  },
  async del(k: string) {
    if (Platform.OS === 'web') window.localStorage.removeItem(k);
    else await SecureStore.deleteItemAsync(k);
  },
};

const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:8081';

const TOKEN_KEY = 'aadat.jwt';

export async function saveToken(token: string) {
  await store.set(TOKEN_KEY, token);
}

export async function loadToken(): Promise<string | null> {
  return store.get(TOKEN_KEY);
}

export async function clearToken() {
  await store.del(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await loadToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

/** The device's local calendar day: the server stores days, not instants. */
export function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
