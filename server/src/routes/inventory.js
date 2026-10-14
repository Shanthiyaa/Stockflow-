const express = require('express');
const { getInventory, adjustStock, getMovements, getStockAlerts } = require('../controllers/inventoryController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);
router.get('/', getInventory);
router.post('/adjust', adjustStock);
router.get('/movements', getMovements);
router.get('/alerts', getStockAlerts);

module.exports = router;
