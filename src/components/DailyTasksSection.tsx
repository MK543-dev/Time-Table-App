/**
 * TimeForge — DailyTasksSection
 * Main task view: toolbar (Today only), task list, add/edit/delete, toggle, timer.
 * NO Yesterday/Day Before buttons — history lives in HistoryMatrix.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { tasksAPI, timelogAPI, type TaskDefinition, type HistoryResponse } from '../api/index.ts';
import toast from 'react-hot-toast';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'badge-gray',
  medium: 'badge-blue',
  high: 'badge-amber',
  urgent: 'badge-red',
};

interface Props {
  user: { id: string; name: string; role: string };
  onLogout: () => void;
  onOpenHistory: () => void;
  onOpenAI: () => void;
  onOpenAgent: () => void;
  streak: number;
  onStreakChange: (s: number) => void;
}

export default function DailyTasksSection({
  user, onLogout, onOpenHistory, onOpenAI, onOpenAgent, streak, onStreakChange
}: Props) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [runningTimer, setRunningTimer] = useState<any>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add task form
  const [form, setForm] = useState({
    title: '',
    category: '',
    time_slot: '',
    duration_minutes: '',
    priority: 'medium',
  });

  // Load tasks for selected date
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [defRes, histRes, timerRes] = await Promise.all([
        tasksAPI.definitions(),
        tasksAPI.history(),
        timelogAPI.running(),
      ]);
      setTasks(defRes.data);
      setHistory(histRes.data);
      setCompletions(histRes.data.today.completions || {});
      setRunningTimer(timerRes.data);
      onStreakChange(histRes.data.streak);

      // Today's completions if viewing today
      if (selectedDate === format(new Date(), 'yyyy-MM-dd')) {
        setCompletions(histRes.data.today.completions || {});
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load completions for selected date (if not today)
  useEffect(() => {
    if (selectedDate !== format(new Date(), 'yyyy-MM-dd')) {
      tasksAPI.historyMatrix('30').then((res) => {
        const record = res.data.find((r: any) => r.date === selectedDate);
        if (record) {
          // We need per-task completions — fetch them differently
          // For non-today dates, we only show the aggregate from the matrix
          // Individual task completions are fetched per-date via the toggle endpoint
        }
      });
    }
  }, [selectedDate]);

  // Timer ticker
  useEffect(() => {
    if (!runningTimer) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(runningTimer.started_at).getTime()) / 1000);
      setTimerSeconds(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);

  // ── Toggle task completion ───────────────────────────────────────────────

  const handleToggle = async (taskId: string) => {
    const current = completions[taskId] || false;
    try {
      const res = await tasksAPI.toggleCell(taskId, selectedDate, !current);
      setCompletions(prev => ({ ...prev, [taskId]: !current }));
      onStreakChange(res.data.streak);
    } catch { toast.error('Failed to update'); }
  };

  // ── Add task ────────────────────────────────────────────────────────────

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const payload: Partial<TaskDefinition> = { title: form.title, priority: form.priority as any };
      if (form.category) payload.category = form.category;
      if (form.time_slot) payload.time_slot = form.time_slot;
      if (form.duration_minutes) payload.duration_minutes = parseInt(form.duration_minutes);
      await tasksAPI.createDefinition(payload);
      toast.success('Task added!');
      setForm({ title: '', category: '', time_slot: '', duration_minutes: '', priority: 'medium' });
      setShowAddForm(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add task');
    }
  };

  // ── Delete task ──────────────────────────────────────────────────────────

  const handleDelete = async (taskId: string) => {
    try {
      await tasksAPI.deleteDefinition(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setCompletions(prev => { const n = { ...prev }; delete n[taskId]; return n; });
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete'); }
  };

  // ── Timer ────────────────────────────────────────────────────────────────

  const handleStartTimer = async (taskId: string) => {
    try {
      const res = await timelogAPI.start(taskId);
      setRunningTimer(res.data);
      setTimerSeconds(0);
      toast.success('Timer started');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to start timer'); }
  };

  const handleStopTimer = async () => {
    try {
      await timelogAPI.stop();
      setRunningTimer(null);
      setTimerSeconds(0);
      toast.success('Timer stopped');
    } catch { toast.error('Failed to stop timer'); }
  };

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + 'h ' : ''}${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
  };

  // ── Completion stats ─────────────────────────────────────────────────────

  const totalTasks = tasks.length;
  const completedCount = Object.values(completions).filter(Boolean).length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = selectedDate === today;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* ── Header ── */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950/90 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" opacity="0.4" />
              <path d="M12 6 L12 12 L17 12" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-lg text-white">TimeForge</span>
        </div>
        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <button onClick={onOpenAgent} className="btn-ghost text-sm flex items-center gap-1.5">
              <span>🤖</span> AI Agent
            </button>
          )}
          <button onClick={onOpenHistory} className="btn-ghost text-sm">📊 History</button>
          <button onClick={onOpenAI} className="btn-ghost text-sm">✨ AI</button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-400 font-semibold text-sm">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-gray-400">🔥 {streak} day streak</p>
            </div>
          </div>
          <button onClick={onLogout} className="btn-ghost text-sm text-gray-400 hover:text-red-400">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Toolbar: ONLY Today button + date picker ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Today button */}
          <button
            onClick={() => setSelectedDate(today)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              isToday
                ? 'bg-brand-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Today
          </button>

          {/* Date picker */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
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
              onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
              className="btn-ghost p-2 rounded-lg"
              disabled={isToday}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Stats badge */}
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-white">{completedCount} / {totalTasks}</p>
              <p className="text-xs text-gray-400">{completionRate}% done</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xl">
              🔥
            </div>
          </div>

          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Task
          </button>
        </div>

        {/* ── Add Task Form ── */}
        {showAddForm && (
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">New Task</h3>
            <form onSubmit={handleAddTask} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Task title (e.g. Study DBMS)"
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
                <label className="block text-xs text-gray-500 mb-1">Time Slot</label>
                <input
                  type="time"
                  className="input-field"
                  value={form.time_slot}
                  onChange={(e) => setForm({ ...form, time_slot: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="30"
                  min="1"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
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
              <div className="sm:col-span-4 flex gap-3 mt-2">
                <button type="submit" className="btn-primary">Add Task</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── Timer Card ── */}
        {runningTimer && (
          <div className="glass-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Timer Running</p>
              <p className="text-2xl font-mono font-bold text-brand-400">{formatTimer(timerSeconds)}</p>
            </div>
            <button
              onClick={handleStopTimer}
              className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold"
            >
              Stop
            </button>
          </div>
        )}

        {/* ── Task List ── */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">
              Tasks — {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
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
              </svg>
              <p>No tasks yet — add one to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {tasks.map((task) => {
                const isDone = !!completions[task.id];
                return (
                  <div
                    key={task.id}
                    className={`px-6 py-4 flex items-center gap-4 hover:bg-gray-800/40 transition-colors group ${
                      isDone ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(task.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-600 hover:border-brand-400 text-transparent hover:border-brand-400 cursor-pointer'
                      }`}
                    >
                      {isDone && '✓'}
                    </button>

                    {/* Task info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${isDone ? 'line-through text-gray-400' : 'text-white'}`}>
                          {task.title}
                        </span>
                        <span className={`badge ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                        {task.category && <span className="badge badge-gray text-xs">{task.category}</span>}
                        {task.time_slot && <span className="badge badge-blue text-xs">🕐 {task.time_slot}</span>}
                        {task.is_locked && <span className="badge badge-amber text-xs">🔒</span>}
                      </div>
                    </div>

                    {/* Timer */}
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
                          <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>

                    {/* Delete */}
                    {!task.is_locked && (
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="flex-shrink-0 p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer nav ── */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <button onClick={onOpenHistory} className="hover:text-brand-400 transition-colors">
            📊 View full history matrix →
          </button>
          <p>{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
      </main>
    </div>
  );
}
