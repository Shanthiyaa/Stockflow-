const express = require('express');
const {
  getProfile, updateProfile, changePassword,
  addAddress, updateAddress, deleteAddress, getAllUsers,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

// Admin routes
router.get('/', adminOnly, getAllUsers);

module.exports = router;
