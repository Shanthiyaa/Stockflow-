export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStockBadgeClass(stockStatus) {
  const map = {
    in_stock: 'badge-in-stock',
    low_stock: 'badge-low-stock',
    out_of_stock: 'badge-out-of-stock',
  };
  return map[stockStatus] || 'badge';
}

export function getStockLabel(stockStatus) {
  const map = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
  };
  return map[stockStatus] || stockStatus;
}

export function getOrderStatusBadgeClass(status) {
  return `badge-${status}`;
}

export function getOrderStatusLabel(status) {
  const map = {
    placed: 'Placed',
    packed: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return map[status] || status;
}

export function getPaymentStatusLabel(status) {
  const map = {
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return map[status] || status;
}

export function truncate(str, len = 80) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
