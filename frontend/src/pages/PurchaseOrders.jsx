import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/stock';

const inputClass =
  'w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:bg-surface';

const STATUS_FLOW = ['draft', 'sent', 'approved', 'received'];

const emptyLine = () => ({ itemId: '', quantity: '', unitPrice: '' });

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    supplierId: '',
    notes: '',
    lines: [emptyLine()],
  });

  const loadMeta = useCallback(async () => {
    try {
      const [sups, mats] = await Promise.all([api.getSuppliers(), api.getItems()]);
      setSuppliers(sups);
      setItems(mats);
    } catch (err) {
      setError(err.message || 'Failed to load suppliers/items');
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getPurchaseOrders({ status: statusFilter });
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const formTotal = useMemo(
    () =>
      form.lines.reduce((sum, line) => {
        const qty = Number(line.quantity) || 0;
        const price = Number(line.unitPrice) || 0;
        return sum + qty * price;
      }, 0),
    [form.lines]
  );

  const updateLine = (index, field, value) => {
    setForm((prev) => {
      const lines = prev.lines.map((line, i) => {
        if (i !== index) return line;
        const next = { ...line, [field]: value };
        if (field === 'itemId') {
          const item = items.find((it) => it._id === value);
          if (item && (line.unitPrice === '' || line.unitPrice == null)) {
            next.unitPrice = String(item.unitPrice ?? '');
          }
        }
        return next;
      });
      return { ...prev, lines };
    });
  };

  const addLine = () => {
    setForm((prev) => ({ ...prev, lines: [...prev.lines, emptyLine()] }));
  };

  const removeLine = (index) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.length === 1 ? prev.lines : prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api.createPurchaseOrder({
        supplierId: form.supplierId,
        notes: form.notes,
        lines: form.lines.map((line) => ({
          itemId: line.itemId,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
        })),
      });
      setForm({ supplierId: '', notes: '', lines: [emptyLine()] });
      setNotice('Purchase order created as draft.');
      await loadOrders();
    } catch (err) {
      setError(err.message || 'Failed to create purchase order');
    } finally {
      setSaving(false);
    }
  };

  const nextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  };

  const advanceStatus = async (order) => {
    const next = nextStatus(order.status);
    if (!next) return;

    const confirmMsg =
      next === 'received'
        ? `Mark ${order.poNumber} as received? Inventory will update automatically.`
        : `Move ${order.poNumber} to “${next}”?`;
    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(order._id);
    setError('');
    setNotice('');
    try {
      await api.updatePurchaseOrderStatus(order._id, next);
      if (next === 'received') {
        setNotice(`${order.poNumber} received — inventory restocked automatically.`);
      }
      await loadOrders();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const statusTone = (status) => {
    if (status === 'received') return 'bg-emerald-50 text-success border-emerald-100';
    if (status === 'approved') return 'bg-accent-soft text-accent border-teal-100';
    if (status === 'sent') return 'bg-amber-50 text-warning border-amber-100';
    return 'bg-canvas text-muted border-border';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Purchase Orders
        </h1>
        <p className="mt-1 text-sm text-muted">
          Draft → sent → approved → received. Receiving a PO restocks inventory automatically.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="h-fit rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Create purchase order</h2>
          <p className="mt-1 text-xs text-muted">Add supplier and line items with unit prices in GHS.</p>

          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Supplier
              </span>
              <select
                value={form.supplierId}
                onChange={(e) => setForm((prev) => ({ ...prev, supplierId: e.target.value }))}
                className={inputClass}
                required
              >
                <option value="">Select supplier…</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
                  Lines
                </span>
                <button
                  type="button"
                  onClick={addLine}
                  className="text-xs font-medium text-accent hover:opacity-80"
                >
                  Add line
                </button>
              </div>

              {form.lines.map((line, index) => (
                <div
                  key={`line-${index}`}
                  className="space-y-2 rounded-lg border border-border bg-canvas/60 p-3"
                >
                  <select
                    value={line.itemId}
                    onChange={(e) => updateLine(index, 'itemId', e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Material…</option>
                    {items.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} ({item.sku})
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                      className={inputClass}
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Unit price (GHS)"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(index, 'unitPrice', e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                  {form.lines.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="text-xs font-medium text-danger hover:opacity-80"
                    >
                      Remove line
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Notes
              </span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className={inputClass}
              />
            </label>

            <p className="text-sm text-muted">
              Estimated total:{' '}
              <span className="font-semibold tabular-nums text-ink">{formatCurrency(formTotal)}</span>
            </p>

            {error ? (
              <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-success">
                {notice}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create draft PO'}
            </button>
          </form>
        </section>

        <section>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${inputClass} sm:w-48`}
            >
              <option value="all">All statuses</option>
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted">
              When a PO is marked received, stock quantities update automatically.
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {loading ? (
              <p className="rounded-xl border border-border bg-surface px-4 py-10 text-center text-sm text-muted">
                Loading purchase orders…
              </p>
            ) : orders.length === 0 ? (
              <p className="rounded-xl border border-border bg-surface px-4 py-10 text-center text-sm text-muted">
                No purchase orders for this filter.
              </p>
            ) : (
              orders.map((order) => {
                const next = nextStatus(order.status);
                const total =
                  order.totalValue ??
                  (order.lines || []).reduce(
                    (sum, line) => sum + line.quantity * line.unitPrice,
                    0
                  );
                return (
                  <article
                    key={order._id}
                    className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-ink/15"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-ink">{order.poNumber}</h3>
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${statusTone(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          {order.supplier?.name || '—'} · Ordered {formatDate(order.orderDate)}
                          {order.receivedAt ? ` · Received ${formatDate(order.receivedAt)}` : ''}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-semibold tabular-nums text-ink">
                          {formatCurrency(total)}
                        </p>
                        {next ? (
                          <button
                            type="button"
                            disabled={updatingId === order._id}
                            onClick={() => advanceStatus(order)}
                            className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink hover:border-ink/20 disabled:opacity-50"
                          >
                            {updatingId === order._id
                              ? 'Updating…'
                              : next === 'received'
                                ? 'Mark received'
                                : `Mark ${next}`}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
                          <tr>
                            <th className="pb-2 pr-3 font-medium">Item</th>
                            <th className="pb-2 pr-3 font-medium">Qty</th>
                            <th className="pb-2 pr-3 font-medium">Unit price</th>
                            <th className="pb-2 font-medium">Line total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(order.lines || []).map((line, idx) => (
                            <tr key={`${order._id}-${idx}`} className="border-t border-border">
                              <td className="py-2 pr-3">
                                <p className="font-medium text-ink">
                                  {line.item?.name || 'Item'}
                                </p>
                                <p className="font-mono text-xs text-muted">{line.item?.sku}</p>
                              </td>
                              <td className="py-2 pr-3 tabular-nums text-muted">{line.quantity}</td>
                              <td className="py-2 pr-3 tabular-nums text-muted">
                                {formatCurrency(line.unitPrice)}
                              </td>
                              <td className="py-2 tabular-nums text-ink">
                                {formatCurrency(line.quantity * line.unitPrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {order.notes ? (
                      <p className="mt-3 text-xs text-muted">Notes: {order.notes}</p>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
