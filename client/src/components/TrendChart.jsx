import { useState } from 'react';
import { dayLabel, money } from '../lib/format.js';

/** Daily profit bars about a zero line; losses drop below it. */
export default function TrendChart({ data, lang }) {
  const [hover, setHover] = useState(null);
  const W = 640;
  const H = 240;
  const pad = { top: 28, bottom: 34, left: 8, right: 8 };
  const values = data.map((d) => d.profit);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const innerH = H - pad.top - pad.bottom;
  const y = (v) => pad.top + ((max - v) / span) * innerH;
  const slot = (W - pad.left - pad.right) / data.length;
  const barW = Math.min(56, slot * 0.58);
  const zero = y(0);

  return (
    <figure className="trend">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={data.map((d) => `${dayLabel(d.date, lang, { short: true })} ${money(d.profit)}`).join(', ')}>
        <line x1={pad.left} x2={W - pad.right} y1={zero} y2={zero} className="trend-zero" />
        {data.map((d, i) => {
          const cx = pad.left + slot * i + slot / 2;
          const top = Math.min(y(d.profit), zero);
          const h = Math.max(Math.abs(y(d.profit) - zero), d.logged ? 2 : 0);
          const last = i === data.length - 1;
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}>
              <rect x={cx - slot / 2} y={pad.top - 20} width={slot} height={H - pad.top} fill="transparent" />
              {d.logged ? (
                <rect x={cx - barW / 2} y={top} width={barW} height={h} rx={4}
                  className={`trend-bar ${d.profit < 0 ? 'trend-loss' : ''} ${last ? 'trend-today' : ''} ${hover === i ? 'trend-hover' : ''}`} />
              ) : (
                <text x={cx} y={zero - 8} textAnchor="middle" className="trend-none">—</text>
              )}
              {d.logged && (hover === i || data.length <= 7) && (
                <text x={cx} y={d.profit >= 0 ? top - 8 : top + h + 18} textAnchor="middle" className="trend-value">
                  {Math.abs(d.profit) >= 1000 ? `${d.profit < 0 ? '−' : ''}₹${(Math.abs(d.profit) / 1000).toFixed(1)}k` : money(d.profit)}
                </text>
              )}
              <text x={cx} y={H - 10} textAnchor="middle" className={`trend-day ${last ? 'trend-day-today' : ''}`}>
                {dayLabel(d.date, lang, { short: true })}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
