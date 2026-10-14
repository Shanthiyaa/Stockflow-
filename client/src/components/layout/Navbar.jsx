import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Bell, Search, Menu, X, ChevronDown, User, Package, LogOut, LayoutDashboard } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { notificationAPI } from '../../api';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (user) {
      notificationAPI.getAll({ limit: 1 })
        .then(res => setUnreadCount(res.data.data.unreadCount || 0))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-navy-900 tracking-tight">StockFlow</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/products" className="text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors">Products</Link>
            <Link to="/products?featured=true" className="text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors">Featured</Link>
            {isAdmin && (
              <Link to="/admin/dashboard" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" />Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-navy-900 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-navy-900 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <>
                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                    id="user-menu-btn"
                  >
                    <div className="w-7 h-7 bg-navy-100 rounded-full flex items-center justify-center">
                      <span className="text-navy-800 text-xs font-semibold">{user.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">{user.name?.split(' ')[0]}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-100 shadow-card-hover py-1 z-50">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Package className="w-4 h-4" /> My Orders
                      </Link>
                      {isAdmin && (
                        <Link to="/admin/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-teal-600 hover:bg-slate-50">
                          <LayoutDashboard className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-primary btn-sm hidden sm:flex">Get Started</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-2">
          <Link to="/products" className="text-sm font-medium text-slate-600 py-2" onClick={() => setMenuOpen(false)}>Products</Link>
          {isAdmin && (
            <Link to="/admin/dashboard" className="text-sm font-medium text-teal-600 py-2" onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>
          )}
          {!user && (
            <Link to="/register" className="btn btn-primary w-full mt-1" onClick={() => setMenuOpen(false)}>Get Started</Link>
          )}
        </div>
      )}
    </nav>
  );
}
