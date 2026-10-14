const Payment = require('../models/Payment');
const Order = require('../models/Order');

// NOTICE: This is a simulated payment gateway.
// No real payment credentials are stored or processed.
// For production, integrate with Razorpay/Stripe using their SDKs.

// @desc   Initiate a simulated payment
// @route  POST /api/payments/initiate
// @access Protected
const initiatePayment = async (req, res) => {
  const { orderId, method } = req.body;

  const order = await Order.findOne({ _id: orderId, customer: req.user._id });
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (order.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, message: 'Order is already paid.' });
  }

  // Create payment record
  const payment = await Payment.create({
    order: order._id,
    customer: req.user._id,
    amount: order.totalAmount,
    method: method || 'demo_card',
    status: 'processing',
    gatewayResponse: {
      simulated: true,
      note: 'This is a demo payment. No real transaction occurred.',
      timestamp: new Date().toISOString(),
    },
  });

  // Simulate payment processing delay (in production, redirect to gateway)
  res.json({
    success: true,
    message: 'Payment initiated (simulated).',
    data: {
      paymentId: payment._id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      isSimulated: true,
    },
  });
};

// @desc   Confirm simulated payment (simulate success/failure)
// @route  POST /api/payments/confirm
// @access Protected
const confirmPayment = async (req, res) => {
  const { paymentId, shouldSucceed = true } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment || payment.customer.toString() !== req.user._id.toString()) {
    return res.status(404).json({ success: false, message: 'Payment not found.' });
  }

  if (payment.status !== 'processing') {
    return res.status(400).json({ success: false, message: 'Payment is not in processing state.' });
  }

  if (shouldSucceed) {
    payment.status = 'success';
    payment.gatewayResponse.completedAt = new Date().toISOString();

    // Update order payment status
    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: 'paid',
      paymentTransactionId: payment.transactionId,
    });

    res.json({
      success: true,
      message: 'Payment successful (simulated).',
      data: { payment, isSimulated: true },
    });
  } else {
    payment.status = 'failed';
    payment.gatewayResponse.failedAt = new Date().toISOString();
    payment.gatewayResponse.failureReason = 'Simulated payment failure.';
    await payment.save();

    res.json({
      success: false,
      message: 'Payment failed (simulated).',
      data: { payment, isSimulated: true },
    });
  }

  await payment.save();
};

// @desc   Get payment for an order
// @route  GET /api/payments/order/:orderId
// @access Protected
const getPaymentByOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, customer: req.user._id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  const payment = await Payment.findOne({ order: req.params.orderId });
  res.json({ success: true, data: { payment } });
};

module.exports = { initiatePayment, confirmPayment, getPaymentByOrder };
