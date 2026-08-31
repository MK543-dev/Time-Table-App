import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Sparkles,
  Lock,
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
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, CategoryDef, TaskPriority, TaskStatus, RecurrenceType } from '../types';
import { ThreeProgressRing } from './ThreeProgressRing';

interface TaskBoardProps {
  tasks: Task[];
  categories: CategoryDef[];
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
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  categories,
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

  // Calculate metrics for today
  const dailyTasks = tasks.filter((t) => !t.date || t.date === selectedDate);
  const completedCount = dailyTasks.filter((t) => t.status === 'done').length;
  const totalCount = dailyTasks.length;
  const totalPlannedMinutes = dailyTasks.reduce((acc, t) => acc + (t.duration_minutes || 60), 0);
  const totalPlannedHours = (totalPlannedMinutes / 60).toFixed(1);
  const totalLoggedSeconds = dailyTasks.reduce((acc, t) => acc + (t.time_spent_seconds || 0), 0);
  const totalLoggedHours = (totalLoggedSeconds / 3600).toFixed(1);
  const isOverloaded = parseFloat(totalPlannedHours) > maxDailyHoursThreshold;

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
        is_admin_locked: false,
        time_spent_seconds: 0,
        tags: ['Manual Entry'],
        notes: newNotes,
      });
    }

    setIsAddingTask(false);
    setNewTitle('');
    setNewNotes('');
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
      {/* Top Hero Layout: 3D Torus Progress Ring + Day Overview & AI Quick Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3D Torus Hero Ring */}
        <div className="lg:col-span-4 flex flex-col">
          <ThreeProgressRing completed={completedCount} total={totalCount} />
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
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Planned Workload</div>
              <div className="text-lg font-bold font-mono text-slate-100 mt-0.5 flex items-baseline gap-1">
                <span>{totalPlannedHours} hrs</span>
                <span className="text-xs text-slate-500 font-normal">/ max {maxDailyHoursThreshold}h</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl glass-dark border border-white/5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Actual Logged Focus</div>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                {totalLoggedHours} hrs
              </div>
            </div>

            <div className="p-3.5 rounded-xl glass-dark border border-white/5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Completion Velocity</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Overload Warning Alert */}
          {isOverloaded && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">Schedule Warning:</span> You have planned {totalPlannedHours} hours for today, which exceeds your institutional {maxDailyHoursThreshold}h threshold.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Filters and Search Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass border border-white/5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-tasks-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedule, tags, subjects..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Status filter chips */}
          <div className="flex items-center gap-1">
            {['all', 'active', 'done', 'skipped'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedStatus === st
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                    : 'glass-dark text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Priority & Category dropdown filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-slate-200">All Priorities</option>
            <option value="high" className="bg-slate-900 text-slate-200">High Priority</option>
            <option value="medium" className="bg-slate-900 text-slate-200">Medium Priority</option>
            <option value="low" className="bg-slate-900 text-slate-200">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Task List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <span>Today's Schedule</span>
            <span className="text-cyan-400 font-mono">({filteredTasks.length} Blocks)</span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Block {currentDayCycle} Timetable
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-dark border border-dashed border-white/10">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-300">No scheduled blocks found for this filter</div>
            <div className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add a class or study block using the AI quick bar above or click "Add Block".
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'done';
              const isTimerActive = activeTimerTaskId === task.id;

              return (
                <div
                  key={task.id}
                  id={`task-item-${task.id}`}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                    isDone
                      ? 'glass-dark opacity-75 border-l-4 border-l-green-500 border-t border-r border-b border-white/5'
                      : isTimerActive
                      ? 'glass border-l-4 border-l-cyan-500 border-t border-r border-b border-white/15 glow-cyan-sm'
                      : task.is_admin_locked
                      ? 'glass-dark opacity-80 border-l-4 border-l-indigo-500 border-t border-r border-b border-white/5'
                      : 'glass-dark border-l-4 border-l-slate-600 hover:border-l-cyan-400 border-t border-r border-b border-white/5'
                  }`}
                >
                  {/* Left Column: Checkbox, Title, Category dot, Time slot */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {/* Interactive Checkbox */}
                    <button
                      id={`task-toggle-${task.id}`}
                      onClick={() => handleCheckboxClick(task)}
                      className="mt-0.5 sm:mt-0 text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400 fill-green-500/20" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-500 group-hover:text-cyan-400" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold tracking-tight truncate ${
                            isDone ? 'line-through text-slate-500' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Status Label */}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isDone ? 'text-green-400' : isTimerActive ? 'text-cyan-400' : 'text-slate-500'
                        }`}>
                          {isDone ? 'DONE' : isTimerActive ? 'ACTIVE' : task.start_time}
                        </span>

                        {/* Admin Locked Badge */}
                        {task.is_admin_locked && (
                          <span
                            title="Set by your organization."
                            className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-[9px] font-bold border border-indigo-500/30 uppercase cursor-help flex items-center gap-1"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            <span>Locked by Admin</span>
                          </span>
                        )}

                        {/* Priority Badge */}
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getPriorityBadgeClass(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* Subtitle Details: Category, Time slot, Logged info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {/* Time & Room info */}
                        <div className="flex items-center gap-1 text-slate-400">
                          <span className="font-mono">
                            {task.start_time} - {task.end_time} ({task.duration_minutes}m)
                          </span>
                          {task.room && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400 font-mono text-[11px]">{task.room}</span>
                            </>
                          )}
                        </div>

                        {/* Category */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: getCategoryColor(task.category) }}
                          />
                          <span className="font-medium text-slate-400">{task.category}</span>
                        </div>

                        {/* Time Logged Tag */}
                        {task.time_spent_seconds > 0 && (
                          <div className="flex items-center gap-1 text-cyan-400 font-mono font-medium text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                            <span>Logged: {formatSeconds(task.time_spent_seconds)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions (Start Timer, AI Split, Edit, Delete) */}
                  <div className="flex items-center gap-2 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0">
                    {/* Toggl-Style Start/Stop Timer Button */}
                    <button
                      id={`task-timer-btn-${task.id}`}
                      onClick={() => onStartTimer(task)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isTimerActive
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                          : 'glass hover:bg-white/10 text-white border border-white/10'
                      }`}
                    >
                      {isTimerActive ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-white" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                          <span>Track</span>
                        </>
                      )}
                    </button>

                    {/* AI Task Splitter Button */}
                    {!isDone && (
                      <button
                        onClick={() => onSplitTaskAI(task)}
                        title="AI Split: Break this task into 45-minute actionable blocks"
                        className="p-1.5 rounded-xl glass hover:bg-white/10 text-cyan-300 border border-cyan-500/30 transition-colors"
                      >
                        <Split className="w-4 h-4" />
                      </button>
                    )}

                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setNewTitle(task.title);
                        setNewCategory(task.category);
                        setNewStartTime(task.start_time);
                        setNewEndTime(task.end_time);
                        setNewPriority(task.priority);
                        setNewRecurrence(task.recurrence_rule);
                        setNewNotes(task.notes || '');
                        setIsAddingTask(true);
                      }}
                      className="p-1.5 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Edit task parameters"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Button (disabled if admin-locked) */}
                    <button
                      onClick={() => {
                        if (task.is_admin_locked) {
                          alert('This task is locked by your organization governance policy.');
                          return;
                        }
                        if (confirm(`Remove "${task.title}" from timetable?`)) {
                          onDeleteTask(task.id);
                        }
                      }}
                      disabled={task.is_admin_locked}
                      className={`p-1.5 rounded-xl transition-colors ${
                        task.is_admin_locked
                          ? 'opacity-25 cursor-not-allowed text-slate-600 glass'
                          : 'glass hover:bg-rose-500/20 text-slate-400 hover:text-rose-300'
                      }`}
                      title={task.is_admin_locked ? 'Locked by organization' : 'Delete task'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
