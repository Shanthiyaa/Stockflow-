const Product = require('../models/Product');

// @desc   Get products (public catalog)
// @route  GET /api/products
// @access Public
const getProducts = async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    inStock,
    sort = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 12,
    featured,
  } = req.query;

  const query = { isActive: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  if (category) query.category = category;

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (inStock === 'true') query.stock = { $gt: 0 };
  if (featured === 'true') query.isFeatured = true;

  const sortObj = {};
  const allowedSortFields = ['price', 'name', 'createdAt', 'totalSold', 'rating'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
  sortObj[sortField] = order === 'asc' ? 1 : -1;

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sortObj)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({
    success: true,
    data: {
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
  });
};

// @desc   Get single product
// @route  GET /api/products/:id
// @access Public
const getProduct = async (req, res) => {
  const product = await Product.findOne({
    $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { slug: req.params.id }],
    isActive: true,
  }).populate('category', 'name slug');

  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  res.json({ success: true, data: { product } });
};

// @desc   Create product (admin)
// @route  POST /api/products
// @access Admin
const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  await product.populate('category', 'name slug');
  res.status(201).json({ success: true, message: 'Product created.', data: { product } });
};

// @desc   Update product (admin)
// @route  PUT /api/products/:id
// @access Admin
const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('category', 'name slug');

  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  res.json({ success: true, message: 'Product updated.', data: { product } });
};

// @desc   Delete product (admin - soft delete)
// @route  DELETE /api/products/:id
// @access Admin
const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  // Soft delete to preserve historical order records
  product.isActive = false;
  await product.save();

  res.json({ success: true, message: 'Product deactivated. Historical orders remain intact.' });
};

// @desc   Get all products for admin (includes inactive)
// @route  GET /api/products/admin/all
// @access Admin
const getProductsAdmin = async (req, res) => {
  const {
    search,
    category,
    stockStatus,
    sort = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 20,
  } = req.query;

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

  const sortObj = { [sort]: order === 'asc' ? 1 : -1 };
  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name')
    .sort(sortObj)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({
    success: true,
    data: { products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getProductsAdmin };
