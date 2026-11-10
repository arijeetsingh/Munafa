import { useApp, useFetch } from '../lib/store.jsx';
import { Card, ErrorState, Loading } from '../components/ui.jsx';

function MetricRow({ m, t }) {
  const has = m.value !== null && m.value !== undefined;
  const ok = has && m.value >= m.target;
  const pct = has ? Math.min(100, (m.value / (m.target * 1.5)) * 100) : 0;
  const targetPos = (1 / 1.5) * 100;
  return (
    <li className="metric">
      <div className="metric-text">
        <span className="metric-level">{m.level}</span>
        <span className="metric-name">{m.name}</span>
      </div>
      <div className="metric-value">
        <span className="metric-num">{has ? `${m.value}${m.unit === '%' ? '%' : ''}` : '—'}</span>
        <span className="muted small">{t('target')} {m.target}{m.unit === '%' ? '%' : ` ${m.unit}`}</span>
      </div>
      <div className="metric-track" aria-hidden>
        <div className={`metric-fill ${ok ? 'ok' : 'below'}`} style={{ width: `${pct}%` }} />
        <div className="metric-target" style={{ left: `${targetPos}%` }} />
      </div>
      <span className={`pill ${ok ? 'pill-ok' : 'pill-warn'}`}>{ok ? t('on_track') : t('below')}</span>
    </li>
  );
}

export default function Metrics() {
  const { t } = useApp();
  const { data, error, loading, reload } = useFetch('/metrics');
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{data?.asOf}</p>
          <h1>{t('metrics_title')}</h1>
          <p className="muted lead">{t('metrics_sub')}</p>
        </div>
      </header>
      {error && <ErrorState t={t} onRetry={reload} message={error.message} />}
      {loading && !data && <Loading t={t} />}
      {data && (
        <div className="metrics-grid">
          <section className="northstar">
            <p className="eyebrow eyebrow-light">{t('north_star')}</p>
            <p className="northstar-num">{data.northStar.value}</p>
            <p className="northstar-name">{data.northStar.name}</p>
            <p className="northstar-def">{t('wpav_def')} · {t('of_vendors', { n: data.vendors })}</p>
          </section>
          <Card>
            <ul className="metric-list">{data.metrics.map((m) => <MetricRow key={m.name} m={m} t={t} />)}</ul>
          </Card>
        </div>
      )}
    </div>
  );
}
