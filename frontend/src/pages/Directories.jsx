import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/stock';

const inputClass =
  'w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:bg-surface';

const emptyCategory = { name: '', description: '' };
const emptySupplier = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

export default function Directories() {
  const [tab, setTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [editingCategory, setEditingCategory] = useState(null);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [supplierDetail, setSupplierDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    const data = await api.getCategories();
    setCategories(data);
  }, []);

  const loadSuppliers = useCallback(async () => {
    const data = await api.getSuppliers();
    setSuppliers(data);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadCategories(), loadSuppliers()]);
    } catch (err) {
      setError(err.message || 'Failed to load directories');
    } finally {
      setLoading(false);
    }
  }, [loadCategories, loadSuppliers]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const loadSupplierDetail = async (id) => {
    setSelectedSupplierId(id);
    setError('');
    try {
      const data = await api.getSupplier(id);
      setSupplierDetail(data);
    } catch (err) {
      setError(err.message || 'Failed to load supplier history');
      setSupplierDetail(null);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategory);
    setEditingCategory(null);
  };

  const resetSupplierForm = () => {
    setSupplierForm(emptySupplier);
    setEditingSupplier(null);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory._id, categoryForm);
      } else {
        await api.createCategory(categoryForm);
      }
      resetCategoryForm();
      await loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier._id, supplierForm);
      } else {
        await api.createSupplier(supplierForm);
      }
      resetSupplierForm();
      await loadSuppliers();
      if (selectedSupplierId) {
        await loadSupplierDetail(selectedSupplierId);
      }
    } catch (err) {
      setError(err.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const startEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name || '', description: cat.description || '' });
  };

  const startEditSupplier = (sup) => {
    setEditingSupplier(sup);
    setSupplierForm({
      name: sup.name || '',
      contactName: sup.contactName || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
      notes: sup.notes || '',
    });
  };

  const deleteCategory = async (cat) => {
    if (!window.confirm(`Delete category “${cat.name}”?`)) return;
    setError('');
    try {
      await api.deleteCategory(cat._id);
      if (editingCategory?._id === cat._id) resetCategoryForm();
      await loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to delete category');
    }
  };

  const deleteSupplier = async (sup) => {
    if (!window.confirm(`Delete supplier “${sup.name}”?`)) return;
    setError('');
    try {
      await api.deleteSupplier(sup._id);
      if (editingSupplier?._id === sup._id) resetSupplierForm();
      if (selectedSupplierId === sup._id) {
        setSelectedSupplierId(null);
        setSupplierDetail(null);
      }
      await loadSuppliers();
    } catch (err) {
      setError(err.message || 'Failed to delete supplier');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Categories &amp; Suppliers
        </h1>
        <p className="mt-1 text-sm text-muted">
          Maintain material categories and vendor contacts for purchasing.
        </p>
      </div>

      <div className="mt-6 inline-flex rounded-lg border border-border bg-surface p-0.5">
        {[
          { id: 'categories', label: 'Categories' },
          { id: 'suppliers', label: 'Suppliers' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              tab === t.id ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {tab === 'categories' ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <section className="h-fit rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">
              {editingCategory ? 'Edit category' : 'Add category'}
            </h2>
            <p className="mt-1 text-xs text-muted">
              Seeded names may already exist (Cement &amp; Aggregates, Electrical, etc.).
            </p>
            <form onSubmit={handleCategorySubmit} className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                  Name
                </span>
                <input
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                  Description
                </span>
                <textarea
                  rows={3}
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className={inputClass}
                />
              </label>
              <div className="flex gap-2">
                {editingCategory ? (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editingCategory ? 'Save changes' : 'Add category'}
                </button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-canvas/80 text-xs font-medium uppercase tracking-[0.1em] text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-muted">
                        Loading categories…
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-muted">
                        No categories yet.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr
                        key={cat._id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-canvas/70"
                      >
                        <td className="px-4 py-3 font-medium text-ink">{cat.name}</td>
                        <td className="px-4 py-3 text-muted">{cat.description || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEditCategory(cat)}
                              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted hover:text-ink"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteCategory(cat)}
                              className="rounded-md border border-red-100 px-2.5 py-1 text-xs font-medium text-danger hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_minmax(0,1fr)]">
          <section className="h-fit rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">
              {editingSupplier ? 'Edit supplier' : 'Add supplier'}
            </h2>
            <form onSubmit={handleSupplierSubmit} className="mt-4 space-y-3">
              {[
                { key: 'name', label: 'Name', required: true },
                { key: 'contactName', label: 'Contact name' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'Phone' },
                { key: 'address', label: 'Address' },
              ].map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                    {field.label}
                  </span>
                  <input
                    type={field.type || 'text'}
                    value={supplierForm[field.key]}
                    onChange={(e) =>
                      setSupplierForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    required={field.required}
                    className={inputClass}
                  />
                </label>
              ))}
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                  Notes
                </span>
                <textarea
                  rows={3}
                  value={supplierForm.notes}
                  onChange={(e) =>
                    setSupplierForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className={inputClass}
                />
              </label>
              <div className="flex gap-2">
                {editingSupplier ? (
                  <button
                    type="button"
                    onClick={resetSupplierForm}
                    className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editingSupplier ? 'Save changes' : 'Add supplier'}
                </button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">Suppliers</h2>
            </div>
            <ul className="divide-y divide-border">
              {loading ? (
                <li className="px-4 py-10 text-center text-sm text-muted">Loading suppliers…</li>
              ) : suppliers.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-muted">No suppliers yet.</li>
              ) : (
                suppliers.map((sup) => (
                  <li
                    key={sup._id}
                    className={[
                      'flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-canvas/70',
                      selectedSupplierId === sup._id ? 'bg-accent-soft/40' : '',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      onClick={() => loadSupplierDetail(sup._id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="font-medium text-ink">{sup.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {sup.contactName || 'No contact'} · {sup.phone || 'No phone'}
                      </p>
                    </button>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEditSupplier(sup)}
                        className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted hover:text-ink"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSupplier(sup)}
                        className="rounded-md border border-red-100 px-2 py-1 text-xs font-medium text-danger hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">Order history</h2>
            {!selectedSupplierId ? (
              <p className="mt-4 text-sm text-muted">Select a supplier to view recent POs.</p>
            ) : !supplierDetail ? (
              <p className="mt-4 text-sm text-muted">Loading history…</p>
            ) : (
              <>
                <div className="mt-3 rounded-lg border border-border bg-canvas/60 p-3 text-sm">
                  <p className="font-medium text-ink">{supplierDetail.supplier.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {supplierDetail.supplier.email || 'No email'} ·{' '}
                    {supplierDetail.supplier.address || 'No address'}
                  </p>
                  {supplierDetail.supplier.notes ? (
                    <p className="mt-2 text-xs text-muted">{supplierDetail.supplier.notes}</p>
                  ) : null}
                </div>
                <ul className="mt-4 space-y-3">
                  {(supplierDetail.orders || []).length === 0 ? (
                    <li className="text-sm text-muted">No purchase orders yet.</li>
                  ) : (
                    (supplierDetail.orders || []).map((order) => (
                      <li
                        key={order._id}
                        className="rounded-lg border border-border px-3 py-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-ink">{order.poNumber}</p>
                          <span className="text-xs capitalize text-muted">{order.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {formatDate(order.orderDate)} ·{' '}
                          {formatCurrency(
                            order.totalValue ??
                              (order.lines || []).reduce(
                                (sum, line) => sum + line.quantity * line.unitPrice,
                                0
                              )
                          )}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {(order.lines || [])
                            .map((line) => `${line.item?.name || 'Item'} × ${line.quantity}`)
                            .join(', ')}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
