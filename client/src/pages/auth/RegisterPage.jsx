import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/axios';
import Alert from '../../components/ui/Alert';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('Name, email and password are required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-navy-900">StockFlow</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
          <p className="text-slate-500 text-sm mt-1">Start shopping with StockFlow today</p>
        </div>

        <div className="card p-8">
          {error && <Alert variant="error" message={error} onClose={() => setError('')} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label" htmlFor="name">Full Name *</label>
              <input id="name" type="text" className="input" placeholder="John Doe"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoComplete="name" />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="email">Email Address *</label>
              <input id="email" type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="phone">Phone Number</label>
              <input id="phone" type="tel" className="input" placeholder="9876543210"
                value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} autoComplete="tel" />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="reg-password">Password *</label>
              <div className="relative">
                <input id="reg-password" type={showPwd ? 'text' : 'password'} className="input pr-10" placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-navy-700 font-semibold hover:text-navy-900">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
