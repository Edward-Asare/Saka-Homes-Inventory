import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import { downloadCsv, printReport } from '../utils/export';
import { formatCurrency, formatDate } from '../utils/stock';

const inputClass =
  'rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:bg-surface';

export default function Reports() {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    }
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, catalog] = await Promise.all([
        api.getReportSummary({ category, from, to }),
        api.getItems({ category }),
      ]);
      setReport(summary);
      setItems(catalog);
    } catch (err) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [category, from, to]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const stats = report?.stats || {};
  const movements = report?.movements || [];
  const purchaseOrders = report?.purchaseOrders || [];

  const exportMovementsCsv = () => {
    if (!movements.length) return;
    const rows = movements.map((m) => ({
      date: formatDate(m.movementDate),
      type: m.type,
      sku: m.item?.sku || '',
      name: m.item?.name || '',
      category: m.item?.category || '',
      quantity: m.quantity,
      previousQuantity: m.previousQuantity,
      newQuantity: m.newQuantity,
      siteName: m.siteName || '',
      contractor: m.contractor || '',
      notes: m.notes || '',
    }));
    downloadCsv(`saka-movements-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const exportValuationCsv = () => {
    if (!items.length) return;
    const rows = items.map((item) => ({
      sku: item.sku,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      unitCostGHS: item.unitPrice,
      valueGHS: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      location: item.location || '',
    }));
    downloadCsv(`saka-valuation-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handlePrint = () => {
    const movementRows = movements
      .map(
        (m) => `<tr>
          <td>${formatDate(m.movementDate)}</td>
          <td>${m.type}</td>
          <td>${m.item?.name || '—'} (${m.item?.sku || ''})</td>
          <td>${m.quantity}</td>
          <td>${m.previousQuantity} → ${m.newQuantity}</td>
          <td>${m.siteName || '—'}</td>
        </tr>`
      )
      .join('');

    const poRows = purchaseOrders
      .map((po) => {
        const total =
          po.totalValue ??
          (po.lines || []).reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
        return `<tr>
          <td>${po.poNumber}</td>
          <td>${po.supplier?.name || '—'}</td>
          <td>${po.status}</td>
          <td>${formatDate(po.orderDate)}</td>
          <td>${formatCurrency(total)}</td>
        </tr>`;
      })
      .join('');

    const valuationRows = items
      .map((item) => {
        const value = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        return `<tr>
          <td>${item.sku}</td>
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unitPrice)}</td>
          <td>${formatCurrency(value)}</td>
        </tr>`;
      })
      .join('');

    const filters = [
      category !== 'all' ? `Category: ${category}` : 'All categories',
      from ? `From ${from}` : null,
      to ? `To ${to}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    printReport(
      'Saka Homes Inventory Report',
      `
      <p class="meta">${filters}</p>
      <div class="section">
        <h2>Valuation summary</h2>
        <table>
          <tbody>
            <tr><th>Store valuation</th><td>${formatCurrency(stats.totalInventoryValue)}</td></tr>
            <tr><th>Active SKUs</th><td>${stats.activeSkus ?? 0}</td></tr>
            <tr><th>Optimal stock</th><td>${stats.optimalStock ?? 0}</td></tr>
            <tr><th>Low-stock alerts</th><td>${stats.lowStockAlerts ?? 0}</td></tr>
            <tr><th>Out of stock</th><td>${stats.outOfStock ?? 0}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="section">
        <h2>Movements</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Type</th><th>Item</th><th>Qty</th><th>Before → After</th><th>Site</th></tr>
          </thead>
          <tbody>${movementRows || '<tr><td colspan="6">No movements</td></tr>'}</tbody>
        </table>
      </div>
      <div class="section">
        <h2>Purchase orders</h2>
        <table>
          <thead>
            <tr><th>PO</th><th>Supplier</th><th>Status</th><th>Date</th><th>Total</th></tr>
          </thead>
          <tbody>${poRows || '<tr><td colspan="5">No purchase orders</td></tr>'}</tbody>
        </table>
      </div>
      <div class="section">
        <h2>Items valuation</h2>
        <table>
          <thead>
            <tr><th>SKU</th><th>Name</th><th>Category</th><th>Qty</th><th>Unit cost</th><th>Value</th></tr>
          </thead>
          <tbody>${valuationRows || '<tr><td colspan="6">No items</td></tr>'}</tbody>
        </table>
      </div>`
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-muted">
            Valuation, movements, and purchase order summaries for export or print.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportMovementsCsv}
            disabled={!movements.length}
            className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:border-ink/20 disabled:opacity-50"
          >
            Export movements CSV
          </button>
          <button
            type="button"
            onClick={exportValuationCsv}
            disabled={!items.length}
            className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:border-ink/20 disabled:opacity-50"
          >
            Export valuation CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Print PDF
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className={inputClass}
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className={inputClass}
        />
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Store valuation"
          value={loading ? '…' : formatCurrency(stats.totalInventoryValue)}
        />
        <StatCard label="Active SKUs" value={loading ? '…' : stats.activeSkus ?? 0} />
        <StatCard label="Optimal stock" value={loading ? '…' : stats.optimalStock ?? 0} />
        <StatCard label="Low-stock alerts" value={loading ? '…' : stats.lowStockAlerts ?? 0} />
        <StatCard label="Out of stock" value={loading ? '…' : stats.outOfStock ?? 0} />
      </div>

      <section className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Movements</h2>
          <p className="mt-1 text-xs text-muted">
            {loading ? 'Loading…' : `${movements.length} records in range`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-canvas/80 text-xs font-medium uppercase tracking-[0.1em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Material</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Before → After</th>
                <th className="px-4 py-3 font-medium">Site</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    Loading movements…
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    No movements in this range.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr
                    key={m._id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-canvas/70"
                  >
                    <td className="px-4 py-3 text-muted">{formatDate(m.movementDate)}</td>
                    <td className="px-4 py-3 capitalize text-ink">{m.type}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{m.item?.name || '—'}</p>
                      <p className="font-mono text-xs text-muted">{m.item?.sku}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink">{m.quantity}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {m.previousQuantity} → {m.newQuantity}
                    </td>
                    <td className="px-4 py-3 text-muted">{m.siteName || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Purchase orders</h2>
          <p className="mt-1 text-xs text-muted">
            {loading ? 'Loading…' : `${purchaseOrders.length} orders in range`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-canvas/80 text-xs font-medium uppercase tracking-[0.1em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">PO</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Order date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Lines</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    Loading purchase orders…
                  </td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    No purchase orders in this range.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => {
                  const total =
                    po.totalValue ??
                    (po.lines || []).reduce(
                      (sum, line) => sum + line.quantity * line.unitPrice,
                      0
                    );
                  return (
                    <tr
                      key={po._id}
                      className="border-b border-border last:border-0 transition-colors hover:bg-canvas/70"
                    >
                      <td className="px-4 py-3 font-medium text-ink">{po.poNumber}</td>
                      <td className="px-4 py-3 text-muted">{po.supplier?.name || '—'}</td>
                      <td className="px-4 py-3 capitalize text-ink">{po.status}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(po.orderDate)}</td>
                      <td className="px-4 py-3 tabular-nums text-ink">{formatCurrency(total)}</td>
                      <td className="px-4 py-3 text-muted">
                        {(po.lines || []).length} line{(po.lines || []).length === 1 ? '' : 's'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
