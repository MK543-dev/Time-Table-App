import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
  Plus,
  Trash2
} from 'lucide-react';
import { ClassPeriod, ExamCountdown, CategoryDef } from '../types';

interface RotatingTimetableProps {
  periods: ClassPeriod[];
  exams: ExamCountdown[];
  categories: CategoryDef[];
  currentCycle: 'A' | 'B';
  onAddPeriod: (period: Partial<ClassPeriod>) => void;
  onDeletePeriod: (periodId: string) => void;
  onAddExam: (exam: Partial<ExamCountdown>) => void;
  onDeleteExam: (examId: string) => void;
  onImportSyllabus: (syllabusText: string) => Promise<boolean>;
}

export const RotatingTimetable: React.FC<RotatingTimetableProps> = ({
  periods,
  exams,
  categories,
  currentCycle,
  onAddPeriod,
  onDeletePeriod,
  onAddExam,
  onDeleteExam,
  onImportSyllabus,
}) => {
  const [selectedCycleView, setSelectedCycleView] = useState<'A' | 'B' | 'all'>('all');
  const [isAddingPeriod, setIsAddingPeriod] = useState(false);
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [syllabusInput, setSyllabusInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Period form
  const [periodName, setPeriodName] = useState('');
  const [periodStart, setPeriodStart] = useState('09:00');
  const [periodEnd, setPeriodEnd] = useState('10:30');
  const [periodDayType, setPeriodDayType] = useState<'all' | 'A' | 'B'>('all');
  const [periodCategory, setPeriodCategory] = useState(categories[0]?.name || 'Database Systems (DBMS)');
  const [periodRoom, setPeriodRoom] = useState('Hall B-201');

  // Exam form
  const [examSubject, setExamSubject] = useState(categories[0]?.name || 'Database Systems (DBMS)');
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('2026-09-25');
  const [examTime, setExamTime] = useState('09:00');
  const [examWeight, setExamWeight] = useState(30);
  const [examRoom, setExamRoom] = useState('Auditorium A');
  const [examTopicsInput, setExamTopicsInput] = useState('');

  // Filter periods
  const visiblePeriods = periods.filter((p) => {
    if (selectedCycleView === 'all') return true;
    return p.day_type === 'all' || p.day_type === selectedCycleView;
  });

  const getDaysUntil = (dateStr: string) => {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handlePeriodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodName.trim()) return;

    onAddPeriod({
      name: periodName,
      start_time: periodStart,
      end_time: periodEnd,
      day_type: periodDayType,
      default_category: periodCategory,
      room: periodRoom,
    });

    setIsAddingPeriod(false);
    setPeriodName('');
  };

  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) return;

    const topics = examTopicsInput.split(',').map((t) => t.trim()).filter(Boolean);
    onAddExam({
      subject: examSubject,
      title: examTitle,
      date: examDate,
      time: examTime,
      weight_percent: examWeight,
      room: examRoom,
      topics: topics.length > 0 ? topics : ['Core Syllabus Review'],
    });

    setIsAddingExam(false);
    setExamTitle('');
    setExamTopicsInput('');
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusInput.trim()) return;

    setIsImporting(true);
    setImportStatus(null);

    const success = await onImportSyllabus(syllabusInput);
    setIsImporting(false);
    if (success) {
      setImportStatus('✅ Successfully parsed syllabus and populated timetable periods!');
      setTimeout(() => {
        setIsImportModalOpen(false);
        setSyllabusInput('');
        setImportStatus(null);
      }, 2000);
    } else {
      setImportStatus('⚠️ Failed to parse syllabus text. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-6 rounded-2xl glass shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Rotating Timetable & Exam Milestones</h2>
          </div>
          <p className="text-xs text-slate-400">
            A/B Day rotating block schedules, academic lecture periods, and midterm countdowns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Syllabus AI Importer Button */}
          <button
            id="import-syllabus-btn"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass hover:bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Syllabus Importer</span>
          </button>

          <button
            onClick={() => setIsAddingPeriod(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-lg shadow-cyan-500/25 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Period</span>
          </button>
        </div>
      </div>

      {/* Cycle Selector & Active Rotation Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass border border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Current Institutional Day: Block {currentCycle}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl glass-dark border border-white/10 text-xs">
          <button
            onClick={() => setSelectedCycleView('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedCycleView === 'all' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Periods
          </button>
          <button
            onClick={() => setSelectedCycleView('A')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedCycleView === 'A' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Block A Only
          </button>
          <button
            onClick={() => setSelectedCycleView('B')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedCycleView === 'B' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Block B Only
          </button>
        </div>
      </div>

      {/* Timetable Period Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visiblePeriods.map((period) => (
          <div
            key={period.id}
            className="p-5 rounded-2xl glass-dark border-l-4 border-l-cyan-500 border-t border-r border-b border-white/5 flex flex-col justify-between space-y-3 hover:border-r-white/20 transition-all shadow-md group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  {period.start_time} - {period.end_time}
                </span>
                <h4 className="text-sm font-bold text-white">{period.name}</h4>
              </div>

              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                  period.day_type === 'A'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    : period.day_type === 'B'
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {period.day_type === 'all' ? 'Every Day' : `Block ${period.day_type}`}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span>Subject / Track:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                  {period.default_category}
                </span>
              </div>
              {period.room && (
                <div className="flex items-center justify-between">
                  <span>Location:</span>
                  <span className="font-mono text-slate-300">{period.room}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => onDeletePeriod(period.id)}
                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove period template"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Exams & Milestone Countdown Section */}
      <div className="p-6 rounded-2xl glass space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Exam & Assessment Countdowns</span>
            </h3>
            <p className="text-xs text-slate-400">
              Target revision milestones with automated weight calculations and topic checklists
            </p>
          </div>

          <button
            onClick={() => setIsAddingExam(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Exam / Milestone</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {exams.map((exam) => {
            const daysLeft = getDaysUntil(exam.date);
            const isUrgent = daysLeft <= 14;

            return (
              <div
                key={exam.id}
                className="p-5 rounded-2xl glass-dark border border-white/10 flex flex-col justify-between space-y-4 hover:border-cyan-500/30 transition-all shadow-md group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-400 truncate max-w-[160px]">
                      {exam.subject}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                      {exam.weight_percent}% of Grade
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{exam.title}</h4>

                  {/* Countdown Badge */}
                  <div
                    className={`flex items-center gap-2 p-2.5 rounded-xl font-mono text-xs font-bold border ${
                      isUrgent
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.1)]'
                    }`}
                  >
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      {daysLeft > 0 ? `${daysLeft} Days Remaining` : daysLeft === 0 ? 'Exam is Today!' : 'Completed'}
                    </span>
                  </div>
                </div>

                {/* Topics Tag List */}
                <div className="space-y-2 text-xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Core Topics:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {exam.topics.map((tp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-lg glass border border-white/5 text-slate-300"
                      >
                        {tp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                  <span>📍 {exam.room}</span>
                  <button
                    onClick={() => onDeleteExam(exam.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Syllabus Importer Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-dark border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>AI Syllabus & Schedule Importer</span>
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-xs text-slate-400 hover:text-white">
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste course syllabus text or lecture schedules. Gemini will extract class periods and exam countdowns automatically!
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <textarea
                rows={6}
                required
                value={syllabusInput}
                onChange={(e) => setSyllabusInput(e.target.value)}
                placeholder="Example:
Course: CS301 Database Systems
Lectures: Mon/Wed 09:00 - 10:30 in Hall B-201
Midterm 1: 2026-09-20 at 10:00 AM (30% weight) covering Indexing & Transactions..."
                className="w-full p-3.5 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
              />

              {importStatus && (
                <div className="text-xs text-cyan-300 font-medium">{importStatus}</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl glass text-slate-300 text-xs font-semibold hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !syllabusInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 text-black text-xs font-bold shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Parsing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Extract & Populate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Period Modal */}
      {isAddingPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl glass-dark border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Add Class Period Block</span>
              </h3>
              <button onClick={() => setIsAddingPeriod(false)} className="text-xs text-slate-400 hover:text-white">
                Cancel
              </button>
            </div>

            <form onSubmit={handlePeriodSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Period Name</label>
                <input
                  type="text"
                  required
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  placeholder="e.g. Period 5: Distributed Systems Lab"
                  className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Start Time</label>
                  <input
                    type="time"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">End Time</label>
                  <input
                    type="time"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Rotation Cycle</label>
                  <select
                    value={periodDayType}
                    onChange={(e) => setPeriodDayType(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="all" className="bg-slate-900 text-slate-200">Every Day</option>
                    <option value="A" className="bg-slate-900 text-slate-200">Block A Only</option>
                    <option value="B" className="bg-slate-900 text-slate-200">Block B Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Room / Hall</label>
                  <input
                    type="text"
                    value={periodRoom}
                    onChange={(e) => setPeriodRoom(e.target.value)}
                    placeholder="e.g. Lab 4B"
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Subject Category</label>
                <select
                  value={periodCategory}
                  onChange={(e) => setPeriodCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddingPeriod(false)}
                  className="px-3.5 py-1.5 rounded-xl glass text-slate-300 text-xs font-semibold hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 text-black text-xs font-bold shadow-lg shadow-cyan-500/25 hover:bg-cyan-400"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {isAddingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl glass-dark border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Add Exam / Milestone Countdown</span>
              </h3>
              <button onClick={() => setIsAddingExam(false)} className="text-xs text-slate-400 hover:text-white">
                Cancel
              </button>
            </div>

            <form onSubmit={handleExamSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Exam Title</label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. Midterm 2 Theory & Benchmark"
                  className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Date</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Time</label>
                  <input
                    type="time"
                    required
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Grade Weight (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={examWeight}
                    onChange={(e) => setExamWeight(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Exam Room</label>
                  <input
                    type="text"
                    value={examRoom}
                    onChange={(e) => setExamRoom(e.target.value)}
                    placeholder="e.g. Auditorium A"
                    className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Topics (comma-separated)</label>
                <input
                  type="text"
                  value={examTopicsInput}
                  onChange={(e) => setExamTopicsInput(e.target.value)}
                  placeholder="B+ Trees, Dynamic Programming, ACID"
                  className="w-full mt-1 px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddingExam(false)}
                  className="px-3.5 py-1.5 rounded-xl glass text-slate-300 text-xs font-semibold hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 text-black text-xs font-bold shadow-lg shadow-cyan-500/25 hover:bg-cyan-400"
                >
                  Save Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
