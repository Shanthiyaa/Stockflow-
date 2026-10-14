import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Suspense, lazy } from 'react';
import { PageLoader } from './components/ui/Spinner';
import CustomerLayout from './components/layout/CustomerLayout';
import AdminLayout from './components/layout/AdminLayout';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/routes/Guards';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/customer/HomePage'));
const ProductsPage = lazy(() => import('./pages/customer/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/customer/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const OrderConfirmPage = lazy(() => import('./pages/customer/OrderConfirmPage'));
const OrdersPage = lazy(() => import('./pages/customer/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/customer/OrderDetailPage'));
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/customer/NotificationsPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Customer routes */}
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/order-confirm/:id" element={<ProtectedRoute><OrderConfirmPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              </Route>

              {/* Auth routes */}
              <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

              {/* Admin routes */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrderDetail />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="customers" element={<AdminCustomers />} />
              </Route>

              <Route path="*" element={<CustomerLayout />}>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
