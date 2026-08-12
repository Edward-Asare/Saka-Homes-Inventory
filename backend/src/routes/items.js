const express = require('express');
const Item = require('../models/Item');
const { protect } = require('../middleware/auth');
const { validate, itemRules, itemUpdateRules } = require('../middleware/validate');

const router = express.Router();

// All item routes require authentication
router.use(protect);

// GET /api/items — list with optional search & category filter
router.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;
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

    const items = await Item.find(filter).sort({ updatedAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// GET /api/items/stats — dashboard summary
router.get('/stats', async (req, res, next) => {
  try {
    const items = await Item.find();
    const totalItems = items.length;
    const lowStockAlerts = items.filter((item) => item.quantity <= 5).length;
    const totalInventoryValue = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const categories = [...new Set(items.map((item) => item.category))].sort();

    res.json({
      totalItems,
      lowStockAlerts,
      totalInventoryValue,
      categories,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

// POST /api/items
router.post('/', itemRules, validate, async (req, res, next) => {
  try {
    const { name, sku, category, quantity, unitPrice, location } = req.body;

    const item = await Item.create({
      name,
      sku,
      category,
      quantity,
      unitPrice,
      location,
      createdBy: req.user._id,
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

// PUT /api/items/:id
router.put('/:id', itemUpdateRules, validate, async (req, res, next) => {
  try {
    const allowed = ['name', 'sku', 'category', 'quantity', 'unitPrice', 'location'];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const item = await Item.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/items/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted', id: item._id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
