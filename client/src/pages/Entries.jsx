import { useMemo, useState } from 'react';
import { useApp, useFetch } from '../lib/store.jsx';
import { api } from '../lib/api.js';
import { dayLabel, money } from '../lib/format.js';
import { Card, EntryRow, ErrorState, Loading } from '../components/ui.jsx';
import ConfirmSheet from '../components/ConfirmSheet.jsx';

const RANGES = [7, 14, 30];

export default function Entries() {
  const { t, lang, catalog, toast, bump } = useApp();
  const [days, setDays] = useState(7);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const { data, error, loading, reload } = useFetch(`/entries?days=${days}&limit=500`);

  const groups = useMemo(() => {
    const out = [];
    for (const e of data?.entries || []) {
      if (filter !== 'all' && e.type !== filter) continue;
      let g = out[out.length - 1];
      if (!g || g.date !== e.date) {
        g = { date: e.date, entries: [], profit: 0 };
        out.push(g);
      }
      g.entries.push(e);
      g.profit += e.type === 'sale' ? e.amount : -e.amount;
    }
    return out;
  }, [data, filter]);

  const saveEdit = async ([d]) => {
    setSaving(true);
    try {
      await api(`/entries/${editing._id}`, { method: 'PATCH', body: { type: d.type, category: d.category, itemKey: d.itemKey, item: d.item, qty: d.qty, unit: d.unit, amount: d.amount } });
      toast(t('updated'));
      setEditing(null);
      bump();
    } catch (err) {
      toast(err.message, 'warn');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await api(`/entries/${editing._id}`, { method: 'DELETE' });
    toast(t('deleted'));
    setEditing(null);
    bump();
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{t('last_days', { n: days })}</p>
          <h1>{t('khata_title')}</h1>
        </div>
      </header>

      <div className="toolbar">
        <div className="segmented" role="radiogroup" aria-label="Range">
          {RANGES.map((n) => (
            <button key={n} type="button" role="radio" aria-checked={days === n} className={`seg${days === n ? ' seg-on' : ''}`} onClick={() => setDays(n)}>{n}d</button>
          ))}
        </div>
        <div className="segmented" role="radiogroup" aria-label="Type">
          {['all', 'expense', 'sale'].map((f) => (
            <button key={f} type="button" role="radio" aria-checked={filter === f} className={`seg${filter === f ? ' seg-on' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? t('all') : t(f)}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorState t={t} onRetry={reload} message={error.message} />}
      {loading && !data && <Loading t={t} />}
      {data && groups.length === 0 && <p className="empty">{t('no_entries')}</p>}

      <div className="day-groups">
        {groups.map((g) => (
          <Card key={g.date} title={dayLabel(g.date, lang)} action={filter === 'all' ? <span className={`money ${g.profit < 0 ? 'loss' : 'gain'}`}>{money(g.profit, { sign: true })}</span> : null}>
            <div className="entry-list">
              {g.entries.map((e) => <EntryRow key={e._id} entry={e} lang={lang} catalog={catalog} t={t} onClick={() => setEditing(e)} />)}
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <ConfirmSheet
          mode="edit"
          initial={[{ ...editing, menuItemId: editing.menuItem, lowConfidence: [] }]}
          parser="none"
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={saveEdit}
          onDelete={remove}
        />
      )}
    </div>
  );
}
