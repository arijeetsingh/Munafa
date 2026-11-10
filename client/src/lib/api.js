// API client with an offline queue for entries (PRD: "entries are saved
// offline first"). Queued entries carry a clientId so a retried sync never
// creates duplicates on the server.

const TOKEN_KEY = 'munafa.token';
const QUEUE_KEY = 'munafa.queue';

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable: run without persistence */ }
}

export const getToken = () => read(TOKEN_KEY, null);
export const setToken = (t) => write(TOKEN_KEY, t);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('offline', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) {
    setToken(null);
    window.dispatchEvent(new Event('munafa:logout'));
  }
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong.', res.status);
  return data;
}

// ---------- offline queue ----------

export const queued = () => read(QUEUE_KEY, []);

function notify() {
  window.dispatchEvent(new CustomEvent('munafa:queue', { detail: queued().length }));
}

export function newClientId() {
  return (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

/** Save entries; falls back to the local queue when the network is down. */
export async function saveEntries(entries, date) {
  const withIds = entries.map((e) => ({ ...e, clientId: e.clientId || newClientId(), date }));
  try {
    const res = await api('/entries', { method: 'POST', body: { entries: withIds } });
    return { saved: res.entries, offline: false };
  } catch (err) {
    if (err.status !== 0) throw err;
    write(QUEUE_KEY, [...queued(), ...withIds]);
    notify();
    return { saved: withIds, offline: true };
  }
}

let syncing = false;
export async function syncQueue() {
  const list = queued();
  if (!list.length || syncing || !getToken()) return 0;
  syncing = true;
  try {
    await api('/entries', { method: 'POST', body: { entries: list } });
    write(QUEUE_KEY, []);
    notify();
    return list.length;
  } catch {
    return 0;
  } finally {
    syncing = false;
  }
}
