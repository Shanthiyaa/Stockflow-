import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Minus, Plus, AlertCircle, CheckCircle2, Star, Package } from 'lucide-react';
import { productAPI } from '../../api';
import { formatCurrency, formatDate } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, items } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedMsg, setAddedMsg] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    productAPI.getOne(id)
      .then(res => {
        setProduct(res.data.data.product);
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, [id]);

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
      <h2 className="text-xl font-semibold text-slate-700 mb-2">Product not found</h2>
      <Link to="/products" className="btn btn-primary mt-4">Back to Products</Link>
    </div>
  );

  const stockStatus = product.stock === 0 ? 'out_of_stock' : product.stock <= product.lowStockThreshold ? 'low_stock' : 'in_stock';
  const inCartQty = items.find(i => i.productId === product._id)?.quantity || 0;
  const maxAddable = product.stock - inCartQty;
  const discount = product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  const handleAddToCart = () => {
    if (quantity > maxAddable) {
      setAddedMsg(`error:Only ${maxAddable} more unit(s) can be added.`);
      return;
    }
    addItem(product, quantity);
    setAddedMsg('success:Added to cart!');
    setTimeout(() => setAddedMsg(''), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-navy-700">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-navy-700">Products</Link>
        <span>/</span>
        {product.category && <Link to={`/products?category=${product.category._id}`} className="hover:text-navy-700">{product.category.name}</Link>}
        <span>/</span>
        <span className="text-slate-700 font-medium truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
            {product.images?.length > 0 ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&size=600&background=e2e8f0&color=64748b&bold=true`; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-200"><Package className="w-24 h-24" /></div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-navy-600' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          {product.brand && <p className="text-sm font-medium text-teal-600 uppercase tracking-wide">{product.brand}</p>}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{product.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm font-mono bg-slate-50 px-2 py-1 rounded">SKU: {product.sku}</span>
            {product.category && (
              <Link to={`/products?category=${product.category._id}`}
                className="text-sm text-navy-600 bg-navy-50 px-2 py-1 rounded hover:bg-navy-100 transition-colors">
                {product.category.name}
              </Link>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-navy-900">{formatCurrency(product.price)}</span>
            {product.comparePrice > product.price && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatCurrency(product.comparePrice)}</span>
                <span className="badge bg-green-100 text-green-700 text-sm font-semibold">{discount}% OFF</span>
              </>
            )}
          </div>

          {/* Stock status */}
          <div className="flex items-center gap-2">
            {stockStatus === 'out_of_stock' ? (
              <><AlertCircle className="w-4 h-4 text-red-500" /><span className="text-red-600 font-medium text-sm">Out of Stock</span></>
            ) : stockStatus === 'low_stock' ? (
              <><AlertCircle className="w-4 h-4 text-yellow-500" /><span className="text-yellow-600 font-medium text-sm">Only {product.stock} left in stock – order soon!</span></>
            ) : (
              <><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-green-600 font-medium text-sm">In Stock ({product.stock} available)</span></>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">{product.description}</p>
          )}

          {/* Quantity + Add to Cart */}
          {stockStatus !== 'out_of_stock' && (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <label className="label">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-slate-500 hover:text-navy-700 hover:bg-slate-50 rounded-l-lg transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-semibold text-slate-800">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-2 text-slate-500 hover:text-navy-700 hover:bg-slate-50 rounded-r-lg transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-400">Max: {product.stock}</span>
              </div>

              {addedMsg && (
                <div className={`flex items-center gap-2 text-sm ${addedMsg.startsWith('error') ? 'text-red-600' : 'text-green-600'}`}>
                  {addedMsg.startsWith('error') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {addedMsg.split(':')[1]}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleAddToCart} className="btn btn-primary flex-1 btn-lg">
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </button>
                <button onClick={() => { handleAddToCart(); if (user) navigate('/cart'); else navigate('/login'); }}
                  className="btn btn-teal btn-lg flex-1">
                  Buy Now
                </button>
              </div>
            </div>
          )}

          {!user && stockStatus !== 'out_of_stock' && (
            <p className="text-xs text-slate-500">
              <Link to="/login" className="text-navy-600 underline">Sign in</Link> to complete purchase.
            </p>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {product.tags.map(tag => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
