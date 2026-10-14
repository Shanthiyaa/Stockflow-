const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const InventoryMovement = require('../models/InventoryMovement');
const Notification = require('../models/Notification');

const SHIPPING_CHARGE = 50; // INR
const FREE_SHIPPING_THRESHOLD = 500; // INR

// @desc   Create order (after successful payment)
// @route  POST /api/orders
// @access Protected
const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, paymentTransactionId, notes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
  }

  // Re-validate stock and prices from DB (prevents price manipulation and overselling)
  const orderItems = [];
  let itemsTotal = 0;

  for (const item of items) {
    // Atomic stock check and decrement
    const product = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity }, isActive: true },
      { $inc: { stock: -item.quantity, totalSold: item.quantity } },
      { new: true }
    );

    if (!product) {
      // Rollback already decremented items
      for (const rolledItem of orderItems) {
        await Product.findByIdAndUpdate(rolledItem.product, {
          $inc: { stock: rolledItem.quantity, totalSold: -rolledItem.quantity },
        });
      }
      const failedProduct = await Product.findById(item.product);
      return res.status(409).json({
        success: false,
        message: `"${failedProduct?.name || 'A product'}" is out of stock or unavailable. Your cart has been updated.`,
      });
    }

    const unitPrice = product.price; // Always use DB price
    const totalPrice = unitPrice * item.quantity;
    itemsTotal += totalPrice;

    orderItems.push({
      product: product._id,
      productName: product.name,
      productSKU: product.sku,
      productImage: product.images?.[0] || null,
      unitPrice,
      quantity: item.quantity,
      totalPrice,
    });

    // Record inventory movement
    await InventoryMovement.create({
      product: product._id,
      type: 'sale',
      quantity: -item.quantity,
      stockBefore: product.stock + item.quantity,
      stockAfter: product.stock,
      reason: 'Customer order',
      performedBy: req.user._id,
    });
  }

  const shippingCharge = itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const totalAmount = itemsTotal + shippingCharge;

  const order = await Order.create({
    customer: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'demo',
    paymentTransactionId,
    itemsTotal,
    shippingCharge,
    totalAmount,
    paymentStatus: paymentTransactionId ? 'paid' : 'pending',
    status: 'placed',
    statusHistory: [{ status: 'placed', timestamp: new Date(), note: 'Order placed successfully.' }],
    notes,
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Create notification
  await Notification.create({
    user: req.user._id,
    type: 'order_placed',
    title: 'Order Placed Successfully!',
    message: `Your order #${order.orderNumber} for ₹${totalAmount.toFixed(2)} has been placed.`,
    relatedOrder: order._id,
    link: `/orders/${order._id}`,
  });

  await order.populate('customer', 'name email');

  res.status(201).json({
    success: true,
    message: 'Order placed successfully.',
    data: { order },
  });
};

// @desc   Get my orders
// @route  GET /api/orders/my
// @access Protected
const getMyOrders = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { customer: req.user._id };
  if (status) query.status = status;

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('items.product', 'name images');

  res.json({
    success: true,
    data: { orders, total, page: Number(page), pages: Math.ceil(total / limit) },
  });
};

// @desc   Get single order (customer)
// @route  GET /api/orders/:id
// @access Protected
const getOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id }).populate(
    'customer',
    'name email'
  );

  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  res.json({ success: true, data: { order } });
};

// @desc   Cancel order (customer)
// @route  PUT /api/orders/:id/cancel
// @access Protected
const cancelOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  if (!order.canBeCancelledByCustomer()) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel an order in "${order.status}" status. Contact support.`,
    });
  }

  // Restore stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      const stockBefore = product.stock;
      product.stock += item.quantity;
      product.totalSold = Math.max(0, product.totalSold - item.quantity);
      await product.save();

      await InventoryMovement.create({
        product: product._id,
        type: 'return',
        quantity: item.quantity,
        stockBefore,
        stockAfter: product.stock,
        reason: `Order ${order.orderNumber} cancelled by customer`,
        reference: order.orderNumber,
        performedBy: req.user._id,
      });
    }
  }

  const prevStatus = order.status;
  order.status = 'cancelled';
  order.cancelReason = req.body.reason || 'Cancelled by customer';
  order.statusHistory.push({ status: 'cancelled', note: order.cancelReason });

  // If order was paid, mark as refunded in demo
  if (order.paymentStatus === 'paid') {
    order.paymentStatus = 'refunded';
  }

  await order.save();

  await Notification.create({
    user: req.user._id,
    type: 'order_cancelled',
    title: 'Order Cancelled',
    message: `Your order #${order.orderNumber} has been cancelled. Stock has been restored.`,
    relatedOrder: order._id,
  });

  res.json({ success: true, message: 'Order cancelled.', data: { order } });
};

// Admin Controllers

// @desc   Get all orders (admin)
// @route  GET /api/orders/admin/all
// @access Admin
const getAllOrders = async (req, res) => {
  const { status, paymentStatus, search, page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = req.query;
  const query = {};

  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('customer', 'name email')
    .sort({ [sort]: order === 'asc' ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    data: { orders, total, page: Number(page), pages: Math.ceil(total / limit) },
  });
};

// @desc   Get single order (admin)
// @route  GET /api/orders/admin/:id
// @access Admin
const getOrderAdmin = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer', 'name email phone');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  res.json({ success: true, data: { order } });
};

// @desc   Update order status (admin)
// @route  PUT /api/orders/admin/:id/status
// @access Admin
const updateOrderStatus = async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id).populate('customer', 'name email');

  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  if (!order.canTransitionTo(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status transition from "${order.status}" to "${status}".`,
    });
  }

  order.status = status;
  order.statusHistory.push({ status, note, updatedBy: req.user._id });

  if (status === 'delivered') {
    order.paymentStatus = 'paid';
  }

  await order.save();

  // Notify customer
  const notifMap = {
    packed: { type: 'order_packed', title: 'Order Packed', msg: `Your order #${order.orderNumber} is packed and ready to ship.` },
    shipped: { type: 'order_shipped', title: 'Order Shipped', msg: `Your order #${order.orderNumber} is on the way!` },
    delivered: { type: 'order_delivered', title: 'Order Delivered', msg: `Your order #${order.orderNumber} has been delivered.` },
    cancelled: { type: 'order_cancelled', title: 'Order Cancelled', msg: `Your order #${order.orderNumber} was cancelled.` },
  };

  if (notifMap[status]) {
    const n = notifMap[status];
    await Notification.create({
      user: order.customer._id,
      type: n.type,
      title: n.title,
      message: n.msg,
      relatedOrder: order._id,
    });
  }

  res.json({ success: true, message: `Order status updated to "${status}".`, data: { order } });
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  getOrderAdmin,
  updateOrderStatus,
};
