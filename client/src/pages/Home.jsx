import { Link } from 'react-router-dom';
import { Flame, Lightbulb } from 'lucide-react';
import { useApp, useFetch } from '../lib/store.jsx';
import { dayLabel, money } from '../lib/format.js';
import Capture from '../components/Capture.jsx';
import { Card, Delta, EntryRow, ErrorState, Loading } from '../components/ui.jsx';

export default function Home() {
  const { vendor, t, lang, catalog } = useApp();
  const { data, error, loading, reload } = useFetch('/dashboard');

  return (
    <div className="page home">
      <header className="page-head">
        <div>
          <p className="eyebrow">{dayLabel(data?.date || new Date().toISOString().slice(0, 10), lang)}</p>
          <h1>{t('greet', { name: vendor.name || '' })}</h1>
        </div>
        {data?.streak > 1 && <span className="pill pill-saffron"><Flame size={14} aria-hidden /> {t('streak', { n: data.streak })}</span>}
      </header>

      <div className="home-grid">
        <div className="home-main">
          <Link to="/hisaab" className="profit-hero" aria-label={t('hisaab_title')}>
            <span className="profit-label">{t('todays_profit')}</span>
            {loading && !data ? <span className="profit-value skeleton">₹0,000</span> : (
              <span className={`profit-value ${data?.today.profit < 0 ? 'is-loss' : ''}`}>{money(data?.today.profit ?? 0)}</span>
            )}
            <span className="profit-split">
              <span><span className="split-label">{t('sales')}</span> {money(data?.today.sales ?? 0)}</span>
              <span><span className="split-label">{t('expenses')}</span> {money(data?.today.expenses ?? 0)}</span>
            </span>
            {data && !data.today.hasSale && data.today.entryCount > 0 && <span className="profit-note">{t('sales_pending')}</span>}
            {data?.today.hasSale && <Delta value={data.change} label={t('vs_yesterday')} />}
          </Link>

          <Capture />
        </div>

        <div className="home-side">
          {data?.tip && (
            <Card tone="peach" className="tip-card">
              <p className="tip-head"><Lightbulb size={18} aria-hidden /> {t('tip_of_day')}</p>
              <p className="tip-text">{data.tip.text}</p>
              {data.tip.kind === 'price_alert' && <Link to="/insights" className="link-strong">{t('price_alerts')} →</Link>}
            </Card>
          )}

          <Card title={t('recent')} action={<Link to="/khata" className="link-quiet">{t('see_all')}</Link>}>
            {error && <ErrorState t={t} onRetry={reload} message={error.message} />}
            {loading && !data && <Loading t={t} />}
            {data && data.recent.length === 0 && <p className="empty">{t('no_entries')}</p>}
            {data && data.recent.length > 0 && (
              <div className="entry-list">
                {data.recent.map((e) => <EntryRow key={e._id} entry={e} lang={lang} catalog={catalog} t={t} />)}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
