/**
 * TimeForge — AuthModal
 * Login / Register in a glassmorphic modal overlay.
 */
import React, { useState } from 'react';
import { authAPI } from '../api/index.ts';

interface Props {
  onClose: () => void;
  onLogin: () => void;
}

export default function AuthModal({ onClose, onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await authAPI.login(form.email, form.password);
        localStorage.setItem('timeforge_token', res.data.token);
        localStorage.setItem('timeforge_user', JSON.stringify(res.data.user));
      } else {
        const res = await authAPI.register(form);
        localStorage.setItem('timeforge_token', res.data.token);
        localStorage.setItem('timeforge_user', JSON.stringify(res.data.user));
      }
      onLogin();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md">
        {/* Background glow */}
        <div className="absolute -inset-4 bg-brand-600/10 rounded-3xl blur-2xl pointer-events-none" />

        <div className="relative glass-card p-8">
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" opacity="0.4" />
                <path d="M12 6 L12 12 L17 12" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">TimeForge</span>
          </div>

          <h2 className="text-lg font-semibold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {mode === 'login' ? 'Sign in to continue tracking' : 'Start crushing your goals'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Alex Johnson"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-sm text-gray-400 hover:text-brand-400 transition-colors"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
