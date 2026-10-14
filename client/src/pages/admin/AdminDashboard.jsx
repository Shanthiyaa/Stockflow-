import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, DollarSign, Package, AlertTriangle, Users, TrendingUp, ChevronRight } from 'lucide-react';
import { adminAPI, analyticsAPI } from '../../api';
import { formatCurrency, formatDate, getOrderStatusBadgeClass, getOrderStatusLabel } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const STATUS_COLORS = { placed: '#3b82f6', packed: '#f59e0b', shipped: '#6366f1', delivered: '#10b981', cancelled: '#ef4444' };

function StatCard({ icon: Icon, label, value, sub, color = 'navy' }) {
  const colors = {
    navy: 'bg-navy-50 text-navy-700',
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getDashboard(),
      analyticsAPI.getSalesTrend({ period: 30 }),
    ]).then(([statsRes, salesRes]) => {
      setStats(statsRes.data.data);
      setSalesData(salesRes.data.data.salesData.map(d => ({ date: d._id.slice(5), revenue: d.revenue, orders: d.orders })));
      setStatusData(statsRes.data.data.statusDistribution.map(d => ({ name: d._id, value: d.count })));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Live overview from database</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats?.totalOrders?.toLocaleString() || 0} color="navy" />
        <StatCard icon={DollarSign} label="Revenue (Paid)" value={formatCurrency(stats?.totalRevenue || 0)} sub="From paid orders" color="green" />
        <StatCard icon={Package} label="Products" value={stats?.totalProducts || 0} color="teal" />
        <StatCard icon={Users} label="Customers" value={stats?.totalCustomers || 0} color="purple" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={stats?.lowStock || 0} sub="Items need restock" color="amber" />
        <StatCard icon={TrendingUp} label="Out of Stock" value={stats?.outOfStock || 0} color="red" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Sales chart */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="section-title mb-4">Revenue (Last 30 Days)</h3>
          {salesData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No sales data yet. Place orders to see trends.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e2a5e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1e2a5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="#1e2a5e" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order status pie */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Order Status</h3>
          {statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No orders yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
                <Legend formatter={(v) => <span className="text-xs capitalize text-slate-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent orders + Best sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-navy-600 hover:text-navy-800 flex items-center gap-1 font-medium">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {stats?.recentOrders?.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {stats?.recentOrders?.map(order => (
                <Link key={order._id} to={`/admin/orders/${order._id}`} className="flex items-center justify-between group py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-navy-700">#{order.orderNumber}</p>
                    <p className="text-xs text-slate-400">{order.customer?.name} · {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${getOrderStatusBadgeClass(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
                    <p className="text-sm font-bold text-slate-700 mt-1">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Best sellers */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Best Sellers</h3>
            <Link to="/admin/analytics" className="text-xs text-navy-600 hover:text-navy-800 flex items-center gap-1 font-medium">
              Analytics <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {stats?.bestSelling?.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats?.bestSelling?.map((product, i) => (
                <div key={product._id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                    <p className="text-xs text-slate-400">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-navy-900">{product.totalSold} sold</p>
                    <p className="text-xs text-slate-400">{formatCurrency(product.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
