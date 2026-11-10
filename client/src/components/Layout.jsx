import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, BellRing, BookOpenText, CloudOff, Gauge, Home, ReceiptIndianRupee, Settings as Cog, X } from 'lucide-react';
import { useApp } from '../lib/store.jsx';
import { todayKey } from '../lib/format.js';
import Logo from './Logo.jsx';

const NAV = [
  { to: '/', key: 'nav_home', icon: Home, end: true },
  { to: '/hisaab', key: 'nav_hisaab', icon: ReceiptIndianRupee },
  { to: '/insights', key: 'nav_insights', icon: BarChart3 },
  { to: '/khata', key: 'nav_khata', icon: BookOpenText },
  { to: '/settings', key: 'nav_settings', icon: Cog },
];

function nowHHMM() {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date());
}

// Closing-time reminder: an in-app banner, plus a system notification when allowed.
function useClosingReminder(vendor, t) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!vendor?.remindersOn) return undefined;
    const key = `munafa.reminded.${todayKey()}`;
    const check = () => {
      let dismissed = false;
      try { dismissed = localStorage.getItem(key) === '1'; } catch { /* ignore */ }
      const now = nowHHMM();
      const [h, m] = vendor.closingTime.split(':').map(Number);
      const endMin = Math.min(h * 60 + m + 120, 24 * 60 - 1);
      const end = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
      const due = now >= vendor.closingTime && now <= end;
      setShow(due && !dismissed);
      if (due && !dismissed && 'Notification' in window && Notification.permission === 'granted' && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        try { new Notification('Munafa', { body: t('reminder_banner'), icon: '/icon.svg' }); } catch { /* ignore */ }
      }
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [vendor, t]);
  const dismiss = () => {
    try { localStorage.setItem(`munafa.reminded.${todayKey()}`, '1'); } catch { /* ignore */ }
    setShow(false);
  };
  return [show, dismiss];
}

export default function Layout() {
  const { vendor, t, online, pending, toasts } = useApp();
  const navigate = useNavigate();
  const [reminder, dismissReminder] = useClosingReminder(vendor, t);

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Main">
        <div className="sidebar-brand"><Logo /></div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, key, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              <Icon size={20} aria-hidden /> <span>{t(key)}</span>
            </NavLink>
          ))}
          <NavLink to="/metrics" className="side-link side-link-quiet">
            <Gauge size={20} aria-hidden /> <span>{t('nav_metrics')}</span>
          </NavLink>
        </nav>
        <div className="sidebar-foot">
          <div className="stall-card">
            <div className="stall-name">{vendor.name || vendor.phone}</div>
            <div className="stall-meta">{vendor.area} · {vendor.closingTime}</div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-brand"><Logo compact /></div>
          <div className="topbar-status">
            {!online && <span className="pill pill-warn"><CloudOff size={14} aria-hidden /> {t('offline')}</span>}
            {pending > 0 && <span className="pill">{t('pending_sync', { n: pending })}</span>}
          </div>
        </header>

        {reminder && (
          <div className="reminder" role="status">
            <BellRing size={20} aria-hidden />
            <p>{t('reminder_banner')}</p>
            <button type="button" className="btn btn-small btn-ink" onClick={() => { dismissReminder(); navigate('/?listen=1'); }}>{t('log_sales')}</button>
            <button type="button" className="icon-btn" aria-label={t('cancel')} onClick={dismissReminder}><X size={18} /></button>
          </div>
        )}

        <main className="content">
          <Outlet />
        </main>
      </div>

      <nav className="bottomnav" aria-label="Main">
        {NAV.map(({ to, key, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="bottom-link">
            <Icon size={22} aria-hidden />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="toasts" aria-live="polite">
        {toasts.map((x) => <div key={x.id} className={`toast toast-${x.kind}`}>{x.text}</div>)}
      </div>
    </div>
  );
}
