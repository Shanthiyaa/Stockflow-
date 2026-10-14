import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, TrendingUp, Shield, Truck, Star, ChevronRight } from 'lucide-react';
import { productAPI, categoryAPI } from '../../api';
import { formatCurrency } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';
import { useCart } from '../../context/CartContext';

function ProductCard({ product }) {
  const { addItem } = useCart();
  const stockStatus = product.stockStatus || (product.stock === 0 ? 'out_of_stock' : product.stock <= product.lowStockThreshold ? 'low_stock' : 'in_stock');
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link to={`/products/${product._id}`} className="card card-hover flex flex-col group overflow-hidden">
      <div className="aspect-[4/3] bg-slate-50 overflow-hidden flex-shrink-0">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=400&background=e2e8f0&color=64748b&bold=true`; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ShoppingBag className="w-12 h-12" />
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{product.category?.name}</p>
          <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2">{product.name}</h3>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-2">
          <span className="text-lg font-bold text-navy-900">{formatCurrency(product.price)}</span>
          {product.comparePrice > product.price && (
            <span className="text-xs text-slate-400 line-through">{formatCurrency(product.comparePrice)}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${
            stockStatus === 'out_of_stock' ? 'text-red-600' :
            stockStatus === 'low_stock' ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {stockStatus === 'out_of_stock' ? 'Out of stock' :
             stockStatus === 'low_stock' ? `Only ${product.stock} left` : 'In Stock'}
          </span>
          {stockStatus !== 'out_of_stock' && (
            <button
              onClick={handleAdd}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                added ? 'bg-green-100 text-green-700' : 'bg-navy-900 text-white hover:bg-navy-800'
              }`}
            >
              {added ? '✓ Added' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productAPI.getAll({ featured: true, limit: 8 }),
      categoryAPI.getAll(),
    ]).then(([prodRes, catRes]) => {
      setFeaturedProducts(prodRes.data.data.products || []);
      setCategories(catRes.data.data.categories || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1 mb-6">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-teal-400 text-xs font-medium">Smart Inventory Management</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Shop smarter,<br />
              <span className="text-teal-400">manage better.</span>
            </h1>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              Discover thousands of products with real-time inventory tracking. Fast shipping, secure payments, and complete order visibility.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="btn btn-teal btn-lg">
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/products?featured=true" className="btn btn-secondary btn-lg border-slate-600 bg-transparent text-white hover:bg-slate-800">
                Featured Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, label: 'Free Shipping', sub: 'On orders above ₹500' },
              { icon: Shield, label: 'Secure Payments', sub: 'Demo gateway (simulated)' },
              { icon: Star, label: 'Quality Products', sub: 'Curated catalog' },
              { icon: ShoppingBag, label: 'Easy Returns', sub: 'Cancel before dispatch' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-navy-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-12 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Shop by Category</h2>
              <Link to="/products" className="flex items-center gap-1 text-sm font-medium text-navy-700 hover:text-navy-900">
                All categories <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat._id}`}
                  className="card card-hover p-4 text-center flex flex-col items-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-navy-900 transition-colors">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
            <Link to="/products?featured=true" className="flex items-center gap-1 text-sm font-medium text-navy-700 hover:text-navy-900">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No featured products yet. Seed the database to see products.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to explore more?</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">Browse our full catalog with filters, search, and real-time stock availability.</p>
          <Link to="/products" className="btn btn-teal btn-lg">
            Browse All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
