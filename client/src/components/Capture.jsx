import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUp, Mic, Square } from 'lucide-react';
import { useApp } from '../lib/store.jsx';
import { api, saveEntries } from '../lib/api.js';
import { speechLang } from '../lib/i18n.js';
import { useSpeech } from '../lib/speech.js';
import { todayKey } from '../lib/format.js';
import { parseText } from '../../../server/src/services/parser.js';
import ConfirmSheet from './ConfirmSheet.jsx';

const EXAMPLES = {
  hinglish: ['teen kilo pyaaz 90 rupaye', '5 kilo aloo 150, 2 litre tel 280', 'aaj 4,200 ki bikri'],
  hi: ['तीन किलो प्याज़ 90 रुपये', '2 लीटर तेल 280 रुपये', 'आज की बिक्री 4200 रुपये'],
  en: ['3 kg onions 90 rupees', '2 litres oil 280', 'total sales 4,200'],
};

/** Mic button + text fallback → parse → confirm → save. */
export default function Capture() {
  const { lang, t, toast, bump, menu } = useApp();
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(null); // { entries, raw, parser, source }
  const [saving, setSaving] = useState(false);

  const handleText = useCallback(async (raw, source) => {
    setBusy(true);
    try {
      let res;
      try {
        res = await api('/parse', { method: 'POST', body: { text: raw } });
      } catch (err) {
        if (err.status !== 0) throw err;
        // Offline: the same rule parser runs on the phone.
        res = { entries: parseText(raw, menu), parser: 'rules' };
      }
      if (!res.entries.length) {
        toast(t('nothing_found'), 'warn');
        setText(raw);
        return;
      }
      setSheet({ entries: res.entries.map((e) => ({ ...e, source })), raw, parser: res.parser });
      setText('');
    } catch (err) {
      toast(err.message, 'warn');
      setText(raw);
    } finally {
      setBusy(false);
    }
  }, [t, toast, menu]);

  const speech = useSpeech({ lang: speechLang(lang), onResult: (said) => handleText(said, 'voice') });

  // "/?listen=1" (from the closing reminder) opens the mic straight away.
  useEffect(() => {
    if (params.get('listen') === '1') {
      setParams({}, { replace: true });
      if (speech.supported) speech.start();
    }
  }, [params, setParams, speech]);

  const save = async (entries) => {
    setSaving(true);
    try {
      const { offline } = await saveEntries(entries, todayKey());
      toast(offline ? t('saved_offline') : t('saved_n', { n: entries.length }), offline ? 'warn' : 'ok');
      setSheet(null);
      bump();
    } catch (err) {
      toast(err.message, 'warn');
    } finally {
      setSaving(false);
    }
  };

  const micMessage = speech.error === 'unsupported' ? t('mic_unsupported')
    : speech.error === 'denied' ? t('mic_denied')
      : speech.error === 'nothing' ? t('mic_nothing') : null;

  return (
    <div className="capture">
      <button
        type="button"
        className={`mic${speech.listening ? ' mic-on' : ''}${busy ? ' mic-busy' : ''}`}
        onClick={() => (speech.listening ? speech.stop() : speech.start())}
        disabled={busy}
        aria-pressed={speech.listening}
        aria-label={speech.listening ? t('mic_listening') : t('mic_idle')}
      >
        <span className="mic-ring" aria-hidden />
        {speech.listening ? <Square size={34} aria-hidden /> : <Mic size={42} aria-hidden />}
        <span className="mic-word">{busy ? '…' : speech.listening ? t('mic_listening') : t('mic_idle')}</span>
      </button>

      <p className={`capture-hint${micMessage ? ' capture-hint-warn' : ''}`} aria-live="polite">
        {speech.listening && speech.interim ? <q>{speech.interim}</q> : micMessage || t('mic_hint')}
      </p>

      <form className="type-box" onSubmit={(e) => { e.preventDefault(); if (text.trim()) handleText(text.trim(), 'text'); }}>
        <label className="sr-only" htmlFor="type-input">{t('type_instead')}</label>
        <input id="type-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={`${t('type_instead')} ${t('type_placeholder')}`} maxLength={500} autoComplete="off" />
        <button type="submit" className="type-send" disabled={!text.trim() || busy} aria-label={t('save')}><ArrowUp size={20} /></button>
      </form>

      <div className="examples">
        <span className="examples-label">{t('try_saying')}</span>
        {(EXAMPLES[lang] || EXAMPLES.hinglish).map((ex) => (
          <button key={ex} type="button" className="chip" onClick={() => handleText(ex, 'text')} disabled={busy}>{ex}</button>
        ))}
      </div>

      {sheet && (
        <ConfirmSheet initial={sheet.entries} raw={sheet.raw} parser={sheet.parser} saving={saving}
          onCancel={() => setSheet(null)} onSave={save} />
      )}
    </div>
  );
}
