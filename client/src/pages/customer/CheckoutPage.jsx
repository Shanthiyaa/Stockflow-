import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Smartphone, Building2, Package2, MapPin, CheckCircle2, AlertCircle, Truck, Info } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { cartAPI, orderAPI, paymentAPI } from '../../api';
import { formatCurrency } from '../../utils/format';
import { getErrorMessage } from '../../api/axios';
import Alert from '../../components/ui/Alert';

const PAYMENT_METHODS = [
  { id: 'demo_card', label: 'Credit / Debit Card', icon: CreditCard, note: 'Simulated – no real card data collected' },
  { id: 'demo_upi', label: 'UPI Payment', icon: Smartphone, note: 'Simulated UPI flow' },
  { id: 'demo_netbanking', label: 'Net Banking', icon: Building2, note: 'Simulated net banking' },
  { id: 'demo_cod', label: 'Cash on Delivery', icon: Package2, note: 'Pay when delivered' },
];

export default function CheckoutPage() {
  const { items, itemsTotal, shippingCharge, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const defaultAddress = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];

  const [step, setStep] = useState(1); // 1: address, 2: payment, 3: processing
  const [address, setAddress] = useState(defaultAddress || {
    fullName: user?.name || '', addressLine1: '', addressLine2: '', city: '',
    state: '', pincode: '', phone: user?.phone || '',
  });
  const [useExistingAddress, setUseExistingAddress] = useState(!!defaultAddress);
  const [selectedAddress, setSelectedAddress] = useState(defaultAddress?._id || '');
  const [paymentMethod, setPaymentMethod] = useState('demo_card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationIssues, setValidationIssues] = useState([]);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-slate-500 mb-4">Your cart is empty.</p>
        <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  const getShippingAddress = () => {
    if (useExistingAddress && selectedAddress) {
      return user.addresses.find(a => a._id === selectedAddress) || address;
    }
    return address;
  };

  const validateAddress = () => {
    const addr = getShippingAddress();
    const required = ['fullName', 'addressLine1', 'city', 'state', 'pincode', 'phone'];
    return required.every(f => addr[f]?.trim());
  };

  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Validate cart against current DB
      const validateRes = await cartAPI.validate(items.map(i => ({ productId: i.productId, quantity: i.quantity })));
      const { issues, hasIssues } = validateRes.data.data;

      if (hasIssues) {
        setValidationIssues(issues);
        setLoading(false);
        setStep(1);
        return;
      }

      // 2. Simulate payment
      let transactionId = null;
      if (paymentMethod !== 'demo_cod') {
        // For demo: directly create a fake transaction ID
        transactionId = `DEMO-TXN-${Date.now()}`;
      }

      // 3. Create order
      const orderRes = await orderAPI.create({
        items: items.map(i => ({ product: i.productId, quantity: i.quantity })),
        shippingAddress: getShippingAddress(),
        paymentMethod,
        paymentTransactionId: transactionId,
      });

      clearCart();
      navigate(`/order-confirm/${orderRes.data.data.order._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-title mb-6">Checkout</h1>

      {/* Demo payment notice */}
      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-6">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Demo Mode:</strong> This is a simulated payment flow for academic demonstration. No real payment is processed and no card data is stored.
        </p>
      </div>

      {error && <Alert variant="error" message={error} onClose={() => setError('')} className="mb-4" />}
      {validationIssues.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-medium text-red-800 text-sm mb-2">⚠️ Cart issues detected:</p>
          <ul className="text-sm text-red-700 space-y-1">
            {validationIssues.map((issue, i) => (
              <li key={i}>• {issue.productName}: {issue.issue}</li>
            ))}
          </ul>
          <Link to="/cart" className="btn btn-danger btn-sm mt-3">Update Cart</Link>
        </div>
      )}

      {/* Step indicators */}
      <div className="flex items-center gap-4 mb-8">
        {[{ n: 1, label: 'Delivery' }, { n: 2, label: 'Payment' }, { n: 3, label: 'Confirm' }].map(({ n, label }) => (
          <div key={n} className={`flex items-center gap-2 ${n < 3 ? 'flex-1' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= n ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{n}</div>
            <span className={`text-sm font-medium hidden sm:block ${step >= n ? 'text-navy-900' : 'text-slate-400'}`}>{label}</span>
            {n < 3 && <div className={`flex-1 h-px ${step > n ? 'bg-navy-900' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Shipping Address */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="section-title mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-navy-600" /> Delivery Address</h2>

              {user?.addresses?.length > 0 && (
                <div className="mb-4 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={useExistingAddress} onChange={() => setUseExistingAddress(true)} className="text-navy-600" />
                    <span className="text-sm font-medium text-slate-700">Use saved address</span>
                  </label>
                  {useExistingAddress && (
                    <div className="ml-5 space-y-2">
                      {user.addresses.map(addr => (
                        <label key={addr._id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedAddress === addr._id ? 'border-navy-500 bg-navy-50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <input type="radio" name="address" value={addr._id} checked={selectedAddress === addr._id}
                            onChange={() => setSelectedAddress(addr._id)} className="mt-0.5" />
                          <div className="text-sm text-slate-700">
                            <p className="font-medium">{addr.fullName}</p>
                            <p>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                            <p>{addr.city}, {addr.state} – {addr.pincode}</p>
                            <p>📞 {addr.phone}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!useExistingAddress} onChange={() => setUseExistingAddress(false)} />
                    <span className="text-sm font-medium text-slate-700">Enter new address</span>
                  </label>
                </div>
              )}

              {(!useExistingAddress || user?.addresses?.length === 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group sm:col-span-2">
                    <label className="label">Full Name *</label>
                    <input className="input" value={address.fullName} onChange={e => setAddress(p => ({ ...p, fullName: e.target.value }))} placeholder="John Doe" />
                  </div>
                  <div className="form-group sm:col-span-2">
                    <label className="label">Address Line 1 *</label>
                    <input className="input" value={address.addressLine1} onChange={e => setAddress(p => ({ ...p, addressLine1: e.target.value }))} placeholder="House/Flat/Block No., Street" />
                  </div>
                  <div className="form-group sm:col-span-2">
                    <label className="label">Address Line 2</label>
                    <input className="input" value={address.addressLine2} onChange={e => setAddress(p => ({ ...p, addressLine2: e.target.value }))} placeholder="Area, Landmark (optional)" />
                  </div>
                  <div className="form-group">
                    <label className="label">City *</label>
                    <input className="input" value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} placeholder="Mumbai" />
                  </div>
                  <div className="form-group">
                    <label className="label">State *</label>
                    <input className="input" value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} placeholder="Maharashtra" />
                  </div>
                  <div className="form-group">
                    <label className="label">PIN Code *</label>
                    <input className="input" value={address.pincode} onChange={e => setAddress(p => ({ ...p, pincode: e.target.value }))} placeholder="400001" maxLength={6} />
                  </div>
                  <div className="form-group">
                    <label className="label">Phone Number *</label>
                    <input className="input" value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} placeholder="9876543210" />
                  </div>
                </div>
              )}

              <button className="btn btn-primary w-full mt-4 btn-lg" onClick={() => { if (!validateAddress()) { setError('Please fill in all required address fields.'); return; } setError(''); setStep(2); }}>
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="card p-6">
              <h2 className="section-title mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-navy-600" /> Payment Method</h2>

              <div className="space-y-3 mb-6">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon, note }) => (
                  <label key={id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === id ? 'border-navy-500 bg-navy-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="payment" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="mt-1" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-9 h-9 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-navy-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{note}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button className="btn btn-secondary flex-1" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary flex-1 btn-lg" onClick={() => setStep(3)}>
                  Review Order →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Place */}
          {step === 3 && (
            <div className="card p-6">
              <h2 className="section-title mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-navy-600" /> Review Your Order</h2>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Delivery To</p>
                  {(() => {
                    const addr = getShippingAddress();
                    return <p className="text-sm text-slate-700">{addr.fullName}, {addr.addressLine1}, {addr.city} – {addr.pincode}</p>;
                  })()}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Payment</p>
                  <p className="text-sm text-slate-700">{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{items.length} Item{items.length > 1 ? 's' : ''}</p>
                  {items.map(i => (
                    <div key={i.productId} className="flex justify-between text-sm text-slate-600 py-1">
                      <span className="truncate mr-2">{i.name} × {i.quantity}</span>
                      <span className="font-medium flex-shrink-0">{formatCurrency(i.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button className="btn btn-secondary flex-1" onClick={() => setStep(2)} disabled={loading}>← Back</button>
                <button className="btn btn-primary flex-1 btn-lg" onClick={handlePlaceOrder} disabled={loading}>
                  {loading ? 'Placing Order...' : `Place Order · ${formatCurrency(totalAmount)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div className="card p-5 h-fit sticky top-20">
          <h3 className="section-title mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            {items.map(i => (
              <div key={i.productId} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                  {i.image ? <img src={i.image} alt={i.name} className="w-full h-full object-cover" /> : <Package2 className="w-5 h-5 m-2 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 line-clamp-1">{i.name}</p>
                  <p className="text-xs text-slate-400">×{i.quantity}</p>
                </div>
                <p className="text-xs font-semibold text-slate-700">{formatCurrency(i.price * i.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(itemsTotal)}</span></div>
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />Shipping</span>
              <span className={shippingCharge === 0 ? 'text-green-600 font-medium' : ''}>{shippingCharge === 0 ? 'FREE' : formatCurrency(shippingCharge)}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-base">
              <span>Total</span><span className="text-navy-900">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
