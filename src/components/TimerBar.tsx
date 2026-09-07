import React, { useState } from 'react';
import {
  Play,
  Square,
  Clock,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  FileText
} from 'lucide-react';
import { Task, TimeLog, CategoryDef } from '../types';

interface TimerBarProps {
  tasks: Task[];
  timeLogs: TimeLog[];
  categories: CategoryDef[];
  activeTimer: {
    isRunning: boolean;
    taskTitle: string;
    elapsedSeconds: number;
    category: string;
    taskId?: string;
  } | null;
  onStartTimer: (taskTitle: string, category: string, taskId?: string) => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onStopAndSaveTimer: (notes?: string) => void;
  onAddManualLog: (log: Partial<TimeLog>) => void;
  onDeleteLog: (logId: string) => void;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  tasks,
  timeLogs,
  categories,
  activeTimer,
  onStartTimer,
  onStopAndSaveTimer,
  onAddManualLog,
  onDeleteLog,
}) => {
  const [customTitle, setCustomTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || 'General Study');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timerNotes, setTimerNotes] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Manual entry states
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState(categories[0]?.name || 'General Study');
  const [manualMinutes, setManualMinutes] = useState(45);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);

  const isRunning = activeTimer?.isRunning ?? false;
  const elapsedSeconds = activeTimer?.elapsedSeconds ?? 0;

  // Format seconds to HH:MM:SS
  const formatStopwatch = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStart = () => {
    const titleToUse = customTitle.trim() || (selectedTaskId ? tasks.find(t => t.id === selectedTaskId)?.title : '') || 'Focus Work Block';
    onStartTimer(titleToUse, selectedCategory, selectedTaskId || undefined);
    if (soundEnabled) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {}
    }
  };

  const handleStop = () => {
    onStopAndSaveTimer(timerNotes);
    setTimerNotes('');
    setCustomTitle('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    onAddManualLog({
      task_title: manualTitle,
      category: manualCategory,
      duration_seconds: manualMinutes * 60,
      started_at: new Date(manualDate).toISOString(),
      ended_at: new Date().toISOString(),
      notes: 'Manually logged focus session',
      is_manual: true,
    });

    setIsManualModalOpen(false);
    setManualTitle('');
  };

  const totalLoggedSeconds = timeLogs.reduce((acc, l) => acc + (l.duration_seconds || 0), 0);
  const totalLoggedHours = (totalLoggedSeconds / 3600).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Banner & Stopwatch Hero */}
      <div className="p-6 rounded-2xl glass space-y-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Focus Time Engine</h2>
              <p className="text-xs text-slate-400">Live start/stop work logging with auto-sync to scheduled timetable blocks</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
              title="Toggle audio click feedback"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              id="open-manual-log-btn"
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Manual Entry</span>
            </button>
          </div>
        </div>

        {/* Floating Active Tracker Input Strip */}
        <div className="p-4 rounded-xl glass-dark border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left: Task Title / Select */}
          <div className="flex flex-wrap items-center gap-3 flex-1 w-full">
            <input
              id="timer-task-title-input"
              type="text"
              value={isRunning ? activeTimer?.taskTitle : customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              disabled={isRunning}
              placeholder="What are you working on right now? (e.g. DBMS Query Optimization)"
              className="flex-1 min-w-[220px] px-3.5 py-2.5 rounded-xl glass border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 disabled:opacity-80"
            />

            {/* Quick Task Picker */}
            {!isRunning && (
              <select
                value={selectedTaskId}
                onChange={(e) => {
                  setSelectedTaskId(e.target.value);
                  const found = tasks.find(t => t.id === e.target.value);
                  if (found) {
                    setCustomTitle(found.title);
                    setSelectedCategory(found.category);
                  }
                }}
                className="px-3 py-2.5 rounded-xl glass border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 max-w-xs cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-200">Attach to Scheduled Task...</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                    {t.title.length > 35 ? t.title.slice(0, 35) + '...' : t.title}
                  </option>
                ))}
              </select>
            )}

            {/* Category Picker */}
            <select
              value={isRunning ? activeTimer?.category : selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={isRunning}
              className="px-3 py-2.5 rounded-xl glass border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer disabled:opacity-80"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Stopwatch Counter & Start/Stop Controls */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-2">
              {isRunning && <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />}
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.35)] tracking-wider">
                {formatStopwatch(elapsedSeconds)}
              </span>
            </div>

            {isRunning ? (
              <button
                id="stop-timer-btn"
                onClick={handleStop}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop & Log</span>
              </button>
            ) : (
              <button
                id="start-timer-btn"
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Start Timer</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional Notes when timer is running */}
        {isRunning && (
          <div className="flex items-center gap-2 animate-fadeIn">
            <FileText className="w-4 h-4 text-cyan-400" />
            <input
              type="text"
              value={timerNotes}
              onChange={(e) => setTimerNotes(e.target.value)}
              placeholder="Session notes (e.g. solved database indexing queries)..."
              className="flex-1 px-3 py-1.5 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl glass border border-white/5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Logged Focus</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{totalLoggedHours} hrs</div>
        </div>
        <div className="p-4 rounded-xl glass border border-white/5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Completed Sessions</div>
          <div className="text-xl font-bold font-mono text-white mt-1">{timeLogs.length} logs</div>
        </div>
        <div className="p-4 rounded-xl glass border border-white/5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Engine State</div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1 flex items-center gap-2">
            {isRunning ? (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Active Recording</span>
              </>
            ) : (
              <span className="text-slate-400">Standby</span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Time Logs Table */}
      <div className="p-6 rounded-2xl glass space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Focus Session History</h3>
            <p className="text-xs text-slate-400">Detailed logs with recorded durations and category breakdown</p>
          </div>
        </div>

        {timeLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No time logs recorded yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {timeLogs.map((log) => {
              const mins = Math.round(log.duration_seconds / 60);
              const hrs = (log.duration_seconds / 3600).toFixed(1);

              return (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">{log.task_title}</span>
                      {log.is_manual && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded glass-dark text-slate-400 border border-white/10">
                          Manual
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span className="text-cyan-400/90">{log.category}</span>
                      <span>•</span>
                      <span>{new Date(log.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {log.notes && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500 truncate max-w-xs">{log.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right font-mono">
                      <div className="font-bold text-cyan-400">{hrs}h ({mins}m)</div>
                    </div>
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete log"
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

      {/* Manual Log Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl glass-dark border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Manual Focus Entry</span>
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Task / Activity Description</label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Solved DBMS SQL query benchmarks"
                  className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    required
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Date</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl glass text-slate-300 text-xs font-semibold hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 text-black text-xs font-bold shadow-lg shadow-cyan-500/25 hover:bg-cyan-400"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
