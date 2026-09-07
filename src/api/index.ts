/**
 * TimeForge — Axios API Client
 */
import axios from 'axios';

const BASE = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('timeforge_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('timeforge_token');
      localStorage.removeItem('timeforge_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  streak_count: number;
  theme_pref: string;
  created_at: string;
}

export interface TaskDefinition {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  time_slot: string | null;
  duration_minutes: number | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sort_order: number;
  is_locked: boolean;
  created_at: string;
}

export type DayStatus = 'perfect' | 'partial' | 'missed' | 'no-tasks';

export interface DayRecord {
  date: string;
  total: number;
  completed: number;
  rate: number;
  status: DayStatus;
}

export interface HistoryResponse {
  records: DayRecord[];
  streak: number;
  today: {
    date: string;
    completions: Record<string, boolean>;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  me: () => api.get<User>('/auth/me'),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const tasksAPI = {
  definitions: () => api.get<TaskDefinition[]>('/daily-tasks/definitions'),
  createDefinition: (data: Partial<TaskDefinition>) =>
    api.post<TaskDefinition>('/daily-tasks/definitions', data),
  updateDefinition: (id: string, data: Partial<TaskDefinition>) =>
    api.patch<TaskDefinition>(`/daily-tasks/definitions/${id}`, data),
  deleteDefinition: (id: string) => api.delete(`/daily-tasks/definitions/${id}`),
  history: (from?: string) => api.get<HistoryResponse>('/daily-tasks/history', { params: { from } }),
  historyMatrix: (range: string) =>
    api.get<DayRecord[]>('/daily-tasks/history/matrix', { params: { range } }),
  toggleCell: (task_id: string, date: string, completed: boolean) =>
    api.post('/daily-tasks/history/toggle-cell', { task_id, date, completed }),
  updateStreak: () => api.patch<{ streak: number }>('/daily-tasks/history/streak'),
};

// ── TimeLog ──────────────────────────────────────────────────────────────────

export const timelogAPI = {
  start: (taskId: string) => api.post('/timelog/start', { task_id: taskId }),
  stop: (notes?: string) => api.post('/timelog/stop', { notes }),
  running: () => api.get('/timelog/running'),
  dailyStats: (days: number) =>
    api.get<{ date: string; total_seconds: number; total_hours: number }[]>('/timelog/daily-stats', { params: { days } }),
};

// ── AI ───────────────────────────────────────────────────────────────────────

export const aiAPI = {
  tools: () => api.get('/ai/tools'),
  chat: (messages: ChatMessage[]) => api.post<{ reply: string }>('/ai/chat', { messages }),
  splitTask: (title: string, minutes: number) =>
    api.post<{ blocks: { title: string; minutes: number }[] }>('/ai/split-task', { title, total_minutes: minutes }),
  suggestSlot: (task_title: string) =>
    api.post<{ suggestion: string | null }>('/ai/suggest-slot', { task_title }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get<User[]>('/admin/users'),
  makeAdmin: (userId: string) => api.post(`/admin/users/${userId}/make-admin`),
  configs: () => api.get('/admin/configs'),
  upsertConfig: (data: { key: string; value: string; locked?: boolean; scope?: string }) =>
    api.put('/admin/configs', data),
  deleteConfig: (key: string) => api.delete(`/admin/configs/${key}`),
};

// ── User ─────────────────────────────────────────────────────────────────────

export const userAPI = {
  settings: () => api.get('/user/settings'),
  updateSettings: (data: { theme_pref?: string }) => api.patch('/user/settings', data),
};

export default api;
