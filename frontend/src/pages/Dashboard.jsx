import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import StockBadge from '../components/StockBadge';
import { formatCurrency } from '../utils/stock';

const PIE_COLORS = {
  optimal: '#16a34a',
  low: '#d97706',
  out: '#dc2626',
};

const emptyStats = {
  totalInventoryValue: 0,
  activeSkus: 0,
  optimalStock: 0,
  lowStockAlerts: 0,
  outOfStock: 0,
  categoryBreakdown: [],
  stockHealth: [],
  criticalAlerts: [],
};

export default function Dashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getStats();
        if (!cancelled) setStats({ ...emptyStats, ...data });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryData = (stats.categoryBreakdown || []).map((row) => ({
    name: row.category,
    value: Math.round(row.value * 100) / 100,
    count: row.count,
  }));

  const healthData = (stats.stockHealth || []).filter((row) => row.value > 0);
  const isEmpty = !loading && (stats.activeSkus || 0) === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Store valuation, stock health, and critical material alerts.
          </p>
        </div>
        <Link
          to="/catalog"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/20"
        >
          Open catalog
        </Link>
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
          hint="Qty × unit cost (GHS)"
        />
        <StatCard
          label="Active SKUs"
          value={loading ? '…' : stats.activeSkus}
          hint="Materials in catalog"
        />
        <StatCard
          label="Optimal stock"
          value={loading ? '…' : stats.optimalStock}
          hint="Within min–max range"
        />
        <StatCard
          label="Low-stock alerts"
          value={loading ? '…' : stats.lowStockAlerts}
          hint="At or below minimum"
        />
        <StatCard
          label="Out of stock"
          value={loading ? '…' : stats.outOfStock}
          hint="Zero quantity on hand"
        />
      </div>

      {isEmpty ? (
        <div className="mt-8 rounded-xl border border-border bg-surface px-6 py-12 text-center">
          <p className="font-display text-2xl text-ink">No materials yet</p>
          <p className="mt-2 text-sm text-muted">
            Add your first SKU in the catalog to populate valuation and charts.
          </p>
          <Link
            to="/catalog"
            className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Go to catalog to add items
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold text-ink">Category breakdown</h2>
              <p className="mt-1 text-xs text-muted">Inventory value by category (GHS)</p>
              <div className="mt-4 h-72">
                {loading ? (
                  <p className="flex h-full items-center justify-center text-sm text-muted">
                    Loading chart…
                  </p>
                ) : categoryData.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-muted">
                    No category data
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8eaef" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        interval={0}
                        angle={-28}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v)
                        }
                      />
                      <Tooltip
                        formatter={(value) => [formatCurrency(value), 'Value']}
                        contentStyle={{
                          border: '1px solid #e8eaef',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold text-ink">Stock Health Index</h2>
              <p className="mt-1 text-xs text-muted">Share of SKUs by stock status</p>
              <div className="mt-4 h-72">
                {loading ? (
                  <p className="flex h-full items-center justify-center text-sm text-muted">
                    Loading chart…
                  </p>
                ) : healthData.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-muted">
                    No health data
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={healthData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={2}
                      >
                        {healthData.map((entry) => (
                          <Cell
                            key={entry.key || entry.name}
                            fill={PIE_COLORS[entry.key] || '#0d9488'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} SKUs`, name]}
                        contentStyle={{
                          border: '1px solid #e8eaef',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {!loading && healthData.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
                  {healthData.map((row) => (
                    <li key={row.key || row.name} className="inline-flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: PIE_COLORS[row.key] || '#0d9488' }}
                      />
                      {row.name}: {row.value}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </div>

          <section className="mt-8 rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">Critical stock alerts</h2>
              <p className="mt-1 text-xs text-muted">
                Materials at or below minimum — restock before site delays.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-canvas/80 text-xs font-medium uppercase tracking-[0.1em] text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Material</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Qty</th>
                    <th className="px-5 py-3 font-medium">Min</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted">
                        Loading alerts…
                      </td>
                    </tr>
                  ) : (stats.criticalAlerts || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted">
                        No critical alerts — stock looks healthy.
                      </td>
                    </tr>
                  ) : (
                    (stats.criticalAlerts || []).map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-canvas/70"
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-ink">{item.name}</p>
                          <p className="mt-0.5 font-mono text-xs text-muted">{item.sku}</p>
                        </td>
                        <td className="px-5 py-3 text-muted">{item.category}</td>
                        <td className="px-5 py-3 tabular-nums font-medium text-ink">
                          {item.quantity} {item.unit || ''}
                        </td>
                        <td className="px-5 py-3 tabular-nums text-muted">{item.minStock}</td>
                        <td className="px-5 py-3">
                          <StockBadge item={item} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
