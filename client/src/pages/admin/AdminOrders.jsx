import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronRight, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../api';
import { formatCurrency, formatDate, getOrderStatusBadgeClass, getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getAllAdmin({ search, status: statusFilter, paymentStatus: paymentFilter, page, limit: 20 });
      setOrders(res.data.data.orders);
      setTotal(res.data.data.total);
      setPages(res.data.data.pages);
    } finally { setLoading(false); }
  }, [search, statusFilter, paymentFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Orders</h1><p className="text-sm text-slate-500 mt-1">{total} total orders</p></div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search order number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input max-w-[160px]" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {['placed','packed','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="input max-w-[160px]" value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }}>
          <option value="">All Payments</option>
          {['pending','paid','failed','refunded'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>{['Order', 'Customer', 'Date', 'Items', 'Amount', 'Status', 'Payment', ''].map(h => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={8} className="td text-center py-12"><Spinner /></td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="td text-center py-12 text-slate-400">No orders found.</td></tr>
            ) : orders.map(order => (
              <tr key={order._id} className="tr-hover">
                <td className="td"><span className="font-mono text-sm font-semibold text-navy-800">#{order.orderNumber}</span></td>
                <td className="td">
                  <p className="text-sm font-medium text-slate-800">{order.customer?.name || '—'}</p>
                  <p className="text-xs text-slate-400">{order.customer?.email}</p>
                </td>
                <td className="td text-sm text-slate-500">{formatDate(order.createdAt)}</td>
                <td className="td text-sm text-slate-600">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</td>
                <td className="td"><span className="font-bold text-sm">{formatCurrency(order.totalAmount)}</span></td>
                <td className="td"><span className={`badge ${getOrderStatusBadgeClass(order.status)}`}>{getOrderStatusLabel(order.status)}</span></td>
                <td className="td"><span className={`badge badge-${order.paymentStatus}`}>{getPaymentStatusLabel(order.paymentStatus)}</span></td>
                <td className="td">
                  <Link to={`/admin/orders/${order._id}`} className="flex items-center gap-1 text-xs font-medium text-navy-600 hover:text-navy-800">
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pt-2"><Pagination page={page} pages={pages} total={total} limit={20} onPageChange={setPage} /></div>
    </div>
  );
}
