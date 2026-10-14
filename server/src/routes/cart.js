const express = require('express');
const { validateCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.post('/validate', protect, validateCart);

module.exports = router;
