import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { money, qty as fmtQty, timeLabel } from '../lib/format.js';
import { itemLabel } from '../lib/i18n.js';

export function Money({ value, className = '', sign = false }) {
  const tone = value > 0 ? 'gain' : value < 0 ? 'loss' : '';
  return <span className={`money ${sign ? tone : ''} ${className}`}>{money(value, { sign })}</span>;
}

export function Delta({ value, label }) {
  if (value === null || value === undefined) return null;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`delta ${up ? 'gain' : 'loss'}`}>
      <Icon size={16} aria-hidden /> {money(Math.abs(value))} <span className="delta-label">{label}</span>
    </span>
  );
}

export function EntryRow({ entry, lang, catalog, onClick, t, showTime = true }) {
  const isSale = entry.type === 'sale';
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`entry-row${onClick ? ' entry-row-btn' : ''}`} onClick={onClick}>
      <span className={`entry-dot ${isSale ? 'dot-sale' : 'dot-expense'}`} aria-hidden />
      <span className="entry-main">
        <span className="entry-item">{itemLabel(entry, lang, catalog)}</span>
        <span className="entry-meta">
          {isSale ? t('sale') : t('expense')}
          {entry.qty ? ` · ${fmtQty(entry.qty, entry.unit)}` : ''}
          {showTime && entry.createdAt ? ` · ${timeLabel(entry.createdAt)}` : ''}
          {entry.edited ? ` · ${t('edited')}` : ''}
        </span>
      </span>
      <span className={`entry-amount ${isSale ? 'gain' : ''}`}>{isSale ? '+' : '−'}{money(entry.amount).replace('−', '')}</span>
    </Tag>
  );
}

export function Card({ title, action, children, className = '', tone }) {
  return (
    <section className={`card ${tone ? `card-${tone}` : ''} ${className}`}>
      {(title || action) && (
        <header className="card-head">
          {title && <h2 className="card-title">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Loading({ t }) {
  return <div className="loading" role="status"><span className="spinner" /> {t('loading')}</div>;
}

export function ErrorState({ t, onRetry, message }) {
  return (
    <div className="error-state" role="alert">
      <p>{message && message !== 'offline' ? message : t('error_generic')}</p>
      {onRetry && <button type="button" className="btn btn-ghost" onClick={onRetry}>{t('retry')}</button>}
    </div>
  );
}
