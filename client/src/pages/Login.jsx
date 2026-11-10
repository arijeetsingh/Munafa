import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Store } from 'lucide-react';
import { useApp } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { LANGUAGES } from '../lib/i18n.js';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const { t, lang, setGuestLang, login, health } = useApp();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn, goHome = true) => {
    setBusy(true);
    setError(null);
    try { await fn(); if (goHome) navigate('/', { replace: true }); } catch (err) { setError(err.status === 0 ? t('error_generic') : err.message); } finally { setBusy(false); }
  };

  const sendCode = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await api('/auth/request-otp', { method: 'POST', body: { phone } });
      setDemoCode(res.demoCode || null);
      setStep('code');
    }, false);
  };
  const verify = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await api('/auth/verify', { method: 'POST', body: { phone, code } });
      await login(res.token, res.vendor);
    });
  };
  const demo = () => run(async () => {
    const res = await api('/auth/demo', { method: 'POST' });
    await login(res.token, res.vendor);
  });

  return (
    <div className="login">
      <section className="login-story">
        <Logo light />
        <div className="login-hero">
          <h1>{t('tagline')}</h1>
          <div className="login-card" aria-hidden>
            <span className="login-card-label">{t('todays_profit')}</span>
            <span className="login-card-value">₹1,240</span>
            <span className="login-card-said">“teen kilo pyaaz, nabbe rupaye”</span>
          </div>
        </div>
        <ul className="login-points">
          <li><b>{t('mic_idle')}</b> · {lang === 'en' ? 'Say a purchase or sale in Hindi, Hinglish or English.' : lang === 'hi' ? 'खरीद या बिक्री हिंदी, हिंग्लिश या अंग्रेज़ी में बोलिए।' : 'Kharidari ya bikri Hindi, Hinglish ya English mein bolo.'}</li>
          <li><b>{t('profit')}</b> · {lang === 'en' ? "Every evening: today's profit and your top costs." : lang === 'hi' ? 'हर शाम: आज का मुनाफ़ा और सबसे बड़े खर्चे।' : 'Har shaam: aaj ka munafa aur sabse bade kharche.'}</li>
          <li><b>{t('price_alerts')}</b> · {lang === 'en' ? 'Know when you pay more than your area.' : lang === 'hi' ? 'पता चले जब आप इलाके से ज़्यादा दाम दें।' : 'Pata chale jab aap area se zyada daam do.'}</li>
        </ul>
      </section>

      <section className="login-panel">
        <div className="lang-switch" role="group" aria-label="Language">
          {LANGUAGES.map((l) => (
            <button key={l.key} type="button" className={`seg${lang === l.key ? ' seg-on' : ''}`} aria-pressed={lang === l.key} onClick={() => setGuestLang(l.key)}>{l.label}</button>
          ))}
        </div>

        <div className="login-form-wrap">
          <h2>{t('login_title')}</h2>
          {step === 'phone' ? (
            <form className="stack" onSubmit={sendCode}>
              <label className="field">
                <span className="field-label">{t('phone')}</span>
                <div className="phone-input">
                  <span>+91</span>
                  <input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone} required
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="98765 43210" />
                </div>
              </label>
              <button type="submit" className="btn btn-ink btn-block" disabled={busy || phone.length !== 10}>{t('send_code')} <ArrowRight size={18} aria-hidden /></button>
            </form>
          ) : (
            <form className="stack" onSubmit={verify}>
              <label className="field">
                <span className="field-label">{t('enter_code', { phone: `+91 ${phone}` })}</span>
                <input className="code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} required autoFocus
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
              </label>
              {demoCode && <p className="demo-code">{t('demo_code', { code: demoCode })}</p>}
              <button type="submit" className="btn btn-ink btn-block" disabled={busy || code.length !== 6}>{t('verify')} <ArrowRight size={18} aria-hidden /></button>
              <button type="button" className="btn btn-link" onClick={() => { setStep('phone'); setCode(''); }}>{t('change_number')}</button>
            </form>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          {health?.demo !== false && (
            <>
              <div className="divider"><span>{t('or')}</span></div>
              <button type="button" className="btn btn-saffron btn-block" onClick={demo} disabled={busy}><Store size={18} aria-hidden /> {t('try_demo')}</button>
            </>
          )}
        </div>
        <p className="login-foot">Product Space Capstone · Cohort 31</p>
      </section>
    </div>
  );
}
