const Product = require('../models/Product');

// Cart is session/client-side but we validate on the server before checkout.
// This controller validates cart items against current prices and stock.

// @desc   Validate cart items against current DB state
// @route  POST /api/cart/validate
// @access Protected
const validateCart = async (req, res) => {
  const { items } = req.body; // [{ productId, quantity }]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty.' });
  }

  const validatedItems = [];
  const issues = [];

  for (const item of items) {
    const product = await Product.findById(item.productId).populate('category', 'name');

    if (!product || !product.isActive) {
      issues.push({ productId: item.productId, issue: 'Product no longer available.' });
      continue;
    }

    if (product.stock < item.quantity) {
      issues.push({
        productId: item.productId,
        productName: product.name,
        requestedQty: item.quantity,
        availableQty: product.stock,
        issue: product.stock === 0 ? 'Out of stock.' : `Only ${product.stock} unit(s) available.`,
      });
    }

    validatedItems.push({
      product: product._id,
      productName: product.name,
      productSKU: product.sku,
      productImage: product.images?.[0] || null,
      unitPrice: product.price,
      quantity: Math.min(item.quantity, product.stock),
      totalPrice: product.price * Math.min(item.quantity, product.stock),
      stock: product.stock,
    });
  }

  const itemsTotal = validatedItems.reduce((sum, i) => sum + i.totalPrice, 0);

  res.json({
    success: true,
    data: {
      validatedItems,
      issues,
      itemsTotal,
      hasIssues: issues.length > 0,
    },
  });
};

module.exports = { validateCart };
