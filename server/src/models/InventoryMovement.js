const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: {
      type: String,
      enum: ['purchase', 'sale', 'adjustment_add', 'adjustment_remove', 'return', 'damage'],
      required: true,
    },
    quantity: { type: Number, required: true }, // positive = added, negative = removed
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    reason: { type: String, trim: true },
    reference: { type: String }, // e.g., order number
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ product: 1 });
inventoryMovementSchema.index({ type: 1 });
inventoryMovementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
