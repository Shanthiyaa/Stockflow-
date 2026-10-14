const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    method: {
      type: String,
      enum: ['demo_card', 'demo_upi', 'demo_netbanking', 'demo_cod'],
      required: true,
    },
    // NEVER store real card numbers, CVV, or actual payment credentials
    // This is a simulated gateway integration only
    status: {
      type: String,
      enum: ['initiated', 'processing', 'success', 'failed', 'refunded'],
      default: 'initiated',
    },
    transactionId: { type: String, unique: true },
    gatewayResponse: { type: Object }, // Simulated gateway response only
    refundAmount: { type: Number, min: 0 },
    refundedAt: { type: Date },
    refundReason: { type: String },
  },
  { timestamps: true }
);

// Generate transaction ID
paymentSchema.pre('save', function (next) {
  if (!this.transactionId) {
    this.transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
  next();
});

paymentSchema.index({ order: 1 });
paymentSchema.index({ customer: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
