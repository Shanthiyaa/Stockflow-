const express = require('express');
const {
  createOrder, getMyOrders, getOrder, cancelOrder,
  getAllOrders, getOrderAdmin, updateOrderStatus,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Admin routes (MUST come before /:id wildcard)
router.get('/admin/all', adminOnly, getAllOrders);
router.get('/admin/:id', adminOnly, getOrderAdmin);
router.put('/admin/:id/status', adminOnly, updateOrderStatus);

// Customer routes
router.post('/', createOrder);
router.get('/my', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

module.exports = router;

