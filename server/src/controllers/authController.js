const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @desc   Register a new customer
// @route  POST /api/auth/register
// @access Public
const register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered.' });
  }

  const user = await User.create({ name, email, password, phone, role: 'customer' });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: { user, token },
  });
};

// @desc   Login
// @route  POST /api/auth/login
// @access Public
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful.',
    data: { user, token },
  });
};

// @desc   Get current user
// @route  GET /api/auth/me
// @access Protected
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: { user } });
};

module.exports = { register, login, getMe };
