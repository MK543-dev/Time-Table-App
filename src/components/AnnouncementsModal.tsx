import React from 'react';
import { Bell, X, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
  onMarkAllRead: () => void;
}

export const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({
  isOpen,
  onClose,
  announcements,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl glass-dark border border-white/10 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(34,211,238,0.2)]">
              <Bell className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Institutional Announcements</h3>
              <p className="text-[11px] text-slate-400">Notices, schedule adjustments & exam bulletins</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {announcements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No active announcements</div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-xl border space-y-1.5 text-xs ${
                  ann.severity === 'urgent'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                    : ann.severity === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                    : 'glass-dark border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    {ann.severity === 'urgent' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    ) : ann.severity === 'warning' ? (
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Info className="w-4 h-4 text-cyan-400" />
                    )}
                    <span>{ann.title}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60">{ann.date}</span>
                </div>

                <p className="text-slate-300 leading-relaxed pl-5">{ann.message}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
          <button
            onClick={onMarkAllRead}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            Mark all as read
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl glass hover:bg-white/10 text-slate-200 font-semibold border border-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
