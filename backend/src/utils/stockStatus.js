function getStockStatus(item) {
  const qty = Number(item.quantity) || 0;
  const min = item.minStock ?? 5;
  const max = item.maxStock;

  if (qty <= 0) return 'out';
  if (qty <= min) return 'low';
  if (max != null && qty > max) return 'over';
  return 'optimal';
}

module.exports = { getStockStatus };
