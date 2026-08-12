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

export const api = {
  register: (body) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/auth/me'),
  getItems: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    const qs = query.toString();
    return request(`/api/items${qs ? `?${qs}` : ''}`);
  },
  getStats: () => request('/api/items/stats'),
  createItem: (body) =>
    request('/api/items', { method: 'POST', body: JSON.stringify(body) }),
  updateItem: (id, body) =>
    request(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteItem: (id) => request(`/api/items/${id}`, { method: 'DELETE' }),
};
