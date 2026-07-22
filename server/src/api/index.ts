const BASE_URL = '/api'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('登录已过期')
  }

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, email: string, password: string) =>
    request<{ token: string; user: { id: string; username: string; email: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  getMe: () => request<{ id: string; username: string; email: string; created_at: string }>('/auth/me'),

  // Usage
  getStats: (days = 7) =>
    request<import('../types').DashboardStats>(`/usage/stats?days=${days}`),

  getCostTrend: (days = 30) =>
    request<import('../types').CostTrend[]>(`/usage/cost-trend?days=${days}`),

  // API Keys
  getApiKeys: () =>
    request<import('../types').ApiKey[]>('/keys'),

  createApiKey: (name: string) =>
    request<import('../types').ApiKey>('/keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  deleteApiKey: (id: string) =>
    request<{ message: string }>(`/keys/${id}`, { method: 'DELETE' }),

  toggleApiKey: (id: string) =>
    request<{ message: string; is_active: boolean }>(`/keys/${id}/toggle`, { method: 'PATCH' }),
}
