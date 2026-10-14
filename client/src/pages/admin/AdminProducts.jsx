import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Package, X, Image } from 'lucide-react';
import { productAPI, categoryAPI } from '../../api';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';

const EMPTY_PRODUCT = { name: '', description: '', price: '', comparePrice: '', sku: '', category: '', images: [''], stock: '', lowStockThreshold: '10', brand: '', isFeatured: false, isActive: true, tags: '' };

function StockBadge({ stock, threshold }) {
  if (stock === 0) return <span className="badge badge-out-of-stock">Out of Stock</span>;
  if (stock <= threshold) return <span className="badge badge-low-stock">Low Stock</span>;
  return <span className="badge badge-in-stock">In Stock</span>;
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAllAdmin({ search, category: categoryFilter, stockStatus: stockFilter, page, limit: 15 });
      setProducts(res.data.data.products);
      setTotal(res.data.data.total);
      setPages(res.data.data.pages);
    } finally { setLoading(false); }
  }, [search, categoryFilter, stockFilter, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { categoryAPI.getAll().then(r => setCategories(r.data.data.categories)).catch(() => {}); }, []);

  const openCreate = () => { setEditingProduct(null); setForm(EMPTY_PRODUCT); setError(''); setModalOpen(true); };
  const openEdit = (p) => {
    setEditingProduct(p);
    setForm({ ...p, price: p.price, comparePrice: p.comparePrice || '', stock: p.stock, lowStockThreshold: p.lowStockThreshold, images: p.images?.length ? p.images : [''], tags: p.tags?.join(', ') || '', category: p.category?._id || p.category });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.sku || !form.category || form.stock === '') { setError('Name, price, SKU, category, and stock are required.'); return; }
    if (Number(form.price) < 0) { setError('Price cannot be negative.'); return; }
    if (Number(form.stock) < 0) { setError('Stock cannot be negative.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold) || 10,
        images: form.images.filter(Boolean),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      if (editingProduct) {
        await productAPI.update(editingProduct._id, payload);
        setSuccessMsg('Product updated.');
      } else {
        await productAPI.create(payload);
        setSuccessMsg('Product created.');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteModal.product) return;
    setDeleting(true);
    try {
      await productAPI.delete(deleteModal.product._id);
      setDeleteModal({ open: false, product: null });
      setSuccessMsg('Product deactivated (historical orders preserved).');
      fetchProducts();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setDeleting(false); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-sm text-slate-500 mt-1">{total} product{total !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus className="w-4 h-4" /> Add Product</button>
      </div>

      {successMsg && <Alert variant="success" message={successMsg} onClose={() => setSuccessMsg('')} className="mb-4" />}
      {error && !modalOpen && <Alert variant="error" message={error} onClose={() => setError('')} className="mb-4" />}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search products, SKU..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input max-w-[180px]" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="input max-w-[160px]" value={stockFilter} onChange={e => { setStockFilter(e.target.value); setPage(1); }}>
          <option value="">All Stock</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="td text-center py-12"><Spinner /></td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="td text-center py-12 text-slate-400">No products found.</td></tr>
            ) : products.map(p => (
              <tr key={p._id} className="tr-hover">
                <td className="td">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                      {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" onError={e => { e.target.onerror = null; e.target.src = ''; }} /> : <Package className="w-5 h-5 m-2.5 text-slate-300" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.brand || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="td"><span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">{p.sku}</span></td>
                <td className="td text-sm text-slate-600">{p.category?.name || '—'}</td>
                <td className="td">
                  <p className="text-sm font-semibold">{formatCurrency(p.price)}</p>
                  {p.comparePrice > p.price && <p className="text-xs text-slate-400 line-through">{formatCurrency(p.comparePrice)}</p>}
                </td>
                <td className="td"><span className="text-sm font-medium">{p.stock}</span><span className="text-xs text-slate-400 ml-1">units</span></td>
                <td className="td"><StockBadge stock={p.stock} threshold={p.lowStockThreshold} /></td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteModal({ open: true, product: p })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pt-2"><Pagination page={page} pages={pages} total={total} limit={15} onPageChange={setPage} /></div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'} size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}</button>
          </>
        }>
        {error && <Alert variant="error" message={error} className="mb-4" />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group sm:col-span-2">
            <label className="label">Product Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="iPhone 14 Pro" />
          </div>
          <div className="form-group sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Product description..." />
          </div>
          <div className="form-group">
            <label className="label">SKU *</label>
            <input className="input font-mono" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value.toUpperCase() }))} placeholder="PROD-001" />
          </div>
          <div className="form-group">
            <label className="label">Category *</label>
            <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Price (₹) *</label>
            <input type="number" className="input" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="999" />
          </div>
          <div className="form-group">
            <label className="label">Compare Price (₹)</label>
            <input type="number" className="input" min="0" step="0.01" value={form.comparePrice} onChange={e => setForm(p => ({ ...p, comparePrice: e.target.value }))} placeholder="1299 (optional)" />
          </div>
          <div className="form-group">
            <label className="label">Stock *</label>
            <input type="number" className="input" min="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} placeholder="100" />
          </div>
          <div className="form-group">
            <label className="label">Low Stock Threshold</label>
            <input type="number" className="input" min="0" value={form.lowStockThreshold} onChange={e => setForm(p => ({ ...p, lowStockThreshold: e.target.value }))} placeholder="10" />
          </div>
          <div className="form-group">
            <label className="label">Brand</label>
            <input className="input" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="Apple" />
          </div>
          <div className="form-group">
            <label className="label">Tags (comma-separated)</label>
            <input className="input" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="electronics, mobile, apple" />
          </div>
          <div className="form-group sm:col-span-2">
            <label className="label">Image URL</label>
            <input className="input" value={form.images[0]} onChange={e => setForm(p => ({ ...p, images: [e.target.value] }))} placeholder="https://example.com/image.jpg" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} />
              <span className="text-sm text-slate-600">Featured product</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
              <span className="text-sm text-slate-600">Active</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null })}
        onConfirm={handleDelete}
        title="Deactivate Product"
        message={`Deactivate "${deleteModal.product?.name}"? It will be hidden from customers. Historical orders remain intact.`}
        confirmText="Deactivate"
        loading={deleting}
      />
    </div>
  );
}
