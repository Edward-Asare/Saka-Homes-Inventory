export const LOW_STOCK = 5;
export const WARNING_STOCK = 15;

export function getStockStatus(item) {
  const qty = Number(item?.quantity) || 0;
  const min = item?.minStock ?? LOW_STOCK;
  const max = item?.maxStock;

  if (qty <= 0) return 'out';
  if (qty <= min) return 'low';
  if (max != null && qty > max) return 'over';
  return 'optimal';
}

export function stockLabel(status) {
  switch (status) {
    case 'out':
      return 'Out of stock';
    case 'low':
      return 'Low stock';
    case 'over':
      return 'Over max';
    default:
      return 'Optimal';
  }
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function stockGaugePercent(item) {
  const max = Number(item.maxStock) || Math.max(Number(item.minStock) || 5, Number(item.quantity) || 0, 1);
  return Math.min(100, Math.round(((Number(item.quantity) || 0) / max) * 100));
}
