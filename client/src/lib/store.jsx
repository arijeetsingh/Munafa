import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, getToken, queued, setToken, syncQueue } from './api.js';
import { translate } from './i18n.js';

const AppContext = createContext(null);
const PRELOGIN_LANG = 'munafa.lang';

function storedLang() {
  try { return localStorage.getItem(PRELOGIN_LANG) || 'hinglish'; } catch { return 'hinglish'; }
}

export function AppProvider({ children }) {
  const [vendor, setVendor] = useState(null);
  const [booting, setBooting] = useState(Boolean(getToken()));
  const [catalog, setCatalog] = useState(null);
  const [menu, setMenu] = useState([]);
  const [health, setHealth] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(queued().length);
  const [version, setVersion] = useState(0); // bump to refetch screens after a save
  const [toasts, setToasts] = useState([]);
  const [guestLang, setGuestLang] = useState(storedLang);
  const toastId = useRef(0);

  const lang = vendor?.onboarded ? vendor.language : guestLang;
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const toast = useCallback((text, kind = 'ok') => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((list) => [...list, { id, text, kind }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3800);
  }, []);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const loadMenu = useCallback(async () => {
    const res = await api('/menu');
    setMenu(res.menu);
  }, []);

  const login = useCallback(async (token, v) => {
    setToken(token);
    setVendor(v);
    if (v.onboarded) await loadMenu().catch(() => {});
  }, [loadMenu]);

  const logout = useCallback(() => {
    setToken(null);
    setVendor(null);
    setMenu([]);
  }, []);

  const changeGuestLang = useCallback((l) => {
    setGuestLang(l);
    try { localStorage.setItem(PRELOGIN_LANG, l); } catch { /* ignore */ }
  }, []);

  // Boot: restore session, load reference data.
  useEffect(() => {
    api('/health').then(setHealth).catch(() => {});
    if (!getToken()) return;
    (async () => {
      try {
        const { vendor: v } = await api('/auth/me');
        setVendor(v);
        if (v.onboarded) await loadMenu();
      } catch {
        /* offline or expired: login screen handles it */
      } finally {
        setBooting(false);
      }
    })();
  }, [loadMenu]);

  useEffect(() => {
    if (vendor && !catalog) api('/catalog').then(setCatalog).catch(() => {});
  }, [vendor, catalog]);

  // Online/offline + queue sync.
  useEffect(() => {
    const trySync = async () => {
      const n = await syncQueue();
      if (n) {
        toast(translate(lang, 'synced_n', { n }));
        bump();
      }
    };
    const up = () => { setOnline(true); trySync(); };
    const down = () => setOnline(false);
    const q = (e) => setPending(e.detail);
    const out = () => logout();
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    window.addEventListener('munafa:queue', q);
    window.addEventListener('munafa:logout', out);
    if (vendor) trySync();
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      window.removeEventListener('munafa:queue', q);
      window.removeEventListener('munafa:logout', out);
    };
  }, [vendor, lang, toast, bump, logout]);

  const value = useMemo(() => ({
    vendor, setVendor, booting, lang, t, catalog, menu, setMenu, loadMenu, health, online, pending,
    version, bump, toast, toasts, login, logout, setGuestLang: changeGuestLang,
  }), [vendor, booting, lang, t, catalog, menu, loadMenu, health, online, pending, version, bump, toast, toasts, login, logout, changeGuestLang]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

/** Fetch helper for screens: refetches when `deps` or the global version change. */
export function useFetch(path, deps = []) {
  const { version } = useApp();
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const load = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState((s) => ({ data: s.data, error, loading: false })));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, version, ...deps]);
  useEffect(load, [load]);
  return { ...state, reload: load };
}
