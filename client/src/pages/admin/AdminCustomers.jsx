import { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';
import { userAPI, orderAPI } from '../../api';
import { formatDate, formatCurrency } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [orderModal, setOrderModal] = useState({ open: false, customer: null, orders: [] });
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    userAPI.getAllUsers({ search, page, limit: 20 })
      .then(r => {
        setCustomers(r.data.data.users);
        setTotal(r.data.data.total);
        setPages(r.data.data.pages);
      })
      .finally(() => setLoading(false));
  }, [search, page]);

  const openOrders = async (customer) => {
    setOrderModal({ open: true, customer, orders: [] });
    setOrdersLoading(true);
    try {
      const res = await orderAPI.getAllAdmin({ search: '', page: 1, limit: 50 });
      const customerOrders = res.data.data.orders.filter(o => o.customer?._id === customer._id || o.customer === customer._id);
      setOrderModal(p => ({ ...p, orders: customerOrders }));
    } finally { setOrdersLoading(false); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Customers</h1><p className="text-sm text-slate-500 mt-1">{total} registered customers</p></div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className="input pl-9" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>{['Customer', 'Email', 'Phone', 'Joined', 'Last Login', 'Orders'].map(h => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="td text-center py-12"><Spinner /></td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="td text-center py-12 text-slate-400">No customers found.</td></tr>
            ) : customers.map(c => (
              <tr key={c._id} className="tr-hover">
                <td className="td">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-navy-800 text-xs font-semibold">{c.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                  </div>
                </td>
                <td className="td text-sm text-slate-600">{c.email}</td>
                <td className="td text-sm text-slate-500">{c.phone || '—'}</td>
                <td className="td text-sm text-slate-500">{formatDate(c.createdAt)}</td>
                <td className="td text-sm text-slate-500">{c.lastLogin ? formatDate(c.lastLogin) : 'Never'}</td>
                <td className="td">
                  <button onClick={() => openOrders(c)} className="flex items-center gap-1 text-xs text-navy-600 hover:text-navy-800 font-medium">
                    <ShoppingBag className="w-3.5 h-3.5" /> View Orders
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pt-2"><Pagination page={page} pages={pages} total={total} limit={20} onPageChange={setPage} /></div>

      {/* Orders modal */}
      <Modal isOpen={orderModal.open} onClose={() => setOrderModal({ open: false, customer: null, orders: [] })} title={`Orders: ${orderModal.customer?.name}`} size="lg">
        {ordersLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
          orderModal.orders.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No orders placed by this customer yet.</p>
          ) : (
            <div className="space-y-3">
              {orderModal.orders.map(o => (
                <div key={o._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-800">#{o.orderNumber}</p>
                    <p className="text-xs text-slate-400">{formatDate(o.createdAt)} · {o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-navy-900">{formatCurrency(o.totalAmount)}</p>
                    <span className={`badge badge-${o.status}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
