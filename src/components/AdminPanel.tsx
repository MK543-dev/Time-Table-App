import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Settings,
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  Building,
  Save,
  Layers,
  FileSpreadsheet,
  Users,
  Flame,
  Edit2,
  CheckCheck,
  RotateCcw,
  RefreshCw,
  Search,
  ShieldCheck,
  Award,
  Calendar,
  Clock
} from 'lucide-react';
import { AdminConfig, CategoryDef, Task, Announcement, User } from '../types';

interface RegisteredAccount extends User {
  password?: string;
}

interface AdminPanelProps {
  currentUser: User;
  adminConfig: AdminConfig;
  categories: CategoryDef[];
  tasks: Task[];
  announcements: Announcement[];
  registeredUsers?: RegisteredAccount[];
  onUpdateAdminConfig: (config: AdminConfig) => void;
  onUpdateCategories: (categories: CategoryDef[]) => void;
  onBroadcastAnnouncement: (announcement: Partial<Announcement>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onPushInstitutionalTask: (task: Partial<Task>) => void;
  onUpdateUserAccount?: (user: RegisteredAccount) => void;
  onDeleteUserAccount?: (userId: string) => void;
  onAddUserAccount?: (user: RegisteredAccount) => void;
  onUnlockAllTasks?: () => void;
  onLockAllTasks?: () => void;
  onBatchCompleteAll?: () => void;
  onBatchResetAll?: () => void;
  onResetAllStreaks?: () => void;
  onClearAllTasks?: () => void;
  onRestoreDefaultSchedule?: () => void;
  onUpdateTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  adminConfig,
  categories,
  tasks,
  announcements,
  registeredUsers = [],
  onUpdateAdminConfig,
  onUpdateCategories,
  onBroadcastAnnouncement,
  onDeleteAnnouncement,
  onPushInstitutionalTask,
  onUpdateUserAccount,
  onDeleteUserAccount,
  onAddUserAccount,
  onUnlockAllTasks,
  onLockAllTasks,
  onBatchCompleteAll,
  onBatchResetAll,
  onResetAllStreaks,
  onClearAllTasks,
  onRestoreDefaultSchedule,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [activeTab, setActiveTab] = useState<
    'policy' | 'users' | 'master_tasks' | 'categories' | 'broadcast' | 'templates'
  >('policy');
  const [configDraft, setConfigDraft] = useState<AdminConfig>(adminConfig);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Broadcast state
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annSeverity, setAnnSeverity] = useState<'info' | 'warning' | 'urgent'>('info');

  // Push task template state
  const [taskTemplateTitle, setTaskTemplateTitle] = useState('Machine Learning & Python Practice Sprint');
  const [taskTemplateCategory, setTaskTemplateCategory] = useState(categories[0]?.name || 'Machine Learning (ML)');
  const [taskTemplateDuration, setTaskTemplateDuration] = useState(90);
  const [taskTemplateLocked, setTaskTemplateLocked] = useState(true);

  // User management state
  const [editingUser, setEditingUser] = useState<RegisteredAccount | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [isAddingNewUser, setIsAddingNewUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState<Partial<RegisteredAccount>>({
    name: '',
    email: '',
    password: '',
    role: 'user',
    department: 'Computer Science & AI',
    streak_count: 0,
    longest_streak: 0,
    xp: 0,
    level: 1,
  });

  // Task management state
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');
  const [taskFilterLocked, setTaskFilterLocked] = useState<string>('all');
  const [editingTaskObj, setEditingTaskObj] = useState<Task | null>(null);

  const isUserAdmin = currentUser.role === 'admin';

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAdminConfig(configDraft);
    setSavedMessage('Institutional policies successfully saved and propagated!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleToggleCategoryLock = (catId: string) => {
    const updated = categories.map((c) =>
      c.id === catId ? { ...c, is_locked_by_admin: !c.is_locked_by_admin } : c
    );
    onUpdateCategories(updated);
  };

  const handleAddCategory = () => {
    const newCat: CategoryDef = {
      id: `cat-${Date.now()}`,
      name: 'New Department Track',
      color: '#22d3ee',
      is_locked_by_admin: false,
      is_core_academic: true,
    };
    onUpdateCategories([...categories, newCat]);
  };

  const handleDeleteCategory = (catId: string) => {
    onUpdateCategories(categories.filter((c) => c.id !== catId));
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    onBroadcastAnnouncement({
      title: annTitle,
      message: annMessage,
      severity: annSeverity,
      date: new Date().toISOString().split('T')[0],
      is_mandatory: true,
    });

    setAnnTitle('');
    setAnnMessage('');
    setSavedMessage('Announcement broadcasted across all student panels!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handlePushTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTemplateTitle.trim()) return;

    onPushInstitutionalTask({
      title: taskTemplateTitle,
      category: taskTemplateCategory,
      duration_minutes: taskTemplateDuration,
      is_admin_locked: taskTemplateLocked,
      priority: 'high',
      status: 'pending',
      start_time: '14:00',
      end_time: '15:30',
      tags: ['Institutional Policy', 'Mandatory'],
      notes: 'Required attendance scheduled by Dean of Studies',
    });

    setSavedMessage(`Pushed "${taskTemplateTitle}" to student timetables.`);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  // CSV Report Generator
  const handleExportCSV = () => {
    const headers = ['Task Title', 'Category', 'Date', 'Planned Duration (min)', 'Logged Seconds', 'Status', 'Locked By Admin'];
    const rows = tasks.map((t) => [
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.date || 'Today',
      t.duration_minutes,
      t.time_spent_seconds,
      t.status,
      t.is_admin_locked ? 'YES' : 'NO',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TimeForge_Institutional_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = registeredUsers.filter((u) => {
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q);
  });

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase()) || t.category.toLowerCase().includes(taskSearch.toLowerCase());
    const matchesStatus = taskFilterStatus === 'all' || t.status === taskFilterStatus;
    const matchesLock = taskFilterLocked === 'all' || (taskFilterLocked === 'locked' ? t.is_admin_locked : !t.is_admin_locked);
    return matchesSearch && matchesStatus && matchesLock;
  });

  return (
    <div className="space-y-6">
      {/* Admin Role Status Banner */}
      {!isUserAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Read-Only Governance Mode:</span> You are currently viewing as Student ({currentUser.name}). Switch to the Administrator profile in the top-right corner to modify lock policies.
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-6 rounded-2xl glass shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Institutional Governance & Master Admin Hub</h2>
          </div>
          <p className="text-xs text-slate-400">
            Enforce organization-wide maximum workloads, user streaks, and comprehensive timetable overrides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>Export CSV Audit</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl glass-dark border border-white/10 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('policy')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'policy'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Policies & Lock Flags</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Accounts & Streaks ({registeredUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('master_tasks')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'master_tasks'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Master Tasks Hub ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Curriculum Tracks</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'broadcast'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Broadcast Announcements</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'templates'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Push Mandatory Tasks</span>
        </button>
      </div>

      {savedMessage && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold animate-fadeIn flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Tab 1: Policies & Lock Flags */}
      {activeTab === 'policy' && (
        <form onSubmit={handleSavePolicy} className="p-6 rounded-2xl glass space-y-6 animate-fadeIn shadow-xl">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              <span>Institutional Identity & Capacity Constraints</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Institution / Department Name</label>
                <input
                  type="text"
                  value={configDraft.organization_name}
                  onChange={(e) => setConfigDraft({ ...configDraft, organization_name: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Active Day Cycle Rotation</label>
                <select
                  value={configDraft.rotation_cycle_current}
                  onChange={(e) =>
                    setConfigDraft({
                      ...configDraft,
                      rotation_cycle_current: e.target.value as 'A' | 'B',
                    })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                >
                  <option value="A" className="bg-slate-900 text-slate-200">
                    Cycle A (Day 1 / Mon-Wed Schedule)
                  </option>
                  <option value="B" className="bg-slate-900 text-slate-200">
                    Cycle B (Day 2 / Tue-Thu Schedule)
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Governance Rules & Lock Enforcement</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl glass-dark border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Daily Study Workload Threshold</span>
                  <input
                    type="number"
                    min="4"
                    max="24"
                    value={configDraft.max_daily_hours_threshold.value}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        max_daily_hours_threshold: {
                          ...configDraft.max_daily_hours_threshold,
                          value: Number(e.target.value),
                        },
                      })
                    }
                    className="w-20 px-2.5 py-1 rounded-lg glass text-xs text-center font-mono text-cyan-300 border border-white/10"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Flags student study plan with overload warning if exceeded in single 24-hour cycle.
                </p>
              </div>

              <div className="p-4 rounded-xl glass-dark border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Gamification & XP Engine</span>
                  <input
                    type="checkbox"
                    checked={configDraft.gamification_enabled.value}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        gamification_enabled: {
                          ...configDraft.gamification_enabled,
                          value: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Enables streak counts (starts from zero, resets on missed day), XP progression, and level badges.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={!isUserAdmin}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save & Propagate Institutional Policies</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: User Accounts & Streaks Management */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl glass space-y-5 animate-fadeIn shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>User Accounts, Credentials & Streak Manager</span>
              </h3>
              <p className="text-xs text-slate-400">
                Admin master control to adjust roles, reset streaks to 0, customize XP/level, and update passwords.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onResetAllStreaks && (
                <button
                  type="button"
                  onClick={onResetAllStreaks}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold"
                  title="Reset all registered users streaks to 0"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Reset All Streaks to 0</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddingNewUser(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Account</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user accounts by name, email, or department..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* User Accounts List */}
          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const isCurrent = u.id === currentUser.id || u.email === currentUser.email;
              return (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl glass-dark border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm group hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{u.name}</span>
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          }`}
                        >
                          {u.role}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate">{u.email}</p>
                      {u.department && (
                        <p className="text-[11px] text-slate-500 truncate">📍 {u.department}</p>
                      )}
                    </div>
                  </div>

                  {/* Streak & XP Stats */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center p-2 rounded-xl glass border border-white/5">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Streak</div>
                      <div className="font-mono font-bold text-amber-400 mt-0.5">
                        🔥 {u.streak_count || 0}d
                      </div>
                    </div>

                    <div className="text-center p-2 rounded-xl glass border border-white/5">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Experience</div>
                      <div className="font-mono font-bold text-cyan-400 mt-0.5">
                        ⚡ {u.xp || 0} XP
                      </div>
                    </div>

                    <div className="text-center p-2 rounded-xl glass border border-white/5">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Level</div>
                      <div className="font-mono font-bold text-emerald-400 mt-0.5">
                        Lv. {u.level || 1}
                      </div>
                    </div>

                    {/* Admin Actions for User */}
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateUserAccount) {
                            onUpdateUserAccount({
                              ...u,
                              streak_count: 0,
                              last_streak_date: undefined,
                            });
                            setSavedMessage(`Streak for ${u.name} reset to 0.`);
                            setTimeout(() => setSavedMessage(null), 3000);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg glass text-amber-400 hover:bg-amber-500/15 border border-amber-500/30 text-xs font-semibold"
                        title="Reset streak to 0"
                      >
                        Reset Streak
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingUser(u)}
                        className="p-1.5 rounded-lg glass hover:bg-white/10 text-cyan-300 border border-cyan-500/30"
                        title="Edit user details & streaks"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteUserAccount && !isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete account for "${u.name}" (${u.email})?`)) {
                              onDeleteUserAccount(u.id);
                              setSavedMessage(`Account "${u.name}" deleted.`);
                              setTimeout(() => setSavedMessage(null), 3000);
                            }
                          }}
                          className="p-1.5 rounded-lg glass hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          title="Delete user account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edit User Modal */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
              <div className="w-full max-w-lg p-6 rounded-2xl glass-dark border border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-cyan-400" />
                    <span>Edit User Account & Streaks: {editingUser.name}</span>
                  </h3>
                  <button onClick={() => setEditingUser(null)} className="text-xs text-slate-400 hover:text-white">
                    Cancel
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onUpdateUserAccount) {
                      const isMasterAdmin = editingUser.email.toLowerCase().trim() === '218r1a0543@gmail.com';
                      const sanitized: RegisteredAccount = {
                        ...editingUser,
                        role: isMasterAdmin ? 'admin' : 'user',
                      };
                      onUpdateUserAccount(sanitized);
                      setSavedMessage(`User "${editingUser.name}" successfully updated!`);
                      setTimeout(() => setSavedMessage(null), 3000);
                    }
                    setEditingUser(null);
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Name</label>
                      <input
                        type="text"
                        required
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Role & Permissions</label>
                      {editingUser.email.toLowerCase().trim() === '218r1a0543@gmail.com' ? (
                        <div className="w-full mt-1 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-300 font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>admin (Institutional Lead)</span>
                        </div>
                      ) : (
                        <div className="w-full mt-1 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-300 font-medium flex items-center justify-between">
                          <span>user (Student)</span>
                          <span className="text-[10px] text-slate-400 font-mono">Restricted</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Email Address</label>
                      <input
                        type="email"
                        required
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Department</label>
                      <input
                        type="text"
                        value={editingUser.department || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Streak & Progression Controls */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Streak & Gamification Controls</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingUser({
                            ...editingUser,
                            streak_count: 0,
                            longest_streak: 0,
                            last_streak_date: undefined,
                          })
                        }
                        className="text-[11px] text-amber-300 hover:underline font-normal"
                      >
                        Set Streak to 0
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400">Current Streak</label>
                        <input
                          type="number"
                          min="0"
                          value={editingUser.streak_count ?? 0}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser,
                              streak_count: Number(e.target.value),
                            })
                          }
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg glass border border-white/10 text-xs font-mono text-amber-300 text-center"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400">Experience (XP)</label>
                        <input
                          type="number"
                          min="0"
                          value={editingUser.xp ?? 0}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser,
                              xp: Number(e.target.value),
                            })
                          }
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg glass border border-white/10 text-xs font-mono text-cyan-300 text-center"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400">Mastery Level</label>
                        <input
                          type="number"
                          min="1"
                          value={editingUser.level ?? 1}
                          onChange={(e) =>
                            setEditingUser({
                              ...editingUser,
                              level: Number(e.target.value),
                            })
                          }
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg glass border border-white/10 text-xs font-mono text-emerald-300 text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-3.5 py-1.5 rounded-xl glass text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/20"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add New User Modal */}
          {isAddingNewUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
              <div className="w-full max-w-md p-6 rounded-2xl glass-dark border border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-cyan-400" />
                    <span>Create User / Administrator Account</span>
                  </h3>
                  <button onClick={() => setIsAddingNewUser(false)} className="text-xs text-slate-400 hover:text-white">
                    Cancel
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newUserForm.name || !newUserForm.email) return;
                    const emailClean = newUserForm.email.toLowerCase().trim();
                    const isMasterAdmin = emailClean === '218r1a0543@gmail.com';
                    const created: RegisteredAccount = {
                      id: isMasterAdmin ? 'usr_admin' : `usr_${Date.now()}`,
                      name: newUserForm.name,
                      email: emailClean,
                      password: newUserForm.password || (isMasterAdmin ? 'Admin@0543' : 'Student@123'),
                      role: isMasterAdmin ? 'admin' : 'user',
                      department: newUserForm.department || (isMasterAdmin ? 'Academic Operations & Governance' : 'General Studies'),
                      avatar:
                        newUserForm.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                      theme_pref: 'glass',
                      streak_count: 0,
                      longest_streak: 0,
                      xp: 0,
                      level: 1,
                    };
                    if (onAddUserAccount) {
                      onAddUserAccount(created);
                      setSavedMessage(`Account "${created.name}" created with 0 streak!`);
                      setTimeout(() => setSavedMessage(null), 3000);
                    }
                    setIsAddingNewUser(false);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Smith"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. user@campus.edu"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Password</label>
                      <input
                        type="text"
                        required
                        placeholder="Password"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Role</label>
                      <div className="w-full mt-1 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-300 font-medium flex items-center justify-between">
                        <span>user (Student)</span>
                        <span className="text-[10px] text-slate-400 font-mono">Restricted</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl glass border border-white/5 text-[11px] text-slate-400">
                    ℹ️ New user accounts automatically initialize with <strong className="text-amber-300">Streak: 0</strong>, <strong className="text-cyan-300">0 XP</strong>, and <strong className="text-emerald-300">Level 1</strong>.
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewUser(false)}
                      className="px-3.5 py-1.5 rounded-xl glass text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/20"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Master Tasks Hub */}
      {activeTab === 'master_tasks' && (
        <div className="p-6 rounded-2xl glass space-y-5 animate-fadeIn shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-cyan-400" />
                <span>Master Timetable Routine Hub</span>
              </h3>
              <p className="text-xs text-slate-400">
                Full institutional access: unlock/lock, complete, modify or delete any task block across all schedules.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onUnlockAllTasks && (
                <button
                  type="button"
                  onClick={onUnlockAllTasks}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-white/10"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock All</span>
                </button>
              )}
              {onLockAllTasks && (
                <button
                  type="button"
                  onClick={onLockAllTasks}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-white/10"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock All</span>
                </button>
              )}
              {onBatchCompleteAll && (
                <button
                  type="button"
                  onClick={onBatchCompleteAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Complete All</span>
                </button>
              )}
              {onBatchResetAll && (
                <button
                  type="button"
                  onClick={onBatchResetAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-slate-300 border border-white/10 text-xs font-semibold hover:bg-white/10"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Status</span>
                </button>
              )}
              {onRestoreDefaultSchedule && (
                <button
                  type="button"
                  onClick={onRestoreDefaultSchedule}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-white/10"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore 11-Task Routine</span>
                </button>
              )}
              {onClearAllTasks && (
                <button
                  type="button"
                  onClick={onClearAllTasks}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <select
              value={taskFilterStatus}
              onChange={(e) => setTaskFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="pending" className="bg-slate-900">Pending Only</option>
              <option value="done" className="bg-slate-900">Completed Only</option>
            </select>

            <select
              value={taskFilterLocked}
              onChange={(e) => setTaskFilterLocked(e.target.value)}
              className="px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all" className="bg-slate-900">All Lock States</option>
              <option value="locked" className="bg-slate-900">Locked By Admin</option>
              <option value="unlocked" className="bg-slate-900">Unlocked</option>
            </select>
          </div>

          {/* Master Tasks Table / Cards */}
          <div className="space-y-2.5">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl glass-dark border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-cyan-500/30 transition-all"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">{t.title}</span>
                    {t.is_admin_locked ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Locked</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5 flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" />
                        <span>Unlocked</span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                        t.status === 'done'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                    <span>📚 {t.category}</span>
                    <span>⏰ {t.start_time} - {t.end_time} ({t.duration_minutes}m)</span>
                    {t.date && <span>📅 {t.date}</span>}
                    {t.room && <span>📍 {t.room}</span>}
                  </div>
                </div>

                {/* Master Action Controls for Task */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {onUpdateTask && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateTask({
                          ...t,
                          is_admin_locked: !t.is_admin_locked,
                        });
                      }}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        t.is_admin_locked
                          ? 'glass text-amber-300 border-amber-500/30 hover:bg-amber-500/15'
                          : 'glass text-slate-400 border-white/10 hover:text-white'
                      }`}
                      title={t.is_admin_locked ? 'Click to Unlock task' : 'Click to Lock task'}
                    >
                      {t.is_admin_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {onUpdateTask && (
                    <button
                      type="button"
                      onClick={() => setEditingTaskObj(t)}
                      className="p-1.5 rounded-lg glass text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/15"
                      title="Edit task parameters"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onDeleteTask && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Admin action: delete "${t.title}" from schedule?`)) {
                          onDeleteTask(t.id);
                        }
                      }}
                      className="p-1.5 rounded-lg glass text-rose-400 border border-rose-500/30 hover:bg-rose-500/15"
                      title="Delete task (Admin Override)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Edit Task Modal */}
          {editingTaskObj && onUpdateTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
              <div className="w-full max-w-lg p-6 rounded-2xl glass-dark border border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-cyan-400" />
                    <span>Admin Master Edit: {editingTaskObj.title}</span>
                  </h3>
                  <button onClick={() => setEditingTaskObj(null)} className="text-xs text-slate-400 hover:text-white">
                    Cancel
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onUpdateTask(editingTaskObj);
                    setSavedMessage(`Task "${editingTaskObj.title}" updated.`);
                    setTimeout(() => setSavedMessage(null), 3000);
                    setEditingTaskObj(null);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Task Title</label>
                    <input
                      type="text"
                      required
                      value={editingTaskObj.title}
                      onChange={(e) => setEditingTaskObj({ ...editingTaskObj, title: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Category</label>
                      <select
                        value={editingTaskObj.category}
                        onChange={(e) => setEditingTaskObj({ ...editingTaskObj, category: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name} className="bg-slate-900">
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Status</label>
                      <select
                        value={editingTaskObj.status}
                        onChange={(e) => setEditingTaskObj({ ...editingTaskObj, status: e.target.value as any })}
                        className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200"
                      >
                        <option value="pending" className="bg-slate-900">pending</option>
                        <option value="done" className="bg-slate-900">done (completed)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Start Time</label>
                      <input
                        type="time"
                        value={editingTaskObj.start_time}
                        onChange={(e) => setEditingTaskObj({ ...editingTaskObj, start_time: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">End Time</label>
                      <input
                        type="time"
                        value={editingTaskObj.end_time}
                        onChange={(e) => setEditingTaskObj({ ...editingTaskObj, end_time: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-300">Institutional Lock:</span>
                      <p className="text-[11px] text-amber-200/70">When locked, standard students cannot delete this task.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingTaskObj.is_admin_locked}
                      onChange={(e) =>
                        setEditingTaskObj({ ...editingTaskObj, is_admin_locked: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingTaskObj(null)}
                      className="px-3.5 py-1.5 rounded-xl glass text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/20"
                    >
                      Save Task Updates
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Curriculum Tracks & Subject Locks */}
      {activeTab === 'categories' && (
        <div className="p-6 rounded-2xl glass space-y-4 animate-fadeIn shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Curriculum Tracks & Subject Locks</span>
              </h3>
              <p className="text-xs text-slate-400">
                Lock core academic subjects so students cannot remove mandatory lectures from timetable.
              </p>
            </div>

            <button
              onClick={handleAddCategory}
              disabled={!isUserAdmin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject Track</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl glass-dark border border-white/10 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-white truncate block">{cat.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {cat.is_core_academic ? 'Mandatory Core Track' : 'Elective Track'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleCategoryLock(cat.id)}
                    disabled={!isUserAdmin}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                      cat.is_locked_by_admin
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'glass text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {cat.is_locked_by_admin ? (
                      <>
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Locked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" />
                        <span>Unlocked</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    disabled={!isUserAdmin || cat.is_locked_by_admin}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Broadcast Announcements */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6 animate-fadeIn">
          {isUserAdmin && (
            <form onSubmit={handleBroadcastSubmit} className="p-6 rounded-2xl glass space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span>Send Institutional Broadcast</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Broadcast instant schedule alerts, exam modifications, or room changes to all active users.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Midterm Lab Schedule Revised"
                  className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Severity Level</label>
                  <select
                    value={annSeverity}
                    onChange={(e) => setAnnSeverity(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                  >
                    <option value="info" className="bg-slate-900 text-slate-200">Info / General Notice</option>
                    <option value="warning" className="bg-slate-900 text-slate-200">Warning / Revision</option>
                    <option value="urgent" className="bg-slate-900 text-slate-200">Urgent / Exam Override</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Message Content</label>
                <textarea
                  rows={2}
                  required
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="Details regarding classroom change, holiday rotation, or grading policy..."
                  className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-lg shadow-cyan-500/25"
              >
                Send Broadcast to All Users
              </button>
            </form>
          )}

          {/* Existing Announcements List */}
          <div className="p-6 rounded-2xl glass space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white">Live Institutional Announcements</h3>
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-4 text-xs ${
                    ann.severity === 'urgent'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : ann.severity === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'glass-dark border-white/10 text-slate-300'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{ann.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded glass text-slate-400 border border-white/5">
                        {ann.date}
                      </span>
                    </div>
                    <p className="text-slate-300">{ann.message}</p>
                  </div>

                  {isUserAdmin && (
                    <button
                      onClick={() => onDeleteAnnouncement(ann.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Push Mandatory Tasks */}
      {activeTab === 'templates' && (
        <form onSubmit={handlePushTaskSubmit} className="p-6 rounded-2xl glass space-y-4 animate-fadeIn shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Push Mandatory Timetable Block</span>
            </h3>
            <p className="text-xs text-slate-400">
              Instantly inserts a locked task across student timetables with `is_admin_locked: true`
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Block Title</label>
            <input
              type="text"
              required
              value={taskTemplateTitle}
              onChange={(e) => setTaskTemplateTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <select
                value={taskTemplateCategory}
                onChange={(e) => setTaskTemplateCategory(e.target.value)}
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
              <label className="text-xs font-semibold text-slate-300">Duration (Minutes)</label>
              <input
                type="number"
                value={taskTemplateDuration}
                onChange={(e) => setTaskTemplateDuration(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="lock-pushed-task"
              checked={taskTemplateLocked}
              onChange={(e) => setTaskTemplateLocked(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="lock-pushed-task" className="text-xs text-slate-300 cursor-pointer">
              Enforce <span className="font-mono text-cyan-300">is_admin_locked: true</span> (Students cannot delete this block)
            </label>
          </div>

          <div className="flex justify-end pt-3 border-t border-white/10">
            <button
              type="submit"
              disabled={!isUserAdmin}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              Push to All Timetables
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
