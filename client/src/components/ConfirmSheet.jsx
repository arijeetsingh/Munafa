import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../lib/store.jsx';
import { money } from '../lib/format.js';

const UNITS = ['kg', 'g', 'L', 'ml', 'pc', 'dozen', 'packet', 'plate', 'cup', 'glass', 'bundle', 'crate', 'sack', 'cylinder'];

// Build the item picker from the catalog and the vendor's menu.
function useItemOptions() {
  const { catalog, menu, lang } = useApp();
  return useMemo(() => {
    const name = (x) => (lang === 'en' ? x.name : `${x.hi} · ${x.name}`);
    const menuOpts = menu.map((m) => ({ value: `menu:${m._id}`, label: m.name, type: 'sale', category: 'menu', itemKey: m.templateKey || m.name, item: m.name, menuItemId: m._id, price: m.price }));
    const ingOpts = (catalog?.ingredients || []).map((i) => ({ value: `ing:${i.key}`, label: name(i), type: 'expense', category: 'ingredient', itemKey: i.key, item: i.name, unit: i.unit }));
    const ohOpts = (catalog?.overheads || []).map((o) => ({ value: `oh:${o.key}`, label: name(o), type: 'expense', category: 'overhead', itemKey: o.key, item: o.name }));
    const all = [...menuOpts, ...ingOpts, ...ohOpts, { value: 'sales:total', label: 'Total sales', type: 'sale', category: 'sales', itemKey: 'total_sales', item: 'Total sales' }];
    return { menuOpts, ingOpts, ohOpts, all };
  }, [catalog, menu, lang]);
}

function optionValue(d) {
  if (d.category === 'menu' && d.menuItemId) return `menu:${d.menuItemId}`;
  if (d.category === 'ingredient') return `ing:${d.itemKey}`;
  if (d.category === 'overhead') return `oh:${d.itemKey}`;
  if (d.itemKey === 'total_sales') return 'sales:total';
  return 'other';
}

function DraftCard({ draft, index, onChange, onRemove, options, t, autoFocus }) {
  const low = new Set(draft.lowConfidence || []);
  const flag = (f) => (low.has(f) && !draft.touched?.[f] ? ' needs-check' : '');
  const set = (patch, field) => onChange({ ...draft, ...patch, touched: { ...draft.touched, [field]: true } });
  const amountRef = useRef(null);
  useEffect(() => { if (autoFocus) amountRef.current?.focus(); }, [autoFocus]);

  const pickItem = (value) => {
    if (value === 'other') return set({ category: 'other', itemKey: 'other', item: draft.itemKey === 'other' ? draft.item : '' }, 'item');
    const o = options.all.find((x) => x.value === value);
    if (!o) return;
    const patch = { category: o.category, itemKey: o.itemKey, item: o.item, menuItemId: o.menuItemId, type: o.type };
    if (o.unit && !draft.unit) patch.unit = o.unit;
    if (o.category === 'menu' && !draft.unit) patch.unit = 'plate';
    set(patch, 'item');
  };

  return (
    <article className={`draft draft-${draft.type}`} aria-label={`${index + 1}`}>
      <div className="draft-top">
        <div className="segmented" role="radiogroup" aria-label={t('expense')}>
          {['expense', 'sale'].map((type) => (
            <button key={type} type="button" role="radio" aria-checked={draft.type === type}
              className={`seg${draft.type === type ? ' seg-on' : ''}${flag('type')}`} onClick={() => set({ type }, 'type')}>
              {t(type)}
            </button>
          ))}
        </div>
        <button type="button" className="icon-btn" aria-label={t('remove')} onClick={onRemove}><Trash2 size={18} /></button>
      </div>

      <label className={`field${flag('item')}`}>
        <span className="field-label">{t('item')} {low.has('item') && !draft.touched?.item && <em className="check-tag">{t('check')}</em>}</span>
        <select value={optionValue(draft)} onChange={(e) => pickItem(e.target.value)}>
          {draft.type === 'sale' ? (
            <>
              <optgroup label={t('menu')}>{options.menuOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>
              <option value="sales:total">{t('sales')} (total)</option>
            </>
          ) : (
            <>
              <optgroup label={t('ingredient')}>{options.ingOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>
              <optgroup label={t('expenses')}>{options.ohOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>
            </>
          )}
          <option value="other">{t('other')}…</option>
        </select>
      </label>
      {draft.itemKey === 'other' && (
        <label className="field">
          <span className="field-label sr-only">{t('item')}</span>
          <input value={draft.item} maxLength={80} placeholder={t('item')} onChange={(e) => set({ item: e.target.value }, 'item')} />
        </label>
      )}

      <div className="field-row">
        <label className={`field${flag('qty')}`}>
          <span className="field-label">{t('quantity')} {low.has('qty') && !draft.touched?.qty && <em className="check-tag">{t('check')}</em>}</span>
          <input type="number" inputMode="decimal" min="0" step="any" value={draft.qty ?? ''} onChange={(e) => set({ qty: e.target.value === '' ? null : Number(e.target.value) }, 'qty')} />
        </label>
        <label className={`field${flag('unit')}`}>
          <span className="field-label">{t('unit')}</span>
          <select value={draft.unit || ''} onChange={(e) => set({ unit: e.target.value || null }, 'unit')}>
            <option value="">—</option>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label className={`field field-amount${flag('amount')}`}>
          <span className="field-label">{t('amount')} {low.has('amount') && !draft.touched?.amount && <em className="check-tag">{t('check')}</em>}</span>
          <input ref={amountRef} type="number" inputMode="numeric" min="1" step="any" required value={draft.amount ?? ''} onChange={(e) => set({ amount: e.target.value === '' ? null : Number(e.target.value) }, 'amount')} />
        </label>
      </div>
    </article>
  );
}

export default function ConfirmSheet({ initial, raw, parser, onCancel, onSave, saving, mode = 'confirm', onDelete }) {
  const { t } = useApp();
  const options = useItemOptions();
  const [drafts, setDrafts] = useState(() => initial.map((e, i) => ({ ...e, _k: i, original: JSON.stringify([e.type, e.itemKey, e.qty, e.unit, e.amount]) })));
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sheetRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    sheetRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const update = (i, d) => setDrafts((list) => list.map((x, j) => (j === i ? d : x)));
  const remove = (i) => setDrafts((list) => list.filter((_, j) => j !== i));
  const addBlank = () => setDrafts((list) => [...list, { _k: Date.now(), type: 'expense', category: 'other', itemKey: 'other', item: '', qty: null, unit: null, amount: null, lowConfidence: [], manual: true }]);

  const total = drafts.reduce((s, d) => s + (d.type === 'sale' ? 1 : -1) * (d.amount || 0), 0);

  const submit = (e) => {
    e.preventDefault();
    if (drafts.some((d) => !d.amount || d.amount <= 0)) return setError(t('amount_required'));
    if (drafts.some((d) => !d.item?.trim())) return setError(t('item'));
    setError(null);
    onSave(drafts.map((d) => {
      const edited = !d.manual && JSON.stringify([d.type, d.itemKey, d.qty, d.unit, d.amount]) !== d.original;
      return {
        type: d.type, category: d.category, itemKey: d.itemKey, item: d.item.trim(), menuItemId: d.menuItemId || null,
        qty: d.qty || null, unit: d.qty ? d.unit : null, amount: d.amount,
        source: d.manual ? 'manual' : d.source, parser: d.manual ? 'none' : parser, rawText: raw?.slice(0, 500),
        confidence: d.confidence, edited,
      };
    }));
  };

  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="sheet" role="dialog" aria-modal="true" aria-labelledby="confirm-title" ref={sheetRef} tabIndex={-1} onSubmit={submit}>
        <header className="sheet-head">
          <div>
            <h2 id="confirm-title">{mode === 'edit' ? t('edit') : t('confirm_title')}</h2>
            {mode === 'confirm' && <p className="muted">{t('confirm_sub')}</p>}
          </div>
          <button type="button" className="icon-btn" aria-label={t('cancel')} onClick={onCancel}><X size={20} /></button>
        </header>

        {raw && (
          <div className="said">
            <span className="said-label">{t('you_said')}</span>
            <q>{raw}</q>
            <span className="said-parser">{parser === 'llm' ? t('parsed_by_ai') : t('parsed_by_rules')}</span>
          </div>
        )}

        <div className="drafts">
          {drafts.map((d, i) => (
            <DraftCard key={d._k} draft={d} index={i} options={options} t={t} autoFocus={d.manual}
              onChange={(nd) => update(i, nd)} onRemove={mode === 'edit' ? () => setConfirmDelete(true) : () => remove(i)} />
          ))}
          {mode === 'confirm' && <button type="button" className="btn btn-ghost btn-add" onClick={addBlank}><Plus size={18} aria-hidden /> {t('add_line')}</button>}
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        {confirmDelete ? (
          <footer className="sheet-foot sheet-foot-danger" role="alert">
            <span className="sheet-total">{t('delete_confirm')}</span>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>{t('cancel')}</button>
            <button type="button" className="btn btn-danger" onClick={onDelete}>{t('delete')}</button>
          </footer>
        ) : (
        <footer className="sheet-foot">
          <span className="sheet-total">{mode === 'confirm' ? money(total, { sign: true }) : ''}</span>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>{t('cancel')}</button>
          <button type="submit" className="btn btn-ink" disabled={saving || drafts.length === 0}>
            {drafts.length > 1 ? t('save_all') : t('save')}
          </button>
        </footer>
        )}
      </form>
    </div>
  );
}
