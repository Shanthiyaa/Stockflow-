import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ShoppingBag, ChevronDown } from 'lucide-react';
import { productAPI, categoryAPI } from '../../api';
import { formatCurrency } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { useCart } from '../../context/CartContext';

function ProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const stockStatus = product.stock === 0 ? 'out_of_stock' : product.stock <= product.lowStockThreshold ? 'low_stock' : 'in_stock';

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link to={`/products/${product._id}`} className="card card-hover flex flex-col group overflow-hidden">
      <div className="aspect-[4/3] bg-slate-50 overflow-hidden">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=400&background=e2e8f0&color=64748b&bold=true`; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <ShoppingBag className="w-12 h-12" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <p className="text-xs text-slate-400 uppercase tracking-wide">{product.category?.name}</p>
        <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 flex-1">{product.name}</h3>
        {product.brand && <p className="text-xs text-slate-400">{product.brand}</p>}
        <div className="flex items-center gap-2">
          <span className="font-bold text-navy-900">{formatCurrency(product.price)}</span>
          {product.comparePrice > product.price && (
            <span className="text-xs text-slate-400 line-through">{formatCurrency(product.comparePrice)}</span>
          )}
          {product.comparePrice > product.price && (
            <span className="text-xs text-green-600 font-medium">{Math.round((1 - product.price / product.comparePrice) * 100)}% off</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className={`text-xs font-medium ${stockStatus === 'out_of_stock' ? 'text-red-600' : stockStatus === 'low_stock' ? 'text-yellow-600' : 'text-green-600'}`}>
            {stockStatus === 'out_of_stock' ? 'Out of stock' : stockStatus === 'low_stock' ? `Only ${product.stock} left` : 'In Stock'}
          </span>
          {stockStatus !== 'out_of_stock' && (
            <button onClick={handleAdd} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${added ? 'bg-green-100 text-green-700' : 'bg-navy-900 text-white hover:bg-navy-800'}`}>
              {added ? '✓ Added' : 'Add'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock = searchParams.get('inStock') || '';
  const sort = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const featured = searchParams.get('featured') || '';

  const [localSearch, setLocalSearch] = useState(search);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({ search, category, minPrice, maxPrice, inStock, sort, order, page, limit: 12, featured });
      setProducts(res.data.data.products);
      setTotal(res.data.data.total);
      setPages(res.data.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, minPrice, maxPrice, inStock, sort, order, page, featured]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data.data.categories)).catch(() => {});
  }, []);

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const clearFilters = () => setSearchParams({});

  const hasFilters = category || minPrice || maxPrice || inStock || search || featured;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', localSearch);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">
            {featured ? 'Featured Products' : category ? categories.find(c => c._id === category)?.name || 'Products' : 'All Products'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} product{total !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={`${sort}_${order}`}
            onChange={(e) => { const [s, o] = e.target.value.split('_'); updateParam('sort', s); updateParam('order', o); }}
            className="input max-w-[180px] text-sm"
          >
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A–Z</option>
            <option value="totalSold_desc">Best Selling</option>
          </select>
          <button onClick={() => setFilterOpen(!filterOpen)} className="btn btn-secondary gap-2 lg:hidden">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters - desktop */}
        <aside className={`w-56 flex-shrink-0 ${filterOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="card p-4 sticky top-20 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Filters</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>

            {/* Search */}
            <div>
              <label className="label">Search</label>
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input type="text" className="input pr-8" placeholder="Search products..." value={localSearch} onChange={e => setLocalSearch(e.target.value)} />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Category */}
            <div>
              <label className="label">Category</label>
              <select className="input text-sm" value={category} onChange={e => updateParam('category', e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="label">Price Range (₹)</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" className="input text-sm" value={minPrice}
                  onChange={e => updateParam('minPrice', e.target.value)} />
                <input type="number" placeholder="Max" className="input text-sm" value={maxPrice}
                  onChange={e => updateParam('maxPrice', e.target.value)} />
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="label">Availability</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={inStock === 'true'} onChange={e => updateParam('inStock', e.target.checked ? 'true' : '')} className="rounded" />
                In stock only
              </label>
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {/* Active filters */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {search && <span className="badge bg-navy-100 text-navy-800">Search: "{search}" <button onClick={() => { setLocalSearch(''); updateParam('search', ''); }} className="ml-1 hover:text-navy-900"><X className="w-3 h-3 inline" /></button></span>}
              {category && <span className="badge bg-navy-100 text-navy-800">{categories.find(c => c._id === category)?.name} <button onClick={() => updateParam('category', '')} className="ml-1"><X className="w-3 h-3 inline" /></button></span>}
              {inStock === 'true' && <span className="badge bg-navy-100 text-navy-800">In Stock <button onClick={() => updateParam('inStock', '')} className="ml-1"><X className="w-3 h-3 inline" /></button></span>}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24"><Spinner size="lg" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No products found</h3>
              <p className="text-sm mb-4">Try adjusting your filters or search query.</p>
              <button onClick={clearFilters} className="btn btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
              <div className="mt-8">
                <Pagination page={page} pages={pages} total={total} limit={12}
                  onPageChange={(p) => { const params = new URLSearchParams(searchParams); params.set('page', p); setSearchParams(params); window.scrollTo(0, 0); }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
