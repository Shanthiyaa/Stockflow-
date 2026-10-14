import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Truck, Home, ArrowRight } from 'lucide-react';
import { orderAPI } from '../../api';
import { formatCurrency, formatDate } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';

export default function OrderConfirmPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getOne(id).then(r => { setOrder(r.data.data.order); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!order) return <div className="text-center py-24"><p className="text-slate-500">Order not found.</p></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Placed!</h1>
        <p className="text-slate-500">Thank you for shopping with StockFlow.</p>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Order Number</p>
            <p className="text-xl font-bold text-navy-900">#{order.orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Placed On</p>
            <p className="text-sm font-medium text-slate-700">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Status Timeline</p>
          <div className="flex items-center gap-0">
            {['placed', 'packed', 'shipped', 'delivered'].map((status, i) => {
              const reached = ['placed', 'packed', 'shipped', 'delivered'].indexOf(order.status) >= i;
              return (
                <div key={status} className="flex items-center flex-1">
                  <div className={`flex flex-col items-center ${i > 0 ? 'flex-1' : ''}`}>
                    {i > 0 && <div className={`h-px w-full ${reached ? 'bg-navy-900' : 'bg-slate-200'} mb-2`} />}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${reached ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {i + 1}
                    </div>
                    <p className={`text-xs mt-1 capitalize ${reached ? 'text-navy-800 font-medium' : 'text-slate-400'}`}>{status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3 mb-5">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                {item.productImage ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 m-3 text-slate-300" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{item.productName}</p>
                <p className="text-xs text-slate-400">× {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-slate-700">{formatCurrency(item.totalPrice)}</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-100 pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(order.itemsTotal)}</span></div>
          <div className="flex justify-between text-slate-500"><span>Shipping</span><span>{order.shippingCharge === 0 ? 'FREE' : formatCurrency(order.shippingCharge)}</span></div>
          <div className="flex justify-between font-bold text-base text-navy-900 pt-2 border-t border-slate-100">
            <span>Total Paid</span><span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* Delivery address */}
        <div className="mt-5 p-3 bg-slate-50 rounded-xl">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Delivering To</p>
          <p className="text-sm text-slate-700">
            {order.shippingAddress.fullName}, {order.shippingAddress.addressLine1}, {order.shippingAddress.city} – {order.shippingAddress.pincode}
          </p>
          {order.estimatedDelivery && (
            <p className="text-xs text-green-600 mt-1 font-medium">🚚 Estimated delivery: {formatDate(order.estimatedDelivery)}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to={`/orders/${order._id}`} className="btn btn-primary flex-1 btn-lg">
          Track Order <Truck className="w-4 h-4" />
        </Link>
        <Link to="/products" className="btn btn-secondary flex-1 btn-lg">
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
