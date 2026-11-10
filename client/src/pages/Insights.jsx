import { Fragment, useState } from 'react';
import { AlertTriangle, ChevronDown, TrendingDown, TrendingUp } from 'lucide-react';
import { useApp, useFetch } from '../lib/store.jsx';
import { money, num } from '../lib/format.js';
import { Card, ErrorState, Loading } from '../components/ui.jsx';
import TrendChart from '../components/TrendChart.jsx';

function AlertCard({ a, t }) {
  return (
    <article className="alert-card">
      <header className="alert-head">
        <AlertTriangle size={20} aria-hidden />
        <h3>{a.name}</h3>
        <span className="alert-pct">{a.pctAbove}% {t('higher')}</span>
      </header>
      <dl className="alert-figs">
        <div><dt>{t('you_paid')}</dt><dd>{money(a.paid, { decimals: true })}/{a.unit}</dd></div>
        <div><dt>{t('area_median')}</dt><dd>{money(a.median, { decimals: true })}/{a.unit}</dd></div>
      </dl>
      {a.monthlyExtra > 0 && <p className="alert-save">{t('monthly_saving', { amt: money(a.monthlyExtra) })}</p>}
      <p className="alert-foot">{t('based_on', { n: a.sampleSize })}</p>
    </article>
  );
}

function PlatesTable({ plates, t }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th scope="col">{t('item')}</th><th scope="col" className="num">{t('price')}</th><th scope="col" className="num">{t('cost')}</th><th scope="col" className="num">{t('margin')}</th></tr>
        </thead>
        <tbody>
          {plates.map((p) => (
            <Fragment key={p.menuItemId}>
              <tr className="row-click" onClick={() => setOpen(open === p.menuItemId ? null : p.menuItemId)}>
                <th scope="row">
                  <button type="button" className="row-toggle" aria-expanded={open === p.menuItemId}>
                    <ChevronDown size={16} aria-hidden className={open === p.menuItemId ? 'rot' : ''} />
                    <span>{p.name}<span className="muted small"> · {p.serving}</span></span>
                  </button>
                </th>
                <td className="num">{money(p.price)}</td>
                <td className="num">{money(p.cost, { decimals: true })}</td>
                <td className="num">
                  <span className={`margin-chip ${p.marginPct < 35 ? 'margin-low' : p.marginPct < 50 ? 'margin-mid' : 'margin-good'}`}>{p.marginPct}%</span>
                  <span className="muted small"> {money(p.margin, { decimals: true })}</span>
                </td>
              </tr>
              {open === p.menuItemId && (
                <tr className="row-detail">
                  <td colSpan={4}>
                    <ul className="recipe">
                      {p.lines.map((l) => (
                        <li key={l.ingredientKey}>
                          <span>{l.name} <span className="muted">{num(l.qty)} {l.unit}</span></span>
                          <span className="muted small">{money(l.unitPrice, { decimals: true })}/{l.unit} · {l.priceSource === 'yours' ? t('src_yours') : t('src_area')}</span>
                          <span className="num">{money(l.cost, { decimals: true })}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Insights() {
  const { t, lang, catalog } = useApp();
  const { data, error, loading, reload } = useFetch('/insights');
  const ingName = (key) => {
    const i = catalog?.ingredients.find((x) => x.key === key);
    return i ? (lang === 'en' ? i.name : i.hi) : key;
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{data?.area}</p>
          <h1>{t('insights_title')}</h1>
        </div>
      </header>

      {error && <ErrorState t={t} onRetry={reload} message={error.message} />}
      {loading && !data && <Loading t={t} />}

      {data && (
        <div className="insights-grid">
          <Card title={t('price_alerts')} className="span-2">
            <p className="muted">{t('price_alerts_sub', { area: data.area })}</p>
            {data.alerts.length === 0 ? <p className="empty">{t('no_alerts')}</p> : (
              <div className="alerts">{data.alerts.map((a) => <AlertCard key={a.ingredientKey} a={a} t={t} />)}</div>
            )}
          </Card>

          <Card title={t('trend_title')}>
            <TrendChart data={data.trend} lang={lang} />
          </Card>

          <Card title={t('week_profit')}>
            <p className="week-profit">{money(data.weekly.profit)}</p>
            {data.weekly.change !== null && (
              <p className={`delta ${data.weekly.change >= 0 ? 'gain' : 'loss'}`}>
                {data.weekly.change >= 0 ? <TrendingUp size={16} aria-hidden /> : <TrendingDown size={16} aria-hidden />}
                {data.weekly.change > 0 ? '+' : ''}{data.weekly.change}% <span className="delta-label">{t('prev_week')} {money(data.weekly.previousProfit)}</span>
              </p>
            )}
            {data.weekly.best ? (
              <dl className="week-items">
                <div><dt>{t('best_item')}</dt><dd>{data.weekly.best.item}<span className="muted"> · {money(data.weekly.best.amount)}</span></dd></div>
                {data.weekly.worst && <div><dt>{t('worst_item')}</dt><dd>{data.weekly.worst.item}<span className="muted"> · {money(data.weekly.worst.amount)}</span></dd></div>}
              </dl>
            ) : <p className="empty">{t('no_menu_sales')}</p>}
          </Card>

          <Card title={t('plates_title')} className="span-2">
            <p className="muted">{t('plates_sub')}</p>
            <PlatesTable plates={data.plates} t={t} />
          </Card>

          <Card title={t('prices_title')} className="span-2">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th scope="col">{t('ingredient')}</th><th scope="col" className="num">{t('you_paid')}</th><th scope="col" className="num">{t('area_median')}</th><th scope="col" className="num">±</th></tr>
                </thead>
                <tbody>
                  {data.prices.sort((a, b) => ((b.median ? b.price / b.median : 0) - (a.median ? a.price / a.median : 0))).map((p) => {
                    const diff = p.median ? Math.round(((p.price - p.median) / p.median) * 100) : null;
                    return (
                      <tr key={p.ingredientKey}>
                        <th scope="row">{ingName(p.ingredientKey)}</th>
                        <td className="num">{money(p.price, { decimals: true })}/{p.unit}</td>
                        <td className="num">{p.median ? `${money(p.median, { decimals: true })}/${p.unit}` : '—'}</td>
                        <td className="num">
                          {!p.enoughData ? <span className="muted small">{t('not_enough_data')}</span>
                            : <span className={diff >= 10 ? 'loss strong' : diff <= -5 ? 'gain' : ''}>{diff > 0 ? '+' : ''}{diff}%</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
