const { getStockStatus } = require('../utils/stockStatus');

function buildDashboardStats(items) {
  const activeItems = items.filter((item) => item.active !== false);
  let totalInventoryValue = 0;
  let optimalStock = 0;
  let lowStockAlerts = 0;
  let outOfStock = 0;
  const categoryMap = {};

  activeItems.forEach((item) => {
    totalInventoryValue += item.quantity * item.unitPrice;
    const status = getStockStatus(item);
    if (status === 'out') outOfStock += 1;
    else if (status === 'low') lowStockAlerts += 1;
    else if (status === 'optimal' || status === 'over') optimalStock += 1;

    if (!categoryMap[item.category]) {
      categoryMap[item.category] = { category: item.category, count: 0, value: 0 };
    }
    categoryMap[item.category].count += 1;
    categoryMap[item.category].value += item.quantity * item.unitPrice;
  });

  const criticalAlerts = activeItems
    .filter((item) => {
      const status = getStockStatus(item);
      return status === 'out' || status === 'low';
    })
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 10)
    .map((item) => ({
      id: item._id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity,
      minStock: item.minStock,
      unit: item.unit,
      stockStatus: getStockStatus(item),
    }));

  return {
    totalItems: activeItems.length,
    activeSkus: activeItems.length,
    optimalStock,
    lowStockAlerts,
    outOfStock,
    totalInventoryValue,
    categories: Object.keys(categoryMap).sort(),
    categoryBreakdown: Object.values(categoryMap).sort((a, b) => b.value - a.value),
    stockHealth: [
      { name: 'Optimal', value: optimalStock, key: 'optimal' },
      { name: 'Low stock', value: lowStockAlerts, key: 'low' },
      { name: 'Out of stock', value: outOfStock, key: 'out' },
    ],
    criticalAlerts,
  };
}

module.exports = { buildDashboardStats };
