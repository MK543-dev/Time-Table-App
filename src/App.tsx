import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TaskBoard } from './components/TaskBoard';
import { VisualDiagrams } from './components/VisualDiagrams';
import { TimerBar } from './components/TimerBar';
import { RotatingTimetable } from './components/RotatingTimetable';
import { AdminPanel } from './components/AdminPanel';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AgentChatModal } from './components/AgentChatModal';
import { AnnouncementsModal } from './components/AnnouncementsModal';
import { AuthModal, RegisteredAccount } from './components/AuthModal';
import {
  INITIAL_TASKS,
  INITIAL_TIME_LOGS,
  INITIAL_CATEGORIES,
  INITIAL_ADMIN_CONFIG,
  INITIAL_EXAMS,
  INITIAL_CLASS_PERIODS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AI_SUMMARY,
  CURRENT_USER,
  ADMIN_USER,
} from './mockData';
import {
  Task,
  TimeLog,
  CategoryDef,
  AdminConfig,
  ExamCountdown,
  ClassPeriod,
  Announcement,
  AISummary,
  User,
  ThemeMode,
} from './types';

export default function App() {
  // Registered Accounts cache in Local Storage (no plaintext credentials baked in source)
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredAccount[]>(() => {
    const saved = localStorage.getItem('timeforge_registered_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const SCHEDULE_DATA_VERSION = 'v2_img_timetable';

  // Application State with Local Storage persistence - No default mock user
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('timeforge_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed && parsed.id ? parsed : null;
    } catch {
      return null;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const currentVersion = localStorage.getItem('timeforge_schedule_version');
    if (currentVersion !== SCHEDULE_DATA_VERSION) {
      localStorage.setItem('timeforge_schedule_version', SCHEDULE_DATA_VERSION);
      localStorage.setItem('timeforge_tasks', JSON.stringify(INITIAL_TASKS));
      localStorage.setItem('timeforge_categories', JSON.stringify(INITIAL_CATEGORIES));
      localStorage.setItem('timeforge_periods', JSON.stringify(INITIAL_CLASS_PERIODS));
      localStorage.setItem('timeforge_logs', JSON.stringify(INITIAL_TIME_LOGS));
      localStorage.setItem('timeforge_exams', JSON.stringify(INITIAL_EXAMS));
      localStorage.setItem('timeforge_ai_summary', JSON.stringify(INITIAL_AI_SUMMARY));
      return INITIAL_TASKS;
    }
    const saved = localStorage.getItem('timeforge_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(() => {
    const currentVersion = localStorage.getItem('timeforge_schedule_version');
    if (currentVersion !== SCHEDULE_DATA_VERSION) return INITIAL_TIME_LOGS;
    const saved = localStorage.getItem('timeforge_logs');
    return saved ? JSON.parse(saved) : INITIAL_TIME_LOGS;
  });

  const [categories, setCategories] = useState<CategoryDef[]>(() => {
    const currentVersion = localStorage.getItem('timeforge_schedule_version');
    if (currentVersion !== SCHEDULE_DATA_VERSION) return INITIAL_CATEGORIES;
    const saved = localStorage.getItem('timeforge_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [adminConfig, setAdminConfig] = useState<AdminConfig>(() => {
    const saved = localStorage.getItem('timeforge_admin_config');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_CONFIG;
  });

  const [exams, setExams] = useState<ExamCountdown[]>(() => {
    const currentVersion = localStorage.getItem('timeforge_schedule_version');
    if (currentVersion !== SCHEDULE_DATA_VERSION) return INITIAL_EXAMS;
    const saved = localStorage.getItem('timeforge_exams');
    return saved ? JSON.parse(saved) : INITIAL_EXAMS;
  });

  const [periods, setPeriods] = useState<ClassPeriod[]>(() => {
    const currentVersion = localStorage.getItem('timeforge_schedule_version');
    if (currentVersion !== SCHEDULE_DATA_VERSION) return INITIAL_CLASS_PERIODS;
    const saved = localStorage.getItem('timeforge_periods');
    return saved ? JSON.parse(saved) : INITIAL_CLASS_PERIODS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('timeforge_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [aiSummary, setAiSummary] = useState<AISummary | null>(() => {
    const saved = localStorage.getItem('timeforge_ai_summary');
    return saved ? JSON.parse(saved) : INITIAL_AI_SUMMARY;
  });

  const [currentTab, setCurrentTab] = useState<string>('board');
  const [theme, setTheme] = useState<ThemeMode>('glass');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => !currentUser);
  const [authModalMode, setAuthModalMode] = useState<'landing' | 'login' | 'register' | 'profile'>('landing');
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(2);

  // Active Timer state
  const [activeTimer, setActiveTimer] = useState<{
    isRunning: boolean;
    taskTitle: string;
    elapsedSeconds: number;
    category: string;
    taskId?: string;
  } | null>(null);

  // Verify session validity with backend on initial load
  useEffect(() => {
    const token = localStorage.getItem('timeforge_session_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('timeforge_user', JSON.stringify(data.user));
            setIsAuthModalOpen(false);
          } else {
            // Expired or invalid session
            localStorage.removeItem('timeforge_session_token');
            localStorage.removeItem('timeforge_user');
            setCurrentUser(null);
            setIsAuthModalOpen(true);
          }
        })
        .catch(() => {
          // If network fails, maintain existing state
        });
    } else {
      const savedUser = localStorage.getItem('timeforge_user');
      if (!savedUser) {
        setCurrentUser(null);
        setIsAuthModalOpen(true);
      }
    }
  }, []);

  // Save to LocalStorage whenever state updates
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('timeforge_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('timeforge_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('timeforge_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem('timeforge_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('timeforge_logs', JSON.stringify(timeLogs));
  }, [timeLogs]);

  useEffect(() => {
    localStorage.setItem('timeforge_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('timeforge_admin_config', JSON.stringify(adminConfig));
  }, [adminConfig]);

  useEffect(() => {
    localStorage.setItem('timeforge_exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('timeforge_periods', JSON.stringify(periods));
  }, [periods]);

  useEffect(() => {
    localStorage.setItem('timeforge_announcements', JSON.stringify(announcements));
  }, [announcements]);

  // Live Timer interval ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTimer && activeTimer.isRunning) {
      interval = setInterval(() => {
        setActiveTimer((prev) => (prev ? { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 } : null));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer?.isRunning]);

  const handleStreakUpdate = useCallback((newStreak: number) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      if (prev.streak_count === newStreak) return prev;
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedUser: User = {
        ...prev,
        streak_count: newStreak,
        longest_streak: Math.max(prev.longest_streak || 0, newStreak),
        last_streak_date: newStreak > 0 ? todayStr : undefined,
        last_active_date: todayStr,
      };
      try {
        localStorage.setItem('timeforge_user', JSON.stringify(updatedUser));
        const storedList = localStorage.getItem('timeforge_registered_users');
        if (storedList) {
          const parsed = JSON.parse(storedList);
          const updatedList = parsed.map((u: User) => (u.id === prev.id ? updatedUser : u));
          localStorage.setItem('timeforge_registered_users', JSON.stringify(updatedList));
        }
      } catch (err) {
        // ignore
      }
      return updatedUser;
    });
  }, []);

  // Automated Streak Verification: starts from 0; resets to 0 if a day was missed
  useEffect(() => {
    if (!currentUser) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // New user with undefined streak -> default to 0
    if (currentUser.streak_count === undefined) {
      handleStreakUpdate(0);
      return;
    }

    // If user's last_streak_date is older than yesterday and not today, streak has lapsed -> reset to 0
    if (
      currentUser.streak_count > 0 &&
      currentUser.last_streak_date &&
      currentUser.last_streak_date !== todayStr &&
      currentUser.last_streak_date !== yesterdayStr
    ) {
      handleStreakUpdate(0);
    }
  }, [currentUser?.id, currentUser?.last_streak_date, currentUser?.streak_count, handleStreakUpdate]);

  // Sync streak from AI agent or external updates
  useEffect(() => {
    const handleStreakEvent = (e: any) => {
      if (e?.detail?.streak !== undefined && typeof e.detail.streak === 'number') {
        handleStreakUpdate(e.detail.streak);
      }
    };
    const handleStateEvent = () => {
      if (currentUser?.id) {
        fetch(`/daily-tasks?user_id=${currentUser.id}`)
          .then((r) => r.json())
          .then((data) => {
            if (data && typeof data.streak === 'number') {
              handleStreakUpdate(data.streak);
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener('timeforge-streak-updated', handleStreakEvent);
    window.addEventListener('timeforge-state-updated', handleStateEvent);
    return () => {
      window.removeEventListener('timeforge-streak-updated', handleStreakEvent);
      window.removeEventListener('timeforge-state-updated', handleStateEvent);
    };
  }, [currentUser?.id, handleStreakUpdate]);

  // Task Handlers
  const handleToggleTask = (taskId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let isNowDone = false;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'done' ? 'pending' : 'done';
          isNowDone = nextStatus === 'done';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );

    // Update user XP & Streak on complete
    if (currentUser && isNowDone) {
      const newXp = (currentUser.xp || 0) + 25;
      const newLevel = Math.floor(newXp / 200) + 1;
      let newStreak = currentUser.streak_count || 0;
      let lastStreakDate = currentUser.last_streak_date;

      if (lastStreakDate !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (lastStreakDate === yesterdayStr) {
          newStreak = (currentUser.streak_count || 0) + 1;
        } else {
          newStreak = 1;
        }
        lastStreakDate = todayStr;
      }

      const updatedUser: User = {
        ...currentUser,
        xp: newXp,
        level: newLevel,
        streak_count: newStreak,
        longest_streak: Math.max(currentUser.longest_streak || 0, newStreak),
        last_streak_date: lastStreakDate,
        last_active_date: todayStr,
      };
      handleUpdateProfile(updatedUser);
    }
  };

  const handleAddTask = (newTask: Partial<Task>) => {
    const task: Task = {
      id: `task-${Date.now()}`,
      user_id: currentUser?.id || 'usr_guest',
      title: newTask.title || 'Untitled Task',
      category: newTask.category || categories[0]?.name || 'General Study',
      date: newTask.date || new Date().toISOString().split('T')[0],
      start_time: newTask.start_time || '09:00',
      end_time: newTask.end_time || '10:00',
      duration_minutes: newTask.duration_minutes || 60,
      priority: newTask.priority || 'medium',
      status: newTask.status || 'pending',
      recurrence_rule: newTask.recurrence_rule || 'none',
      is_admin_locked: !!newTask.is_admin_locked,
      time_spent_seconds: 0,
      tags: newTask.tags || ['User-Created'],
      notes: newTask.notes || '',
      room: newTask.room,
    };

    setTasks((prev) => [task, ...prev]);
  };

  const handleUpdateTask = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Master Admin Batch Handlers
  const handleUnlockAllTasks = () => {
    setTasks((prev) => prev.map((t) => ({ ...t, is_admin_locked: false })));
  };

  const handleLockAllTasks = () => {
    setTasks((prev) => prev.map((t) => ({ ...t, is_admin_locked: true })));
  };

  const handleBatchCompleteAll = () => {
    const today = new Date().toISOString().split('T')[0];
    setTasks((prev) =>
      prev.map((t) => (!t.date || t.date === today ? { ...t, status: 'done' as const } : t))
    );
    if (currentUser) {
      const todayStr = new Date().toISOString().split('T')[0];
      const newStreak = (currentUser.streak_count || 0) + 1;
      const updated = {
        ...currentUser,
        streak_count: newStreak,
        longest_streak: Math.max(currentUser.longest_streak || 0, newStreak),
        last_streak_date: todayStr,
        last_active_date: todayStr,
      };
      handleUpdateProfile(updated);
    }
  };

  const handleBatchResetAll = () => {
    const today = new Date().toISOString().split('T')[0];
    setTasks((prev) =>
      prev.map((t) => (!t.date || t.date === today ? { ...t, status: 'pending' as const } : t))
    );
  };

  const handleResetStreak = (userId?: string) => {
    if (userId) {
      setRegisteredUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, streak_count: 0, last_streak_date: undefined } : u))
      );
      if (currentUser && currentUser.id === userId) {
        const updated = { ...currentUser, streak_count: 0, last_streak_date: undefined };
        setCurrentUser(updated);
        localStorage.setItem('timeforge_user', JSON.stringify(updated));
      }
    } else if (currentUser) {
      const updated = { ...currentUser, streak_count: 0, last_streak_date: undefined };
      handleUpdateProfile(updated);
    }
  };

  const handleResetAllStreaks = () => {
    setRegisteredUsers((prev) =>
      prev.map((u) => ({ ...u, streak_count: 0, last_streak_date: undefined }))
    );
    if (currentUser) {
      const updated = { ...currentUser, streak_count: 0, last_streak_date: undefined };
      setCurrentUser(updated);
      localStorage.setItem('timeforge_user', JSON.stringify(updated));
    }
  };

  const handleRestoreDefaultSchedule = () => {
    setTasks(INITIAL_TASKS);
    localStorage.setItem('timeforge_tasks', JSON.stringify(INITIAL_TASKS));
  };

  const handleClearAllTasks = () => {
    if (confirm('Are you sure you want to delete all tasks from the schedule?')) {
      setTasks([]);
      localStorage.setItem('timeforge_tasks', JSON.stringify([]));
    }
  };

  const handleUpdateUserAccount = (user: RegisteredAccount) => {
    setRegisteredUsers((prev) => {
      const updatedList = prev.map((u) => (u.id === user.id ? user : u));
      localStorage.setItem('timeforge_registered_users', JSON.stringify(updatedList));
      return updatedList;
    });
    if (currentUser && currentUser.id === user.id) {
      setCurrentUser(user);
      localStorage.setItem('timeforge_user', JSON.stringify(user));
    }
  };

  const handleDeleteUserAccount = (userId: string) => {
    setRegisteredUsers((prev) => {
      const updatedList = prev.filter((u) => u.id !== userId);
      localStorage.setItem('timeforge_registered_users', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const handleAddUserAccount = (newUser: RegisteredAccount) => {
    setRegisteredUsers((prev) => {
      const updatedList = [...prev, newUser];
      localStorage.setItem('timeforge_registered_users', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const handleUpdatePeriod = (updated: ClassPeriod) => {
    setPeriods((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleUpdateExam = (updated: ExamCountdown) => {
    setExams((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  // Timer Handlers
  const handleStartTimer = (taskTitle: string, category: string, taskId?: string) => {
    if (activeTimer && activeTimer.isRunning && activeTimer.taskId === taskId) {
      handleStopAndSaveTimer();
      return;
    }

    setActiveTimer({
      isRunning: true,
      taskTitle,
      category,
      elapsedSeconds: 0,
      taskId,
    });
  };

  const handlePauseTimer = () => {
    if (activeTimer) {
      setActiveTimer({ ...activeTimer, isRunning: false });
    }
  };

  const handleResumeTimer = () => {
    if (activeTimer) {
      setActiveTimer({ ...activeTimer, isRunning: true });
    }
  };

  const handleStopAndSaveTimer = (notes?: string) => {
    if (!activeTimer) return;

    const newLog: TimeLog = {
      id: `log-${Date.now()}`,
      user_id: currentUser.id,
      task_id: activeTimer.taskId,
      task_title: activeTimer.taskTitle,
      category: activeTimer.category,
      started_at: new Date(Date.now() - activeTimer.elapsedSeconds * 1000).toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: activeTimer.elapsedSeconds,
      notes: notes || 'Tracked focus session',
      is_manual: false,
    };

    setTimeLogs((prev) => [newLog, ...prev]);

    // Also update time_spent_seconds on task if attached
    if (activeTimer.taskId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTimer.taskId
            ? { ...t, time_spent_seconds: (t.time_spent_seconds || 0) + activeTimer.elapsedSeconds }
            : t
        )
      );
    }

    setActiveTimer(null);
  };

  const handleAddManualLog = (manualLog: Partial<TimeLog>) => {
    const log: TimeLog = {
      id: `log-${Date.now()}`,
      user_id: currentUser.id,
      task_title: manualLog.task_title || 'Manual Entry',
      category: manualLog.category || categories[0]?.name,
      started_at: manualLog.started_at || new Date().toISOString(),
      ended_at: manualLog.ended_at || new Date().toISOString(),
      duration_seconds: manualLog.duration_seconds || 3600,
      notes: manualLog.notes || 'Manually logged',
      is_manual: true,
    };
    setTimeLogs((prev) => [log, ...prev]);
  };

  const handleDeleteLog = (logId: string) => {
    setTimeLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  // AI Split Handlers
  const handleSplitTaskAI = async (task: Task) => {
    try {
      const res = await fetch('/api/ai/split-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          totalMinutes: task.duration_minutes,
          category: task.category,
        }),
      });
      const data = await res.json();
      if (data.success && data.subtasks) {
        handleApplySubtasks(data.subtasks, task.title);
      }
    } catch (e) {
      console.error('Failed to split task:', e);
    }
  };

  const handleApplySubtasks = (subtasks: any[], parentTitle: string) => {
    const newBlocks: Task[] = subtasks.map((sub, idx) => ({
      id: `task-sub-${Date.now()}-${idx}`,
      user_id: currentUser.id,
      title: `${parentTitle}: ${sub.title}`,
      category: categories[0]?.name || 'Database Systems (DBMS)',
      date: new Date().toISOString().split('T')[0],
      start_time: `${String(9 + idx * 1).padStart(2, '0')}:00`,
      end_time: `${String(9 + idx * 1).padStart(2, '0')}:45`,
      duration_minutes: sub.duration_minutes || 45,
      priority: 'medium',
      status: 'pending',
      recurrence_rule: 'none',
      is_admin_locked: false,
      time_spent_seconds: 0,
      tags: ['AI-Split', 'Deep Work'],
      notes: sub.objective || '',
    }));

    setTasks((prev) => [...newBlocks, ...prev]);
  };

  // AI Weekly Summary Generator
  const handleGenerateNewSummary = async () => {
    try {
      const res = await fetch('/api/ai/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          timeLogs,
          tone: adminConfig.ai_tone_persona,
        }),
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setAiSummary(data.summary);
      }
    } catch (e) {
      console.error('Failed to generate summary:', e);
    }
  };

  // AI Syllabus Parser
  const handleImportSyllabus = async (syllabusText: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/ai/parse-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabusText }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.periods && data.periods.length > 0) {
          setPeriods((prev) => [...data.periods, ...prev]);
        }
        if (data.exams && data.exams.length > 0) {
          setExams((prev) => [...data.exams, ...prev]);
        }
        return true;
      }
    } catch (e) {
      console.error('Failed to import syllabus:', e);
    }
    return false;
  };

  // Authentication Handlers
  const handleOpenAuthModal = (mode: 'landing' | 'login' | 'register' | 'profile' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleRegister = (newUser: RegisteredAccount) => {
    const isMasterAdmin = newUser.email.toLowerCase().trim() === '218r1a0543@gmail.com';
    const sanitizedUser: RegisteredAccount = {
      ...newUser,
      role: isMasterAdmin ? 'admin' : 'user',
    };
    setRegisteredUsers((prev) => {
      const updated = [...prev, sanitizedUser];
      localStorage.setItem('timeforge_registered_users', JSON.stringify(updated));
      return updated;
    });
    setCurrentUser(sanitizedUser);
    setIsAuthModalOpen(false);
  };

  const handleUpdateProfile = (updatedUser: User) => {
    const isMasterAdmin = updatedUser.email.toLowerCase().trim() === '218r1a0543@gmail.com';
    const sanitizedUser: User = {
      ...updatedUser,
      role: isMasterAdmin ? 'admin' : 'user',
    };
    setCurrentUser(sanitizedUser);
    setRegisteredUsers((prev) => {
      const index = prev.findIndex((u) => u.id === sanitizedUser.id || u.email === sanitizedUser.email);
      let updatedList = [...prev];
      if (index >= 0) {
        updatedList[index] = { ...updatedList[index], ...sanitizedUser };
      } else {
        updatedList.push(sanitizedUser);
      }
      localStorage.setItem('timeforge_registered_users', JSON.stringify(updatedList));
      return updatedList;
    });
    localStorage.setItem('timeforge_user', JSON.stringify(sanitizedUser));
  };

  const handleLogout = () => {
    const token = localStorage.getItem('timeforge_session_token');
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setCurrentUser(null);
    localStorage.removeItem('timeforge_user');
    localStorage.removeItem('timeforge_session_token');
    setAuthModalMode('landing');
    setIsAuthModalOpen(true);
  };

  // Blocking Authentication Gate: If no user is authenticated, render ONLY the Login/Register modal
  // Zero tasks, streaks, timetable, or any account's private workspace rendered behind or underneath it
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#05070A] text-slate-200 selection:bg-cyan-500 selection:text-black flex flex-col font-sans relative overflow-hidden items-center justify-center p-4">
        {/* Immersive Ambient Orbs */}
        <div className="orb w-96 h-96 bg-cyan-900/20 -top-20 -left-20 fixed" />
        <div className="orb w-[500px] h-[500px] bg-indigo-900/15 -bottom-40 -right-20 fixed" />
        <div className="orb w-80 h-80 bg-cyan-500/5 top-1/3 left-1/2 fixed" />

        <AuthModal
          isOpen={true}
          isBlockingGate={true}
          onClose={() => {}}
          currentUser={null}
          registeredUsers={registeredUsers}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onLogout={handleLogout}
          onUpdateProfile={handleUpdateProfile}
          initialMode={authModalMode}
        />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => !t.date || t.date === todayStr);
  const completedTodayCount = todayTasks.filter((t) => t.status === 'done').length;
  const totalTodayCount = todayTasks.length;

  const totalLoggedSecondsAll = timeLogs.reduce((acc, l) => acc + (l.duration_seconds || 0), 0);
  const totalLoggedHoursAll = (totalLoggedSecondsAll / 3600).toFixed(1);

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-200 selection:bg-cyan-500 selection:text-black flex flex-col font-sans relative overflow-x-hidden">
      {/* Immersive Background Ambient Orbs */}
      <div className="orb w-96 h-96 bg-cyan-900/20 -top-20 -left-20 fixed" />
      <div className="orb w-[500px] h-[500px] bg-indigo-900/15 -bottom-40 -right-20 fixed" />
      <div className="orb w-80 h-80 bg-cyan-500/5 top-1/3 left-1/2 fixed" />

      {/* Main Sticky Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        theme={theme}
        setTheme={setTheme}
        activeTimer={activeTimer}
        onStopTimer={handleStopAndSaveTimer}
        completedTasksCount={completedTodayCount}
        totalTasksCount={totalTodayCount}
        unreadAnnouncementsCount={unreadAnnouncementsCount}
        onOpenAnnouncements={() => {
          setIsAnnouncementsModalOpen(true);
          setUnreadAnnouncementsCount(0);
        }}
        onOpenAISummary={() => setIsAiModalOpen(true)}
        onOpenAIAgent={() => setIsAgentModalOpen(true)}
        brandName={adminConfig.organization_name ? `${adminConfig.organization_name} TimeForge` : 'TimeForge'}
      />

      {/* Main Workspace Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'board' && (
          <TaskBoard
            tasks={tasks}
            categories={categories}
            currentUser={currentUser}
            isAdmin={currentUser?.role === 'admin'}
            onStreakUpdate={handleStreakUpdate}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onStartTimer={(task) => handleStartTimer(task.title, task.category, task.id)}
            activeTimerTaskId={activeTimer?.isRunning ? activeTimer.taskId : undefined}
            maxDailyHoursThreshold={adminConfig.max_daily_hours_threshold.value}
            currentDayCycle={adminConfig.rotation_cycle_current}
            onSplitTaskAI={handleSplitTaskAI}
            gamificationEnabled={adminConfig.gamification_enabled.value}
            onUnlockAllTasks={handleUnlockAllTasks}
            onLockAllTasks={handleLockAllTasks}
            onBatchCompleteAll={handleBatchCompleteAll}
            onBatchResetAll={handleBatchResetAll}
            onResetStreak={() => handleResetStreak()}
            onRestoreDefaultTasks={handleRestoreDefaultSchedule}
            onClearAllTasks={handleClearAllTasks}
            onOpenAIAgent={() => setIsAgentModalOpen(true)}
          />
        )}

        {currentTab === 'timetable' && (
          <RotatingTimetable
            periods={periods}
            exams={exams}
            categories={categories}
            currentCycle={adminConfig.rotation_cycle_current}
            currentUser={currentUser}
            onAddPeriod={(p) =>
              setPeriods((prev) => [{ ...p, id: `period-${Date.now()}` } as ClassPeriod, ...prev])
            }
            onUpdatePeriod={handleUpdatePeriod}
            onDeletePeriod={(id) => setPeriods((prev) => prev.filter((p) => p.id !== id))}
            onAddExam={(e) => setExams((prev) => [{ ...e, id: `exam-${Date.now()}` } as ExamCountdown, ...prev])}
            onUpdateExam={handleUpdateExam}
            onDeleteExam={(id) => setExams((prev) => prev.filter((e) => e.id !== id))}
            onImportSyllabus={handleImportSyllabus}
          />
        )}

        {currentTab === 'diagrams' && (
          <VisualDiagrams tasks={tasks} timeLogs={timeLogs} categories={categories} />
        )}

        {currentTab === 'timer' && (
          <TimerBar
            tasks={tasks}
            timeLogs={timeLogs}
            categories={categories}
            activeTimer={activeTimer}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResumeTimer={handleResumeTimer}
            onStopAndSaveTimer={handleStopAndSaveTimer}
            onAddManualLog={handleAddManualLog}
            onDeleteLog={handleDeleteLog}
          />
        )}

        {currentTab === 'ai' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl glass border border-cyan-500/30 glow-cyan">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-base font-bold text-white">AI Assistant & Cognitive Scheduler</h3>
                  <p className="text-xs text-slate-400">
                    Auto-decompose complex projects into 45-minute deep blocks and receive weekly momentum insights.
                  </p>
                </div>
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Launch AI Intelligence Hub</span>
                </button>
              </div>
            </div>
            <VisualDiagrams tasks={tasks} timeLogs={timeLogs} categories={categories} />
          </div>
        )}

        {currentTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminPanel
            currentUser={currentUser}
            adminConfig={adminConfig}
            categories={categories}
            tasks={tasks}
            announcements={announcements}
            registeredUsers={registeredUsers}
            onUpdateAdminConfig={setAdminConfig}
            onUpdateCategories={setCategories}
            onBroadcastAnnouncement={(ann) =>
              setAnnouncements((prev) => [
                { ...ann, id: `ann-${Date.now()}` } as Announcement,
                ...prev,
              ])
            }
            onDeleteAnnouncement={(id) => setAnnouncements((prev) => prev.filter((a) => a.id !== id))}
            onPushInstitutionalTask={(t) => handleAddTask({ ...t, is_admin_locked: true })}
            onUpdateUserAccount={handleUpdateUserAccount}
            onDeleteUserAccount={handleDeleteUserAccount}
            onAddUserAccount={handleAddUserAccount}
            onUnlockAllTasks={handleUnlockAllTasks}
            onLockAllTasks={handleLockAllTasks}
            onBatchCompleteAll={handleBatchCompleteAll}
            onBatchResetAll={handleBatchResetAll}
            onResetAllStreaks={handleResetAllStreaks}
            onClearAllTasks={handleClearAllTasks}
            onRestoreDefaultSchedule={handleRestoreDefaultSchedule}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {currentTab === 'admin' && currentUser?.role !== 'admin' && (
          <div className="max-w-xl mx-auto p-8 rounded-3xl glass-dark border border-amber-500/30 text-center space-y-4 shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              🔒
            </div>
            <h3 className="text-base font-bold text-white">Administrator Privileges Required</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Institutional policy enforcement, curriculum locks, and broadcast announcements are reserved for faculty & administrative dean accounts.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleOpenAuthModal('login')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <span>Sign In with Institutional Admin Account</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Authentication & Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        registeredUsers={registeredUsers}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
        initialMode={authModalMode}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        tasks={tasks}
        timeLogs={timeLogs}
        categories={categories}
        aiSummary={aiSummary}
        onApplySubtasks={handleApplySubtasks}
        onGenerateNewSummary={handleGenerateNewSummary}
        aiTonePersona={adminConfig.ai_tone_persona}
      />

      {/* Autonomous AI Agent Modal (Developer & User Modes) */}
      <AgentChatModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        currentUser={currentUser}
        onStateModified={() => {
          window.dispatchEvent(new Event('timeforge-state-updated'));
        }}
      />

      {/* Announcements Modal */}
      <AnnouncementsModal
        isOpen={isAnnouncementsModalOpen}
        onClose={() => setIsAnnouncementsModalOpen(false)}
        announcements={announcements}
        onMarkAllRead={() => setUnreadAnnouncementsCount(0)}
      />

      {/* Immersive Footer */}
      <footer className="relative z-10 px-6 sm:px-8 py-4 bg-black/40 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Weekly Target</span>
            <span className="text-sm text-white font-medium">84% Efficiency</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Focused Hours</span>
            <span className="text-sm text-cyan-400 font-mono font-medium">{totalLoggedHoursAll}h Logged</span>
          </div>
        </div>

        <div className="flex items-center gap-6 h-8">
          <div className="flex items-end gap-1" title="Daily velocity rhythm">
            <div className="w-1.5 h-3 bg-cyan-500/40 rounded-full" />
            <div className="w-1.5 h-5 bg-cyan-500/60 rounded-full" />
            <div className="w-1.5 h-8 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            <div className="w-1.5 h-4 bg-cyan-500/40 rounded-full" />
            <div className="w-1.5 h-6 bg-cyan-500/70 rounded-full" />
          </div>
          <div className="h-full w-px bg-white/10" />
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>Org: {adminConfig.organization_name || 'Highline University'}</span>
            <span>•</span>
            <span className="text-cyan-400 font-mono font-semibold">Block {adminConfig.rotation_cycle_current}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
