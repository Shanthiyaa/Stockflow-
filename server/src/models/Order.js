const mongoose = require('mongoose');

// Snapshot of line item at order time for historical accuracy
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  // Snapshots stored at order time
  productName: { type: String, required: true },
  productSKU: { type: String, required: true },
  productImage: { type: String },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true, min: 0 },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  phone: { type: String, required: true },
});

const ORDER_STATUSES = ['placed', 'packed', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shippingAddress: { type: shippingAddressSchema, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed' },
    statusHistory: [statusHistorySchema],
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    paymentMethod: { type: String, default: 'demo' },
    paymentTransactionId: { type: String },
    itemsTotal: { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    notes: { type: String },
    cancelReason: { type: String },
    estimatedDelivery: { type: Date },
  },
  { timestamps: true }
);

// Auto generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `SF${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Allowed status transitions
const validTransitions = {
  placed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

orderSchema.methods.canTransitionTo = function (newStatus) {
  return validTransitions[this.status]?.includes(newStatus) ?? false;
};

orderSchema.methods.canBeCancelledByCustomer = function () {
  return ['placed', 'packed'].includes(this.status);
};

orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
