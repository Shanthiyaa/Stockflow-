const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');

// @desc   Get inventory summary
// @route  GET /api/inventory
// @access Admin
const getInventory = async (req, res) => {
  const { stockStatus, category, search, page = 1, limit = 20 } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) query.category = category;

  if (stockStatus === 'out_of_stock') query.stock = 0;
  else if (stockStatus === 'low_stock') query.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };
  else if (stockStatus === 'in_stock') query.$expr = { $gt: ['$stock', '$lowStockThreshold'] };

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name')
    .sort({ stock: 1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .select('name sku stock lowStockThreshold category images price isActive');

  res.json({
    success: true,
    data: { products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
};

// @desc   Adjust stock manually
// @route  POST /api/inventory/adjust
// @access Admin
const adjustStock = async (req, res) => {
  const { productId, type, quantity, reason } = req.body;

  if (!['adjustment_add', 'adjustment_remove', 'purchase', 'damage', 'return'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid adjustment type.' });
  }

  if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
    return res.status(400).json({ success: false, message: 'Quantity must be a positive integer.' });
  }

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  const isAddition = ['adjustment_add', 'purchase', 'return'].includes(type);
  const delta = isAddition ? Number(quantity) : -Number(quantity);
  const newStock = product.stock + delta;

  if (newStock < 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot remove ${quantity} units. Only ${product.stock} in stock.`,
    });
  }

  const stockBefore = product.stock;
  product.stock = newStock;
  await product.save();

  await InventoryMovement.create({
    product: product._id,
    type,
    quantity: delta,
    stockBefore,
    stockAfter: newStock,
    reason,
    performedBy: req.user._id,
  });

  res.json({
    success: true,
    message: `Stock ${isAddition ? 'added' : 'removed'} successfully.`,
    data: { product, newStock },
  });
};

// @desc   Get inventory movement history
// @route  GET /api/inventory/movements
// @access Admin
const getMovements = async (req, res) => {
  const { productId, type, page = 1, limit = 30 } = req.query;
  const query = {};
  if (productId) query.product = productId;
  if (type) query.type = type;

  const total = await InventoryMovement.countDocuments(query);
  const movements = await InventoryMovement.find(query)
    .populate('product', 'name sku')
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    data: { movements, total, page: Number(page), pages: Math.ceil(total / limit) },
  });
};

// @desc   Get stock alerts (low + out of stock)
// @route  GET /api/inventory/alerts
// @access Admin
const getStockAlerts = async (req, res) => {
  const outOfStock = await Product.find({ stock: 0, isActive: true }).select('name sku stock category').populate('category', 'name');
  const lowStock = await Product.find({
    $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] },
    isActive: true,
  }).select('name sku stock lowStockThreshold category').populate('category', 'name');

  res.json({
    success: true,
    data: { outOfStock, lowStock },
  });
};

module.exports = { getInventory, adjustStock, getMovements, getStockAlerts };
