const express = require('express');
const {
  getSalesTrend, getCategoryRevenue, getBestSellers,
  getInventoryHealth, getOrderStatusSummary,
} = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);
router.get('/sales', getSalesTrend);
router.get('/category-revenue', getCategoryRevenue);
router.get('/best-sellers', getBestSellers);
router.get('/inventory-health', getInventoryHealth);
router.get('/order-status', getOrderStatusSummary);

module.exports = router;
