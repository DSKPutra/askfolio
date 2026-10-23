// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Device-only encrypted storage for the "Siapkan Laporan" wizard (§4.29, §13.2): IndexedDB + WebCrypto AES-GCM with a
// non-extractable device key (kept as a CryptoKey object in IndexedDB, never exported). Nothing here touches the
// network. Entries expire after 30 days unless the user chose "keep".
import { createStore, del, get, set } from 'idb-keyval';

const STORE = createStore('finandex-secure', 'kv');
const KEY_ID = 'device-key-v1';
export const RETENTION_DAYS = 30;

type Envelope = { v: 1; iv: number[]; data: number[]; savedAt: string; keep: boolean };

async function deviceKey(): Promise<CryptoKey> {
  const existing = await get<CryptoKey>(KEY_ID, STORE);
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await set(KEY_ID, key, STORE);
  return key;
}

export async function saveSecure<T>(id: string, value: T, keep: boolean, now = new Date()): Promise<void> {
  const key = await deviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(value));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const env: Envelope = { v: 1, iv: [...iv], data: [...data], savedAt: now.toISOString(), keep };
  await set(id, env, STORE);
}

export async function loadSecure<T>(id: string, now = new Date()): Promise<{ value: T; savedAt: string; keep: boolean } | null> {
  const env = await get<Envelope>(id, STORE);
  if (!env) return null;
  if (!env.keep && now.getTime() - Date.parse(env.savedAt) > RETENTION_DAYS * 86_400_000) {
    await del(id, STORE);
    return null;
  }
  const key = await deviceKey();
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(env.iv) }, key, new Uint8Array(env.data));
  return { value: JSON.parse(new TextDecoder().decode(plain)) as T, savedAt: env.savedAt, keep: env.keep };
}

export async function deleteSecure(id: string): Promise<void> {
  await del(id, STORE);
}

/** True when the stored record is ciphertext (used by tests: no plaintext ever reaches IndexedDB). */
export async function rawEnvelope(id: string): Promise<unknown> {
  return get(id, STORE);
}
