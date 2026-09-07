import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { tasksAPI, timelogAPI } from '../api/index.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import ProgressRing3D from '../components/ProgressRing3D.jsx'
import TaskChart from '../components/TaskChart.jsx'
import DailyHeatmap from '../components/DailyHeatmap.jsx'

const PRIORITY_COLORS = {
  low: 'badge-gray',
  medium: 'badge-blue',
  high: 'badge-amber',
  urgent: 'badge-red',
}

const STATUS_ICONS = {
  done: '✓',
  pending: '○',
  skipped: '–',
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [progress, setProgress] = useState({ total: 0, completed: 0, pending: 0, skipped: 0, completion_rate: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [runningTimer, setRunningTimer] = useState(null)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [dailyStats, setDailyStats] = useState([])

  // Add task form
  const [form, setForm] = useState({
    title: '',
    category: '',
    start_time: '',
    end_time: '',
    duration_minutes: '',
    priority: 'medium',
    recurrence_rule: '',
  })

  const fetchTasks = useCallback(async () => {
    try {
      const res = await tasksAPI.list({ date_str: selectedDate })
      setTasks(res.data)
    } catch {
      toast.error('Failed to load tasks')
    }
  }, [selectedDate])

  const fetchProgress = useCallback(async () => {
    try {
      const res = await tasksAPI.progress()
      setProgress(res.data)
    } catch { /* ignore */ }
  }, [])

  const fetchTimer = useCallback(async () => {
    try {
      const res = await timelogAPI.running()
      setRunningTimer(res.data)
    } catch { /* ignore */ }
  }, [])

  const fetchDailyStats = useCallback(async () => {
    try {
      const res = await timelogAPI.dailyStats(14)
      setDailyStats(res.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTasks(), fetchProgress(), fetchTimer(), fetchDailyStats()])
      .finally(() => setLoading(false))
  }, [fetchTasks, fetchProgress, fetchTimer, fetchDailyStats])

  // Timer ticker
  useEffect(() => {
    if (!runningTimer) return
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(runningTimer.started_at).getTime()) / 1000)
      setTimerSeconds(elapsed)
    }, 1000)
    return () => clearInterval(interval)
  }, [runningTimer])

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    try {
      const payload = {
        title: form.title,
        category: form.category || null,
        priority: form.priority,
        recurrence_rule: form.recurrence_rule || null,
      }
      if (form.start_time) payload.start_time = `${selectedDate}T${form.start_time}:00`
      if (form.end_time) payload.end_time = `${selectedDate}T${form.end_time}:00`
      if (form.duration_minutes) payload.duration_minutes = parseInt(form.duration_minutes)
      await tasksAPI.create(payload)
      toast.success('Task added!')
      setForm({ title: '', category: '', start_time: '', end_time: '', duration_minutes: '', priority: 'medium', recurrence_rule: '' })
      setShowAddForm(false)
      fetchTasks()
      fetchProgress()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add task')
    }
  }

  const handleToggle = async (taskId) => {
    try {
      const res = await tasksAPI.toggle(taskId)
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t))
      fetchProgress()
    } catch {
      toast.error('Failed to update task')
    }
  }

  const handleDelete = async (taskId) => {
    try {
      await tasksAPI.delete(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      fetchProgress()
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleStartTimer = async (taskId) => {
    try {
      const res = await timelogAPI.start(taskId)
      setRunningTimer(res.data)
      setTimerSeconds(0)
      toast.success('Timer started')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start timer')
    }
  }

  const handleStopTimer = async () => {
    try {
      await timelogAPI.stop(null)
      setRunningTimer(null)
      setTimerSeconds(0)
      toast.success('Timer stopped')
    } catch {
      toast.error('Failed to stop timer')
    }
  }

  const formatTimer = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h > 0 ? h + 'h ' : ''}${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`
  }

  const completionPct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ── Header ── */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/90 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" opacity="0.4" />
              <path d="M12 6 L12 12 L17 12" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-lg text-white">TimeForge</span>
        </div>

        <div className="flex items-center gap-4">
          {user.role === 'admin' && (
            <button onClick={() => navigate('/admin')} className="btn-ghost text-sm">
              Admin
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-400 font-semibold text-sm">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-gray-300 hidden sm:block">{user.name}</span>
          </div>
          <button onClick={logout} className="btn-ghost text-sm text-gray-400 hover:text-red-400">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Hero Stats Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D Progress Ring */}
          <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[220px]">
            <h2 className="text-sm font-medium text-gray-400 mb-4">Today's Progress</h2>
            <ProgressRing3D percentage={completionPct} size={140} />
            <div className="mt-4 text-center">
              <span className="text-3xl font-bold text-white">{progress.completed}</span>
              <span className="text-2xl text-gray-500"> / {progress.total}</span>
              <p className="text-sm text-gray-400 mt-1">tasks completed</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{progress.completion_rate}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${progress.completion_rate}%` }}
                />
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending Tasks</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{progress.pending}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Timer Card */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-medium text-gray-400 mb-4">Timer</h2>
            {runningTimer ? (
              <div className="flex flex-col items-center gap-4">
                <div className="text-4xl font-mono font-bold text-brand-400">
                  {formatTimer(timerSeconds)}
                </div>
                <p className="text-sm text-gray-400">
                  {tasks.find(t => t.id === runningTimer.task_id)?.title || 'Running...'}
                </p>
                <button
                  onClick={handleStopTimer}
                  className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all active:scale-95"
                >
                  Stop
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-6">
                <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-sm">No timer running</p>
                <p className="text-xs mt-1">Click the play button on any task to start</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Date Picker + Add Task ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const d = new Date(selectedDate)
                d.setDate(d.getDate() - 1)
                setSelectedDate(format(d, 'yyyy-MM-dd'))
              }}
              className="btn-ghost p-2 rounded-lg"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <input
              type="date"
              className="input-field w-auto"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button
              onClick={() => {
                const d = new Date(selectedDate)
                d.setDate(d.getDate() + 1)
                setSelectedDate(format(d, 'yyyy-MM-dd'))
              }}
              className="btn-ghost p-2 rounded-lg"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              className="btn-ghost text-sm px-3"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Task
          </button>
        </div>

        {/* ── Add Task Form ── */}
        {showAddForm && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">New Task</h3>
            <form onSubmit={handleAddTask} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-4">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Task title (e.g. Study DBMS 6-8pm)"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Category</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Study / Work / Personal"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                <input
                  type="time"
                  className="input-field"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Time</label>
                <input
                  type="time"
                  className="input-field"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Priority</label>
                <select
                  className="input-field"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Recurrence</label>
                <select
                  className="input-field"
                  value={form.recurrence_rule}
                  onChange={(e) => setForm({ ...form, recurrence_rule: e.target.value })}
                >
                  <option value="">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="A">A Week (Rotating)</option>
                  <option value="B">B Week (Rotating)</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-3 mt-2">
                <button type="submit" className="btn-primary">Add Task</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── Task List ── */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">
              Tasks for {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
            </h2>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg viewBox="0 0 24 24" className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
              <p>No tasks for this day</p>
              <p className="text-sm mt-1">Add a task to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {tasks.map((task) => (
                <div key={task.id} className={`px-6 py-4 flex items-center gap-4 hover:bg-gray-800/40 transition-colors group ${task.status === 'done' ? 'opacity-60' : ''}`}>
                  {/* Checkbox */}
                  <button
                    onClick={() => !task.is_admin_locked && handleToggle(task.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all ${
                      task.status === 'done'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : task.status === 'skipped'
                        ? 'border-gray-600 text-gray-600'
                        : 'border-gray-600 hover:border-brand-400 text-transparent hover:border-brand-400'
                    } ${task.is_admin_locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {task.status === 'done' ? '✓' : task.status === 'skipped' ? '–' : ''}
                  </button>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-white'}`}>
                        {task.title}
                      </span>
                      <span className={`badge ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                      {task.category && <span className="badge badge-gray text-xs">{task.category}</span>}
                      {task.recurrence_rule && (
                        <span className="badge badge-blue text-xs">↻ {task.recurrence_rule}</span>
                      )}
                      {task.is_admin_locked && (
                        <span className="badge badge-amber text-xs">🔒 org-locked</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {task.start_time && (
                        <span>🕐 {format(new Date(task.start_time), 'HH:mm')}</span>
                      )}
                      {task.end_time && (
                        <span>→ {format(new Date(task.end_time), 'HH:mm')}</span>
                      )}
                      {task.total_logged_seconds > 0 && (
                        <span>⏱ {Math.round(task.total_logged_seconds / 60)}m logged</span>
                      )}
                    </div>
                  </div>

                  {/* Timer button */}
                  {!task.is_admin_locked && (
                    <button
                      onClick={() => runningTimer?.task_id === task.id ? handleStopTimer() : handleStartTimer(task.id)}
                      className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                        runningTimer?.task_id === task.id
                          ? 'bg-red-500/20 text-red-400'
                          : 'hover:bg-gray-700 text-gray-500 hover:text-brand-400'
                      }`}
                      title={runningTimer?.task_id === task.id ? 'Stop timer' : 'Start timer'}
                    >
                      {runningTimer?.task_id === task.id ? (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Delete */}
                  {!task.is_admin_locked && (
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="flex-shrink-0 p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="font-semibold text-white mb-4">Hours Tracked (Last 14 Days)</h2>
            <TaskChart data={dailyStats} />
          </div>
          <div className="glass-card p-6">
            <h2 className="font-semibold text-white mb-4">Consistency Heatmap</h2>
            <DailyHeatmap data={dailyStats} />
          </div>
        </div>
      </main>
    </div>
  )
}
