const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const withQuery = (path, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  return `${path}${qs ? `?${qs}` : ''}`;
};

export const api = {
  register: (body) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/auth/me'),

  getItems: (params = {}) => request(withQuery('/api/items', params)),
  getStats: () => request('/api/items/stats'),
  createItem: (body) =>
    request('/api/items', { method: 'POST', body: JSON.stringify(body) }),
  updateItem: (id, body) =>
    request(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteItem: (id) => request(`/api/items/${id}`, { method: 'DELETE' }),

  getCategories: () => request('/api/categories'),
  createCategory: (body) =>
    request('/api/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id, body) =>
    request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),

  getSuppliers: () => request('/api/suppliers'),
  getSupplier: (id) => request(`/api/suppliers/${id}`),
  createSupplier: (body) =>
    request('/api/suppliers', { method: 'POST', body: JSON.stringify(body) }),
  updateSupplier: (id, body) =>
    request(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSupplier: (id) => request(`/api/suppliers/${id}`, { method: 'DELETE' }),

  getMovements: (params = {}) => request(withQuery('/api/movements', params)),
  createMovement: (body) =>
    request('/api/movements', { method: 'POST', body: JSON.stringify(body) }),

  getPurchaseOrders: (params = {}) => request(withQuery('/api/purchase-orders', params)),
  getPurchaseOrder: (id) => request(`/api/purchase-orders/${id}`),
  createPurchaseOrder: (body) =>
    request('/api/purchase-orders', { method: 'POST', body: JSON.stringify(body) }),
  updatePurchaseOrder: (id, body) =>
    request(`/api/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updatePurchaseOrderStatus: (id, status) =>
    request(`/api/purchase-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deletePurchaseOrder: (id) => request(`/api/purchase-orders/${id}`, { method: 'DELETE' }),

  getReportSummary: (params = {}) => request(withQuery('/api/reports/summary', params)),
};
