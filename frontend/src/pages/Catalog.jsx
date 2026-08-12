import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import ItemFormModal from '../components/ItemFormModal';
import StockBadge from '../components/StockBadge';
import { downloadCsv } from '../utils/export';
import {
  formatCurrency,
  formatDate,
  getStockStatus,
  stockGaugePercent,
} from '../utils/stock';

const inputClass =
  'rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:bg-surface';

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [range, setRange] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadMeta = useCallback(async () => {
    try {
      const [cats, sups] = await Promise.all([api.getCategories(), api.getSuppliers()]);
      setCategories(cats);
      setSuppliers(sups);
    } catch (err) {
      setError(err.message || 'Failed to load directories');
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        search,
        category,
        status,
        range,
        from: range === 'custom' ? from : undefined,
        to: range === 'custom' ? to : undefined,
      };
      const data = await api.getItems(params);
      setItems(data);
    } catch (err) {
      setError(err.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, [search, category, status, range, from, to]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadItems]);

  const openCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    if (editingItem) {
      await api.updateItem(editingItem._id, payload);
    } else {
      await api.createItem(payload);
    }
    await loadItems();
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete “${item.name}”? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(item._id);
    try {
      await api.deleteItem(item._id);
      await loadItems();
    } catch (err) {
      setError(err.message || 'Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    if (!items.length) return;
    const rows = items.map((item) => ({
      sku: item.sku,
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      minStock: item.minStock,
      maxStock: item.maxStock,
      unitCostGHS: item.unitPrice,
      valueGHS: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      stockStatus: getStockStatus(item),
      lastRestocked: item.lastRestocked ? formatDate(item.lastRestocked) : '',
      location: item.location || '',
    }));
    downloadCsv(`saka-catalog-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const gaugeTone = (item) => {
    const statusKey = getStockStatus(item);
    if (statusKey === 'out' || statusKey === 'low') return 'bg-danger';
    if (statusKey === 'over') return 'bg-warning';
    return 'bg-accent';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Catalog</h1>
          <p className="mt-1 text-sm text-muted">
            Materials, SKUs, and stock thresholds across the warehouse.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!items.length}
            className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/20 disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Add material
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU, or location…"
            className={`${inputClass} w-full flex-1`}
          />
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {['table', 'grid'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={[
                  'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  view === mode
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:text-ink',
                ].join(' ')}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="all">All stock statuses</option>
            <option value="optimal">Optimal</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
            <option value="over">Over max</option>
          </select>

          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className={inputClass}
          >
            <option value="all">Last restocked: all</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="custom">Custom range</option>
          </select>

          {range === 'custom' ? (
            <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={`${inputClass} w-full`}
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={`${inputClass} w-full`}
              />
            </div>
          ) : (
            <p className="flex items-center text-xs text-muted">
              {items.length} material{items.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {view === 'table' ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-canvas/80 text-xs font-medium uppercase tracking-[0.1em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Min / Max</th>
                  <th className="px-4 py-3 font-medium">Unit cost</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Last restocked</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-muted">
                      Loading catalog…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-muted">
                      No materials match your filters.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const value = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                    return (
                      <tr
                        key={item._id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-canvas/70"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-muted">{item.sku}</td>
                        <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                        <td className="px-4 py-3 text-muted">{item.category}</td>
                        <td className="px-4 py-3 text-muted">{item.unit}</td>
                        <td className="px-4 py-3 tabular-nums font-medium text-ink">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted">
                          {item.minStock} / {item.maxStock}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-ink">{formatCurrency(value)}</td>
                        <td className="px-4 py-3">
                          <StockBadge item={item} />
                        </td>
                        <td className="px-4 py-3 text-muted">{formatDate(item.lastRestocked)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted hover:border-ink/20 hover:text-ink"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === item._id}
                              onClick={() => handleDelete(item)}
                              className="rounded-md border border-red-100 px-2.5 py-1 text-xs font-medium text-danger hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingId === item._id ? '…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <p className="col-span-full py-10 text-center text-sm text-muted">Loading catalog…</p>
          ) : items.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-muted">
              No materials match your filters.
            </p>
          ) : (
            items.map((item) => {
              const pct = stockGaugePercent(item);
              const value = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
              return (
                <article
                  key={item._id}
                  className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-ink/15"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{item.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted">{item.sku}</p>
                    </div>
                    <StockBadge item={item} />
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    {item.category} · {item.unit}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-2xl font-semibold tabular-nums text-ink">{item.quantity}</p>
                      <p className="text-xs text-muted">
                        Min {item.minStock} · Max {item.maxStock}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums text-ink">
                        {formatCurrency(value)}
                      </p>
                      <p className="text-xs text-muted">{formatCurrency(item.unitPrice)} / unit</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.1em] text-muted">
                      <span>Stock gauge</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                      <div
                        className={`h-full rounded-full transition-all ${gaugeTone(item)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Last restocked {formatDate(item.lastRestocked)}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === item._id}
                      onClick={() => handleDelete(item)}
                      className="rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-danger hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === item._id ? '…' : 'Delete'}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      <ItemFormModal
        open={modalOpen}
        item={editingItem}
        categories={categories}
        suppliers={suppliers}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
      />
    </div>
  );
}
