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
  FileSpreadsheet
} from 'lucide-react';
import { AdminConfig, CategoryDef, Task, Announcement, User } from '../types';

interface AdminPanelProps {
  currentUser: User;
  adminConfig: AdminConfig;
  categories: CategoryDef[];
  tasks: Task[];
  announcements: Announcement[];
  onUpdateAdminConfig: (config: AdminConfig) => void;
  onUpdateCategories: (categories: CategoryDef[]) => void;
  onBroadcastAnnouncement: (announcement: Partial<Announcement>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onPushInstitutionalTask: (task: Partial<Task>) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  adminConfig,
  categories,
  tasks,
  announcements,
  onUpdateAdminConfig,
  onUpdateCategories,
  onBroadcastAnnouncement,
  onDeleteAnnouncement,
  onPushInstitutionalTask,
}) => {
  const [activeTab, setActiveTab] = useState<'policy' | 'categories' | 'broadcast' | 'templates' | 'reports'>('policy');
  const [configDraft, setConfigDraft] = useState<AdminConfig>(adminConfig);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Broadcast state
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annSeverity, setAnnSeverity] = useState<'info' | 'warning' | 'urgent'>('info');

  // Push task template state
  const [taskTemplateTitle, setTaskTemplateTitle] = useState('Institutional Midterm Prep Session');
  const [taskTemplateCategory, setTaskTemplateCategory] = useState(categories[0]?.name || 'Database Systems (DBMS)');
  const [taskTemplateDuration, setTaskTemplateDuration] = useState(90);
  const [taskTemplateLocked, setTaskTemplateLocked] = useState(true);

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
    const rows = tasks.map(t => [
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.date || 'Today',
      t.duration_minutes,
      t.time_spent_seconds,
      t.status,
      t.is_admin_locked ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TimeForge_Institutional_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Admin Role Status Warning if viewing in student mode */}
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
            <h2 className="text-lg font-bold text-white">Institutional Governance & Policy Admin</h2>
          </div>
          <p className="text-xs text-slate-400">
            Enforce organization-wide maximum workloads, mandatory timetable locks, and rotation cycles.
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
                <label className="text-xs font-semibold text-slate-300">Organization Name</label>
                <input
                  type="text"
                  value={configDraft.organization_name}
                  onChange={(e) => setConfigDraft({ ...configDraft, organization_name: e.target.value })}
                  disabled={!isUserAdmin}
                  className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Academic Department</label>
                <input
                  type="text"
                  value={configDraft.department}
                  onChange={(e) => setConfigDraft({ ...configDraft, department: e.target.value })}
                  disabled={!isUserAdmin}
                  className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Max Daily Hours Threshold setting with locked_by_admin flag */}
            <div className="p-4 rounded-xl glass-dark border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Max Daily Planned Hours Cap</div>
                  <div className="text-[11px] text-slate-400">
                    Triggers workload overload warnings if student schedules exceed this limit.
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="8"
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
                    disabled={!isUserAdmin || configDraft.max_daily_hours_threshold.locked_by_admin}
                    className="w-20 px-3 py-1.5 rounded-lg glass border border-white/10 text-xs text-cyan-300 text-center font-mono focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
                  />

                  {/* Lock Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setConfigDraft({
                        ...configDraft,
                        max_daily_hours_threshold: {
                          ...configDraft.max_daily_hours_threshold,
                          locked_by_admin: !configDraft.max_daily_hours_threshold.locked_by_admin,
                        },
                      })
                    }
                    disabled={!isUserAdmin}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                      configDraft.max_daily_hours_threshold.locked_by_admin
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                        : 'glass border-white/10 text-slate-400'
                    }`}
                    title={configDraft.max_daily_hours_threshold.locked_by_admin ? 'Locked by admin policy' : 'Unlocked'}
                  >
                    {configDraft.max_daily_hours_threshold.locked_by_admin ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Locked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unlocked</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Gamification Policy Setting */}
            <div className="p-4 rounded-xl glass-dark border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Gamification (Streaks & Confetti)</div>
                <div className="text-[11px] text-slate-400">
                  Allow student streak XP, level badges, and milestone confetti celebrations.
                </div>
              </div>

              <div className="flex items-center gap-3">
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
                  disabled={!isUserAdmin || configDraft.gamification_enabled.locked_by_admin}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() =>
                    setConfigDraft({
                      ...configDraft,
                      gamification_enabled: {
                        ...configDraft.gamification_enabled,
                        locked_by_admin: !configDraft.gamification_enabled.locked_by_admin,
                      },
                    })
                  }
                  disabled={!isUserAdmin}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                    configDraft.gamification_enabled.locked_by_admin
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                      : 'glass border-white/10 text-slate-400'
                  }`}
                >
                  {configDraft.gamification_enabled.locked_by_admin ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Locked</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlocked</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {isUserAdmin && (
            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/25 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Governance Policies</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab 2: Curriculum Tracks / Categories */}
      {activeTab === 'categories' && (
        <div className="p-6 rounded-2xl glass space-y-4 animate-fadeIn shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Subject Categories & Academic Tracks</h3>
              <p className="text-xs text-slate-400">Lock core syllabus tracks to prevent deletion by students</p>
            </div>

            {isUserAdmin && (
              <button
                onClick={handleAddCategory}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-lg shadow-cyan-500/25"
              >
                <Plus className="w-4 h-4" />
                <span>Add Track</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl glass-dark border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.4)]" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-white truncate">{cat.name}</span>
                  {cat.is_core_academic && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Core Academic
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleCategoryLock(cat.id)}
                    disabled={!isUserAdmin}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono ${
                      cat.is_locked_by_admin
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        : 'glass text-slate-400 border border-white/5'
                    }`}
                  >
                    {cat.is_locked_by_admin ? <Lock className="w-3 h-3 text-cyan-400" /> : <Unlock className="w-3 h-3" />}
                    <span>{cat.is_locked_by_admin ? 'Admin Locked' : 'Unlocked'}</span>
                  </button>

                  {isUserAdmin && !cat.is_locked_by_admin && (
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Broadcast Announcements */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6 animate-fadeIn">
          {isUserAdmin && (
            <form onSubmit={handleBroadcastSubmit} className="p-6 rounded-2xl glass space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span>Broadcast New Announcement</span>
              </h3>

              <div>
                <label className="text-xs font-semibold text-slate-300">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Schedule Override: Friday follows Monday Timetable"
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

      {/* Tab 4: Push Mandatory Tasks */}
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
