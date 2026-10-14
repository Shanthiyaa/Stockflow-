const User = require('../models/User');

// @desc   Get my profile
// @route  GET /api/users/profile
// @access Protected
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: { user } });
};

// @desc   Update my profile
// @route  PUT /api/users/profile
// @access Protected
const updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true }
  );
  res.json({ success: true, message: 'Profile updated.', data: { user } });
};

// @desc   Change password
// @route  PUT /api/users/change-password
// @access Protected
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully.' });
};

// @desc   Add or update a shipping address
// @route  POST /api/users/addresses
// @access Protected
const addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = req.body;

  if (address.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  user.addresses.push(address);
  await user.save();

  res.status(201).json({ success: true, message: 'Address added.', data: { addresses: user.addresses } });
};

// @desc   Update an address
// @route  PUT /api/users/addresses/:addressId
// @access Protected
const updateAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addressId);

  if (!addr) return res.status(404).json({ success: false, message: 'Address not found.' });

  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  Object.assign(addr, req.body);
  await user.save();

  res.json({ success: true, message: 'Address updated.', data: { addresses: user.addresses } });
};

// @desc   Delete an address
// @route  DELETE /api/users/addresses/:addressId
// @access Protected
const deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
  await user.save();
  res.json({ success: true, message: 'Address removed.', data: { addresses: user.addresses } });
};

// @desc   Admin: Get all customers
// @route  GET /api/users
// @access Admin
const getAllUsers = async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const query = { role: 'customer' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    data: { users, total, page: Number(page), pages: Math.ceil(total / limit) },
  });
};

module.exports = { getProfile, updateProfile, changePassword, addAddress, updateAddress, deleteAddress, getAllUsers };
