const express = require('express');
const Item = require('../models/Item');
const { protect } = require('../middleware/auth');
const { validate, itemRules, itemUpdateRules } = require('../middleware/validate');
const { buildDashboardStats } = require('../utils/stats');
const { getStockStatus } = require('../utils/stockStatus');

const router = express.Router();
router.use(protect);

const parseDateRange = (range, from, to) => {
  const now = new Date();
  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  if (range === 'today') {
    return { $gte: startOfDay(now), $lte: endOfDay(now) };
  }
  if (range === 'week') {
    const start = startOfDay(now);
    start.setDate(start.getDate() - start.getDay());
    return { $gte: start, $lte: endOfDay(now) };
  }
  if (range === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { $gte: start, $lte: endOfDay(now) };
  }
  if (range === 'custom' && (from || to)) {
    const filter = {};
    if (from) filter.$gte = startOfDay(from);
    if (to) filter.$lte = endOfDay(to);
    return filter;
  }
  return null;
};

router.get('/', async (req, res, next) => {
  try {
    const { search, category, range, from, to, status } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }

    if (search) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { sku: { $regex: term, $options: 'i' } },
        { location: { $regex: term, $options: 'i' } },
      ];
    }

    const restockRange = parseDateRange(range, from, to);
    if (restockRange) {
      filter.lastRestocked = restockRange;
    }

    let items = await Item.find(filter)
      .populate('supplier', 'name contactName')
      .sort({ updatedAt: -1 });

    if (status && status !== 'all') {
      items = items.filter((item) => getStockStatus(item) === status);
    }

    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const items = await Item.find();
    res.json(buildDashboardStats(items));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('supplier', 'name contactName email phone');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post('/', itemRules, validate, async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      unit,
      quantity,
      unitPrice,
      minStock,
      maxStock,
      location,
      supplier,
      lastRestocked,
      active,
    } = req.body;

    const item = await Item.create({
      name,
      sku,
      category,
      unit: unit || 'pcs',
      quantity,
      unitPrice,
      minStock: minStock ?? 5,
      maxStock: maxStock ?? 100,
      location,
      supplier: supplier || null,
      lastRestocked: lastRestocked || (Number(quantity) > 0 ? new Date() : null),
      active: active !== false,
      createdBy: req.user._id,
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', itemUpdateRules, validate, async (req, res, next) => {
  try {
    const allowed = [
      'name',
      'sku',
      'category',
      'unit',
      'quantity',
      'unitPrice',
      'minStock',
      'maxStock',
      'location',
      'supplier',
      'lastRestocked',
      'active',
    ];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const item = await Item.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('supplier', 'name contactName');

    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted', id: item._id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
