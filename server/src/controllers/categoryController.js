const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc   Get all categories
// @route  GET /api/categories
// @access Public
const getCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, data: { categories } });
};

// @desc   Get all categories (admin, includes inactive)
// @route  GET /api/categories/admin
// @access Admin
const getAllCategoriesAdmin = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, data: { categories } });
};

// @desc   Get single category
// @route  GET /api/categories/:id
// @access Public
const getCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
  res.json({ success: true, data: { category } });
};

// @desc   Create category
// @route  POST /api/categories
// @access Admin
const createCategory = async (req, res) => {
  const { name, description, image } = req.body;
  const category = await Category.create({ name, description, image });
  res.status(201).json({ success: true, message: 'Category created.', data: { category } });
};

// @desc   Update category
// @route  PUT /api/categories/:id
// @access Admin
const updateCategory = async (req, res) => {
  const { name, description, image, isActive } = req.body;
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, description, image, isActive },
    { new: true, runValidators: true }
  );
  if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
  res.json({ success: true, message: 'Category updated.', data: { category } });
};

// @desc   Delete category
// @route  DELETE /api/categories/:id
// @access Admin
const deleteCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    return res.status(409).json({
      success: false,
      message: `Cannot delete: ${productCount} product(s) are in this category. Reassign them first.`,
    });
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted.' });
};

module.exports = { getCategories, getAllCategoriesAdmin, getCategory, createCategory, updateCategory, deleteCategory };
