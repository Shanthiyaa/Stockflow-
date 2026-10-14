# StockFlow – E-Commerce Inventory & Order Management Platform

> **BE CSE Mini-Project** | React + Node.js + MongoDB Full-Stack Application

A professional, full-stack e-commerce platform with real-time inventory management, order tracking, simulated payments, and a rich admin analytics dashboard.

---

## 🚀 Quick Start (Windows)

### Prerequisites
- **Node.js** ≥ 18 ([Download](https://nodejs.org))
- **MongoDB Atlas** free cluster ([Sign up](https://www.mongodb.com/atlas))
- **Git** (optional)

---

### 1. Clone / Navigate to Project
```powershell
cd "d:\Alcatel Lucent Internship\Web_MINI\stockflow"
```

### 2. Install All Dependencies
```powershell
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 3. Configure Environment Variables

**Server** – copy `.env.example` to `.env`:
```powershell
cd server
copy .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/stockflow?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@stockflow.com
ADMIN_PASSWORD=Admin@123456
```

> **Get your MongoDB URI:**
> 1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
> 2. Create a free M0 cluster
> 3. Create a database user
> 4. Click **Connect → Connect your application** → copy the URI
> 5. Replace `<username>`, `<password>`, `<cluster>` in the URI

### 4. Seed the Database
```powershell
cd server
npm run seed
cd ..
```

This inserts: 6 categories, 17 products, 3 demo customers, 15 sample orders.

### 5. Run the Application
```powershell
# From the stockflow/ root directory
npm run dev
```

This starts:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

---

## 🔑 Demo Credentials

| Role     | Email                  | Password      |
|----------|------------------------|---------------|
| Admin    | admin@stockflow.com    | Admin@123456  |
| Customer | arjun@demo.com         | Demo@12345    |
| Customer | priya@demo.com         | Demo@12345    |

> ⚠️ **Change admin credentials before any deployment!**

---

## 📁 Project Structure

```
stockflow/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/                # Axios instance & API functions
│   │   ├── components/
│   │   │   ├── layout/         # Navbar, Footer, CustomerLayout, AdminLayout
│   │   │   ├── routes/         # ProtectedRoute, AdminRoute, GuestRoute
│   │   │   └── ui/             # Alert, Modal, Pagination, Spinner
│   │   ├── context/            # AuthContext, CartContext
│   │   ├── pages/
│   │   │   ├── admin/          # Dashboard, Products, Categories, Orders, Inventory, Analytics, Customers
│   │   │   ├── auth/           # Login, Register
│   │   │   └── customer/       # Home, Products, ProductDetail, Cart, Checkout, Orders, Profile, Notifications
│   │   └── utils/              # format.js (currency, date, badges)
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Node.js + Express backend
│   └── src/
│       ├── config/             # db.js (MongoDB connection)
│       ├── controllers/        # auth, user, category, product, cart, order, payment, inventory, notification, admin, analytics
│       ├── middleware/         # auth.js, errorHandler.js, notFound.js, validate.js
│       ├── models/             # User, Category, Product, Order, Payment, InventoryMovement, Notification
│       ├── routes/             # All API routes
│       └── scripts/            # seed.js
│
├── package.json                # Root scripts (concurrently)
└── README.md
```

---

## ✅ Implemented Features

### Customer
- [x] Register & Login with JWT authentication
- [x] Browse products with search, filter (category, price, availability), sort
- [x] Product detail page with stock validation
- [x] Shopping cart (localStorage persistent) with quantity controls
- [x] Server-side cart validation before checkout (prevents overselling)
- [x] 3-step checkout (Address → Payment → Review)
- [x] Simulated payment gateway (no real card data stored)
- [x] Order placement with atomic stock decrement
- [x] Order confirmation page with tracking link
- [x] Order history with status filter
- [x] Order detail with status timeline
- [x] Order cancellation (allowed for Placed/Packed) with stock restore
- [x] Profile management (name, phone, password change)
- [x] Saved shipping addresses
- [x] In-app notifications (order updates)

### Admin
- [x] Dashboard with live stats (orders, revenue, products, stock alerts)
- [x] Revenue trend chart (last 7/30/90/365 days)
- [x] Order status distribution chart
- [x] Product CRUD with image, SKU, stock, category, brand, tags
- [x] Category CRUD with safe deletion (blocked if products exist)
- [x] Inventory view with stock alerts
- [x] Manual stock adjustment with reason and type
- [x] Inventory movement history audit log
- [x] Order management with status transitions (Placed→Packed→Shipped→Delivered)
- [x] Admin order status update with notes
- [x] Analytics: revenue trends, category revenue, best sellers, inventory health
- [x] Customer management with order history view

### Technical
- [x] JWT authentication with protected & admin routes
- [x] Role-based access control (backend-enforced)
- [x] Atomic stock decrement to prevent overselling
- [x] Rollback on partial order failure
- [x] Stock restore on order cancellation
- [x] Backend price calculation (prevents price manipulation)
- [x] Soft delete for products (historical orders preserved)
- [x] Input validation (express-validator + frontend)
- [x] Rate limiting on auth routes
- [x] Helmet security headers
- [x] CORS with allowed origins
- [x] Centralized error handling

---

## ⚠️ Known Limitations

1. **Payments**: Fully simulated. No Razorpay/Stripe integration. For production, replace the `paymentController.js` simulation with the Razorpay SDK.
2. **Email/SMS**: Not implemented. Notifications are in-app only.
3. **File upload**: Product images are URLs only. For actual file upload, integrate Cloudinary or AWS S3.
4. **MongoDB Transactions**: If your Atlas cluster does not support transactions (M0 free tier), the atomic stock operations use `findOneAndUpdate` with conditional query instead of multi-document transactions. This is documented in `orderController.js`.
5. **Image CDN**: Using Unsplash URLs for seeded products — may be rate-limited in production.

---

## 🔧 Available Scripts

From `stockflow/` root:
```powershell
npm run dev          # Start both client and server (development)
npm run server       # Start backend only
npm run client       # Start frontend only
npm run seed         # Seed database with demo data
```

From `server/`:
```powershell
npm start            # Production server
npm run dev          # Development server (nodemon)
npm test             # Run tests
```

From `client/`:
```powershell
npm run dev          # Dev server (Vite)
npm run build        # Production build
npm run preview      # Preview production build
```

---

## 🌐 Deployment

### Frontend (Vercel)
1. Push `client/` to GitHub
2. Import in Vercel
3. Set framework: Vite
4. Set env: `VITE_API_URL=https://your-backend.onrender.com`
5. Update `vite.config.js` proxy target to production URL

### Backend (Render)
1. Push `server/` to GitHub
2. Create Web Service on Render
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add all environment variables from `.env.example`

---

## 🏫 Academic Notes

- **Course**: BE Computer Science Engineering
- **Subject**: Mini-Project
- **Stack**: React.js, Node.js, Express.js, MongoDB Atlas, Tailwind CSS
- **Design Pattern**: MVC with layered architecture
- **Authentication**: JWT with bcrypt password hashing
- **Database**: MongoDB with Mongoose ODM

---

> Built with ❤️ for BE CSE Mini-Project academic demonstration.
