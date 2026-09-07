/**
 * TimeForge — HistoryMatrix
 * Shows EVERY calendar day in range (newest first), computed from real system date.
 * - 0% completion → "Missed" (rose cell)
 * - No tasks configured → "No tasks" (gray cell)
 * - 100% → "Perfect" (green cell)
 * - Partial → "X%" (amber cell)
 * NO hardcoded dates. NO Yesterday/Day Before shortcut buttons.
 */
import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { tasksAPI, type DayRecord } from '../api/index.ts';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
}

const RANGE_OPTIONS = [
  { label: 'Past 7 Days', value: '7' },
  { label: 'Past 14 Days', value: '14' },
  { label: 'Past 30 Days', value: '30' },
  { label: 'All Time', value: 'all' },
];

function getDateRange(range: string): { from: string; to: string } {
  const today = format(new Date(), 'yyyy-MM-dd');
  switch (range) {
    case '7': return { from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: today };
    case '14': return { from: format(subDays(new Date(), 13), 'yyyy-MM-dd'), to: today };
    case '30': return { from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: today };
    case 'all': return { from: '2000-01-01', to: today };
    default: return { from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: today };
  }
}

function CellContent({ record }: { record: DayRecord }) {
  if (record.status === 'no-tasks') {
    return <span className="text-xs text-gray-600">No tasks</span>;
  }
  if (record.status === 'missed') {
    return (
      <span className="text-xs font-semibold text-rose-400">
        Missed <span className="text-rose-600">0%</span>
      </span>
    );
  }
  if (record.status === 'perfect') {
    return (
      <span className="text-xs font-semibold text-emerald-400">
        Perfect <span className="text-emerald-600">100%</span>
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold text-amber-400">
      {record.completed}/{record.total} <span className="text-amber-600">{record.rate}%</span>
    </span>
  );
}

function RowStyle({ status }: { status: DayRecord['status'] }) {
  switch (status) {
    case 'perfect': return 'border-l-2 border-l-emerald-500';
    case 'partial': return 'border-l-2 border-l-amber-500';
    case 'missed': return 'border-l-2 border-l-rose-500';
    default: return '';
  }
}

export default function HistoryMatrix({ onClose }: Props) {
  const [range, setRange] = useState('30');
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setLoading(true);
    tasksAPI.historyMatrix(range)
      .then((res) => {
        setRecords(res.data);
        // Compute streak from records
        let s = 0;
        for (const r of res.data) {
          if (r.status === 'perfect') s++;
          else break;
        }
        setStreak(s);
      })
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, [range]);

  // Sort newest first
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  const perfectDays = records.filter(r => r.status === 'perfect').length;
  const missedDays = records.filter(r => r.status === 'missed').length;
  const partialDays = records.filter(r => r.status === 'partial').length;
  const noTaskDays = records.filter(r => r.status === 'no-tasks').length;
  const daysWithTasks = records.filter(r => r.total > 0).length;
  const avgRate = daysWithTasks > 0
    ? Math.round(records.filter(r => r.total > 0).reduce((s, r) => s + r.rate, 0) / daysWithTasks)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl mt-8 mb-8">

        {/* Background glow */}
        <div className="absolute -inset-4 bg-brand-600/5 rounded-3xl blur-2xl pointer-events-none" />

        <div className="relative glass-card overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-800 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📊 History Matrix
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Every day — newest first. Zero-completion days shown as "Missed."
              </p>
            </div>
            <button onClick={onClose} className="btn-ghost p-2 rounded-lg flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Summary stats */}
          <div className="px-6 py-4 border-b border-gray-800 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: '🔥 Streak', value: `${streak}d`, color: 'text-orange-400' },
              { label: '✅ Perfect', value: perfectDays, color: 'text-emerald-400' },
              { label: '⚠️ Partial', value: partialDays, color: 'text-amber-400' },
              { label: '❌ Missed', value: missedDays, color: 'text-rose-400' },
              { label: '📈 Avg Rate', value: `${avgRate}%`, color: 'text-brand-400' },
            ].map((stat) => (
              <div key={stat.label} className="text-center glass-card p-3">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Range filter tabs */}
          <div className="px-6 py-3 border-b border-gray-800">
            <div className="flex gap-1 bg-gray-900/50 p-1 rounded-xl w-fit">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    range === opt.value
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Matrix table */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>No history yet. Complete some tasks to see your history here.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50 sticky top-0">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium w-36">Date</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">Day</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">Tasks</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {sorted.map((record) => {
                    const d = new Date(record.date + 'T00:00:00');
                    return (
                      <tr
                        key={record.date}
                        className={`hover:bg-gray-800/30 transition-colors ${RowStyle({ status: record.status })}`}
                      >
                        <td className="px-6 py-3 text-gray-300 font-mono text-xs">
                          {format(d, 'yyyy-MM-dd')}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {format(d, 'EEEE')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {record.total > 0 ? (
                            <span className="text-gray-300 text-xs">
                              {record.completed}/{record.total}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <CellContent record={record} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
