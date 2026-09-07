/**
 * TimeForge — AIAssistantModal
 * One-shot AI helpers: task splitting, weekly summary, slot suggestion.
 */
import React, { useState } from 'react';
import { aiAPI, tasksAPI } from '../api/index.ts';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
}

export default function AIAssistantModal({ onClose }: Props) {
  const [tab, setTab] = useState<'split' | 'summary' | 'suggest'>('split');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Split task
  const [splitTitle, setSplitTitle] = useState('');
  const [splitMinutes, setSplitMinutes] = useState('60');

  // Slot suggestion
  const [slotTitle, setSlotTitle] = useState('');
  const [slotResult, setSlotResult] = useState('');

  // Summary
  const [summaryResult, setSummaryResult] = useState('');

  const handleSplit = async () => {
    if (!splitTitle.trim()) return;
    setLoading(true);
    try {
      const res = await aiAPI.splitTask(splitTitle, parseInt(splitMinutes) || 60);
      setResult(res.data.blocks);
    } catch { toast.error('AI split failed'); }
    finally { setLoading(false); }
  };

  const handleSuggest = async () => {
    if (!slotTitle.trim()) return;
    setLoading(true);
    try {
      const res = await aiAPI.suggestSlot(slotTitle);
      setSlotResult(res.data.suggestion || 'No suggestion available');
    } catch { toast.error('AI suggestion failed'); }
    finally { setLoading(false); }
  };

  const handleAddSplitTasks = async () => {
    if (!result?.length) return;
    try {
      for (const block of result) {
        await tasksAPI.createDefinition({
          title: block.title,
          duration_minutes: block.minutes,
          priority: 'medium',
        });
      }
      toast.success(`${result.length} tasks added!`);
      onClose();
    } catch { toast.error('Failed to add tasks'); }
  };

  const handleSummary = async () => {
    setLoading(true);
    try {
      const histRes = await tasksAPI.historyMatrix('7');
      const records = histRes.data;
      const completed = records.filter((r: any) => r.status === 'perfect').length;
      const total = records.filter((r: any) => r.total > 0).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      setSummaryResult(
        `Over the past 7 days: ${completed}/${total} days with perfect completion. ` +
        `Your completion rate was ${rate}%. ` +
        (rate >= 80 ? 'Excellent work! Keep it up 🎉' : rate >= 50 ? 'Good progress — try to focus on consistency.' : 'Room to grow! Start with smaller, achievable goals.')
      );
    } catch { toast.error('Summary failed'); }
    finally { setLoading(false); }
  };

  const TABS = [
    { id: 'split', label: '🔪 Split Task' },
    { id: 'suggest', label: '💡 Best Time Slot' },
    { id: 'summary', label: '📋 Weekly Summary' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg">
        <div className="absolute -inset-4 bg-brand-600/10 rounded-3xl blur-2xl pointer-events-none" />
        <div className="relative glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">✨ AI Assistant</h2>
            <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-900/50 p-1 rounded-xl w-fit">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id as any); setResult(null); setSlotResult(''); setSummaryResult(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tab === t.id ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Split */}
          {tab === 'split' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Task to split</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Study for final exams"
                  value={splitTitle}
                  onChange={(e) => setSplitTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Total minutes</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="60"
                  value={splitMinutes}
                  onChange={(e) => setSplitMinutes(e.target.value)}
                />
              </div>
              <button onClick={handleSplit} className="btn-primary w-full" disabled={loading}>
                {loading ? 'Splitting…' : 'Split into sub-tasks'}
              </button>

              {result && result.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Suggested sub-tasks:</p>
                  {result.map((block: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-2.5">
                      <span className="text-xs text-gray-500 w-5">{i + 1}.</span>
                      <span className="text-sm text-white flex-1">{block.title}</span>
                      <span className="badge badge-gray text-xs">{block.minutes}m</span>
                    </div>
                  ))}
                  <button onClick={handleAddSplitTasks} className="btn-primary w-full text-sm">
                    Add all to my tasks
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Slot suggestion */}
          {tab === 'suggest' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Task</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Deep work session"
                  value={slotTitle}
                  onChange={(e) => setSlotTitle(e.target.value)}
                />
              </div>
              <button onClick={handleSuggest} className="btn-primary w-full" disabled={loading}>
                {loading ? 'Thinking…' : 'Suggest best time'}
              </button>
              {slotResult && (
                <div className="p-4 rounded-xl bg-brand-600/10 border border-brand-600/20">
                  <p className="text-brand-300 font-medium">{slotResult}</p>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {tab === 'summary' && (
            <div className="space-y-4">
              <button onClick={handleSummary} className="btn-primary w-full" disabled={loading}>
                {loading ? 'Analyzing…' : 'Generate 7-day summary'}
              </button>
              {summaryResult && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-emerald-300">{summaryResult}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
