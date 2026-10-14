import { Link } from 'react-router-dom';
import { Package, Mail, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-teal-500 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">StockFlow</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Professional e-commerce inventory and order management for modern businesses.
            </p>
          </div>
          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-white transition-colors">Featured</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Project Info</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail className="w-3 h-3" /> BE CSE Mini Project</li>
              <li>Stack: React + Node + MongoDB</li>
              <li>Demo payments only</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs">© 2024 StockFlow. Built for academic demonstration.</p>
          <p className="text-xs">⚠️ Payments are simulated. No real transactions occur.</p>
        </div>
      </div>
    </footer>
  );
}
