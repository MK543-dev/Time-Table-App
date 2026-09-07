import React, { useState, useCallback } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Sparkles,
  Lock,
  Unlock,
  Play,
  Square,
  Trash2,
  Edit2,
  Split,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  Calendar,
  Layers,
  CheckCheck,
  ChevronRight,
  Info,
  Tag,
  ShieldCheck,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, CategoryDef, TaskPriority, TaskStatus, RecurrenceType, User } from '../types';
import { ThreeProgressRing } from './ThreeProgressRing';
import { DailyTasksSection } from './DailyTasksSection';

interface TaskBoardProps {
  tasks: Task[];
  categories: CategoryDef[];
  currentUser?: User | null;
  isAdmin?: boolean;
  onStreakUpdate?: (newStreak: number) => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Partial<Task>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStartTimer: (task: Task) => void;
  activeTimerTaskId?: string;
  maxDailyHoursThreshold: number;
  currentDayCycle: 'A' | 'B';
  onSplitTaskAI: (task: Task) => void;
  gamificationEnabled: boolean;
  onUnlockAllTasks?: () => void;
  onLockAllTasks?: () => void;
  onBatchCompleteAll?: () => void;
  onBatchResetAll?: () => void;
  onResetStreak?: () => void;
  onClearAllTasks?: () => void;
  onRestoreDefaultTasks?: () => void;
  onOpenAIAgent?: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  categories,
  currentUser,
  isAdmin: propIsAdmin,
  onStreakUpdate,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onStartTimer,
  activeTimerTaskId,
  maxDailyHoursThreshold = 16,
  currentDayCycle = 'A',
  onSplitTaskAI,
  gamificationEnabled = true,
  onUnlockAllTasks,
  onLockAllTasks,
  onBatchCompleteAll,
  onBatchResetAll,
  onResetStreak,
  onClearAllTasks,
  onRestoreDefaultTasks,
  onOpenAIAgent,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiParseMessage, setAiParseMessage] = useState<string | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0]?.name || 'General Study');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:30');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newRecurrence, setNewRecurrence] = useState<RecurrenceType>('none');
  const [newNotes, setNewNotes] = useState('');
  const [newIsAdminLocked, setNewIsAdminLocked] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // Filter tasks for selected date
  const filteredTasks = tasks.filter((t) => {
    const matchesDate = !t.date || t.date === selectedDate;
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    const matchesStatus =
      selectedStatus === 'all'
        ? true
        : selectedStatus === 'active'
        ? t.status === 'pending'
        : t.status === selectedStatus;
    const matchesSearch =
      searchQuery.trim() === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDate && matchesCategory && matchesPriority && matchesStatus && matchesSearch;
  });

  // Daily tasks progress state for 3D hero ring and stats
  const [dailyProgress, setDailyProgress] = useState<{
    completed: number;
    total: number;
    percentage: number;
    plannedMinutes: number;
    completedMinutes: number;
  }>({
    completed: 0,
    total: 10,
    percentage: 0,
    plannedMinutes: 676,
    completedMinutes: 0,
  });

  const handleProgressUpdate = useCallback(
    (stats: {
      completed: number;
      total: number;
      percentage: number;
      plannedMinutes: number;
      completedMinutes: number;
    }) => {
      setDailyProgress((prev) => {
        if (
          prev.completed === stats.completed &&
          prev.total === stats.total &&
          prev.percentage === stats.percentage &&
          prev.plannedMinutes === stats.plannedMinutes &&
          prev.completedMinutes === stats.completedMinutes
        ) {
          return prev;
        }
        return stats;
      });
    },
    []
  );

  const handleDateChange = useCallback((newD: string) => {
    setSelectedDate(newD);
  }, []);

  const displayPlannedHours = (dailyProgress.plannedMinutes / 60).toFixed(1);
  const displayCompletedHours = (dailyProgress.completedMinutes / 60).toFixed(1);
  const isOverloaded = parseFloat(displayPlannedHours) > maxDailyHoursThreshold;

  // Handle Checkbox Toggle with celebration
  const handleCheckboxClick = (task: Task) => {
    const willBeDone = task.status !== 'done';
    onToggleTask(task.id);

    if (willBeDone && gamificationEnabled) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#22d3ee', '#6366f1', '#10b981', '#f59e0b'],
      });
    }
  };

  // AI Natural Language Parse & Add
  const handleAiParseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInput.trim()) return;

    setIsAiParsing(true);
    setAiParseMessage(null);

    try {
      const res = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: aiPromptInput,
          availableCategories: categories,
        }),
      });

      const data = await res.json();
      if (data.success && data.task) {
        const parsed = data.task;
        const targetDate = new Date();
        if (parsed.dateOffsetDays) {
          targetDate.setDate(targetDate.getDate() + parsed.dateOffsetDays);
        }
        const dateStr = targetDate.toISOString().split('T')[0];

        onAddTask({
          title: parsed.title,
          category: parsed.category || categories[0]?.name,
          date: dateStr,
          start_time: parsed.start_time || '09:00',
          end_time: parsed.end_time || '10:30',
          duration_minutes: parsed.duration_minutes || 90,
          priority: parsed.priority || 'medium',
          status: 'pending',
          recurrence_rule: parsed.recurrence_rule || 'none',
          is_admin_locked: false,
          time_spent_seconds: 0,
          tags: parsed.tags || ['AI-Parsed'],
          notes: parsed.notes || '',
        });

        setAiPromptInput('');
        setAiParseMessage(`✨ Auto-scheduled "${parsed.title}" (${parsed.start_time}-${parsed.end_time})`);
        setTimeout(() => setAiParseMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to parse natural language task:', err);
    } finally {
      setIsAiParsing(false);
    }
  };

  // Save Manual Task
  const handleSaveManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const [sH, sM] = newStartTime.split(':').map(Number);
    const [eH, eM] = newEndTime.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff <= 0) diff = 60;

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        title: newTitle,
        category: newCategory,
        start_time: newStartTime,
        end_time: newEndTime,
        duration_minutes: diff,
        priority: newPriority,
        recurrence_rule: newRecurrence,
        notes: newNotes,
        is_admin_locked: isAdmin ? newIsAdminLocked : editingTask.is_admin_locked,
      });
      setEditingTask(null);
    } else {
      onAddTask({
        title: newTitle,
        category: newCategory,
        date: selectedDate,
        start_time: newStartTime,
        end_time: newEndTime,
        duration_minutes: diff,
        priority: newPriority,
        status: 'pending',
        recurrence_rule: newRecurrence,
        is_admin_locked: isAdmin ? newIsAdminLocked : false,
        time_spent_seconds: 0,
        tags: ['Manual Entry'],
        notes: newNotes,
      });
    }

    setIsAddingTask(false);
    setNewTitle('');
    setNewNotes('');
    setNewIsAdminLocked(false);
  };

  const getPriorityBadgeClass = (p: TaskPriority) => {
    switch (p) {
      case 'high':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'low':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  const getCategoryColor = (catName: string) => {
    const c = categories.find((x) => x.name === catName);
    return c ? c.color : '#22d3ee';
  };

  const formatSeconds = (sec: number) => {
    if (!sec) return '0m';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Admin Master Access Toolbar */}
      {isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-3 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-sm shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                👑
              </div>
              <div>
                <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <span>Administrator Master Access Control</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 font-mono">
                    Full Override Enabled
                  </span>
                </div>
                <div className="text-[11px] text-amber-200/70">
                  You have omnipotent access across the entire app to modify, lock/unlock, delete, or reset any routine and streaks.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onUnlockAllTasks && (
                <button
                  type="button"
                  onClick={onUnlockAllTasks}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass hover:bg-white/10 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm"
                  title="Unlock all tasks so anyone can modify them"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock All</span>
                </button>
              )}

              {onLockAllTasks && (
                <button
                  type="button"
                  onClick={onLockAllTasks}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass hover:bg-white/10 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm"
                  title="Lock all tasks to enforce institutional routine"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock All</span>
                </button>
              )}

              {onBatchCompleteAll && (
                <button
                  type="button"
                  onClick={onBatchCompleteAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm"
                  title="Mark all tasks for today as completed"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Complete All</span>
                </button>
              )}

              {onBatchResetAll && (
                <button
                  type="button"
                  onClick={onBatchResetAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition-all shadow-sm"
                  title="Reset all tasks to pending status"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Pending</span>
                </button>
              )}

              {onResetStreak && (
                <button
                  type="button"
                  onClick={onResetStreak}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm"
                  title="Reset streak count to zero"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Reset Streak to 0</span>
                </button>
              )}

              {onRestoreDefaultTasks && (
                <button
                  type="button"
                  onClick={onRestoreDefaultTasks}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass hover:bg-white/10 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all shadow-sm"
                  title="Reload institutional standard 11 timetable routine tasks"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore Schedule</span>
                </button>
              )}

              {onClearAllTasks && (
                <button
                  type="button"
                  onClick={onClearAllTasks}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all shadow-sm"
                  title="Remove all tasks from schedule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Hero Layout: 3D Torus Progress Ring + Day Overview & AI Quick Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3D Torus Hero Ring (Dynamic Daily Velocity) */}
        <div className="lg:col-span-4 flex flex-col">
          <ThreeProgressRing completed={dailyProgress.completed} total={dailyProgress.total} />
        </div>

        {/* Right: Immersive Day Bar, AI Natural Language Entry & Capacity */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4 p-6 rounded-2xl glass shadow-2xl">
          {/* Header Row with Date Navigation & Rotation Cycle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                    : 'glass-dark text-slate-300 hover:text-white hover:border-white/10'
                }`}
              >
                Today ({new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-dark text-xs border border-white/5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
                />
              </div>

              {/* Cycle A/B Day Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Block {currentDayCycle}</span>
              </div>
            </div>

            <button
              id="open-manual-task-modal-btn"
              onClick={() => {
                setEditingTask(null);
                setIsAddingTask(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Block</span>
            </button>
          </div>

          {/* AI Natural Language Task Entry Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart AI Scheduler</span>
              <span className="text-[10px] text-slate-500 font-normal lowercase">
                ("Study DBMS 6-8pm tomorrow", "Physics Lab high priority 45m")
              </span>
            </label>

            <form onSubmit={handleAiParseSubmit} className="relative flex items-center">
              <input
                id="ai-task-prompt-input"
                type="text"
                value={aiPromptInput}
                onChange={(e) => setAiPromptInput(e.target.value)}
                placeholder="Type in natural language: 'Study Algorithms 2pm to 4pm urgent'..."
                className="w-full pl-4 pr-32 py-2.5 rounded-xl glass-dark border border-white/10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all"
              />
              <button
                type="submit"
                disabled={isAiParsing || !aiPromptInput.trim()}
                className="absolute right-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
              >
                {isAiParsing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>AI Parse</span>
                  </>
                )}
              </button>
            </form>

            {aiParseMessage && (
              <div className="text-xs text-cyan-400 font-medium animate-fadeIn">
                {aiParseMessage}
              </div>
            )}
          </div>

          {/* Schedule Capacity & Planned vs Logged Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl glass-dark border border-white/5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Planned Routine</div>
              <div className="text-lg font-bold font-mono text-slate-100 mt-0.5 flex items-baseline gap-1">
                <span>{displayPlannedHours} hrs</span>
                <span className="text-xs text-slate-500 font-normal">/ max {maxDailyHoursThreshold}h</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl glass-dark border border-white/5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Completed Routine</div>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                {displayCompletedHours} hrs
              </div>
            </div>

            <div className="p-3.5 rounded-xl glass-dark border border-white/5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Completion Velocity</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {dailyProgress.percentage}%
              </div>
            </div>
          </div>

          {/* Overload Warning Alert */}
          {isOverloaded && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">Schedule Warning:</span> You have planned {displayPlannedHours} hours for today, which exceeds your institutional {maxDailyHoursThreshold}h threshold.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Permanent Daily Tasks Section (Directly visible on main dashboard, resets daily) */}
      <DailyTasksSection
        currentUser={currentUser}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onProgressUpdate={handleProgressUpdate}
        onStreakUpdate={onStreakUpdate}
        onOpenAIAgent={onOpenAIAgent}
      />

      {/* Manual Task Add / Edit Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-dark border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{editingTask ? 'Edit Timetable Block' : 'Add New Block / Class'}</span>
              </h3>
              <button
                onClick={() => setIsAddingTask(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveManualTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Task / Subject Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. DBMS Lecture: Relational Algebra"
                  className="w-full mt-1 px-3.5 py-2 rounded-xl glass-dark border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Category / Subject</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                  >
                    <option value="high" className="bg-slate-900 text-slate-200">High (Exam/Core)</option>
                    <option value="medium" className="bg-slate-900 text-slate-200">Medium (Regular)</option>
                    <option value="low" className="bg-slate-900 text-slate-200">Low (Optional)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">End Time</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Schedule Recurrence</label>
                <select
                  value={newRecurrence}
                  onChange={(e) => setNewRecurrence(e.target.value as RecurrenceType)}
                  className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                >
                  <option value="none" className="bg-slate-900 text-slate-200">One-time Task</option>
                  <option value="daily" className="bg-slate-900 text-slate-200">Daily Recurrence</option>
                  <option value="weekly" className="bg-slate-900 text-slate-200">Weekly Recurrence</option>
                  <option value="rotating_A" className="bg-slate-900 text-slate-200">Block A Rotation</option>
                  <option value="rotating_B" className="bg-slate-900 text-slate-200">Block B Rotation</option>
                </select>
              </div>

              {isAdmin && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Institutional Lock Policy</span>
                    </div>
                    <div className="text-[11px] text-amber-200/70">
                      When locked, regular users cannot delete or remove this block.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newIsAdminLocked}
                    onChange={(e) => setNewIsAdminLocked(e.target.checked)}
                    className="w-4 h-4 rounded border-amber-500/50 text-amber-500 focus:ring-amber-400/50 bg-slate-900 cursor-pointer"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300">Notes & Objectives</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Key concepts, room locations, or reading references..."
                  className="w-full mt-1 px-3.5 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 rounded-xl glass hover:bg-white/5 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-lg shadow-cyan-500/25"
                >
                  {editingTask ? 'Update Block' : 'Save to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
