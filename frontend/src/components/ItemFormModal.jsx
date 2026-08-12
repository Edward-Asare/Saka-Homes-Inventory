import { useEffect, useId, useState } from 'react';

const emptyForm = {
  name: '',
  sku: '',
  category: '',
  unit: 'pcs',
  quantity: '',
  unitPrice: '',
  minStock: '5',
  maxStock: '100',
  location: '',
  supplier: '',
};

export default function ItemFormModal({
  open,
  item,
  categories = [],
  suppliers = [],
  onClose,
  onSubmit,
}) {
  const titleId = useId();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({
        name: item.name || '',
        sku: item.sku || '',
        category: item.category || '',
        unit: item.unit || 'pcs',
        quantity: String(item.quantity ?? ''),
        unitPrice: String(item.unitPrice ?? ''),
        minStock: String(item.minStock ?? 5),
        maxStock: String(item.maxStock ?? 100),
        location: item.location || '',
        supplier: item.supplier?._id || item.supplier || '',
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [open, item]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category.trim(),
        unit: form.unit.trim() || 'pcs',
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        minStock: Number(form.minStock),
        maxStock: Number(form.maxStock),
        location: form.location.trim(),
        supplier: form.supplier || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close panel" className="absolute inset-0 bg-ink/20" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface"
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {item ? 'Edit material' : 'Add material'}
            </h2>
            <p className="mt-1 text-sm text-muted">SKU, stock thresholds, and unit cost (GHS).</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-2.5 py-1 text-sm text-muted hover:text-ink"
          >
            Esc
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-auto">
          <div className="flex flex-1 flex-col gap-4 px-6 py-5">
            {[
              { name: 'name', label: 'Material name', type: 'text' },
              { name: 'sku', label: 'SKU / item code', type: 'text' },
              { name: 'unit', label: 'Unit of measure', type: 'text', placeholder: 'bags, pcs, m, litres' },
              { name: 'quantity', label: 'Quantity', type: 'number', min: 0, step: '1' },
              { name: 'unitPrice', label: 'Unit cost (GHS)', type: 'number', min: 0, step: '0.01' },
              { name: 'minStock', label: 'Min stock', type: 'number', min: 0, step: '1' },
              { name: 'maxStock', label: 'Max stock', type: 'number', min: 0, step: '1' },
              { name: 'location', label: 'Warehouse location', type: 'text' },
            ].map((field) => (
              <label key={field.name} className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                  {field.label}
                </span>
                <input
                  name={field.name}
                  type={field.type}
                  min={field.min}
                  step={field.step}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={!['supplier'].includes(field.name)}
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:bg-surface"
                />
              </label>
            ))}

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Category
              </span>
              <input
                name="category"
                list="category-suggestions"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent focus:bg-surface"
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c._id || c} value={c.name || c} />
                ))}
              </datalist>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-muted">
                Supplier (optional)
              </span>
              <select
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent focus:bg-surface"
              >
                <option value="">No supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            {error ? (
              <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : item ? 'Save changes' : 'Add material'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
