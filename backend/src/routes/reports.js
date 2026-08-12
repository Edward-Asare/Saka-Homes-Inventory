const express = require('express');
const Item = require('../models/Item');
const StockMovement = require('../models/StockMovement');
const PurchaseOrder = require('../models/PurchaseOrder');
const { protect } = require('../middleware/auth');
const { buildDashboardStats } = require('../utils/stats');

const router = express.Router();
router.use(protect);

router.get('/summary', async (req, res, next) => {
  try {
    const { from, to, category } = req.query;
    const itemFilter = { active: { $ne: false } };
    if (category && category !== 'all') {
      itemFilter.category = new RegExp(`^${category}$`, 'i');
    }

    const items = await Item.find(itemFilter);
    const stats = buildDashboardStats(items);

    const movementFilter = {};
    const poFilter = {};
    if (from || to) {
      movementFilter.movementDate = {};
      poFilter.orderDate = {};
      if (from) {
        movementFilter.movementDate.$gte = new Date(from);
        poFilter.orderDate.$gte = new Date(from);
      }
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        movementFilter.movementDate.$lte = end;
        poFilter.orderDate.$lte = end;
      }
    }

    const movements = await StockMovement.find(movementFilter)
      .populate('item', 'name sku category')
      .sort({ movementDate: -1 })
      .limit(500);

    const purchaseOrders = await PurchaseOrder.find(poFilter)
      .populate('supplier', 'name')
      .populate('lines.item', 'name sku')
      .sort({ orderDate: -1 })
      .limit(500);

    res.json({
      generatedAt: new Date(),
      stats,
      movements,
      purchaseOrders,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
