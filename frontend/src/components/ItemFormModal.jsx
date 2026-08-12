import { useEffect, useId, useState } from 'react';

const emptyForm = {
  name: '',
  sku: '',
  category: '',
  quantity: '',
  unitPrice: '',
  location: '',
};

export default function ItemFormModal({ open, item, categories = [], onClose, onSubmit }) {
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
        quantity: String(item.quantity ?? ''),
        unitPrice: String(item.unitPrice ?? ''),
        location: item.location || '',
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
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        location: form.location.trim(),
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
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-ink/20 transition-opacity"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-none animate-[slideIn_200ms_ease-out]"
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {item ? 'Edit item' : 'Add item'}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {item ? 'Update inventory details.' : 'Create a new inventory record.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-2.5 py-1 text-sm text-muted transition-colors hover:text-ink"
          >
            Esc
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-auto">
          <div className="flex flex-1 flex-col gap-4 px-6 py-5">
            {[
              { name: 'name', label: 'Name', type: 'text', placeholder: 'Ceramic Floor Tile' },
              { name: 'sku', label: 'SKU', type: 'text', placeholder: 'TILE-6060-WHT' },
              {
                name: 'category',
                label: 'Category',
                type: 'text',
                placeholder: 'Flooring',
                list: 'category-suggestions',
              },
              { name: 'quantity', label: 'Quantity', type: 'number', min: 0, step: '1' },
              { name: 'unitPrice', label: 'Unit price (GHS)', type: 'number', min: 0, step: '0.01' },
              { name: 'location', label: 'Location', type: 'text', placeholder: 'Warehouse A' },
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
                  list={field.list}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:bg-surface"
                />
              </label>
            ))}

            <datalist id="category-suggestions">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

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
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : item ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </aside>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(12px); opacity: 0.6; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
