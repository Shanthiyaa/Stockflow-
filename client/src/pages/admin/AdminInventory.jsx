import { useState, useEffect, useCallback } from 'react';
import { Search, AlertTriangle, Plus, Minus, History } from 'lucide-react';
import { inventoryAPI, categoryAPI } from '../../api';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';

function StockBadge({ stock, threshold }) {
  if (stock === 0) return <span className="badge badge-out-of-stock">Out of Stock</span>;
  if (stock <= threshold) return <span className="badge badge-low-stock">Low Stock</span>;
  return <span className="badge badge-in-stock">In Stock</span>;
}

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [adjustModal, setAdjustModal] = useState({ open: false, product: null });
  const [historyModal, setHistoryModal] = useState(false);
  const [movements, setMovements] = useState([]);
  const [movLoading, setMovLoading] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ type: 'adjustment_add', quantity: '', reason: '' });
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alerts, setAlerts] = useState({ outOfStock: [], lowStock: [] });

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.getAll({ search, stockStatus: stockFilter, page, limit: 15 });
      setProducts(res.data.data.products);
      setTotal(res.data.data.total);
      setPages(res.data.data.pages);
    } finally { setLoading(false); }
  }, [search, stockFilter, page]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  useEffect(() => {
    inventoryAPI.getAlerts().then(r => setAlerts(r.data.data)).catch(() => {});
  }, []);

  const openAdjust = (product) => {
    setAdjustModal({ open: true, product });
    setAdjustForm({ type: 'adjustment_add', quantity: '', reason: '' });
    setError('');
  };

  const handleAdjust = async () => {
    if (!adjustForm.quantity || Number(adjustForm.quantity) <= 0) { setError('Enter a valid quantity.'); return; }
    setAdjusting(true);
    try {
      await inventoryAPI.adjust({ productId: adjustModal.product._id, ...adjustForm, quantity: Number(adjustForm.quantity) });
      setAdjustModal({ open: false, product: null });
      setSuccess('Stock adjusted successfully.');
      fetchInventory();
      inventoryAPI.getAlerts().then(r => setAlerts(r.data.data)).catch(() => {});
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setAdjusting(false); }
  };

  const openHistory = async () => {
    setHistoryModal(true);
    setMovLoading(true);
    try {
      const res = await inventoryAPI.getMovements({ limit: 50 });
      setMovements(res.data.data.movements);
    } finally { setMovLoading(false); }
  };

  const MOVE_TYPE_COLORS = { sale: 'text-red-600', purchase: 'text-green-600', return: 'text-green-600', adjustment_add: 'text-blue-600', adjustment_remove: 'text-orange-600', damage: 'text-red-600' };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Inventory</h1><p className="text-sm text-slate-500 mt-1">{total} products</p></div>
        <button onClick={openHistory} className="btn btn-secondary btn-sm flex items-center gap-2"><History className="w-4 h-4" />Movement History</button>
      </div>

      {success && <Alert variant="success" message={success} onClose={() => setSuccess('')} className="mb-4" />}

      {/* Stock alerts */}
      {(alerts.outOfStock?.length > 0 || alerts.lowStock?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {alerts.outOfStock?.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-600" /><p className="text-sm font-semibold text-red-800">{alerts.outOfStock.length} Out of Stock</p></div>
              <ul className="text-xs text-red-700 space-y-1 max-h-28 overflow-y-auto">
                {alerts.outOfStock.map(p => <li key={p._id}>• {p.name} ({p.sku})</li>)}
              </ul>
            </div>
          )}
          {alerts.lowStock?.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-yellow-600" /><p className="text-sm font-semibold text-yellow-800">{alerts.lowStock.length} Low Stock</p></div>
              <ul className="text-xs text-yellow-700 space-y-1 max-h-28 overflow-y-auto">
                {alerts.lowStock.map(p => <li key={p._id}>• {p.name} — {p.stock}/{p.lowStockThreshold} units</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search product, SKU..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input max-w-[160px]" value={stockFilter} onChange={e => { setStockFilter(e.target.value); setPage(1); }}>
          <option value="">All Stock</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr>{['Product', 'SKU', 'Category', 'Stock', 'Low Stock Alert', 'Price', 'Status', 'Adjust'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={8} className="td text-center py-12"><Spinner /></td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="td text-center py-12 text-slate-400">No products found.</td></tr>
            ) : products.map(p => (
              <tr key={p._id} className="tr-hover">
                <td className="td">
                  <p className="text-sm font-semibold text-slate-800 max-w-[180px] truncate">{p.name}</p>
                </td>
                <td className="td"><span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">{p.sku}</span></td>
                <td className="td text-sm text-slate-500">{p.category?.name || '—'}</td>
                <td className="td">
                  <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-600' : p.stock <= p.lowStockThreshold ? 'text-yellow-600' : 'text-slate-800'}`}>{p.stock}</span>
                  <span className="text-xs text-slate-400 ml-1">units</span>
                </td>
                <td className="td text-sm text-slate-500">{p.lowStockThreshold}</td>
                <td className="td text-sm font-medium">{formatCurrency(p.price)}</td>
                <td className="td"><StockBadge stock={p.stock} threshold={p.lowStockThreshold} /></td>
                <td className="td">
                  <button onClick={() => openAdjust(p)} className="btn btn-secondary btn-sm">Adjust</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pt-2"><Pagination page={page} pages={pages} total={total} limit={15} onPageChange={setPage} /></div>

      {/* Adjust Modal */}
      <Modal isOpen={adjustModal.open} onClose={() => setAdjustModal({ open: false, product: null })} title={`Adjust Stock: ${adjustModal.product?.name}`} size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAdjustModal({ open: false, product: null })} disabled={adjusting}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdjust} disabled={adjusting}>{adjusting ? 'Adjusting...' : 'Apply Adjustment'}</button>
          </>
        }>
        {error && <Alert variant="error" message={error} className="mb-3" />}
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl text-sm">
            <span className="text-slate-500">Current Stock: </span>
            <span className="font-bold text-slate-800">{adjustModal.product?.stock} units</span>
          </div>
          <div className="form-group">
            <label className="label">Adjustment Type</label>
            <select className="input" value={adjustForm.type} onChange={e => setAdjustForm(p => ({ ...p, type: e.target.value }))}>
              <option value="adjustment_add">Add Stock (Restock)</option>
              <option value="purchase">Purchase / Received</option>
              <option value="return">Customer Return</option>
              <option value="adjustment_remove">Remove Stock</option>
              <option value="damage">Damaged / Expired</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Quantity *</label>
            <input type="number" className="input" min="1" value={adjustForm.quantity} onChange={e => setAdjustForm(p => ({ ...p, quantity: e.target.value }))} placeholder="10" />
          </div>
          <div className="form-group">
            <label className="label">Reason</label>
            <input className="input" value={adjustForm.reason} onChange={e => setAdjustForm(p => ({ ...p, reason: e.target.value }))} placeholder="Received from supplier" />
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={historyModal} onClose={() => setHistoryModal(false)} title="Inventory Movement History" size="lg">
        {movLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {movements.length === 0 ? <p className="text-center text-slate-400 py-8">No movements recorded yet.</p> : movements.map(m => (
              <div key={m._id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className={`flex-shrink-0 font-bold text-sm ${MOVE_TYPE_COLORS[m.type] || 'text-slate-600'}`}>
                  {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{m.product?.name}</p>
                  <p className="text-xs text-slate-500">{m.type.replace('_', ' ')} · {m.stockBefore} → {m.stockAfter}</p>
                  {m.reason && <p className="text-xs text-slate-400">{m.reason}</p>}
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">{formatDateTime(m.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
