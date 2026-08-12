import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatDate, formatDateInput } from '../utils/stock';

const inputClass =
  'w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:bg-surface';

const emptyForm = {
  type: 'dispatch',
  itemId: '',
  quantity: '',
  siteName: '',
  contractor: '',
  notes: '',
  movementDate: formatDateInput(new Date()),
};

export default function Movements() {
  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [syncNote, setSyncNote] = useState('');

  const loadMovements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getMovements({
        type: typeFilter,
        from,
        to,
      });
      setMovements(data);
    } catch (err) {
      setError(err.message || 'Failed to load movements');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, from, to]);

  const loadItems = useCallback(async () => {
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (err) {
      setError(err.message || 'Failed to load items');
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSyncNote('');
    try {
      const result = await api.createMovement({
        type: form.type,
        itemId: form.itemId,
        quantity: Number(form.quantity),
        siteName: form.siteName,
        contractor: form.contractor,
        notes: form.notes,
        movementDate: form.movementDate || undefined,
      });

      const item = result.item;
      const movement = result.movement;
      setSyncNote(
        `Stock synced automatically: ${item?.name || movement?.item?.name || 'item'} is now ${
          item?.quantity ?? movement?.newQuantity
        } ${item?.unit || movement?.item?.unit || ''} on hand.`
      );
      setForm({
        ...emptyForm,
        type: form.type,
        movementDate: formatDateInput(new Date()),
      });
      await Promise.all([loadMovements(), loadItems()]);
    } catch (err) {
      setError(err.message || 'Failed to record movement');
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = (type) => {
    if (type === 'dispatch') return 'Dispatch';
    if (type === 'restock') return 'Restock';
    return 'Adjustment';
  };

  const typeTone = (type) => {
    if (type === 'dispatch') return 'bg-red-50 text-danger border-red-100';
    if (type === 'restock') return 'bg-emerald-50 text-success border-emerald-100';
    return 'bg-amber-50 text-warning border-amber-100';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Dispatches</h1>
        <p className="mt-1 text-sm text-muted">
          Record dispatches, restocks, and adjustments. Catalog quantities update automatically.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="h-fit rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Record movement</h2>
          <p className="mt-1 text-xs text-muted">
            For adjustments, enter the new absolute quantity on hand.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Type
              </span>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="dispatch">Dispatch</option>
                <option value="restock">Restock</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Material
              </span>
              <select
                name="itemId"
                value={form.itemId}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Select item…</option>
                {items.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} ({item.sku}) — {item.quantity} {item.unit}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                {form.type === 'adjustment' ? 'New quantity' : 'Quantity'}
              </span>
              <input
                name="quantity"
                type="number"
                min={form.type === 'adjustment' ? 0 : 1}
                step="1"
                value={form.quantity}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Site name
              </span>
              <input
                name="siteName"
                type="text"
                value={form.siteName}
                onChange={handleChange}
                placeholder="e.g. Airport City Block B"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Contractor
              </span>
              <input
                name="contractor"
                type="text"
                value={form.contractor}
                onChange={handleChange}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Date
              </span>
              <input
                name="movementDate"
                type="date"
                value={form.movementDate}
                onChange={handleChange}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Notes
              </span>
              <textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                className={inputClass}
              />
            </label>

            {error ? (
              <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}

            {syncNote ? (
              <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-success">
                {syncNote}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Record movement'}
            </button>
          </form>
        </section>

        <section>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`${inputClass} sm:w-44`}
            >
              <option value="all">All types</option>
              <option value="dispatch">Dispatch</option>
              <option value="restock">Restock</option>
              <option value="adjustment">Adjustment</option>
            </select>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={`${inputClass} sm:w-40`}
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={`${inputClass} sm:w-40`}
            />
            <p className="text-xs text-muted sm:ml-auto">
              {movements.length} movement{movements.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-canvas/80 text-xs font-medium uppercase tracking-[0.1em] text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Material</th>
                    <th className="px-4 py-3 font-medium">Qty Δ</th>
                    <th className="px-4 py-3 font-medium">Before → After</th>
                    <th className="px-4 py-3 font-medium">Site</th>
                    <th className="px-4 py-3 font-medium">Contractor</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-muted">
                        Loading movements…
                      </td>
                    </tr>
                  ) : movements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-muted">
                        No movements for these filters.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr
                        key={m._id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-canvas/70"
                      >
                        <td className="px-4 py-3 text-muted">{formatDate(m.movementDate)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${typeTone(
                              m.type
                            )}`}
                          >
                            {typeLabel(m.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">{m.item?.name || '—'}</p>
                          <p className="font-mono text-xs text-muted">{m.item?.sku}</p>
                        </td>
                        <td className="px-4 py-3 tabular-nums font-medium text-ink">
                          {m.quantity > 0 && m.type !== 'adjustment' ? '+' : ''}
                          {m.quantity}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted">
                          {m.previousQuantity} → {m.newQuantity}
                        </td>
                        <td className="px-4 py-3 text-muted">{m.siteName || '—'}</td>
                        <td className="px-4 py-3 text-muted">{m.contractor || '—'}</td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-muted">
                          {m.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
