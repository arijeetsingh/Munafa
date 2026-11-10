import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Copy, Lightbulb, Mic, Share2, Volume2 } from 'lucide-react';
import { useApp, useFetch } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { dayLabel, money, shiftDay, todayKey } from '../lib/format.js';
import { itemLabel } from '../lib/i18n.js';
import { speak } from '../lib/speech.js';
import { Card, Delta, ErrorState, Loading } from '../components/ui.jsx';

function summaryText(d, t, lang) {
  const lines = [
    `${t('hisaab_title')} · ${dayLabel(d.date, lang)}`,
    `${t('sales')}: ${money(d.today.sales)}`,
    `${t('expenses')}: ${money(d.today.expenses)}`,
    `${d.today.profit >= 0 ? t('profit') : t('loss')}: ${money(Math.abs(d.today.profit))}${d.change !== null ? ` (${t('vs_yesterday')} ${money(d.change, { sign: true })})` : ''}`,
  ];
  if (d.tip) lines.push('', `${t('tip_of_day')}: ${d.tip.text}`);
  lines.push('', '— Munafa');
  return lines.join('\n');
}

function CashCheck({ data, t, onSaved }) {
  const [value, setValue] = useState(data.cashCounted ?? '');
  const [saving, setSaving] = useState(false);
  useEffect(() => setValue(data.cashCounted ?? ''), [data.cashCounted, data.date]);
  const counted = data.cashCounted;
  const gap = counted === null ? null : counted - data.today.sales;
  const tolerance = Math.max(50, Math.abs(data.today.sales) * 0.03);

  const submit = async (e) => {
    e.preventDefault();
    if (value === '') return;
    setSaving(true);
    try {
      await api('/dashboard/cash', { method: 'POST', body: { date: data.date, cashCounted: Number(value) } });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title={t('cash_check')}>
      <p className="muted">{t('cash_check_sub')}</p>
      <form className="inline-form" onSubmit={submit}>
        <label className="field field-grow">
          <span className="field-label">{t('cash_counted')}</span>
          <input type="number" inputMode="numeric" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder="₹" />
        </label>
        <button type="submit" className="btn btn-ink" disabled={saving || value === ''}>{t('check_btn')}</button>
      </form>
      {gap !== null && (
        <div className={`cash-result ${Math.abs(gap) <= tolerance ? 'is-ok' : 'is-gap'}`} role="status">
          {Math.abs(gap) <= tolerance ? t('cash_match')
            : gap > 0 ? t('cash_gap_more', { gap: money(gap) }) : t('cash_gap_less', { gap: money(-gap) })}
          {Math.abs(gap) > tolerance && <span className="cash-note">{t('cash_note')}</span>}
        </div>
      )}
    </Card>
  );
}

export default function Today() {
  const { t, lang, catalog, toast } = useApp();
  const [date, setDate] = useState(todayKey());
  const { data, error, loading, reload } = useFetch(`/dashboard?date=${date}`);
  const isToday = date === todayKey();

  const share = async (how) => {
    const text = summaryText(data, t, lang);
    if (how === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    if (how === 'copy') {
      try { await navigator.clipboard.writeText(text); toast(t('copied')); } catch { /* clipboard blocked */ }
    }
    if (how === 'speak') speak(text.replace(/₹/g, ' rupaye ').replace(/—.*$/, ''), lang);
    if (how !== 'speak') api('/dashboard/shared', { method: 'POST', body: { date } }).catch(() => {});
  };

  const maxCost = data?.today.topCosts[0]?.amount || 1;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{isToday ? t('today') : date === shiftDay(todayKey(), -1) ? t('yesterday') : ''}</p>
          <h1>{t('hisaab_title')}</h1>
        </div>
        <div className="day-nav">
          <button type="button" className="icon-btn" aria-label="Previous day" onClick={() => setDate(shiftDay(date, -1))}><ChevronLeft size={20} /></button>
          <span className="day-nav-label">{dayLabel(date, lang)}</span>
          <button type="button" className="icon-btn" aria-label="Next day" disabled={isToday} onClick={() => setDate(shiftDay(date, 1))}><ChevronRight size={20} /></button>
        </div>
      </header>

      {error && <ErrorState t={t} onRetry={reload} message={error.message} />}
      {loading && !data && <Loading t={t} />}

      {data && (
        <div className="today-grid">
          <section className="summary-card" aria-label={t('hisaab_title')}>
            <div className="summary-rows">
              <div className="summary-row"><span>{t('sales')}</span><span className="money">{money(data.today.sales)}</span></div>
              <div className="summary-row"><span>{t('expenses')}</span><span className="money">{money(data.today.expenses)}</span></div>
            </div>
            <div className="summary-total">
              <span>{data.today.profit >= 0 ? t('profit') : t('loss')}</span>
              <span className={`summary-profit ${data.today.profit < 0 ? 'is-loss' : ''}`}>{money(Math.abs(data.today.profit))}</span>
            </div>
            {data.today.hasSale && <Delta value={data.change} label={t('vs_yesterday')} />}
            {!data.today.hasSale && data.today.entryCount > 0 && isToday && (
              <Link to="/?listen=1" className="btn btn-saffron btn-block"><Mic size={18} aria-hidden /> {t('log_sales')}</Link>
            )}
            {data.today.entryCount === 0 && <p className="empty-dark">{t('no_data_day')}</p>}

            {data.tip && data.today.entryCount > 0 && (
              <div className="summary-tip"><Lightbulb size={18} aria-hidden /><p>{data.tip.text}</p></div>
            )}

            {data.today.entryCount > 0 && (
              <div className="share-row">
                <button type="button" className="btn btn-whatsapp" onClick={() => share('whatsapp')}><Share2 size={18} aria-hidden /> {t('share_whatsapp')}</button>
                <button type="button" className="btn btn-on-dark" onClick={() => share('copy')}><Copy size={18} aria-hidden /> {t('copy')}</button>
                <button type="button" className="btn btn-on-dark" onClick={() => share('speak')}><Volume2 size={18} aria-hidden /> {t('read_aloud')}</button>
              </div>
            )}
          </section>

          <div className="today-side">
            <Card title={t('top_costs')}>
              {data.today.topCosts.length === 0 ? <p className="empty">{t('no_data_day')}</p> : (
                <ol className="bars">
                  {data.today.topCosts.map((c) => (
                    <li key={c.item} className="bar-row">
                      <div className="bar-text">
                        <span className="bar-name">{itemLabel(c, lang, catalog)}</span>
                        <span className="bar-value">{money(c.amount)} <span className="muted">· {c.share}% {t('of_costs')}</span></span>
                      </div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(c.amount / maxCost) * 100}%` }} /></div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
            {data.today.entryCount > 0 && <CashCheck data={data} t={t} onSaved={reload} />}
            <Link to="/khata" className="link-strong">{t('all_entries')} →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
