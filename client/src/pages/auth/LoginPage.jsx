import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/axios';
import Alert from '../../components/ui/Alert';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please enter email and password.'); return; }
    setLoading(true); setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin/dashboard' : from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-navy-900">StockFlow</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="card p-8">
          {error && <Alert variant="error" message={error} onClose={() => setError('')} className="mb-4" />}

          {/* Demo credentials */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
            <p className="text-xs font-semibold text-amber-700 mb-2">🔑 Demo Accounts</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => fillDemo('admin@stockflow.com', 'Admin@123456')} className="text-xs bg-navy-100 text-navy-700 px-2 py-1 rounded hover:bg-navy-200 transition-colors">
                Admin Login
              </button>
              <button onClick={() => fillDemo('arjun@demo.com', 'Demo@12345')} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors">
                Customer Login
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label" htmlFor="email">Email Address</label>
              <input id="email" type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" type={showPwd ? 'text' : 'password'} className="input pr-10" placeholder="Your password"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-navy-700 font-semibold hover:text-navy-900">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
