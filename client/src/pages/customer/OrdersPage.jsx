import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { orderAPI } from '../../api';
import { formatCurrency, formatDate, getOrderStatusBadgeClass, getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    orderAPI.getMyOrders({ page, limit: 10, ...(statusFilter && { status: statusFilter }) })
      .then(r => {
        setOrders(r.data.data.orders);
        setPages(r.data.data.pages);
        setTotal(r.data.data.total);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="text-sm text-slate-500 mt-1">{total} order{total !== 1 ? 's' : ''} total</p>
        </div>
        <select className="input max-w-[160px] text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {['placed','packed','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No orders yet</h3>
          <p className="text-sm text-slate-500 mb-6">Your orders will appear here once you place them.</p>
          <Link to="/products" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order._id} to={`/orders/${order._id}`} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-card-hover transition-shadow group">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-bold text-navy-900">#{order.orderNumber}</p>
                  <span className={`badge ${getOrderStatusBadgeClass(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
                  <span className={`badge badge-${order.paymentStatus}`}>{getPaymentStatusLabel(order.paymentStatus)}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>{formatDate(order.createdAt)}</span>
                  <span>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
                  {order.items?.slice(0, 2).map((item, i) => (
                    <span key={i} className="truncate max-w-[150px]">{item.productName}</span>
                  ))}
                  {order.items?.length > 2 && <span>+{order.items.length - 2} more</span>}
                </div>
              </div>
              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 flex-shrink-0">
                <p className="font-bold text-lg text-slate-900">{formatCurrency(order.totalAmount)}</p>
                <span className="flex items-center gap-1 text-xs text-navy-600 font-medium group-hover:underline">
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
          <div className="pt-2">
            <Pagination page={page} pages={pages} total={total} limit={10} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
