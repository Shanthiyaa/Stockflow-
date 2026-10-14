const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc   Sales trend over time
// @route  GET /api/analytics/sales
// @access Admin
const getSalesTrend = async (req, res) => {
  const { period = '30' } = req.query; // days
  const days = Math.min(parseInt(period) || 30, 365);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const salesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        paymentStatus: 'paid',
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data: { salesData, period: days } });
};

// @desc   Revenue by category
// @route  GET /api/analytics/category-revenue
// @access Admin
const getCategoryRevenue = async (req, res) => {
  const data = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: '$productInfo' },
    {
      $lookup: {
        from: 'categories',
        localField: 'productInfo.category',
        foreignField: '_id',
        as: 'categoryInfo',
      },
    },
    { $unwind: '$categoryInfo' },
    {
      $group: {
        _id: '$categoryInfo._id',
        name: { $first: '$categoryInfo.name' },
        revenue: { $sum: '$items.totalPrice' },
        orders: { $sum: 1 },
        units: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  res.json({ success: true, data: { categoryRevenue: data } });
};

// @desc   Best-selling products
// @route  GET /api/analytics/best-sellers
// @access Admin
const getBestSellers = async (req, res) => {
  const { limit = 10 } = req.query;
  const data = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$items.productName' },
        productSKU: { $first: '$items.productSKU' },
        totalUnits: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalUnits: -1 } },
    { $limit: Number(limit) },
  ]);

  res.json({ success: true, data: { bestSellers: data } });
};

// @desc   Inventory health overview
// @route  GET /api/analytics/inventory-health
// @access Admin
const getInventoryHealth = async (req, res) => {
  const inStock = await Product.countDocuments({
    $expr: { $gt: ['$stock', '$lowStockThreshold'] },
    isActive: true,
  });
  const lowStock = await Product.countDocuments({
    $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] },
    isActive: true,
  });
  const outOfStock = await Product.countDocuments({ stock: 0, isActive: true });

  const totalStockValue = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, value: { $sum: { $multiply: ['$stock', '$price'] } } } },
  ]);

  res.json({
    success: true,
    data: {
      inStock,
      lowStock,
      outOfStock,
      totalStockValue: totalStockValue[0]?.value || 0,
    },
  });
};

// @desc   Order status summary
// @route  GET /api/analytics/order-status
// @access Admin
const getOrderStatusSummary = async (req, res) => {
  const { startDate, endDate } = req.query;
  const match = {};
  if (startDate) match.createdAt = { $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };

  const data = await Order.aggregate([
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
  ]);

  res.json({ success: true, data: { statusSummary: data } });
};

module.exports = { getSalesTrend, getCategoryRevenue, getBestSellers, getInventoryHealth, getOrderStatusSummary };
