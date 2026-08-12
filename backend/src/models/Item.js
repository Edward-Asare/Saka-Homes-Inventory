const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: [40, 'SKU cannot exceed 40 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [80, 'Category cannot exceed 80 characters'],
    },
    unit: {
      type: String,
      required: [true, 'Unit of measure is required'],
      trim: true,
      maxlength: [30, 'Unit cannot exceed 30 characters'],
      default: 'pcs',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
      default: 0,
    },
    minStock: {
      type: Number,
      min: [0, 'Min stock cannot be negative'],
      default: 5,
    },
    maxStock: {
      type: Number,
      min: [0, 'Max stock cannot be negative'],
      default: 100,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    lastRestocked: {
      type: Date,
      default: null,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

itemSchema.virtual('stockStatus').get(function stockStatus() {
  if (this.quantity <= 0) return 'out';
  if (this.quantity <= (this.minStock ?? 5)) return 'low';
  if (this.maxStock && this.quantity > this.maxStock) return 'over';
  return 'optimal';
});

itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

itemSchema.pre('save', function updateLastUpdated(next) {
  this.lastUpdated = new Date();
  next();
});

itemSchema.pre('findOneAndUpdate', function setLastUpdated(next) {
  this.set({ lastUpdated: new Date() });
  next();
});

module.exports = mongoose.model('Item', itemSchema);
