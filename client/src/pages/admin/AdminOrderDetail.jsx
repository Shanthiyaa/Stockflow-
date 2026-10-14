import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import { orderAPI } from '../../api';
import { formatCurrency, formatDateTime, getOrderStatusBadgeClass, getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/format';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';

const VALID_TRANSITIONS = { placed: ['packed', 'cancelled'], packed: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchOrder = () => orderAPI.getOneAdmin(id).then(r => { setOrder(r.data.data.order); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { fetchOrder(); }, [id]);

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await orderAPI.updateStatus(id, { status: newStatus, note: statusNote });
      setStatusModal(false);
      setSuccess(`Order status updated to "${newStatus}".`);
      fetchOrder();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setUpdating(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  if (!order) return <div className="p-6 text-center text-slate-500">Order not found.</div>;

  const nextStatuses = VALID_TRANSITIONS[order.status] || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/admin/orders" className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All Orders
      </Link>

      {error && <Alert variant="error" message={error} onClose={() => setError('')} className="mb-4" />}
      {success && <Alert variant="success" message={success} onClose={() => setSuccess('')} className="mb-4" />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Order #{order.orderNumber}</h1>
          <p className="text-sm text-slate-500 mt-1">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`badge text-sm px-3 py-1 ${getOrderStatusBadgeClass(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
          <span className={`badge badge-${order.paymentStatus} text-sm px-3 py-1`}>{getPaymentStatusLabel(order.paymentStatus)}</span>
          {nextStatuses.length > 0 && (
            <button onClick={() => { setNewStatus(nextStatuses[0]); setStatusNote(''); setStatusModal(true); }} className="btn btn-primary btn-sm">
              Update Status
            </button>
          )}
        </div>
      </div>

      {/* Customer info */}
      <div className="card p-4 mb-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-navy-800 font-semibold text-sm">{order.customer?.name?.[0]?.toUpperCase()}</span>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{order.customer?.name}</p>
          <p className="text-sm text-slate-500">{order.customer?.email}</p>
          {order.customer?.phone && <p className="text-sm text-slate-500">📞 {order.customer.phone}</p>}
        </div>
      </div>

      {/* Status history */}
      {order.statusHistory?.length > 0 && (
        <div className="card p-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Status History</h3>
          <div className="space-y-2">
            {order.statusHistory.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${h.status === 'cancelled' ? 'bg-red-500' : 'bg-navy-600'}`} />
                <div>
                  <span className={`badge ${getOrderStatusBadgeClass(h.status)}`}>{getOrderStatusLabel(h.status)}</span>
                  {h.note && <p className="text-xs text-slate-500 mt-0.5">{h.note}</p>}
                  <p className="text-xs text-slate-400">{formatDateTime(h.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Items */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="section-title mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="w-14 h-14 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                  {item.productImage ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 m-4 text-slate-200" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{item.productName}</p>
                  <p className="text-xs text-slate-400">SKU: {item.productSKU}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatCurrency(item.unitPrice)} × {item.quantity}</p>
                </div>
                <p className="font-bold text-sm text-slate-800 flex-shrink-0">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-4 mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500"><span>Items Total</span><span>{formatCurrency(order.itemsTotal)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Shipping</span><span>{order.shippingCharge === 0 ? 'FREE' : formatCurrency(order.shippingCharge)}</span></div>
            <div className="flex justify-between font-bold text-base text-navy-900 pt-1 border-t border-slate-100">
              <span>Total</span><span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" />Shipping Address</h3>
            <div className="text-sm text-slate-600 space-y-0.5">
              <p className="font-medium">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
              <p>PIN: {order.shippingAddress?.pincode}</p>
              <p>📞 {order.shippingAddress?.phone}</p>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" />Payment</h3>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Method</span><span className="font-medium capitalize">{order.paymentMethod?.replace('demo_', '')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`badge badge-${order.paymentStatus}`}>{getPaymentStatusLabel(order.paymentStatus)}</span></div>
              {order.paymentTransactionId && <p className="text-xs text-slate-400 break-all">TXN: {order.paymentTransactionId}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Update Order Status" size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setStatusModal(false)} disabled={updating}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={updating || !newStatus}>{updating ? 'Updating...' : 'Update Status'}</button>
          </>
        }>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">New Status</label>
            <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {nextStatuses.map(s => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Note (optional)</label>
            <input className="input" value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="e.g. Dispatched via BlueDart" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
