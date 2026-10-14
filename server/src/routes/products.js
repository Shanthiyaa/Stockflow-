const express = require('express');
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, getProductsAdmin,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', getProducts);
router.get('/admin/all', protect, adminOnly, getProductsAdmin);
router.get('/:id', getProduct);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
