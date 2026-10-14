import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalItems, itemsTotal, shippingCharge, totalAmount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <div className="max-w-sm mx-auto">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 text-sm mb-6">Add products from our catalog to get started.</p>
        <Link to="/products" className="btn btn-primary btn-lg">
          Browse Products <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-title mb-6">Shopping Cart <span className="text-slate-400 font-normal text-xl">({totalItems} item{totalItems !== 1 ? 's' : ''})</span></h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="card p-4 flex items-start gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=80&background=e2e8f0&color=64748b`; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200"><ShoppingBag className="w-8 h-8" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.productId}`} className="font-semibold text-slate-900 text-sm hover:text-navy-700 transition-colors line-clamp-2">{item.name}</Link>
                <p className="text-xs text-slate-400 mt-0.5">SKU: {item.sku}</p>
                <p className="font-bold text-navy-900 mt-1">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <button onClick={() => removeItem(item.productId)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center border border-slate-200 rounded-lg">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1.5 text-slate-500 hover:text-navy-700 hover:bg-slate-50 rounded-l-lg transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, Math.min(item.stock, item.quantity + 1))} className="p-1.5 text-slate-500 hover:text-navy-700 hover:bg-slate-50 rounded-r-lg transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-slate-700">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-20">
            <h2 className="section-title mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-medium">{formatCurrency(itemsTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Shipping</span>
                <span className={`font-medium ${shippingCharge === 0 ? 'text-green-600' : ''}`}>
                  {shippingCharge === 0 ? 'FREE' : formatCurrency(shippingCharge)}
                </span>
              </div>
              {shippingCharge > 0 && (
                <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-2">
                  Add {formatCurrency(500 - itemsTotal)} more for free shipping!
                </p>
              )}
              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-navy-900">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {user ? (
              <button onClick={() => navigate('/checkout')} className="btn btn-primary w-full btn-lg mt-4">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="mt-4 space-y-2">
                <Link to="/login" state={{ from: '/checkout' }} className="btn btn-primary w-full btn-lg">
                  Sign In to Checkout
                </Link>
                <Link to="/register" className="btn btn-secondary w-full text-sm">
                  Create Account
                </Link>
              </div>
            )}
            <Link to="/products" className="block text-center text-sm text-slate-500 hover:text-navy-700 mt-3 transition-colors">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
