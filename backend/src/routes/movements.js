const express = require('express');
const Item = require('../models/Item');
const StockMovement = require('../models/StockMovement');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { type, from, to } = req.query;
    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (from || to) {
      filter.movementDate = {};
      if (from) filter.movementDate.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.movementDate.$lte = end;
      }
    }

    const movements = await StockMovement.find(filter)
      .populate('item', 'name sku category unit')
      .populate('createdBy', 'name email')
      .sort({ movementDate: -1 });

    res.json(movements);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { type, itemId, quantity, siteName, contractor, notes, movementDate } = req.body;

    if (!['dispatch', 'restock', 'adjustment'].includes(type)) {
      return res.status(400).json({ message: 'Invalid movement type' });
    }

    const qty = Number(quantity);
    if (!itemId || Number.isNaN(qty)) {
      return res.status(400).json({ message: 'Item and quantity are required' });
    }

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const previousQuantity = item.quantity;
    let newQuantity = previousQuantity;

    if (type === 'dispatch') {
      if (qty <= 0) return res.status(400).json({ message: 'Dispatch quantity must be positive' });
      if (qty > previousQuantity) {
        return res.status(400).json({ message: 'Insufficient stock for dispatch' });
      }
      newQuantity = previousQuantity - qty;
    } else if (type === 'restock') {
      if (qty <= 0) return res.status(400).json({ message: 'Restock quantity must be positive' });
      newQuantity = previousQuantity + qty;
      item.lastRestocked = movementDate ? new Date(movementDate) : new Date();
    } else if (type === 'adjustment') {
      // quantity is the new absolute stock level
      if (qty < 0) return res.status(400).json({ message: 'Adjusted quantity cannot be negative' });
      newQuantity = qty;
    }

    item.quantity = newQuantity;
    await item.save();

    const movement = await StockMovement.create({
      type,
      item: item._id,
      quantity: type === 'adjustment' ? newQuantity - previousQuantity : qty,
      previousQuantity,
      newQuantity,
      siteName: siteName?.trim() || '',
      contractor: contractor?.trim() || '',
      notes: notes?.trim() || '',
      movementDate: movementDate ? new Date(movementDate) : new Date(),
      createdBy: req.user._id,
    });

    const populated = await movement.populate([
      { path: 'item', select: 'name sku category unit quantity minStock maxStock' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.status(201).json({ movement: populated, item });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
