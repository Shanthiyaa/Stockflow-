import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Package, ShoppingBag } from 'lucide-react';
import { notificationAPI } from '../../api';
import { timeAgo } from '../../utils/format';
import Spinner from '../../components/ui/Spinner';

const TYPE_ICONS = {
  order_placed: '📦', order_packed: '🗃️', order_shipped: '🚚',
  order_delivered: '✅', order_cancelled: '❌', payment_success: '💳',
  payment_failed: '⚠️', low_stock: '📉', general: '🔔',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = () => {
    notificationAPI.getAll({ limit: 50 })
      .then(r => {
        setNotifications(r.data.data.notifications);
        setUnreadCount(r.data.data.unreadCount);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    await notificationAPI.markRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id) => {
    await notificationAPI.delete(id);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Bell className="w-6 h-6" /> Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-slate-500 mt-1">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm flex items-center gap-1">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No notifications yet</h3>
          <p className="text-sm text-slate-400">You'll see order updates and alerts here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n._id}
              className={`card p-4 flex items-start gap-3 transition-all cursor-pointer ${!n.isRead ? 'border-navy-200 bg-navy-50' : ''}`}
              onClick={() => { if (!n.isRead) handleMarkRead(n._id); }}
            >
              <div className="w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center flex-shrink-0 text-lg">
                {TYPE_ICONS[n.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${!n.isRead ? 'text-navy-900' : 'text-slate-800'}`}>{n.title}</p>
                <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                {n.relatedOrder && (
                  <Link to={`/orders/${n.relatedOrder}`} className="text-xs text-navy-600 hover:underline mt-1 inline-block" onClick={e => e.stopPropagation()}>
                    View Order →
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!n.isRead && <div className="w-2 h-2 bg-navy-600 rounded-full" />}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-400 text-center mt-6">
        ℹ️ Email/SMS notifications require additional configuration (not implemented in this demo).
      </p>
    </div>
  );
}
