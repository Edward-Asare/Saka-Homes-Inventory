export const LOW_STOCK = 5;
export const WARNING_STOCK = 15;

export function getStockLevel(quantity) {
  if (quantity <= LOW_STOCK) return 'low';
  if (quantity <= WARNING_STOCK) return 'warning';
  return 'healthy';
}

export function stockLabel(level) {
  switch (level) {
    case 'low':
      return 'Low stock';
    case 'warning':
      return 'Warning';
    default:
      return 'Healthy';
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
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}
