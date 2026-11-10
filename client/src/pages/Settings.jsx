import { useState } from 'react';
import { Bell, LogOut, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { LANGUAGES, translate } from '../lib/i18n.js';
import { Card } from '../components/ui.jsx';

function MenuEditor() {
  const { menu, catalog, loadMenu, t, toast } = useApp();
  const [adding, setAdding] = useState({ templateKey: '', price: '' });
  const available = (catalog?.templates || []).filter((tpl) => !menu.some((m) => m.templateKey === tpl.key));

  const updatePrice = async (item, value) => {
    const price = Number(value);
    if (!price || price === item.price) return;
    await api(`/menu/${item._id}`, { method: 'PATCH', body: { price } });
    await loadMenu();
    toast(t('saved'));
  };
  const removeItem = async (item) => {
    await api(`/menu/${item._id}`, { method: 'DELETE' });
    await loadMenu();
  };
  const add = async (e) => {
    e.preventDefault();
    if (!adding.templateKey || !adding.price) return;
    await api('/menu', { method: 'POST', body: { templateKey: adding.templateKey, price: Number(adding.price) } });
    setAdding({ templateKey: '', price: '' });
    await loadMenu();
    toast(t('saved'));
  };

  return (
    <Card title={t('menu')} className="span-2">
      <p className="muted">{t('menu_sub')}</p>
      <ul className="menu-list">
        {menu.map((m) => (
          <li key={m._id} className="menu-row">
            <span className="menu-name">{m.name}<span className="muted small"> · {m.serving}</span></span>
            <label className="price-input">
              <span aria-hidden>₹</span>
              <input type="number" inputMode="numeric" min="1" defaultValue={m.price} aria-label={`${m.name} ${t('price')}`}
                onBlur={(e) => updatePrice(m, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
            </label>
            <button type="button" className="icon-btn" aria-label={`${t('remove')} ${m.name}`} onClick={() => removeItem(m)} disabled={menu.length <= 1}><Trash2 size={18} /></button>
          </li>
        ))}
      </ul>
      {available.length > 0 && (
        <form className="inline-form" onSubmit={add}>
          <label className="field field-grow">
            <span className="field-label">{t('add_item')}</span>
            <select value={adding.templateKey} onChange={(e) => {
              const tpl = available.find((x) => x.key === e.target.value);
              setAdding({ templateKey: e.target.value, price: tpl ? tpl.price : '' });
            }}>
              <option value="">—</option>
              {available.map((tpl) => <option key={tpl.key} value={tpl.key}>{tpl.name} ({tpl.serving})</option>)}
            </select>
          </label>
          <label className="field field-price">
            <span className="field-label">{t('price')}</span>
            <input type="number" inputMode="numeric" min="1" value={adding.price} onChange={(e) => setAdding({ ...adding, price: e.target.value })} />
          </label>
          <button type="submit" className="btn btn-ink" disabled={!adding.templateKey || !adding.price}><Plus size={18} aria-hidden /> {t('add_item')}</button>
        </form>
      )}
    </Card>
  );
}

export default function Settings() {
  const { vendor, setVendor, catalog, t, toast, logout, health } = useApp();
  const [form, setForm] = useState({
    name: vendor.name || '', language: vendor.language, businessType: vendor.businessType,
    area: vendor.area, closingTime: vendor.closingTime, remindersOn: vendor.remindersOn,
  });
  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api('/me', { method: 'PATCH', body: form });
      setVendor(res.vendor);
      toast(translate(res.vendor.language, 'saved'));
    } catch (err) {
      toast(err.message, 'warn');
    } finally {
      setSaving(false);
    }
  };

  const askNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    setNotif(await Notification.requestPermission());
  };

  return (
    <div className="page">
      <header className="page-head"><div><p className="eyebrow">{vendor.phone}</p><h1>{t('settings_title')}</h1></div></header>

      <div className="settings-grid">
        <Card title={t('profile')}>
          <form className="stack" onSubmit={save}>
            <label className="field">
              <span className="field-label">{t('your_name')}</span>
              <input value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <fieldset className="field">
              <legend className="field-label">{t('language')}</legend>
              <div className="segmented segmented-wide">
                {LANGUAGES.map((l) => (
                  <button key={l.key} type="button" className={`seg${form.language === l.key ? ' seg-on' : ''}`} aria-pressed={form.language === l.key} onClick={() => setForm({ ...form, language: l.key })}>{l.label}</button>
                ))}
              </div>
            </fieldset>
            <div className="field-row">
              <label className="field">
                <span className="field-label">{t('business_type')}</span>
                <select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
                  {catalog?.businessTypes.map((b) => <option key={b.key} value={b.key}>{b.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field-label">{t('area')}</span>
                <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                  {catalog?.areas.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
            </div>
            <label className="field">
              <span className="field-label">{t('closing_time')}</span>
              <input type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} />
            </label>
            <label className="toggle">
              <input type="checkbox" checked={form.remindersOn} onChange={(e) => setForm({ ...form, remindersOn: e.target.checked })} />
              <span className="toggle-track" aria-hidden><span className="toggle-thumb" /></span>
              <span>{t('reminders')}</span>
            </label>
            <button type="submit" className="btn btn-ink" disabled={saving}>{t('save')}</button>
          </form>
        </Card>

        <div className="stack">
          <Card title={t('reminders')}>
            {notif === 'granted' ? <p className="gain"><Bell size={16} aria-hidden /> {t('notifications_on')}</p> : (
              <button type="button" className="btn btn-ghost" onClick={askNotifications} disabled={notif === 'unsupported' || notif === 'denied'}>
                <Bell size={18} aria-hidden /> {t('enable_notifications')}
              </button>
            )}
          </Card>
          <Card title={t('parser_mode')}>
            <p>{health?.parser === 'llm+rules' ? t('parser_llm') : t('parser_rules')}</p>
          </Card>
          <button type="button" className="btn btn-ghost" onClick={logout}><LogOut size={18} aria-hidden /> {t('logout')}</button>
        </div>

        <MenuEditor />
      </div>
    </div>
  );
}
