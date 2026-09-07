import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminAPI, tasksAPI } from '../api/index.js'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(false)

  // Config form
  const [configForm, setConfigForm] = useState({ key: '', value: '', locked: false, scope: 'global' })

  useEffect(() => {
    if (user.role !== 'admin') navigate('/')
  }, [user, navigate])

  useEffect(() => {
    if (tab === 'stats') loadStats()
    if (tab === 'users') loadUsers()
    if (tab === 'config') loadConfigs()
  }, [tab])

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.stats()
      setStats(res.data)
    } catch { toast.error('Failed to load stats') }
    finally { setLoading(false) }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.users()
      setUsers(res.data)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  const loadConfigs = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.configs()
      setConfigs(res.data)
    } catch { toast.error('Failed to load configs') }
    finally { setLoading(false) }
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    if (!configForm.key.trim()) return
    try {
      await adminAPI.upsertConfig(configForm)
      toast.success('Config saved')
      setConfigForm({ key: '', value: '', locked: false, scope: 'global' })
      loadConfigs()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save config')
    }
  }

  const handleDeleteConfig = async (key) => {
    try {
      await adminAPI.deleteConfig(key)
      setConfigs(prev => prev.filter(c => c.key !== key))
      toast.success('Config deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handleMakeAdmin = async (userId) => {
    try {
      await adminAPI.makeAdmin(userId)
      loadUsers()
      toast.success('User promoted to admin')
    } catch { toast.error('Failed') }
  }

  const TABS = [
    { id: 'stats', label: '📊 Overview' },
    { id: 'users', label: '👥 Users' },
    { id: 'config', label: '⚙️ Config' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/90 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" opacity="0.4" />
              <path d="M12 6 L12 12 L17 12" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-lg text-white">TimeForge</span>
          <span className="badge badge-amber ml-2">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="btn-ghost text-sm">← Back to Dashboard</button>
          <button onClick={logout} className="btn-ghost text-sm text-gray-400 hover:text-red-400">Sign out</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab nav */}
        <div className="flex gap-1 mb-8 bg-gray-900/50 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Stats Tab ── */}
        {tab === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Platform Overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats?.total_users ?? '–', color: 'text-brand-400' },
                { label: 'Total Tasks', value: stats?.total_tasks ?? '–', color: 'text-blue-400' },
                { label: 'Completions', value: stats?.total_completions ?? '–', color: 'text-emerald-400' },
                { label: 'Avg Completion', value: stats ? `${stats.avg_completion_rate}%` : '–', color: 'text-amber-400' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card p-5">
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            {stats?.busiest_hour !== null && stats?.busiest_hour !== undefined && (
              <div className="glass-card p-5">
                <p className="text-sm text-gray-400">Busiest Hour</p>
                <p className="text-xl font-semibold text-white mt-1">
                  {stats.busiest_hour}:00 — {(stats.busiest_hour + 1).toString().padStart(2, '0')}:00
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Users Tab ── */}
        {tab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">All Users</h2>
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Name</th>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Email</th>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Role</th>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Streak</th>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-800/30">
                      <td className="px-6 py-3 text-white">{u.name}</td>
                      <td className="px-6 py-3 text-gray-400">{u.email}</td>
                      <td className="px-6 py-3">
                        <span className={`badge ${u.role === 'admin' ? 'badge-amber' : 'badge-gray'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-400">🔥 {u.streak_count}</td>
                      <td className="px-6 py-3">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleMakeAdmin(u.id)}
                            className="text-brand-400 hover:text-brand-300 text-xs"
                          >
                            Make Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Config Tab ── */}
        {tab === 'config' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Admin Configuration</h2>
            <p className="text-sm text-gray-400">
              Settings here are enforced as <code className="text-brand-400">locked_by_admin: true</code> for all users.
              User-facing controls for these keys will appear read-only.
            </p>

            {/* Add config form */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-white mb-4">Add / Update Config</h3>
              <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Key</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. gamification_enabled"
                    value={configForm.key}
                    onChange={(e) => setConfigForm({ ...configForm, key: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Value</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="true / false / 5 / ..."
                    value={configForm.value}
                    onChange={(e) => setConfigForm({ ...configForm, value: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Scope</label>
                  <select
                    className="input-field"
                    value={configForm.scope}
                    onChange={(e) => setConfigForm({ ...configForm, scope: e.target.value })}
                  >
                    <option value="global">Global</option>
                    <option value="team">Team</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-brand-600"
                      checked={configForm.locked}
                      onChange={(e) => setConfigForm({ ...configForm, locked: e.target.checked })}
                    />
                    Locked
                  </label>
                  <button type="submit" className="btn-primary flex-1">Save</button>
                </div>
              </form>
            </div>

            {/* Existing configs */}
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Key</th>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Value</th>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Scope</th>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Locked</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {configs.map(c => (
                    <tr key={c.id} className="hover:bg-gray-800/30">
                      <td className="px-6 py-3 text-brand-400 font-mono text-xs">{c.key}</td>
                      <td className="px-6 py-3 text-gray-300">{c.value}</td>
                      <td className="px-6 py-3 text-gray-400">{c.scope}</td>
                      <td className="px-6 py-3">{c.locked ? '🔒' : '—'}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleDeleteConfig(c.key)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!configs.length && !loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No configs yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {loading && (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
