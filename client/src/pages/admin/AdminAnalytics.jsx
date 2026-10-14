import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../api';
import { formatCurrency } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#1e2a5e', '#14b8a6', '#6366f1', '#f59e0b', '#10b981', '#ef4444'];

export default function AdminAnalytics() {
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [inventoryHealth, setInventoryHealth] = useState(null);
  const [orderStatus, setOrderStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsAPI.getSalesTrend({ period }),
      analyticsAPI.getCategoryRevenue(),
      analyticsAPI.getBestSellers({ limit: 8 }),
      analyticsAPI.getInventoryHealth(),
      analyticsAPI.getOrderStatus(),
    ]).then(([sales, cat, best, inv, status]) => {
      setSalesData(sales.data.data.salesData.map(d => ({ date: d._id.slice(5), revenue: d.revenue, orders: d.orders })));
      setCategoryData(cat.data.data.categoryRevenue.map(d => ({ name: d.name, revenue: d.revenue, units: d.units })));
      setBestSellers(best.data.data.bestSellers);
      setInventoryHealth(inv.data.data);
      setOrderStatus(status.data.data.statusSummary.map(d => ({ name: d._id, value: d.count })));
    }).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;

  const totalRevenue = salesData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = salesData.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Analytics & Reports</h1><p className="text-sm text-slate-500 mt-1">Data from live database</p></div>
        <select className="input max-w-[160px]" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Revenue (Paid)', value: formatCurrency(totalRevenue), color: 'text-green-700 bg-green-50' },
          { label: `Orders (${period}d)`, value: totalOrders, color: 'text-navy-700 bg-navy-50' },
          { label: 'Avg. Order Value', value: totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : '₹0', color: 'text-indigo-700 bg-indigo-50' },
          { label: 'Stock Value', value: formatCurrency(inventoryHealth?.totalStockValue || 0), color: 'text-teal-700 bg-teal-50' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color.split(' ')[0]}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sales trend */}
      <div className="card p-5 mb-5">
        <h3 className="section-title mb-4">Revenue Trend</h3>
        {salesData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No sales in this period. Place paid orders to see data.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e2a5e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1e2a5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v, name) => [name === 'revenue' ? formatCurrency(v) : v, name === 'revenue' ? 'Revenue' : 'Orders']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#1e2a5e" fill="url(#grad1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Category revenue */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Revenue by Category</h3>
          {categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No category revenue data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Inventory health */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Inventory Health</h3>
          {!inventoryHealth ? <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data.</div> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'In Stock', value: inventoryHealth.inStock },
                      { name: 'Low Stock', value: inventoryHealth.lowStock },
                      { name: 'Out of Stock', value: inventoryHealth.outOfStock },
                    ].filter(d => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value"
                  >
                    {[{ color: '#10b981' }, { color: '#f59e0b' }, { color: '#ef4444' }].map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {[
                  { label: 'In Stock', value: inventoryHealth.inStock, color: 'text-green-700 bg-green-50' },
                  { label: 'Low Stock', value: inventoryHealth.lowStock, color: 'text-yellow-700 bg-yellow-50' },
                  { label: 'Out of Stock', value: inventoryHealth.outOfStock, color: 'text-red-700 bg-red-50' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`rounded-xl p-2 text-center ${color.split(' ')[1]}`}>
                    <p className={`text-lg font-bold ${color.split(' ')[0]}`}>{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Best sellers */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Best-Selling Products</h3>
        {bestSellers.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No sales data yet.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr>{['Rank', 'Product', 'SKU', 'Units Sold', 'Revenue'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-50">
                {bestSellers.map((p, i) => (
                  <tr key={p._id} className="tr-hover">
                    <td className="td"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</div></td>
                    <td className="td text-sm font-medium text-slate-800">{p.productName}</td>
                    <td className="td"><span className="text-xs font-mono">{p.productSKU}</span></td>
                    <td className="td font-bold text-sm">{p.totalUnits?.toLocaleString()}</td>
                    <td className="td font-bold text-sm text-navy-900">{formatCurrency(p.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
