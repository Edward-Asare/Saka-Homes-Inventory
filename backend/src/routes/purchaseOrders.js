const express = require('express');
const PurchaseOrder = require('../models/PurchaseOrder');
const Item = require('../models/Item');
const StockMovement = require('../models/StockMovement');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const nextPoNumber = async () => {
  const count = await PurchaseOrder.countDocuments();
  const stamp = Date.now().toString().slice(-6);
  return `PO-${stamp}-${String(count + 1).padStart(3, '0')}`;
};

router.get('/', async (req, res, next) => {
  try {
    const { status, from, to } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (from || to) {
      filter.orderDate = {};
      if (from) filter.orderDate.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.orderDate.$lte = end;
      }
    }

    const orders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name contactName email phone')
      .populate('lines.item', 'name sku unit')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('lines.item', 'name sku unit unitPrice')
      .populate('createdBy', 'name email');
    if (!order) return res.status(404).json({ message: 'Purchase order not found' });
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { supplierId, lines, notes, status, orderDate } = req.body;
    if (!supplierId) return res.status(400).json({ message: 'Supplier is required' });
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: 'At least one line item is required' });
    }

    const normalizedLines = lines.map((line) => ({
      item: line.itemId || line.item,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    }));

    if (normalizedLines.some((l) => !l.item || !(l.quantity > 0) || Number.isNaN(l.unitPrice))) {
      return res.status(400).json({ message: 'Invalid purchase order lines' });
    }

    const order = await PurchaseOrder.create({
      poNumber: await nextPoNumber(),
      supplier: supplierId,
      status: ['draft', 'sent', 'approved'].includes(status) ? status : 'draft',
      lines: normalizedLines,
      notes: notes?.trim() || '',
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      createdBy: req.user._id,
    });

    const populated = await order.populate([
      { path: 'supplier', select: 'name contactName email phone' },
      { path: 'lines.item', select: 'name sku unit' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Purchase order not found' });
    if (order.status === 'received') {
      return res.status(400).json({ message: 'Received purchase orders cannot be edited' });
    }

    if (req.body.supplierId) order.supplier = req.body.supplierId;
    if (req.body.notes !== undefined) order.notes = req.body.notes.trim();
    if (req.body.orderDate) order.orderDate = new Date(req.body.orderDate);
    if (Array.isArray(req.body.lines) && req.body.lines.length > 0) {
      order.lines = req.body.lines.map((line) => ({
        item: line.itemId || line.item,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
      }));
    }

    await order.save();
    const populated = await order.populate([
      { path: 'supplier', select: 'name contactName email phone' },
      { path: 'lines.item', select: 'name sku unit' },
    ]);
    res.json(populated);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['draft', 'sent', 'approved', 'received'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await PurchaseOrder.findById(req.params.id).populate('lines.item');
    if (!order) return res.status(404).json({ message: 'Purchase order not found' });

    if (order.status === 'received') {
      return res.status(400).json({ message: 'Purchase order already received' });
    }

    // Marking as received automatically restocks inventory
    if (status === 'received') {
      for (const line of order.lines) {
        const item = await Item.findById(line.item._id || line.item);
        if (!item) continue;
        const previousQuantity = item.quantity;
        const newQuantity = previousQuantity + line.quantity;
        item.quantity = newQuantity;
        item.lastRestocked = new Date();
        await item.save();

        await StockMovement.create({
          type: 'restock',
          item: item._id,
          quantity: line.quantity,
          previousQuantity,
          newQuantity,
          notes: `PO ${order.poNumber} received`,
          movementDate: new Date(),
          createdBy: req.user._id,
        });
      }
      order.receivedAt = new Date();
    }

    order.status = status;
    await order.save();

    const populated = await order.populate([
      { path: 'supplier', select: 'name contactName email phone' },
      { path: 'lines.item', select: 'name sku unit' },
    ]);

    res.json(populated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Purchase order not found' });
    if (order.status === 'received') {
      return res.status(400).json({ message: 'Cannot delete a received purchase order' });
    }
    await order.deleteOne();
    res.json({ message: 'Purchase order deleted', id: order._id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
