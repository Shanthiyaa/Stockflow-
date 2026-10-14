require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const InventoryMovement = require('../models/InventoryMovement');
const Notification = require('../models/Notification');

const connectDB = require('../config/db');

const CATEGORIES = [
  { name: 'Electronics', description: 'Smartphones, laptops, tablets and accessories', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
  { name: 'Clothing', description: 'Men, women and kids fashion', image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400' },
  { name: 'Home & Kitchen', description: 'Furniture, appliances and decor', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
  { name: 'Books', description: 'Fiction, non-fiction, textbooks', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400' },
  { name: 'Sports & Fitness', description: 'Equipment, apparel and accessories', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400' },
  { name: 'Beauty & Health', description: 'Skincare, haircare and wellness', image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400' },
];

const PRODUCTS = (cats) => [
  {
    name: 'Apple iPhone 14 Pro Max',
    description: 'Latest iPhone with A16 Bionic chip, 48MP camera system, and Dynamic Island.',
    price: 134900, comparePrice: 139900, sku: 'APPL-IP14PM-256', category: cats['Electronics'],
    images: ['https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=600'],
    stock: 25, lowStockThreshold: 5, isFeatured: true, brand: 'Apple', tags: ['apple', 'iphone', 'smartphone'],
  },
  {
    name: 'Samsung Galaxy S23 Ultra',
    description: 'Flagship Android phone with S Pen, 200MP camera and 5000mAh battery.',
    price: 124999, comparePrice: 134999, sku: 'SMSNG-GS23U-256', category: cats['Electronics'],
    images: ['https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=600'],
    stock: 18, lowStockThreshold: 5, isFeatured: true, brand: 'Samsung', tags: ['samsung', 'android', 'smartphone'],
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise cancellation with 30-hour battery life.',
    price: 29990, comparePrice: 34990, sku: 'SONY-WH1000XM5', category: cats['Electronics'],
    images: ['https://images.unsplash.com/photo-1545127398-14699f92334b?w=600'],
    stock: 40, lowStockThreshold: 8, isFeatured: true, brand: 'Sony', tags: ['headphones', 'sony', 'audio'],
  },
  {
    name: 'MacBook Air M2',
    description: '13.6-inch Liquid Retina display, M2 chip, 8GB RAM, 256GB SSD.',
    price: 114900, comparePrice: 119900, sku: 'APPL-MBA-M2-8GB', category: cats['Electronics'],
    images: ['https://images.unsplash.com/photo-1611186871525-7e7e6059e7b7?w=600'],
    stock: 12, lowStockThreshold: 3, isFeatured: false, brand: 'Apple', tags: ['macbook', 'laptop', 'apple'],
  },
  {
    name: 'Nike Air Max 270',
    description: 'Lightweight running shoe with Air Max cushioning and breathable mesh upper.',
    price: 12995, comparePrice: 14995, sku: 'NIKE-AM270-BLK-42', category: cats['Sports & Fitness'],
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
    stock: 60, lowStockThreshold: 10, isFeatured: true, brand: 'Nike', tags: ['nike', 'shoes', 'running'],
  },
  {
    name: 'Levi\'s 511 Slim Jeans',
    description: 'Classic slim-fit jeans in stretch denim for all-day comfort.',
    price: 3499, comparePrice: 4499, sku: 'LEVIS-511-SLIM-32', category: cats['Clothing'],
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600'],
    stock: 85, lowStockThreshold: 15, isFeatured: false, brand: 'Levis', tags: ['jeans', 'denim', 'levis'],
  },
  {
    name: 'Instant Pot Duo 7-in-1',
    description: '6-quart electric pressure cooker, slow cooker, rice cooker, and more.',
    price: 8999, comparePrice: 11999, sku: 'INST-DUO-6QT', category: cats['Home & Kitchen'],
    images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=600'],
    stock: 30, lowStockThreshold: 8, isFeatured: true, brand: 'Instant Pot', tags: ['kitchen', 'cooking', 'appliance'],
  },
  {
    name: 'Atomic Habits by James Clear',
    description: 'Tiny changes, remarkable results - bestselling self-improvement book.',
    price: 599, comparePrice: 799, sku: 'BOOK-ATOMIC-HABITS', category: cats['Books'],
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600'],
    stock: 150, lowStockThreshold: 20, isFeatured: true, brand: 'Penguin', tags: ['book', 'self-help', 'productivity'],
  },
  {
    name: 'Dyson V15 Detect Vacuum',
    description: 'Laser Detect technology reveals hidden dust. 60-minute battery.',
    price: 52900, comparePrice: 59900, sku: 'DYSON-V15-DETECT', category: cats['Home & Kitchen'],
    images: ['https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600'],
    stock: 8, lowStockThreshold: 3, isFeatured: false, brand: 'Dyson', tags: ['vacuum', 'dyson', 'cleaning'],
  },
  {
    name: 'Yoga Mat Premium Anti-Slip',
    description: 'Extra thick 6mm yoga mat with alignment lines and carry strap.',
    price: 1299, comparePrice: 1799, sku: 'SPRT-YOGA-MAT-6MM', category: cats['Sports & Fitness'],
    images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600'],
    stock: 75, lowStockThreshold: 15, isFeatured: false, brand: 'FitLife', tags: ['yoga', 'fitness', 'mat'],
  },
  {
    name: 'L\'Oreal Paris Revitalift Serum',
    description: 'Pure 1.5% hyaluronic acid face serum for intense hydration.',
    price: 849, comparePrice: 1099, sku: 'LORAL-REVIT-30ML', category: cats['Beauty & Health'],
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'],
    stock: 120, lowStockThreshold: 20, isFeatured: true, brand: "L'Oreal", tags: ['skincare', 'serum', 'beauty'],
  },
  {
    name: 'JBL Charge 5 Bluetooth Speaker',
    description: 'Portable waterproof speaker with 20-hour playtime and power bank.',
    price: 15999, comparePrice: 18999, sku: 'JBL-CHG5-BLU', category: cats['Electronics'],
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'],
    stock: 35, lowStockThreshold: 8, isFeatured: false, brand: 'JBL', tags: ['speaker', 'bluetooth', 'jbl'],
  },
  {
    name: 'Allen Solly Regular Fit Shirt',
    description: 'Premium cotton formal shirt for office and casual wear.',
    price: 1299, comparePrice: 1799, sku: 'ALLEN-SHIRT-WH-42', category: cats['Clothing'],
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'],
    stock: 3, lowStockThreshold: 10, isFeatured: false, brand: 'Allen Solly', tags: ['shirt', 'formal', 'clothing'],
  },
  {
    name: 'The Power of Now - Eckhart Tolle',
    description: 'A guide to spiritual enlightenment and living in the present moment.',
    price: 399, comparePrice: 499, sku: 'BOOK-POWER-NOW', category: cats['Books'],
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600'],
    stock: 0, lowStockThreshold: 15, isFeatured: false, brand: 'New World Library', tags: ['book', 'spiritual', 'mindfulness'],
  },
  {
    name: 'Dumbbell Set Adjustable 20kg',
    description: 'Cast iron adjustable dumbbell set with storage rack.',
    price: 4999, comparePrice: 6499, sku: 'SPRT-DUMB-ADJ-20', category: cats['Sports & Fitness'],
    images: ['https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=600'],
    stock: 22, lowStockThreshold: 5, isFeatured: false, brand: 'PowerFit', tags: ['dumbbell', 'weights', 'gym'],
  },
  {
    name: 'Nescafe Gold Blend Coffee 200g',
    description: 'Premium instant coffee with aromatic roasted coffee beans.',
    price: 549, comparePrice: 649, sku: 'NESC-GOLD-200G', category: cats['Home & Kitchen'],
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600'],
    stock: 200, lowStockThreshold: 30, isFeatured: false, brand: 'Nescafe', tags: ['coffee', 'beverage', 'nescafe'],
  },
  {
    name: 'Garnier Vitamin C Face Wash',
    description: 'Brightening face wash with vitamin C and lemon essence.',
    price: 249, comparePrice: 299, sku: 'GARN-VIT-FACEWASH', category: cats['Beauty & Health'],
    images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600'],
    stock: 180, lowStockThreshold: 25, isFeatured: false, brand: 'Garnier', tags: ['facewash', 'vitamin-c', 'skincare'],
  },
];

async function seed() {
  try {
    await connectDB();
    console.log('\n🌱 Starting seed...\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      InventoryMovement.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('✅ Cleared existing data');

    // Create admin
    const admin = await User.create({
      name: 'StockFlow Admin',
      email: process.env.ADMIN_EMAIL || 'admin@stockflow.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      phone: '9000000001',
    });
    console.log(`✅ Admin created: ${admin.email}`);

    // Create demo customers
    const customers = await User.create([
      { name: 'Arjun Sharma', email: 'arjun@demo.com', password: 'Demo@12345', role: 'customer', phone: '9876543210',
        addresses: [{ fullName: 'Arjun Sharma', addressLine1: '42 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', phone: '9876543210', isDefault: true }] },
      { name: 'Priya Patel', email: 'priya@demo.com', password: 'Demo@12345', role: 'customer', phone: '9876543211',
        addresses: [{ fullName: 'Priya Patel', addressLine1: '15 Anna Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040', phone: '9876543211', isDefault: true }] },
      { name: 'Rahul Verma', email: 'rahul@demo.com', password: 'Demo@12345', role: 'customer', phone: '9876543212',
        addresses: [{ fullName: 'Rahul Verma', addressLine1: '8 Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001', phone: '9876543212', isDefault: true }] },
    ]);
    console.log(`✅ Created ${customers.length} demo customers`);

    // Create categories (use create() so pre-save slug hook runs)
    const categoryDocs = [];
    for (const cat of CATEGORIES) {
      const doc = await Category.create(cat);
      categoryDocs.push(doc);
    }
    const catMap = {};
    categoryDocs.forEach((c) => { catMap[c.name] = c._id; });
    console.log(`✅ Created ${categoryDocs.length} categories`);

    // Create products (use create() so pre-save slug hook runs)
    const productDataList = PRODUCTS(catMap);
    const products = [];
    for (const p of productDataList) {
      const doc = await Product.create(p);
      products.push(doc);
    }
    console.log(`✅ Created ${products.length} products`);

    // Create demo orders spread over last 30 days
    const orderStatuses = ['placed', 'packed', 'shipped', 'delivered', 'delivered', 'delivered'];
    const createdOrders = [];

    for (let i = 0; i < 15; i++) {
      const customer = customers[i % customers.length];
      const p1 = products[i % products.length];
      const p2 = products[(i + 3) % products.length];
      const qty1 = Math.floor(Math.random() * 2) + 1;
      const qty2 = Math.floor(Math.random() * 2) + 1;

      const itemsTotal = p1.price * qty1 + p2.price * qty2;
      const shippingCharge = itemsTotal >= 500 ? 0 : 50;
      const totalAmount = itemsTotal + shippingCharge;

      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(Date.now() - daysAgo * 86400000);

      const status = orderStatuses[i % orderStatuses.length];
      const isPaid = ['shipped', 'delivered', 'packed'].includes(status) || Math.random() > 0.3;

      const order = new Order({
        customer: customer._id,
        items: [
          { product: p1._id, productName: p1.name, productSKU: p1.sku, productImage: p1.images?.[0], unitPrice: p1.price, quantity: qty1, totalPrice: p1.price * qty1 },
          { product: p2._id, productName: p2.name, productSKU: p2.sku, productImage: p2.images?.[0], unitPrice: p2.price, quantity: qty2, totalPrice: p2.price * qty2 },
        ],
        shippingAddress: customer.addresses?.[0] || {
          fullName: customer.name, addressLine1: '123 Test Street',
          city: 'Mumbai', state: 'Maharashtra', pincode: '400001', phone: customer.phone,
        },
        status,
        statusHistory: [{ status: 'placed', timestamp: createdAt }],
        paymentStatus: isPaid ? 'paid' : 'pending',
        paymentMethod: 'demo_card',
        itemsTotal,
        shippingCharge,
        totalAmount,
        createdAt,
        updatedAt: createdAt,
      });
      await order.save();
      createdOrders.push(order);

      // Update product totalSold
      await Product.findByIdAndUpdate(p1._id, { $inc: { totalSold: qty1 } });
      await Product.findByIdAndUpdate(p2._id, { $inc: { totalSold: qty2 } });
    }
    console.log(`✅ Created ${createdOrders.length} demo orders`);

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('Demo Credentials:');
    console.log(`  Admin:    ${process.env.ADMIN_EMAIL || 'admin@stockflow.com'} / ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
    console.log('  Customer: arjun@demo.com / Demo@12345');
    console.log('  Customer: priya@demo.com / Demo@12345');
    console.log('\n⚠️  CHANGE ADMIN CREDENTIALS BEFORE DEPLOYING TO PRODUCTION!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
