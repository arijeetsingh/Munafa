import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { LANGUAGES } from '../lib/i18n.js';
import Logo from '../components/Logo.jsx';

export default function Onboarding() {
  const { vendor, setVendor, setMenu, catalog, t, lang, setGuestLang, logout } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: vendor.name || '', language: lang, businessType: 'chaat', area: 'Lucknow', closingTime: '21:30' });
  const [picked, setPicked] = useState({}); // templateKey → price
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Preview the chosen language immediately.
  useEffect(() => { setGuestLang(form.language); }, [form.language, setGuestLang]);

  const templates = useMemo(() => {
    const list = catalog?.templates || [];
    return [...list].sort((a, b) => Number(b.businessTypes.includes(form.businessType)) - Number(a.businessTypes.includes(form.businessType)));
  }, [catalog, form.businessType]);

  // Pre-select the dishes that match the business type.
  useEffect(() => {
    if (!catalog) return;
    const defaults = Object.fromEntries(catalog.templates.filter((x) => x.businessTypes.includes(form.businessType)).slice(0, 4).map((x) => [x.key, x.price]));
    setPicked(defaults);
  }, [catalog, form.businessType]);

  const toggle = (tpl) => setPicked((p) => {
    const next = { ...p };
    if (tpl.key in next) delete next[tpl.key]; else next[tpl.key] = tpl.price;
    return next;
  });

  const next = () => {
    setError(null);
    if (step === 3 && Object.keys(picked).length === 0) return setError(t('pick_one'));
    setStep((s) => s + 1);
  };

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      const menu = Object.entries(picked).map(([templateKey, price]) => ({ templateKey, price: Number(price) }));
      const res = await api('/onboarding', { method: 'POST', body: { ...form, name: form.name.trim() || undefined, menu } });
      setMenu(res.menu);
      setVendor(res.vendor);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!catalog) return <div className="boot"><span className="spinner" />{t('loading')}</div>;

  return (
    <div className="onboard">
      <header className="onboard-head">
        <Logo />
        <div className="progress" aria-label={t('ob_step', { n: step })}>
          {[1, 2, 3, 4].map((n) => <span key={n} className={`progress-dot${n <= step ? ' on' : ''}`} />)}
        </div>
        <span className="muted small">{t('ob_step', { n: step })}</span>
      </header>

      <main className="onboard-body">
        {step === 1 && (
          <section className="stack-lg">
            <h1>{t('ob_lang_title')}</h1>
            <div className="choice-grid">
              {LANGUAGES.map((l) => (
                <button key={l.key} type="button" className={`choice${form.language === l.key ? ' choice-on' : ''}`} aria-pressed={form.language === l.key} onClick={() => setForm({ ...form, language: l.key })}>
                  <span className="choice-title">{l.label}</span>
                  <span className="choice-sub">{l.sample}</span>
                  {form.language === l.key && <Check className="choice-check" size={20} aria-hidden />}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="stack-lg">
            <h1>{t('ob_business_title')}</h1>
            <label className="field">
              <span className="field-label">{t('your_name')}</span>
              <input value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ramesh" autoFocus />
            </label>
            <div className="choice-grid choice-grid-3">
              {catalog.businessTypes.map((b) => (
                <button key={b.key} type="button" className={`choice choice-sm${form.businessType === b.key ? ' choice-on' : ''}`} aria-pressed={form.businessType === b.key} onClick={() => setForm({ ...form, businessType: b.key })}>
                  <span className="choice-title">{b.name}</span>
                </button>
              ))}
            </div>
            <label className="field">
              <span className="field-label">{t('area')}</span>
              <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                {catalog.areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
          </section>
        )}

        {step === 3 && (
          <section className="stack-lg">
            <div>
              <h1>{t('ob_menu_title')}</h1>
              <p className="muted">{t('ob_menu_sub')}</p>
            </div>
            <ul className="template-list">
              {templates.map((tpl) => {
                const on = tpl.key in picked;
                return (
                  <li key={tpl.key} className={`template${on ? ' template-on' : ''}`}>
                    <button type="button" className="template-pick" aria-pressed={on} onClick={() => toggle(tpl)}>
                      <span className="template-box" aria-hidden>{on && <Check size={16} />}</span>
                      <span>{tpl.name}<span className="muted small"> · {tpl.serving}</span></span>
                    </button>
                    {on && (
                      <label className="price-input">
                        <span aria-hidden>₹</span>
                        <input type="number" inputMode="numeric" min="1" value={picked[tpl.key]} aria-label={`${tpl.name} ${t('price')}`}
                          onChange={(e) => setPicked({ ...picked, [tpl.key]: e.target.value })} />
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {step === 4 && (
          <section className="stack-lg">
            <div>
              <h1>{t('ob_time_title')}</h1>
              <p className="muted">{t('ob_time_sub')}</p>
            </div>
            <label className="field field-time">
              <span className="field-label">{t('closing_time')}</span>
              <input type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} />
            </label>
          </section>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
      </main>

      <footer className="onboard-foot">
        {step > 1 ? (
          <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}><ArrowLeft size={18} aria-hidden /> {t('back')}</button>
        ) : (
          <button type="button" className="btn btn-link" onClick={logout}>{t('logout')}</button>
        )}
        {step < 4 ? (
          <button type="button" className="btn btn-ink" onClick={next}>{t('next')} <ArrowRight size={18} aria-hidden /></button>
        ) : (
          <button type="button" className="btn btn-saffron" onClick={finish} disabled={busy}>{t('finish')} <ArrowRight size={18} aria-hidden /></button>
        )}
      </footer>
    </div>
  );
}
