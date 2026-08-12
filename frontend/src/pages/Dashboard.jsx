import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import ItemFormModal from '../components/ItemFormModal';
import StatCard from '../components/StatCard';
import StockBadge from '../components/StockBadge';
import { formatCurrency, formatDate, getStockLevel } from '../utils/stock';

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockAlerts: 0,
    totalInventoryValue: 0,
    categories: [],
  });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [itemsData, statsData] = await Promise.all([
        api.getItems({ search, category }),
        api.getStats(),
      ]);
      setItems(itemsData);
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadData]);

  const categories = useMemo(() => {
    const fromStats = stats.categories || [];
    const fromItems = items.map((i) => i.category);
    return [...new Set([...fromStats, ...fromItems])].sort();
  }, [stats.categories, items]);

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
    await loadData();
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete “${item.name}”? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(item._id);
    try {
      await api.deleteItem(item._id);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  const rowTone = (quantity) => {
    const level = getStockLevel(quantity);
    if (level === 'low') return 'bg-red-50/40';
    if (level === 'warning') return 'bg-amber-50/30';
    return '';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Track stock levels, value, and materials across sites.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Add item
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total items" value={stats.totalItems} hint="SKUs in catalog" />
        <StatCard
          label="Low stock alerts"
          value={stats.lowStockAlerts}
          hint="Quantity ≤ 5"
        />
        <StatCard
          label="Total inventory value"
          value={formatCurrency(stats.totalInventoryValue)}
          hint="Qty × unit price"
        />
      </div>

      <section className="mt-8">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, SKU, or location…"
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:bg-surface"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:bg-surface sm:w-48"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-canvas/80 text-xs font-medium uppercase tracking-[0.1em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Unit price</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted">
                      Loading inventory…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted">
                      No items match your filters.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item._id}
                      className={`border-b border-border last:border-0 transition-colors duration-150 hover:bg-canvas/70 ${rowTone(item.quantity)}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{item.name}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted">{item.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">{item.category}</td>
                      <td className="px-4 py-3 font-medium tabular-nums text-ink">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge quantity={item.quantity} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-muted">{item.location}</td>
                      <td className="px-4 py-3 text-muted">
                        {formatDate(item.lastUpdated || item.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-ink/20 hover:text-ink"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === item._id}
                            onClick={() => handleDelete(item)}
                            className="rounded-md border border-red-100 px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === item._id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ItemFormModal
        open={modalOpen}
        item={editingItem}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
      />
    </div>
  );
}
