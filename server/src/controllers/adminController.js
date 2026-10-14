const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');

// @desc   Get admin dashboard stats
// @route  GET /api/admin/dashboard
// @access Admin
const getDashboardStats = async (req, res) => {
  const [
    totalOrders,
    totalProducts,
    totalCustomers,
    totalCategories,
  ] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'customer' }),
    Category.countDocuments({ isActive: true }),
  ]);

  // Revenue from paid orders
  const revenueAgg = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  // Low & out of stock
  const outOfStock = await Product.countDocuments({ stock: 0, isActive: true });
  const lowStock = await Product.countDocuments({
    $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] },
    isActive: true,
  });

  // Recent orders
  const recentOrders = await Order.find()
    .populate('customer', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  // Best-selling products
  const bestSelling = await Product.find({ isActive: true })
    .sort({ totalSold: -1 })
    .limit(5)
    .select('name sku totalSold price images');

  // Order status distribution
  const statusDistribution = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      totalOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      totalCategories,
      outOfStock,
      lowStock,
      recentOrders,
      bestSelling,
      statusDistribution,
    },
  });
};

module.exports = { getDashboardStats };
