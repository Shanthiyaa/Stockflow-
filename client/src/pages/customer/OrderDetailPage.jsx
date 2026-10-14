import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, ArrowLeft, MapPin, CreditCard, AlertCircle } from 'lucide-react';
import { orderAPI } from '../../api';
import { formatCurrency, formatDate, formatDateTime, getOrderStatusBadgeClass, getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/format';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';

const STATUS_ICONS = { placed: '📦', packed: '🗃️', shipped: '🚚', delivered: '✅', cancelled: '❌' };

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchOrder = () => {
    orderAPI.getOne(id).then(r => { setOrder(r.data.data.order); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await orderAPI.cancel(id, { reason: cancelReason || 'Cancelled by customer' });
      setCancelOpen(false);
      setSuccessMsg('Order cancelled. Stock has been restored.');
      fetchOrder();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!order) return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <Package className="w-16 h-16 mx-auto text-slate-200 mb-4" />
      <p className="text-slate-500">Order not found.</p>
      <Link to="/orders" className="btn btn-primary mt-4">My Orders</Link>
    </div>
  );

  const canCancel = ['placed', 'packed'].includes(order.status);
  const statuses = ['placed', 'packed', 'shipped', 'delivered'];
  const currentIdx = order.status === 'cancelled' ? -1 : statuses.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/orders" className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {error && <Alert variant="error" message={error} onClose={() => setError('')} className="mb-4" />}
      {successMsg && <Alert variant="success" message={successMsg} onClose={() => setSuccessMsg('')} className="mb-4" />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Order #{order.orderNumber}</h1>
          <p className="text-sm text-slate-500 mt-1">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${getOrderStatusBadgeClass(order.status)} text-sm px-3 py-1`}>{getOrderStatusLabel(order.status)}</span>
          <span className={`badge badge-${order.paymentStatus} text-sm px-3 py-1`}>{getPaymentStatusLabel(order.paymentStatus)}</span>
          {canCancel && (
            <button onClick={() => setCancelOpen(true)} className="btn btn-danger btn-sm">Cancel Order</button>
          )}
        </div>
      </div>

      {/* Delivery Timeline */}
      {order.status !== 'cancelled' && (
        <div className="card p-5 mb-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Order Timeline</h3>
          <div className="flex items-start gap-0">
            {statuses.map((status, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={status} className={`flex items-center ${i < statuses.length - 1 ? 'flex-1' : ''}`}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base transition-colors ${done ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-400'} ${active ? 'ring-4 ring-navy-200' : ''}`}>
                      {STATUS_ICONS[status]}
                    </div>
                    <p className={`text-xs mt-2 font-medium capitalize ${done ? 'text-navy-900' : 'text-slate-400'}`}>{status}</p>
                    {order.statusHistory?.find(h => h.status === status) && (
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.statusHistory.find(h => h.status === status).timestamp)}</p>
                    )}
                  </div>
                  {i < statuses.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mt-5 self-start ${i < currentIdx ? 'bg-navy-900' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
          {order.estimatedDelivery && order.status !== 'delivered' && (
            <p className="text-sm text-green-600 font-medium mt-4">🚚 Estimated delivery: {formatDate(order.estimatedDelivery)}</p>
          )}
        </div>
      )}

      {order.status === 'cancelled' && (
        <div className="card p-4 mb-5 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium text-sm">Order Cancelled</span>
          </div>
          {order.cancelReason && <p className="text-sm text-red-600 mt-1">Reason: {order.cancelReason}</p>}
          {order.paymentStatus === 'refunded' && <p className="text-sm text-green-600 mt-1">✓ Payment refunded (demo refund).</p>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Items */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="section-title mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                  ) : <Package className="w-6 h-6 m-5 text-slate-200" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900">{item.productName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">SKU: {item.productSKU}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatCurrency(item.unitPrice)} × {item.quantity}</p>
                </div>
                <p className="font-bold text-slate-800 text-sm">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-4 mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(order.itemsTotal)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Shipping</span><span>{order.shippingCharge === 0 ? 'FREE' : formatCurrency(order.shippingCharge)}</span></div>
            <div className="flex justify-between font-bold text-base text-navy-900 pt-1 border-t border-slate-100">
              <span>Total</span><span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" />Delivery Address</h3>
            <div className="text-sm text-slate-600 space-y-0.5">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
              <p>PIN: {order.shippingAddress.pincode}</p>
              <p>📞 {order.shippingAddress.phone}</p>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" />Payment Info</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <div className="flex justify-between"><span>Method</span><span className="font-medium capitalize">{order.paymentMethod?.replace('demo_', '').toUpperCase()}</span></div>
              <div className="flex justify-between"><span>Status</span><span className={`badge badge-${order.paymentStatus} text-xs`}>{getPaymentStatusLabel(order.paymentStatus)}</span></div>
              {order.paymentTransactionId && <p className="text-xs text-slate-400 break-all mt-1">TXN: {order.paymentTransactionId}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Order"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCancelOpen(false)} disabled={cancelling}>Keep Order</button>
            <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
            </button>
          </>
        }>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Are you sure you want to cancel order <strong>#{order.orderNumber}</strong>? Stock will be restored.</p>
          <div className="form-group">
            <label className="label">Reason (optional)</label>
            <textarea className="input" rows={3} placeholder="Let us know why..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
