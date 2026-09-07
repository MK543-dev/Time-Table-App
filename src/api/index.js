/**
 * TimeForge — Axios API Client
 */
import axios from 'axios'

const BASE = '/api'

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

// ── Auth interceptor ──────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('timeforge_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('timeforge_token')
      localStorage.removeItem('timeforge_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { username: email, password }),
  register: (data) =>
    api.post('/auth/register', data),
  me: () =>
    api.get('/auth/me'),
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  list: (params = {}) => api.get('/tasks/', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks/', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  toggle: (id) => api.patch(`/tasks/${id}/toggle`),
  progress: () => api.get('/tasks/today-progress'),
  categories: () => api.get('/tasks/categories'),
}

// ── TimeLog ──────────────────────────────────────────────────────────────────
export const timelogAPI = {
  start: (taskId) => api.post('/timelog/start', { task_id: taskId }),
  stop: (notes) => api.post('/timelog/stop', { notes }),
  running: () => api.get('/timelog/running'),
  list: (params) => api.get('/timelog/', { params }),
  dailyStats: (days) => api.get('/timelog/stats/daily', { params: { days } }),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  configs: () => api.get('/admin/config'),
  upsertConfig: (data) => api.put('/admin/config', data),
  deleteConfig: (key) => api.delete(`/admin/config/${key}`),
  users: () => api.get('/admin/users'),
  makeAdmin: (userId) => api.post(`/admin/users/${userId}/make-admin`),
}

// ── User ──────────────────────────────────────────────────────────────────────
export const userAPI = {
  settings: () => api.get('/user/settings'),
  updateSettings: (data) => api.patch('/user/settings', data),
}

export default api
