const express = require('express');
const { initiatePayment, confirmPayment, getPaymentByOrder } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.post('/initiate', initiatePayment);
router.post('/confirm', confirmPayment);
router.get('/order/:orderId', getPaymentByOrder);

module.exports = router;
