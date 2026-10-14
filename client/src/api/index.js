import api from './axios';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  addAddress: (data) => api.post('/users/addresses', data),
  updateAddress: (id, data) => api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
  getAllUsers: (params) => api.get('/users', { params }),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getAllAdmin: () => api.get('/categories/admin'),
  getOne: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getAllAdmin: (params) => api.get('/products/admin/all', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const cartAPI = {
  validate: (items) => api.post('/cart/validate', { items }),
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  cancel: (id, data) => api.put(`/orders/${id}/cancel`, data),
  getAllAdmin: (params) => api.get('/orders/admin/all', { params }),
  getOneAdmin: (id) => api.get(`/orders/admin/${id}`),
  updateStatus: (id, data) => api.put(`/orders/admin/${id}/status`, data),
};

export const paymentAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  confirm: (data) => api.post('/payments/confirm', data),
  getByOrder: (orderId) => api.get(`/payments/order/${orderId}`),
};

export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  adjust: (data) => api.post('/inventory/adjust', data),
  getMovements: (params) => api.get('/inventory/movements', { params }),
  getAlerts: () => api.get('/inventory/alerts'),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
};

export const analyticsAPI = {
  getSalesTrend: (params) => api.get('/analytics/sales', { params }),
  getCategoryRevenue: () => api.get('/analytics/category-revenue'),
  getBestSellers: (params) => api.get('/analytics/best-sellers', { params }),
  getInventoryHealth: () => api.get('/analytics/inventory-health'),
  getOrderStatus: (params) => api.get('/analytics/order-status', { params }),
};
