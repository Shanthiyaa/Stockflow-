const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'order_placed',
        'order_packed',
        'order_shipped',
        'order_delivered',
        'order_cancelled',
        'payment_success',
        'payment_failed',
        'low_stock',
        'general',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    link: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
