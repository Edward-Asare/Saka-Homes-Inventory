import { getStockStatus, stockLabel } from '../utils/stock';

const styles = {
  out: 'bg-red-50 text-danger border-red-100',
  low: 'bg-red-50 text-danger border-red-100',
  over: 'bg-amber-50 text-warning border-amber-100',
  optimal: 'bg-emerald-50 text-success border-emerald-100',
};

const dots = {
  out: 'bg-danger',
  low: 'bg-danger',
  over: 'bg-warning',
  optimal: 'bg-success',
};

export default function StockBadge({ item, quantity }) {
  const status = item ? getStockStatus(item) : quantity <= 0 ? 'out' : quantity <= 5 ? 'low' : 'optimal';

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {stockLabel(status)}
    </span>
  );
}
