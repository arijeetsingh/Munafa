import { useCallback, useEffect, useRef, useState } from 'react';

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export const speechSupported = Boolean(Recognition);

/**
 * Push-to-talk speech recognition (browser Web Speech API, hi-IN by default).
 * onResult receives the final transcript when the vendor stops speaking.
 */
export function useSpeech({ lang, onResult }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const recRef = useRef(null);
  const finalRef = useRef('');
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => () => recRef.current?.abort(), []);

  const start = useCallback(() => {
    if (!Recognition) {
      setError('unsupported');
      return;
    }
    setError(null);
    setInterim('');
    finalRef.current = '';
    const rec = new Recognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i += 1) text += e.results[i][0].transcript;
      setInterim(text);
      if (e.results[e.results.length - 1].isFinal) finalRef.current = text;
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setError('denied');
      else if (e.error === 'no-speech') setError('nothing');
      else if (e.error !== 'aborted') setError('nothing');
    };
    rec.onend = () => {
      setListening(false);
      const text = (finalRef.current || '').trim();
      if (text) onResultRef.current?.(text);
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [lang]);

  const stop = useCallback(() => recRef.current?.stop(), []);

  return { listening, interim, error, start, stop, supported: speechSupported };
}

/** Read text aloud (optional voice reply for the daily summary). */
export function speak(text, lang) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
  return true;
}
