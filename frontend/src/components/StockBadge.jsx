import { getStockLevel, stockLabel } from '../utils/stock';

const styles = {
  low: 'bg-red-50 text-danger border-red-100',
  warning: 'bg-amber-50 text-warning border-amber-100',
  healthy: 'bg-emerald-50 text-success border-emerald-100',
};

export default function StockBadge({ quantity }) {
  const level = getStockLevel(quantity);

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles[level]}`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          level === 'low' ? 'bg-danger' : level === 'warning' ? 'bg-warning' : 'bg-success'
        }`}
      />
      {stockLabel(level)}
    </span>
  );
}
