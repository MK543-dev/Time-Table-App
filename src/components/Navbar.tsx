import React from 'react';
import {
  Clock,
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Sparkles,
  ShieldAlert,
  Flame,
  Bell,
  Square
} from 'lucide-react';
import { User, ThemeMode } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  onSwitchUser: (role: 'admin' | 'user') => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  activeTimer: {
    isRunning: boolean;
    taskTitle: string;
    elapsedSeconds: number;
    category: string;
  } | null;
  onStopTimer: () => void;
  completedTasksCount: number;
  totalTasksCount: number;
  unreadAnnouncementsCount: number;
  onOpenAnnouncements: () => void;
  onOpenAISummary: () => void;
  brandName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onSwitchUser,
  theme,
  setTheme,
  activeTimer,
  onStopTimer,
  completedTasksCount,
  totalTasksCount,
  unreadAnnouncementsCount,
  onOpenAnnouncements,
  onOpenAISummary,
  brandName = 'TimeForge',
}) => {
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const navItems = [
    { id: 'board', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timetable', label: 'Timetable', icon: CalendarDays },
    { id: 'diagrams', label: 'Analytics', icon: BarChart3 },
    { id: 'timer', label: 'Focus Timer', icon: Clock },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles },
    { id: 'admin', label: 'Admin', icon: ShieldAlert, adminOnly: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl border-b transition-colors duration-200 bg-black/30 border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-6">
            <div
              onClick={() => setCurrentTab('board')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-lg flex items-center justify-center font-bold text-black text-sm shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                T
              </div>
              <span className="text-xl font-semibold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                {brandName}
              </span>
            </div>

            {/* Quick Live Completion Tag */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="text-slate-400">Daily:</span>
              <span className="font-mono font-bold text-cyan-300">
                {completedTasksCount} / {totalTasksCount} Done
              </span>
            </div>
          </div>

          {/* Center Navigation Links (Theme Styled) */}
          <nav className="hidden md:flex items-center gap-1 glass p-1 rounded-xl border border-white/5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)] font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.adminOnly && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-mono uppercase ${
                      currentUser.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {currentUser.role === 'admin' ? 'Admin' : 'Lock'}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Active Running Timer Chip */}
            {activeTimer && activeTimer.isRunning && (
              <div
                onClick={() => setCurrentTab('timer')}
                className="cursor-pointer flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)] animate-pulse"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-mono font-bold">{formatTime(activeTimer.elapsedSeconds)}</span>
                <span className="hidden xl:inline truncate max-w-[100px] text-slate-300 text-[11px]">
                  {activeTimer.taskTitle}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStopTimer();
                  }}
                  title="Stop and save log"
                  className="p-0.5 rounded hover:bg-cyan-500/20 text-cyan-400"
                >
                  <Square className="w-3 h-3 fill-cyan-400" />
                </button>
              </div>
            )}

            {/* Streak Badge from Theme */}
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Streak</span>
              <span className="text-white font-mono text-xs">{currentUser.streak_count} Days</span>
            </div>

            {/* AI Assistant Quick Trigger */}
            <button
              id="header-ai-quick-btn"
              onClick={onOpenAISummary}
              title="Open AI Weekly Insights & Habit Summary"
              className="glass p-2 sm:px-3 sm:py-1.5 rounded-xl border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs font-medium flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(34,211,238,0.1)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">AI Insight</span>
            </button>

            {/* Announcements Bell */}
            <button
              id="header-notifications-btn"
              onClick={onOpenAnnouncements}
              title="Institutional Announcements & Schedule Overrides"
              className="relative p-2 rounded-xl glass hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadAnnouncementsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[9px] font-bold text-black flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                  {unreadAnnouncementsCount}
                </span>
              )}
            </button>

            {/* User / Admin Avatar Switcher */}
            <div className="relative group">
              <button
                id="role-switch-button"
                onClick={() => onSwitchUser(currentUser.role === 'admin' ? 'user' : 'admin')}
                className="flex items-center gap-2 p-1 pl-1 pr-2.5 rounded-xl glass hover:bg-white/5 border border-white/10 text-xs font-medium transition-all"
                title={`Currently in ${currentUser.role.toUpperCase()} role. Click to toggle role.`}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border border-white/20 overflow-hidden flex items-center justify-center">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="hidden md:inline text-slate-300 font-medium text-xs">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span
                  className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {currentUser.role}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation row */}
        <div className="md:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-white/5 gap-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
