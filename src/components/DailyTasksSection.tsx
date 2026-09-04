import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  CheckCheck,
  RotateCcw,
  Calendar,
  Layers,
  Sun,
  BookOpen,
  Activity,
  GraduationCap,
  Cpu,
  Video,
  Code,
  Database,
  MessageSquare,
  Flame,
  Table as TableIcon,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Coffee,
  Target,
  Terminal,
  Book,
  Dumbbell,
  Brain,
  Zap,
  Shield,
  Sliders,
  Search,
  Bot,
  Download,
  CalendarPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  DailyTaskDefinition,
  DailyTaskCompletion,
  DailyTaskWithStatus,
  User,
  DailyHistoryRecord,
} from '../types';
import {
  PERMANENT_DAILY_TASKS,
  INITIAL_DAILY_COMPLETIONS,
  createDefaultNewUserTasks,
} from '../mockData';

interface DailyTasksSectionProps {
  currentUser?: User | null;
  selectedDate?: string;
  onDateChange?: (newDate: string) => void;
  onStreakUpdate?: (newStreak: number) => void;
  onOpenAIAgent?: () => void;
  onProgressUpdate?: (stats: {
    completed: number;
    total: number;
    percentage: number;
    plannedMinutes: number;
    completedMinutes: number;
  }) => void;
}

const PRESET_CATEGORIES = [
  'Morning Routine & Fitness',
  "Spiritual & Qur'an",
  'Core Academic Classes',
  'Machine Learning (ML)',
  'Data Science (DS)',
  'Python Programming',
  'SQL & Databases',
  'Communication Skills',
  'DSA & Problem Solving',
  'Web Development',
  'System Design',
  'Deep Work & Focus',
  'General',
];

const AVAILABLE_ICONS = [
  { name: 'Sun', label: 'Sun / Morning' },
  { name: 'BookOpen', label: 'Book / Reading' },
  { name: 'Activity', label: 'Activity / Fitness' },
  { name: 'GraduationCap', label: 'Academic / Class' },
  { name: 'Cpu', label: 'ML / AI' },
  { name: 'Video', label: 'Video / Lecture' },
  { name: 'Code', label: 'Programming / Python' },
  { name: 'Database', label: 'SQL / Database' },
  { name: 'MessageSquare', label: 'Communication' },
  { name: 'Layers', label: 'DSA / Structure' },
  { name: 'Flame', label: 'Streak / High Priority' },
  { name: 'Target', label: 'Goal / Target' },
  { name: 'Brain', label: 'Research / Logic' },
  { name: 'Terminal', label: 'Terminal / CLI' },
  { name: 'Dumbbell', label: 'Gym / Workout' },
  { name: 'Coffee', label: 'Break / Routine' },
  { name: 'Zap', label: 'Sprint / Quick' },
  { name: 'Clock', label: 'Timer / Schedule' },
];

export const DailyTasksSection: React.FC<DailyTasksSectionProps> = ({
  currentUser,
  selectedDate: externalDate,
  onDateChange,
  onStreakUpdate,
  onOpenAIAgent,
  onProgressUpdate,
}) => {
  // Callback refs to prevent re-render loops when parent re-renders
  const onProgressUpdateRef = useRef(onProgressUpdate);
  onProgressUpdateRef.current = onProgressUpdate;

  const onStreakUpdateRef = useRef(onStreakUpdate);
  onStreakUpdateRef.current = onStreakUpdate;

  const onDateChangeRef = useRef(onDateChange);
  onDateChangeRef.current = onDateChange;

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [internalDate, setInternalDate] = useState<string>(externalDate || todayStr);

  const activeDate = externalDate || internalDate;

  const handleSelectDate = useCallback((dateVal: string) => {
    setInternalDate(dateVal);
    onDateChangeRef.current?.(dateVal);
  }, []);

  const userId = currentUser?.id || '';
  const STORAGE_KEY_DEFS = `timeforge_daily_task_defs_${userId}`;
  const STORAGE_KEY_COMPLETIONS = `timeforge_daily_completions_v5_${userId}`;

  // Server-authoritative streak state (synchronized with developer overrides & backend)
  const [serverStreak, setServerStreak] = useState<number | null>(() => {
    return currentUser?.streak_count !== undefined ? currentUser.streak_count : null;
  });

  // Task Definitions State (Customizable / CRUD)
  const [taskDefinitions, setTaskDefinitions] = useState<DailyTaskDefinition[]>(() => {
    if (!userId) return [];
    const saved = localStorage.getItem(STORAGE_KEY_DEFS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback below
      }
    }
    return (userId === 'usr_1' || userId === 'usr_admin') ? PERMANENT_DAILY_TASKS : createDefaultNewUserTasks(userId);
  });

  // Completions database state
  const [completions, setCompletions] = useState<DailyTaskCompletion[]>(() => {
    if (!userId) return [];
    const saved = localStorage.getItem(STORAGE_KEY_COMPLETIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return (userId === 'usr_1' || userId === 'usr_admin') ? INITIAL_DAILY_COMPLETIONS : [];
      }
    }
    return (userId === 'usr_1' || userId === 'usr_admin') ? INITIAL_DAILY_COMPLETIONS : [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<DailyHistoryRecord[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | '7days' | '30days' | 'this_month' | 'missed'>('all');
  const [historySearch, setHistorySearch] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTaskDefinition | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formTimeSlot, setFormTimeSlot] = useState('');
  const [formDuration, setFormDuration] = useState<number>(30);
  const [formCategory, setFormCategory] = useState('General');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIcon, setFormIcon] = useState('CheckCircle2');
  const [formError, setFormError] = useState('');

  // Delete Confirmation State
  const [taskToDelete, setTaskToDelete] = useState<DailyTaskDefinition | null>(null);

  // Fetch from server on mount or date/user change
  useEffect(() => {
    let isMounted = true;
    const fetchServerTasks = async () => {
      if (!userId) {
        if (isMounted) {
          setTaskDefinitions([]);
          setCompletions([]);
          setIsLoading(false);
        }
        return;
      }
      try {
        setIsLoading(true);
        const token = localStorage.getItem('timeforge_session_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`/api/daily-tasks?date=${activeDate}&user_id=${userId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.streak !== undefined && typeof data.streak === 'number') {
              setServerStreak(data.streak);
            }
            if (data.definitions && Array.isArray(data.definitions) && data.definitions.length > 0) {
              setTaskDefinitions(data.definitions);
              localStorage.setItem(STORAGE_KEY_DEFS, JSON.stringify(data.definitions));
            }
            if (data.completions && Array.isArray(data.completions)) {
              setCompletions((prev) => {
                const otherDates = prev.filter((c) => c.date !== activeDate);
                const validCompletions = data.completions.filter((c: DailyTaskCompletion) => Boolean(c.date));
                const merged = [...otherDates, ...validCompletions];
                localStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(merged));
                return merged;
              });
            }
          }
        }
      } catch (err) {
        // Fallback to local storage
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchServerTasks();

    const handleExternalUpdate = () => {
      fetchServerTasks();
    };
    const handleStreakEvent = (e: any) => {
      if (e?.detail?.streak !== undefined && typeof e.detail.streak === 'number') {
        setServerStreak(e.detail.streak);
      }
    };
    window.addEventListener('timeforge-state-updated', handleExternalUpdate);
    window.addEventListener('timeforge-streak-updated', handleStreakEvent);

    return () => {
      isMounted = false;
      window.removeEventListener('timeforge-state-updated', handleExternalUpdate);
      window.removeEventListener('timeforge-streak-updated', handleStreakEvent);
    };
  }, [activeDate, userId, STORAGE_KEY_DEFS, STORAGE_KEY_COMPLETIONS]);

  // Streak Calculation:
  // Strict rule: starts from 0 for new user or whenever a day is missed.
  const userStreak = useMemo(() => {
    if (!taskDefinitions.length) return 0;
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    const getDateStr = (daysAgo: number) => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    const isDate100Done = (dStr: string) => {
      const completedCount = taskDefinitions.filter((def) => {
        const found = completions.find((c) => c.task_id === def.id && c.date === dStr);
        return found?.completed;
      }).length;
      return completedCount === taskDefinitions.length && taskDefinitions.length > 0;
    };

    const todayDone = isDate100Done(todayFormatted);
    const yesterdayDone = isDate100Done(getDateStr(1));

    if (todayDone) {
      let count = 1;
      let daysAgo = 1;
      while (isDate100Done(getDateStr(daysAgo))) {
        count++;
        daysAgo++;
      }
      return count;
    }

    // Today not yet 100%: if yesterday was completed, previous streak is maintained
    // BUT if yesterday was MISSED (< 100%), streak starts from ZERO!
    if (yesterdayDone) {
      let count = 1;
      let daysAgo = 2;
      while (isDate100Done(getDateStr(daysAgo))) {
        count++;
        daysAgo++;
      }
      return count;
    }

    // Missed yesterday or new user -> starts strictly from 0
    return 0;
  }, [completions, taskDefinitions]);

  // Effective Streak: prefers server authoritative / developer overridden streak
  const effectiveStreak = serverStreak !== null
    ? serverStreak
    : (currentUser?.streak_count !== undefined ? currentUser.streak_count : userStreak);

  // Sync computed streak up to parent only when streak actually changes
  const lastReportedStreakRef = useRef<number | null>(null);
  useEffect(() => {
    if (serverStreak !== null) {
      if (lastReportedStreakRef.current !== serverStreak) {
        lastReportedStreakRef.current = serverStreak;
        onStreakUpdateRef.current?.(serverStreak);
      }
    } else if (currentUser?.streak_count !== undefined) {
      lastReportedStreakRef.current = currentUser.streak_count;
    } else if (lastReportedStreakRef.current !== userStreak) {
      lastReportedStreakRef.current = userStreak;
      onStreakUpdateRef.current?.(userStreak);
    }
  }, [serverStreak, userStreak, currentUser?.streak_count]);

  // Fetch full history for spreadsheet matrix view
  const loadHistory = async () => {
    if (!userId) {
      setHistoryRecords([]);
      return;
    }
    try {
      const token = localStorage.getItem('timeforge_session_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/daily-tasks/history?user_id=${userId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.history && Array.isArray(data.history)) {
          setHistoryRecords(data.history);
          if (data.streak !== undefined && typeof data.streak === 'number') {
            setServerStreak(data.streak);
            if (lastReportedStreakRef.current !== data.streak) {
              lastReportedStreakRef.current = data.streak;
              onStreakUpdateRef.current?.(data.streak);
            }
          }
          return;
        }
      }
    } catch (e) {
      // fallback to local generator
    }

    // Local continuous calendar generator (all calendar days from today backwards for at least 30 days)
    const today = new Date();
    const allDays: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      allDays.push(d.toISOString().split('T')[0]);
    }

    const computed: DailyHistoryRecord[] = allDays.map((dStr) => {
      const taskMap: Record<string, boolean | null> = {};
      let compCount = 0;
      taskDefinitions.forEach((t) => {
        const found = completions.find((c) => c.task_id === t.id && c.date === dStr);
        if (found && found.completed === true) {
          taskMap[t.id] = true;
          compCount++;
        } else if (found && found.completed === false) {
          taskMap[t.id] = false;
        } else {
          taskMap[t.id] = null; // No record (missed / unattempted)
        }
      });
      const [y, m, d] = dStr.split('-');
      return {
        date: dStr,
        display_date: `${d}-${m}-${y}`,
        total: taskDefinitions.length,
        completed: compCount,
        percentage:
          taskDefinitions.length > 0 ? Math.round((compCount / taskDefinitions.length) * 100) : 0,
        task_completions: taskMap,
      };
    });
    setHistoryRecords(computed);
  };

  useEffect(() => {
    if (showHistorySheet) {
      loadHistory();
    }
  }, [showHistorySheet, completions, taskDefinitions]);

  // State for adding a custom date row
  const [newDateInput, setNewDateInput] = useState('');

  // Set single cell status in the History Matrix spreadsheet supporting tri-state cycle or explicit selection
  const handleSetCellStatus = async (targetDate: string, taskId: string, explicitStatus?: boolean | null) => {
    let nextStatus: boolean | null = null;
    if (explicitStatus !== undefined) {
      nextStatus = explicitStatus;
    } else {
      const existing = completions.find((c) => c.task_id === taskId && c.date === targetDate);
      if (!existing) {
        nextStatus = true;
      } else if (existing.completed) {
        nextStatus = false;
      } else {
        nextStatus = null; // Clear record
      }
    }

    setCompletions((prev) => {
      const filtered = prev.filter(
        (c) => !(c.task_id === taskId && c.date === targetDate)
      );
      let updatedList = filtered;
      if (nextStatus !== null) {
        updatedList = [
          ...filtered,
          {
            id: `dtc_${targetDate}_${taskId}`,
            user_id: userId,
            task_id: taskId,
            date: targetDate,
            completed: nextStatus,
            completed_at: nextStatus ? new Date().toISOString() : undefined,
          },
        ];
      }
      localStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(updatedList));
      return updatedList;
    });

    setHistoryRecords((prev) =>
      prev.map((row) => {
        if (row.date !== targetDate) return row;
        const newComps = { ...row.task_completions, [taskId]: nextStatus };
        const newCompCount = Object.values(newComps).filter((v) => v === true).length;
        return {
          ...row,
          completed: newCompCount,
          percentage: row.total > 0 ? Math.round((newCompCount / row.total) * 100) : 0,
          task_completions: newComps,
        };
      })
    );

    try {
      const res = await fetch('/api/daily-tasks/history/toggle-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: targetDate,
          task_id: taskId,
          user_id: userId,
          completed: nextStatus,
          action: nextStatus === null ? 'clear' : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.streak !== undefined && typeof data.streak === 'number') {
          setServerStreak(data.streak);
          onStreakUpdateRef.current?.(data.streak);
          window.dispatchEvent(new CustomEvent('timeforge-streak-updated', { detail: { streak: data.streak } }));
        }
      }
      window.dispatchEvent(new Event('timeforge-state-updated'));
    } catch (err) {
      console.warn('Backend history cell sync failed, kept locally');
    }
  };

  // Row-level batch complete or uncomplete for an entire day
  const handleRowMarkAll = async (targetDate: string, status: boolean) => {
    const newCompletionsMap: Record<string, boolean> = {};
    taskDefinitions.forEach((t) => {
      newCompletionsMap[t.id] = status;
    });

    setCompletions((prev) => {
      const filtered = prev.filter((c) => c.date !== targetDate);
      const newItems: DailyTaskCompletion[] = taskDefinitions.map((t) => ({
        id: `dtc_${targetDate}_${t.id}`,
        user_id: userId,
        task_id: t.id,
        date: targetDate,
        completed: status,
        completed_at: status ? new Date().toISOString() : undefined,
      }));
      const merged = [...filtered, ...newItems];
      localStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(merged));
      return merged;
    });

    setHistoryRecords((prev) =>
      prev.map((row) => {
        if (row.date !== targetDate) return row;
        const taskMap: Record<string, boolean | null> = {};
        taskDefinitions.forEach((t) => {
          taskMap[t.id] = status;
        });
        const compCount = status ? taskDefinitions.length : 0;
        return {
          ...row,
          completed: compCount,
          percentage: status ? 100 : 0,
          task_completions: taskMap,
        };
      })
    );

    try {
      const res = await fetch('/api/daily-tasks/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: targetDate,
          user_id: userId,
          completions: newCompletionsMap,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.streak !== undefined && typeof data.streak === 'number') {
          setServerStreak(data.streak);
          onStreakUpdateRef.current?.(data.streak);
          window.dispatchEvent(new CustomEvent('timeforge-streak-updated', { detail: { streak: data.streak } }));
        }
      }
      window.dispatchEvent(new Event('timeforge-state-updated'));
    } catch (e) {}
  };

  // Row-level batch clear (reset to — unattempted)
  const handleRowClearAll = async (targetDate: string) => {
    setCompletions((prev) => {
      const filtered = prev.filter((c) => c.date !== targetDate);
      localStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(filtered));
      return filtered;
    });

    setHistoryRecords((prev) =>
      prev.map((row) => {
        if (row.date !== targetDate) return row;
        const taskMap: Record<string, boolean | null> = {};
        taskDefinitions.forEach((t) => {
          taskMap[t.id] = null;
        });
        return {
          ...row,
          completed: 0,
          percentage: 0,
          task_completions: taskMap,
        };
      })
    );

    try {
      const res = await fetch('/api/daily-tasks/batch-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: targetDate,
          user_id: userId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.streak !== undefined && typeof data.streak === 'number') {
          setServerStreak(data.streak);
          onStreakUpdateRef.current?.(data.streak);
          window.dispatchEvent(new CustomEvent('timeforge-streak-updated', { detail: { streak: data.streak } }));
        }
      }
      window.dispatchEvent(new Event('timeforge-state-updated'));
    } catch (e) {}
  };

  // Add custom historical date row to matrix
  const handleAddCustomDateRow = () => {
    if (!newDateInput) return;
    const dateVal = newDateInput;
    const exists = historyRecords.some((r) => r.date === dateVal);
    if (exists) {
      setHistoryFilter('all');
      setHistorySearch(dateVal);
      setNewDateInput('');
      return;
    }
    const [y, m, d] = dateVal.split('-');
    const taskMap: Record<string, boolean | null> = {};
    taskDefinitions.forEach((t) => {
      taskMap[t.id] = null;
    });
    const newRecord: DailyHistoryRecord = {
      date: dateVal,
      display_date: `${d}-${m}-${y}`,
      total: taskDefinitions.length,
      completed: 0,
      percentage: 0,
      task_completions: taskMap,
    };
    setHistoryRecords((prev) => {
      const next = [newRecord, ...prev];
      next.sort((a, b) => b.date.localeCompare(a.date));
      return next;
    });
    setHistoryFilter('all');
    setHistorySearch(dateVal);
    setNewDateInput('');
  };

  // Bulk complete all displayed dates
  const handleBulkCompleteFiltered = async () => {
    for (const row of filteredHistoryRecords) {
      await handleRowMarkAll(row.date, true);
    }
  };

  // Bulk clear all displayed dates
  const handleBulkResetFiltered = async () => {
    for (const row of filteredHistoryRecords) {
      await handleRowClearAll(row.date);
    }
  };

  // Export history matrix as CSV spreadsheet
  const handleExportCSV = () => {
    if (filteredHistoryRecords.length === 0) return;
    const headers = [
      'Date',
      'Display Date',
      ...taskDefinitions.map((t) => `"${t.title.replace(/"/g, '""')}"`),
      'Completed',
      'Total',
      'Percentage',
    ];
    const rows = filteredHistoryRecords.map((row) => {
      const taskValues = taskDefinitions.map((t) => {
        const status = row.task_completions[t.id];
        if (status === true) return 'Yes';
        if (status === false) return 'No';
        return '—';
      });
      return [
        row.date,
        row.display_date,
        ...taskValues,
        row.completed,
        row.total,
        `${row.percentage}%`,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `timeforge_history_matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered history records according to active view filter and search
  const filteredHistoryRecords = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const thisMonthPrefix = today.substring(0, 7);

    return historyRecords.filter((row) => {
      if (historySearch) {
        const q = historySearch.toLowerCase().trim();
        const matches = row.date.includes(q) || row.display_date.includes(q);
        if (!matches) return false;
      }
      if (historyFilter === '7days') {
        return row.date >= sevenDaysAgoStr && row.date <= today;
      }
      if (historyFilter === '30days') {
        return row.date >= thirtyDaysAgoStr && row.date <= today;
      }
      if (historyFilter === 'this_month') {
        return row.date.startsWith(thisMonthPrefix);
      }
      if (historyFilter === 'missed') {
        return row.percentage < 100;
      }
      return true;
    });
  }, [historyRecords, historyFilter, historySearch]);

  // Combine definitions with current active date completions
  const dailyTasksWithStatus: DailyTaskWithStatus[] = useMemo(() => {
    return taskDefinitions.map((taskDef) => {
      const comp = completions.find(
        (c) => c.task_id === taskDef.id && c.date === activeDate
      );
      return {
        ...taskDef,
        completed: comp ? comp.completed : false,
        completed_at: comp ? comp.completed_at : undefined,
        has_record: !!comp,
        record_status: comp ? (comp.completed ? 'completed' : 'not_completed') : 'no_record',
      };
    });
  }, [activeDate, completions, taskDefinitions]);

  // Progress Calculation
  const totalTasks = dailyTasksWithStatus.length;
  const completedTasks = dailyTasksWithStatus.filter((t) => t.completed).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const plannedMinutes = dailyTasksWithStatus.reduce((acc, t) => acc + (t.duration_minutes || 30), 0);
  const completedMinutes = dailyTasksWithStatus
    .filter((t) => t.completed)
    .reduce((acc, t) => acc + (t.duration_minutes || 30), 0);

  const lastReportedProgressRef = useRef<{
    completed: number;
    total: number;
    percentage: number;
    plannedMinutes: number;
    completedMinutes: number;
  } | null>(null);

  useEffect(() => {
    const prev = lastReportedProgressRef.current;
    if (
      !prev ||
      prev.completed !== completedTasks ||
      prev.total !== totalTasks ||
      prev.percentage !== progressPercentage ||
      prev.plannedMinutes !== plannedMinutes ||
      prev.completedMinutes !== completedMinutes
    ) {
      lastReportedProgressRef.current = {
        completed: completedTasks,
        total: totalTasks,
        percentage: progressPercentage,
        plannedMinutes,
        completedMinutes,
      };
      onProgressUpdateRef.current?.({
        completed: completedTasks,
        total: totalTasks,
        percentage: progressPercentage,
        plannedMinutes,
        completedMinutes,
      });
    }
  }, [completedTasks, totalTasks, progressPercentage, plannedMinutes, completedMinutes]);

  // Toggle Task Completion Handler
  const handleToggleTask = async (taskId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const currentItem = dailyTasksWithStatus.find((t) => t.id === taskId);
    const willBeCompleted = !currentItem?.completed;

    // 1. Optimistic local update
    setCompletions((prev) => {
      const filtered = prev.filter(
        (c) => !(c.task_id === taskId && c.date === activeDate)
      );
      const updated: DailyTaskCompletion = {
        id: `dtc_${activeDate}_${taskId}`,
        user_id: userId,
        task_id: taskId,
        date: activeDate,
        completed: willBeCompleted,
        completed_at: willBeCompleted ? new Date().toISOString() : undefined,
      };
      const nextList = [...filtered, updated];
      localStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(nextList));
      return nextList;
    });

    // 2. Confetti on completion or full 100%
    if (willBeCompleted) {
      if (completedTasks + 1 === totalTasks) {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#22d3ee', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
        });
      } else {
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.7 },
          colors: ['#22d3ee', '#10b981'],
        });
      }
    }

    // 3. Sync to backend
    try {
      await fetch(`/api/daily-tasks/${taskId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: activeDate,
          user_id: userId,
        }),
      });
    } catch (e) {
      console.warn('Backend sync failed, state preserved locally.');
    }
  };

  // Batch Complete All
  const handleBatchCompleteAll = async () => {
    const newCompletionsMap: Record<string, boolean> = {};
    taskDefinitions.forEach((t) => {
      newCompletionsMap[t.id] = true;
    });

    setCompletions((prev) => {
      const filtered = prev.filter((c) => c.date !== activeDate);
      const newItems: DailyTaskCompletion[] = taskDefinitions.map((t) => ({
        id: `dtc_${activeDate}_${t.id}`,
        user_id: userId,
        task_id: t.id,
        date: activeDate,
        completed: true,
        completed_at: new Date().toISOString(),
      }));
      const merged = [...filtered, ...newItems];
      localStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(merged));
      return merged;
    });

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#22d3ee', '#f59e0b'],
    });

    try {
      await fetch('/api/daily-tasks/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: activeDate,
          user_id: userId,
          completions: newCompletionsMap,
        }),
      });
    } catch (e) {}
  };

  // Batch Reset Today / Selected Day to clean uncompleted state
  const handleBatchResetDay = async () => {
    setCompletions((prev) => {
      const filtered = prev.filter((c) => c.date !== activeDate);
      localStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(filtered));
      return filtered;
    });

    try {
      await fetch('/api/daily-tasks/batch-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: activeDate,
          user_id: userId,
        }),
      });
    } catch (e) {}
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormTimeSlot('30mins');
    setFormDuration(30);
    setFormCategory('General');
    setFormCustomCategory('');
    setFormNotes('');
    setFormIcon('CheckCircle2');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (task: DailyTaskDefinition, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTask(task);
    setFormTitle(task.title);
    setFormTimeSlot(task.time_slot);
    setFormDuration(task.duration_minutes || 30);
    if (PRESET_CATEGORIES.includes(task.category)) {
      setFormCategory(task.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('Custom');
      setFormCustomCategory(task.category);
    }
    setFormNotes(task.notes || '');
    setFormIcon(task.icon || 'CheckCircle2');
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Task (Add or Edit)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Please enter a task title');
      return;
    }

    const finalCategory =
      formCategory === 'Custom' ? formCustomCategory.trim() || 'General' : formCategory;
    const finalTimeSlot = formTimeSlot.trim() || `${formDuration} mins`;

    if (editingTask) {
      // Update existing task
      const updatedDef: DailyTaskDefinition = {
        ...editingTask,
        title: formTitle.trim(),
        time_slot: finalTimeSlot,
        duration_minutes: Number(formDuration) || 30,
        category: finalCategory,
        notes: formNotes.trim() || undefined,
        icon: formIcon,
      };

      const updatedList = taskDefinitions.map((t) => (t.id === editingTask.id ? updatedDef : t));
      setTaskDefinitions(updatedList);
      localStorage.setItem(STORAGE_KEY_DEFS, JSON.stringify(updatedList));
      setIsModalOpen(false);

      try {
        await fetch(`/api/daily-tasks/definitions/${editingTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            ...updatedDef,
            user_id: userId,
          }),
        });
      } catch (err) {
        console.warn('Server sync failed, saved locally.');
      }
    } else {
      // Create new task
      const newId = `dt_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const nextOrder =
        taskDefinitions.length > 0 ? Math.max(...taskDefinitions.map((t) => t.order)) + 1 : 1;

      const newDef: DailyTaskDefinition = {
        id: newId,
        user_id: userId,
        order: nextOrder,
        title: formTitle.trim(),
        time_slot: finalTimeSlot,
        duration_minutes: Number(formDuration) || 30,
        category: finalCategory,
        notes: formNotes.trim() || undefined,
        icon: formIcon,
      };

      const updatedList = [...taskDefinitions, newDef];
      setTaskDefinitions(updatedList);
      localStorage.setItem(STORAGE_KEY_DEFS, JSON.stringify(updatedList));
      setIsModalOpen(false);

      try {
        await fetch('/api/daily-tasks/definitions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            ...newDef,
            user_id: userId,
          }),
        });
      } catch (err) {
        console.warn('Server sync failed, saved locally.');
      }
    }
  };

  // Delete Task
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    const targetId = taskToDelete.id;

    const updatedList = taskDefinitions.filter((t) => t.id !== targetId);
    setTaskDefinitions(updatedList);
    localStorage.setItem(STORAGE_KEY_DEFS, JSON.stringify(updatedList));

    // Also remove from local completions
    setCompletions((prev) => {
      const filtered = prev.filter((c) => c.task_id !== targetId);
      localStorage.setItem(STORAGE_KEY_COMPLETIONS, JSON.stringify(filtered));
      return filtered;
    });

    setTaskToDelete(null);

    try {
      await fetch(`/api/daily-tasks/definitions/${targetId}?user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });
    } catch (err) {
      console.warn('Server sync failed, deleted locally.');
    }
  };

  // Reset to original routine tasks
  const handleResetToDefaults = async () => {
    const isAlex = userId === 'usr_1';
    const confirmMsg = isAlex
      ? 'Restore the original 10 daily tasks (Wake-Up, Qur’an, Walking, Regular class, ML, DS Video, Python, SQL, Communication, DSA)?'
      : 'Restore the default daily routine (12 tasks including Morning Exercise, Study, College, Review, etc.)?';

    if (confirm(confirmMsg)) {
      const resetTasks = isAlex ? PERMANENT_DAILY_TASKS : createDefaultNewUserTasks(userId);
      setTaskDefinitions(resetTasks);
      localStorage.setItem(STORAGE_KEY_DEFS, JSON.stringify(resetTasks));

      try {
        await fetch('/api/daily-tasks/definitions/reset-defaults', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ user_id: userId }),
        });
      } catch (err) {}
    }
  };

  const getTaskIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sun':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-cyan-400" />;
      case 'Activity':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-indigo-400" />;
      case 'Cpu':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'Video':
        return <Video className="w-4 h-4 text-blue-400" />;
      case 'Code':
        return <Code className="w-4 h-4 text-amber-400" />;
      case 'Database':
        return <Database className="w-4 h-4 text-teal-400" />;
      case 'MessageSquare':
        return <MessageSquare className="w-4 h-4 text-fuchsia-400" />;
      case 'Layers':
        return <Layers className="w-4 h-4 text-rose-400" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'Target':
        return <Target className="w-4 h-4 text-rose-400" />;
      case 'Brain':
        return <Brain className="w-4 h-4 text-pink-400" />;
      case 'Terminal':
        return <Terminal className="w-4 h-4 text-emerald-400" />;
      case 'Dumbbell':
        return <Dumbbell className="w-4 h-4 text-cyan-400" />;
      case 'Coffee':
        return <Coffee className="w-4 h-4 text-amber-500" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'Shield':
        return <Shield className="w-4 h-4 text-indigo-400" />;
      default:
        return <Clock className="w-4 h-4 text-cyan-400" />;
    }
  };

  const isToday = activeDate === todayStr;

  return (
    <div
      id="daily-tasks-permanent-section"
      className="relative rounded-2xl glass-dark border border-white/10 p-5 sm:p-6 shadow-2xl transition-all duration-300 overflow-hidden"
    >
      {/* Subtle Background Glow Accent */}
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row: Title, Date Switcher, Progress Counter */}
      <div className="relative z-10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Flame className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Daily Tasks</h2>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                  {taskDefinitions.length} Tasks
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-purple-400" />
                  <span>Admin Mode Active</span>
                </span>
                {/* Real-time Streak Badge with Strict Reset Policy */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 font-bold text-xs shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  title={
                    effectiveStreak === 0
                      ? 'Streak starts from 0 for new users or if yesterday was missed. Complete all tasks today to begin your streak!'
                      : `${effectiveStreak} consecutive days completed! Miss a day and it resets strictly to 0.`
                  }
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{effectiveStreak} Day Streak</span>
                  <span className="text-[10px] text-amber-200/70 font-mono font-normal">
                    {effectiveStreak === 0 ? '(Starts from 0)' : '(Active)'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                <span>Manage, add, edit, or remove your daily routine blocks</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400 font-medium">Auto-resets each calendar day</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-300/80">Streak starts from 0 on missed day</span>
              </p>
            </div>
          </div>

          {/* Quick Date Selector, Add Task Button & Batch Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Add Task Button */}
            <button
              type="button"
              id="admin-add-daily-task-btn"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              title="Add a new custom task to your daily routine"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Task</span>
            </button>

            {/* AI Agent Quick Trigger */}
            {onOpenAIAgent && (
              <button
                type="button"
                id="daily-tasks-ai-agent-btn"
                onClick={onOpenAIAgent}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                title="Open AI Agent to manage tasks, streak, or ask questions"
              >
                <Bot className="w-4 h-4 text-purple-400" />
                <span>AI Agent</span>
              </button>
            )}

            {/* Quick Date Selector: Today Only */}
            <button
              type="button"
              id="toolbar-today-btn"
              onClick={() => handleSelectDate(todayStr)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeDate === todayStr
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                  : 'glass text-slate-400 hover:text-slate-200 border border-white/10'
              }`}
            >
              Today
            </button>

            {/* Date Picker */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-xs border border-white/10 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <input
                type="date"
                id="toolbar-date-picker"
                value={activeDate}
                onChange={(e) => handleSelectDate(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
                title="Select date to jump to view"
              />
            </div>

            {/* Quick Batch Actions */}
            <button
              type="button"
              onClick={handleBatchCompleteAll}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold transition-all shadow-sm"
              title="Mark all tasks as completed for this date"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Complete All</span>
            </button>

            <button
              type="button"
              onClick={handleBatchResetDay}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl glass hover:bg-white/10 text-slate-300 border border-white/10 font-semibold transition-all shadow-sm"
              title="Reset completion status for this date"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Day</span>
            </button>

            {/* Spreadsheet Matrix Toggle */}
            <button
              type="button"
              id="toggle-daily-history-matrix-btn"
              onClick={() => setShowHistorySheet((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                showHistorySheet
                  ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                  : 'glass hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
              title="Toggle full consistency spreadsheet view"
            >
              <TableIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>{showHistorySheet ? 'Hide Matrix' : 'History Matrix'}</span>
            </button>

            {/* Restore Reference Tasks option */}
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="p-1.5 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 transition-colors"
              title="Restore Original 10 Reference Tasks"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SPREADSHEET HISTORY MATRIX VIEW (Full Continuous History & Full Editing)   */}
        {/* ========================================================================= */}
        {showHistorySheet && (
          <div className="p-4 rounded-xl glass border border-purple-500/30 bg-purple-950/10 space-y-3 animate-fadeIn">
            {/* Top Toolbar: Search, Add Custom Date, and Export CSV */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                  <TableIcon className="w-4 h-4 text-purple-400" />
                  <span>Editable History Matrix</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 font-mono normal-case">
                  {filteredHistoryRecords.length} days recorded
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans font-medium flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Live Edit Mode
                </span>
              </div>

              {/* Tools Cluster: Search + Add Date + Export */}
              <div className="flex flex-wrap items-center gap-2">
                {/* History Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search date (e.g. 2026, Sep, 02)..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl glass text-xs text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-purple-400 w-48"
                  />
                  {historySearch && (
                    <button
                      type="button"
                      onClick={() => setHistorySearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Add Custom Date Row */}
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={newDateInput}
                    onChange={(e) => setNewDateInput(e.target.value)}
                    className="px-2 py-1.5 rounded-xl glass text-xs text-white border border-white/10 focus:outline-none focus:border-purple-400 max-w-[135px]"
                    title="Choose a custom date to add or edit in the spreadsheet"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDateRow}
                    disabled={!newDateInput}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/25 hover:bg-purple-500/40 text-purple-200 border border-purple-500/40 transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    title="Insert date row into history matrix"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>+ Add Date</span>
                  </button>
                </div>

                {/* Export CSV */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold glass hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all flex items-center gap-1.5 shadow-xs"
                  title="Export history matrix to CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Bulk Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1">Filter:</span>
                {[
                  { id: 'all', label: `All History (${historyRecords.length})` },
                  { id: '7days', label: 'Last 7 Days' },
                  { id: '30days', label: 'Last 30 Days' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'missed', label: 'Missed / Incomplete' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHistoryFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      historyFilter === tab.id
                        ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40 shadow-sm'
                        : 'glass text-slate-400 hover:text-slate-200 border border-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Bulk Batch Actions for visible rows */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-400">Bulk:</span>
                <button
                  type="button"
                  onClick={handleBulkCompleteFiltered}
                  className="px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1"
                  title="Mark all tasks 100% completed for all displayed dates"
                >
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                  <span>100% All Displayed</span>
                </button>
                <button
                  type="button"
                  onClick={handleBulkResetFiltered}
                  className="px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold glass hover:bg-white/15 text-slate-400 hover:text-slate-200 border border-white/10 transition-all flex items-center gap-1"
                  title="Clear records (reset to —) for all displayed dates"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Displayed</span>
                </button>
              </div>
            </div>

            {/* Editing Instructions Banner */}
            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold">How to Edit:</span>
                <span className="text-slate-300">Click any cell to cycle (<span className="text-emerald-300">Yes</span> → <span className="text-rose-300">No</span> → <span className="text-slate-400">—</span>) or hover for instant choice buttons. Use row buttons on the right for full day edits.</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="inline-flex items-center gap-0.5 text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  <Check className="w-2.5 h-2.5" /> Done
                </span>
                <span className="inline-flex items-center gap-0.5 text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/30">
                  <X className="w-2.5 h-2.5" /> Missed
                </span>
                <span className="inline-block text-slate-400 bg-white/5 px-1.5 py-0.2 rounded border border-white/10">
                  — Unrecorded
                </span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10 shadow-inner max-h-[500px]">
              <table className="w-full text-xs text-left border-collapse min-w-[980px]">
                <thead className="sticky top-0 z-10">
                  {/* Top Header: Times / Durations */}
                  <tr className="bg-slate-900/95 text-slate-400 border-b border-white/10 font-mono text-[11px]">
                    <th className="p-2.5 border-r border-white/10 font-bold text-slate-300 min-w-[130px]">
                      Time / Slot
                    </th>
                    {taskDefinitions.map((task) => (
                      <th key={task.id} className="p-2 border-r border-white/10 text-center font-medium min-w-[90px]">
                        {task.time_slot}
                      </th>
                    ))}
                    <th className="p-2 text-center font-bold text-slate-300 min-w-[110px]">Daily Progress</th>
                    <th className="p-2 text-center font-bold text-slate-300 min-w-[130px]">Row Actions</th>
                  </tr>

                  {/* Second Header: Task Names & Edit buttons */}
                  <tr className="bg-slate-800/95 text-white border-b border-white/10 font-bold">
                    <th className="p-2.5 border-r border-white/10 text-cyan-400">
                      Date
                    </th>
                    {taskDefinitions.map((task) => (
                      <th key={task.id} className="p-2 border-r border-white/10 text-center text-slate-200 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 group/th">
                          <span className="truncate max-w-[110px]" title={task.title}>{task.title}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(task, e);
                            }}
                            className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-white/20 text-cyan-300 transition-all"
                            title={`Edit '${task.title}' task definition`}
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </th>
                    ))}
                    <th className="p-2 text-center text-cyan-300 whitespace-nowrap">
                      % / Status
                    </th>
                    <th className="p-2 text-center text-slate-400 whitespace-nowrap">
                      Batch / View
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {filteredHistoryRecords.length === 0 ? (
                    <tr>
                      <td colSpan={taskDefinitions.length + 3} className="p-6 text-center text-slate-400 font-sans">
                        No history records match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryRecords.map((row) => {
                      const isRowSelected = row.date === activeDate;
                      const isTodayRow = row.date === todayStr;

                      return (
                        <tr
                          key={row.date}
                          className={`transition-colors ${
                            isRowSelected
                              ? 'bg-cyan-500/15 border-l-4 border-l-cyan-400'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          {/* Date Column */}
                          <td className="p-2.5 border-r border-white/10 font-semibold text-slate-200 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSelectDate(row.date)}
                                className="hover:text-cyan-300 transition-colors text-left"
                                title="Click to view this day's tasks"
                              >
                                {row.display_date}
                              </button>
                              {isTodayRow && (
                                <span className="text-[10px] text-cyan-300 font-sans px-1.5 py-0.2 rounded bg-cyan-500/20 font-bold">
                                  Today
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Editable Task Cells with Instant Hover Options */}
                          {taskDefinitions.map((task) => {
                            const status = row.task_completions[task.id];
                            return (
                              <td
                                key={task.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetCellStatus(row.date, task.id);
                                }}
                                className="p-1.5 border-r border-white/10 text-center font-bold cursor-pointer hover:bg-white/10 transition-colors group relative select-none"
                                title={
                                  status === true
                                    ? `'${task.title}' on ${row.display_date}: Completed (click to mark Not Done)`
                                    : status === false
                                    ? `'${task.title}' on ${row.display_date}: Not Done (click to clear to unrecorded)`
                                    : `'${task.title}' on ${row.display_date}: Unrecorded (click to mark Yes)`
                                }
                              >
                                {/* Default Cell View */}
                                <div className="flex items-center justify-center min-h-[26px]">
                                  {status === true ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 group-hover:border-emerald-400/50 transition-all shadow-xs">
                                      <Check className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                                      <span>Yes</span>
                                    </span>
                                  ) : status === false ? (
                                    <span className="inline-flex items-center gap-1 text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/25 group-hover:border-rose-400/50 transition-all shadow-xs">
                                      <X className="w-3 h-3 text-rose-400 stroke-[2.5]" />
                                      <span>No</span>
                                    </span>
                                  ) : (
                                    <span className="inline-block text-slate-500 font-mono text-xs group-hover:text-slate-300 transition-colors">
                                      —
                                    </span>
                                  )}
                                </div>

                                {/* Direct Hover Selector Overlay */}
                                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xs flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-2 pointer-events-none group-hover:pointer-events-auto rounded">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSetCellStatus(row.date, task.id, true);
                                    }}
                                    className={`p-1 rounded transition-transform hover:scale-115 ${
                                      status === true
                                        ? 'bg-emerald-500 text-slate-950 font-bold'
                                        : 'bg-emerald-500/25 text-emerald-300 hover:bg-emerald-500/40'
                                    }`}
                                    title="Set to Yes (Done)"
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSetCellStatus(row.date, task.id, false);
                                    }}
                                    className={`p-1 rounded transition-transform hover:scale-115 ${
                                      status === false
                                        ? 'bg-rose-500 text-white font-bold'
                                        : 'bg-rose-500/25 text-rose-300 hover:bg-rose-500/40'
                                    }`}
                                    title="Set to No (Missed)"
                                  >
                                    <X className="w-3 h-3 stroke-[3]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSetCellStatus(row.date, task.id, null);
                                    }}
                                    className={`p-1 rounded transition-transform hover:scale-115 ${
                                      status === null
                                        ? 'bg-slate-600 text-white'
                                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600'
                                    }`}
                                    title="Clear record (—)"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </td>
                            );
                          })}

                          {/* Daily Progress Column */}
                          <td className="p-2 text-center whitespace-nowrap">
                            {row.percentage === 100 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded font-bold text-[11px]">
                                <Check className="w-3 h-3 text-emerald-400" />
                                100% Done
                              </span>
                            ) : row.completed > 0 ? (
                              <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded font-bold text-[11px]">
                                {row.completed}/{row.total} ({row.percentage}%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/15 border border-rose-500/25 px-2 py-0.5 rounded font-bold text-[11px]">
                                0% (Missed)
                              </span>
                            )}
                          </td>

                          {/* Row Actions Column: Bulk Complete, Bulk Missed, Reset, and Load */}
                          <td className="p-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowMarkAll(row.date, true);
                                }}
                                className="p-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all"
                                title={`Mark all tasks 100% Completed for ${row.display_date}`}
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowMarkAll(row.date, false);
                                }}
                                className="p-1 rounded-md bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all"
                                title={`Mark all tasks Not Done for ${row.display_date}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClearAll(row.date);
                                }}
                                className="p-1 rounded-md glass hover:bg-white/15 text-slate-400 hover:text-white border border-white/10 transition-all"
                                title={`Clear records (reset to —) for ${row.display_date}`}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSelectDate(row.date)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-sans font-semibold glass text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 border border-white/10 transition-all ml-0.5"
                                title="Load this day in the main checklist"
                              >
                                Load
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* THE DAILY TASKS LIST (With Admin Edit, Delete & Quick Complete)            */}
        {/* ========================================================================= */}
        {dailyTasksWithStatus.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-dark border border-dashed border-white/10">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-300">No daily tasks yet</div>
            <div className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              You have removed all daily tasks or started fresh. Click below to add a new task or restore the reference routine.
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.25)]"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Task</span>
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10"
              >
                Restore 10 Defaults
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {dailyTasksWithStatus.map((task, index) => {
              const isDone = task.completed;

              return (
                <div
                  key={task.id}
                  id={`daily-task-item-${task.id}`}
                  onClick={() => handleToggleTask(task.id)}
                  className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                    isDone
                      ? 'bg-slate-900/40 border-emerald-500/30 text-slate-400'
                      : 'glass hover:bg-white/[0.06] border-white/10 hover:border-cyan-500/40 text-slate-200 shadow-sm'
                  }`}
                >
                  {/* Left: Checkbox + Icon + Title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Custom Styled Animated Checkbox */}
                    <button
                      type="button"
                      aria-label={`Toggle ${task.title}`}
                      onClick={(e) => handleToggleTask(task.id, e)}
                      className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                        isDone
                          ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                          : 'border border-slate-500 group-hover:border-cyan-400 bg-black/20'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-transparent" />
                      )}
                    </button>

                    {/* Task Icon */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-opacity ${
                        isDone ? 'bg-white/5 opacity-50' : 'bg-white/10'
                      }`}
                    >
                      {getTaskIcon(task.icon)}
                    </div>

                    {/* Title & Category with Strikethrough on Complete */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500 font-semibold">
                          #{index + 1}
                        </span>
                        <span
                          className={`text-sm font-semibold tracking-tight transition-all truncate ${
                            isDone
                              ? 'line-through text-slate-500 italic decoration-emerald-500/60 decoration-2'
                              : 'text-slate-100 group-hover:text-cyan-300'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                        <span>{task.category}</span>
                        {task.notes && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 truncate">{task.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Time Slot Pill Badge & Admin Action Controls (Edit & Delete) */}
                  <div className="shrink-0 ml-3 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 group-hover:border-cyan-500/40'
                      }`}
                    >
                      {task.time_slot}
                    </span>

                    {/* Admin Edit Button */}
                    <button
                      type="button"
                      id={`edit-daily-task-btn-${task.id}`}
                      onClick={(e) => handleOpenEditModal(task, e)}
                      className="p-1.5 rounded-lg glass hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 transition-all opacity-80 group-hover:opacity-100"
                      title="Edit this task definition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Admin Delete Button */}
                    <button
                      type="button"
                      id={`delete-daily-task-btn-${task.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTaskToDelete(task);
                      }}
                      className="p-1.5 rounded-lg glass hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 transition-all opacity-80 group-hover:opacity-100"
                      title="Delete this task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADMIN ADD / EDIT TASK MODAL                                               */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl glass-dark border border-cyan-500/30 p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  {editingTask ? (
                    <Edit2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {editingTask ? 'Edit Daily Task' : 'Add New Daily Task'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingTask ? 'Modify the parameters of this routine item' : 'Create a new daily habit or academic block'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl glass text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Task Title <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g. DSA Practice, Wake-Up, ML Sprint"
                  className="w-full px-3.5 py-2 rounded-xl glass-dark border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  autoFocus
                />
              </div>

              {/* Time Slot & Duration in Minutes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Time Slot / Label
                  </label>
                  <input
                    type="text"
                    value={formTimeSlot}
                    onChange={(e) => setFormTimeSlot(e.target.value)}
                    placeholder="e.g. 5:00 - 5:30, 30mins, 2-3hr"
                    className="w-full px-3.5 py-2 rounded-xl glass-dark border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Planned Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={720}
                    step={5}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value) || 30)}
                    className="w-full px-3.5 py-2 rounded-xl glass-dark border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-dark border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer mb-2"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
                      {cat}
                    </option>
                  ))}
                  <option value="Custom" className="bg-slate-900 text-cyan-400">
                    + Custom Category...
                  </option>
                </select>

                {formCategory === 'Custom' && (
                  <input
                    type="text"
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    placeholder="Enter custom category name"
                    className="w-full px-3.5 py-2 rounded-xl glass-dark border border-cyan-500/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                  />
                )}
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Icon Style</label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 rounded-xl glass-dark border border-white/10">
                  {AVAILABLE_ICONS.map((ic) => {
                    const isSelected = formIcon === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setFormIcon(ic.name)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                            : 'glass border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                        title={ic.label}
                      >
                        {getTaskIcon(ic.name)}
                        <span className="text-[9px] mt-1 truncate max-w-full font-mono">{ic.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Notes & Context (Optional)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Focus on sliding window problems, solve at least 2 questions"
                  className="w-full px-3.5 py-2 rounded-xl glass-dark border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-slate-300 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl glass-dark border border-rose-500/40 p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Delete Daily Task?</h3>
                <p className="text-xs text-slate-400">This action will remove the task from your daily routine</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-rose-200">
                Task: <span className="text-white font-bold font-mono">"{taskToDelete.title}"</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Time slot: {taskToDelete.time_slot} • Category: {taskToDelete.category}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
