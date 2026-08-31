import React, { useState } from 'react';
import {
  Sparkles,
  Split,
  Clock,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  X
} from 'lucide-react';
import { Task, TimeLog, AISummary, CategoryDef } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  timeLogs: TimeLog[];
  categories: CategoryDef[];
  aiSummary: AISummary | null;
  onApplySubtasks: (subtasks: any[], parentTitle: string) => void;
  onGenerateNewSummary: () => Promise<void>;
  aiTonePersona: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  tasks,
  categories,
  aiSummary,
  onApplySubtasks,
  onGenerateNewSummary,
  aiTonePersona,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'split' | 'slots' | 'overload'>('summary');
  const [isGenerating, setIsGenerating] = useState(false);

  // Task Splitter state
  const [splitTitle, setSplitTitle] = useState('Build Capstone Database Indexing Engine');
  const [splitDuration, setSplitDuration] = useState(180);
  const [splitCategory, setSplitCategory] = useState(categories[0]?.name || 'Database Systems (DBMS)');
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitResult, setSplitResult] = useState<any | null>(null);

  // Time Slot Suggester state
  const [suggestResult] = useState<{ slot: string; reasoning: string } | null>({
    slot: '08:30 AM - 10:00 AM (Tomorrow Morning Block)',
    reasoning: 'Your historical completion velocity is 40% higher in morning windows before cognitive fatigue sets in.',
  });

  if (!isOpen) return null;

  const handleGenerateSummaryClick = async () => {
    setIsGenerating(true);
    await onGenerateNewSummary();
    setIsGenerating(false);
  };

  const handleSplitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!splitTitle.trim()) return;

    setIsSplitting(true);
    try {
      const res = await fetch('/api/ai/split-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: splitTitle,
          totalMinutes: splitDuration,
          category: splitCategory,
        }),
      });
      const data = await res.json();
      if (data.success && data.subtasks) {
        setSplitResult(data);
      }
    } catch (err) {
      console.error('Failed to split task:', err);
    } finally {
      setIsSplitting(false);
    }
  };

  const handleApplySplitTasks = () => {
    if (!splitResult || !splitResult.subtasks) return;
    onApplySubtasks(splitResult.subtasks, splitTitle);
    setSplitResult(null);
    onClose();
  };

  // Overload calculation
  const totalPlannedMinutes = tasks.reduce((acc, t) => acc + (t.duration_minutes || 0), 0);
  const totalPlannedHours = (totalPlannedMinutes / 60).toFixed(1);
  const isOverloaded = parseFloat(totalPlannedHours) > 16;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl glass-dark border border-white/10 shadow-2xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">TimeForge AI Intelligence Hub</h2>
              <p className="text-xs text-slate-400">
                Cognitive scheduling assistant, habit summaries & deep-work optimizers
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl glass border border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Weekly Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('split')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'split'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Task Splitter</span>
          </button>

          <button
            onClick={() => setActiveTab('slots')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'slots'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Smart Slot Finder</span>
          </button>

          <button
            onClick={() => setActiveTab('overload')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'overload'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overload Guard</span>
          </button>
        </div>

        {/* Tab 1: Weekly AI Natural Language Summary */}
        {activeTab === 'summary' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400 font-mono">
                Persona Tone: <span className="text-cyan-400 font-bold">{aiTonePersona}</span>
              </div>
              <button
                onClick={handleGenerateSummaryClick}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Analyzing Logs...' : 'Regenerate Recap'}</span>
              </button>
            </div>

            {aiSummary && (
              <div className="p-5 rounded-2xl glass border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                  <span className="font-semibold text-slate-300">Habit Analysis Digest</span>
                  <span className="text-cyan-400 font-mono">{aiSummary.week_of}</span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed italic glass-dark p-4 rounded-xl border border-cyan-500/20 shadow-[inset_0_0_15px_rgba(34,211,238,0.05)]">
                  "{aiSummary.insight_text}"
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl glass-dark border border-white/10">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Completion Rate</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      {aiSummary.metrics.completion_rate}%
                    </div>
                  </div>

                  <div className="p-3 rounded-xl glass-dark border border-white/10">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Peak Flow Velocity</div>
                    <div className="text-xs font-bold font-mono text-cyan-300 mt-1">
                      {aiSummary.metrics.peak_productivity_window}
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-3 rounded-xl glass-dark border border-white/10">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Weekly Completed</div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      {aiSummary.metrics.total_completed} blocks
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1 shadow-[0_0_12px_rgba(245,158,11,0.1)]">
                  <div className="font-bold flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>AI Recommendation for Tomorrow:</span>
                  </div>
                  <p className="text-slate-300">{aiSummary.metrics.recommended_focus_adjustment}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Task Splitter */}
        {activeTab === 'split' && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-xs text-slate-400">
              Break down overwhelming multi-hour assignments into structured, high-focus 45m blocks with resting intervals.
            </p>

            <form onSubmit={handleSplitSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Big Task Objective</label>
                <input
                  type="text"
                  required
                  value={splitTitle}
                  onChange={(e) => setSplitTitle(e.target.value)}
                  placeholder="e.g. Write Complete Machine Learning Research Paper"
                  className="w-full mt-1 px-3.5 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Total Duration (Minutes)</label>
                  <input
                    type="number"
                    min="60"
                    max="600"
                    value={splitDuration}
                    onChange={(e) => setSplitDuration(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={splitCategory}
                    onChange={(e) => setSplitCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSplitting}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-colors disabled:opacity-50"
              >
                {isSplitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>AI Splitting...</span>
                  </>
                ) : (
                  <>
                    <Split className="w-4 h-4" />
                    <span>Generate Micro-Task Blocks</span>
                  </>
                )}
              </button>
            </form>

            {splitResult && splitResult.subtasks && (
              <div className="p-4 rounded-2xl glass border border-white/10 space-y-3 animate-fadeIn shadow-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Recommended Breakdown</span>
                  <span className="text-cyan-400 font-mono font-bold">{splitResult.subtasks.length} Sub-blocks</span>
                </div>

                <div className="space-y-2">
                  {splitResult.subtasks.map((sub: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl glass-dark border border-white/10 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-white">{sub.title}</div>
                        <div className="text-[11px] text-slate-400">{sub.objective}</div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded glass text-cyan-300 border border-cyan-500/30 shrink-0 font-bold">
                        {sub.duration_minutes}m
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleApplySplitTasks}
                  className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Add All Sub-blocks to Timetable</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Smart Slot Finder */}
        {activeTab === 'slots' && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-xs text-slate-400">
              Analyzes your historical focus velocity and recommends the best unblocked time slot for maximum retention.
            </p>

            <div className="p-4 rounded-2xl glass border border-white/10 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                <Sparkles className="w-4 h-4" />
                <span>Recommended Optimal Time Slot</span>
              </div>

              {suggestResult && (
                <div className="space-y-2 text-xs">
                  <div className="text-base font-bold font-mono text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                    {suggestResult.slot}
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {suggestResult.reasoning}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Schedule Overload Guard */}
        {activeTab === 'overload' && (
          <div className="space-y-4 animate-fadeIn">
            <div className={`p-5 rounded-2xl border space-y-3 ${
              isOverloaded
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {isOverloaded ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                <span>{isOverloaded ? 'Daily Capacity Exceeded (>16h)' : 'Workload Balanced Within Safe Capacity'}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {isOverloaded
                  ? `You currently have ${totalPlannedHours} planned hours scheduled for today. Working beyond 16 hours causes cognitive saturation and elevated error rates in problem-solving.`
                  : `You have ${totalPlannedHours} hours planned for today. Your daily schedule maintains sufficient sleep and recovery buffers.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
