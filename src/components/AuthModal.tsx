import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Lock,
  Mail,
  Building,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  KeyRound,
  Layers,
  Edit3,
  Save,
  ArrowRight,
  Clock,
  Calendar,
  Zap,
  Check,
  Shield,
  BookOpen
} from 'lucide-react';
import { User, UserRole } from '../types';

export interface RegisteredAccount extends User {
  password?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  registeredUsers: RegisteredAccount[];
  onLogin: (user: User) => void;
  onRegister: (newUser: RegisteredAccount) => void;
  onLogout: () => void;
  onUpdateProfile?: (updatedUser: User) => void;
  initialMode?: 'landing' | 'login' | 'register' | 'profile';
  isBlockingGate?: boolean;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  registeredUsers,
  onLogin,
  onRegister,
  onLogout,
  onUpdateProfile,
  initialMode = 'landing',
  isBlockingGate = false,
}) => {
  const [activeTab, setActiveTab] = useState<'landing' | 'login' | 'register' | 'profile'>(
    currentUser
      ? initialMode === 'profile'
        ? 'profile'
        : initialMode === 'landing'
        ? 'login'
        : initialMode
      : initialMode || 'landing'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize activeTab with incoming initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setActiveTab(initialMode === 'profile' ? 'profile' : initialMode === 'landing' ? 'login' : initialMode);
      } else {
        setActiveTab(initialMode || 'landing');
      }
      setLoginError(null);
      setRegError(null);
      setRegSuccess(null);
      setProfileEditMode(false);
    }
  }, [isOpen, initialMode, currentUser]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('user');
  const [regDepartment, setRegDepartment] = useState('Computer Science & Engineering');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Profile Edit State
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // When opening profile, populate edit fields
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditEmail(currentUser.email);
      setEditDepartment(currentUser.department || 'General Studies');
      setEditAvatar(currentUser.avatar);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    const emailClean = loginEmail.trim().toLowerCase();

    // 1. Authenticate with backend server
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailClean, password: loginPassword.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        if (data.token) {
          localStorage.setItem('timeforge_session_token', data.token);
        }
        localStorage.setItem('timeforge_user', JSON.stringify(data.user));
        onLogin(data.user);
        onClose();
        setIsSubmitting(false);
        return;
      }
      if (data?.error) {
        setLoginError(data.error);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn('Backend login connection error, checking local store:', err);
    }

    // 2. Fallback check in registered users list
    const userFound = registeredUsers.find(
      (u) =>
        u.email.toLowerCase() === emailClean ||
        u.name.toLowerCase() === emailClean
    );

    if (!userFound) {
      setLoginError(`Invalid email or password. Please check your credentials.`);
      setIsSubmitting(false);
      return;
    }

    if (userFound.password && loginPassword.trim()) {
      const isExactMatch = userFound.password === loginPassword.trim();
      if (!isExactMatch) {
        setLoginError('Invalid email or password. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }
    }

    // Login successful via fallback
    localStorage.setItem('timeforge_user', JSON.stringify(userFound));
    onLogin(userFound);
    onClose();
    setIsSubmitting(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    // Strict Admin Access Control: Only 218r1a0543@gmail.com is ever granted admin role
    const isMasterAdminEmail = regEmail.trim().toLowerCase() === '218r1a0543@gmail.com';
    const finalRole: UserRole = isMasterAdminEmail ? 'admin' : 'user';

    // 1. Register with backend server (seeds 12 routine tasks atomically on server)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          role: finalRole,
          department: regDepartment.trim() || 'General Studies',
          avatar: selectedAvatar,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        if (data.token) {
          localStorage.setItem('timeforge_session_token', data.token);
        }
        localStorage.setItem('timeforge_user', JSON.stringify(data.user));
        onRegister(data.user);
        setRegSuccess('Account created successfully! Logging you in...');
        setTimeout(() => {
          onLogin(data.user);
          onClose();
          setIsSubmitting(false);
        }, 600);
        return;
      }
      if (data?.error) {
        setRegError(data.error);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn('Backend register error, using local fallback:', err);
    }

    // 2. Check if email already exists locally
    const exists = registeredUsers.some(
      (u) => u.email.toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (exists) {
      setRegError('An account with this email address already exists. Please sign in instead.');
      setIsSubmitting(false);
      return;
    }

    const newUser: RegisteredAccount = {
      id: isMasterAdminEmail ? 'usr_admin' : `usr_${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      role: finalRole,
      theme_pref: 'glass',
      streak_count: 0,
      longest_streak: 0,
      xp: 0,
      level: 1,
      avatar: selectedAvatar,
      department: regDepartment.trim() || 'General Studies',
      last_active_date: new Date().toISOString().split('T')[0],
    };

    onRegister(newUser);
    localStorage.setItem('timeforge_user', JSON.stringify(newUser));
    setRegSuccess('Account created successfully! Logging you in...');
    setTimeout(() => {
      onLogin(newUser);
      onClose();
      setIsSubmitting(false);
    }, 600);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updated: User = {
      ...currentUser,
      name: editName.trim() || currentUser.name,
      email: editEmail.trim() || currentUser.email,
      department: editDepartment.trim() || currentUser.department,
      avatar: editAvatar || currentUser.avatar,
    };

    if (onUpdateProfile) {
      onUpdateProfile(updated);
    } else {
      onLogin(updated);
    }

    setProfileSuccess('Profile updated successfully!');
    setProfileEditMode(false);
    setTimeout(() => setProfileSuccess(null), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBlockingGate) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${
          activeTab === 'landing' ? 'max-w-2xl' : 'max-w-lg'
        } rounded-3xl glass-dark border border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 relative overflow-hidden max-h-[92vh] overflow-y-auto transition-all duration-300`}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-28 bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              {activeTab === 'profile' ? (
                <UserIcon className="w-5 h-5 text-cyan-400" />
              ) : activeTab === 'register' ? (
                <UserPlus className="w-5 h-5 text-cyan-400" />
              ) : activeTab === 'landing' ? (
                <Sparkles className="w-5 h-5 text-cyan-400" />
              ) : (
                <LogIn className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {activeTab === 'profile'
                  ? 'My Account Profile'
                  : activeTab === 'register'
                  ? 'Create New Account'
                  : activeTab === 'landing'
                  ? 'Welcome to TimeForge'
                  : 'Sign In to TimeForge'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeTab === 'profile'
                  ? 'Manage your personal details, academic major & credentials'
                  : activeTab === 'landing'
                  ? 'Intelligent Academic Timetable & Routine Operating System'
                  : activeTab === 'register'
                  ? 'Join TimeForge with an isolated, private student workspace'
                  : 'Sign in to access your synchronized routine and classes'}
              </p>
            </div>
          </div>

          {!isBlockingGate ? (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <div className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Auth Gate</span>
            </div>
          )}
        </div>

        {/* Navigation Mode Pill Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl glass border border-white/10 text-xs font-semibold relative z-10">
          {!currentUser && (
            <button
              type="button"
              id="auth-tab-landing-btn"
              onClick={() => {
                setActiveTab('landing');
                setLoginError(null);
                setRegError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'landing'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
          )}

          <button
            type="button"
            id="auth-tab-login-btn"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            id="auth-tab-register-btn"
            onClick={() => {
              setActiveTab('register');
              setRegError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>

          {currentUser && (
            <button
              type="button"
              id="auth-tab-profile-btn"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>My Profile</span>
            </button>
          )}
        </div>

        {/* TAB 0: PUBLIC LANDING VIEW (Served strictly when user is logged out) */}
        {activeTab === 'landing' && !currentUser && (
          <div className="space-y-5 animate-fadeIn relative z-10">
            {/* Brand Hero & Value Proposition Header */}
            <div className="text-center space-y-2.5 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] sm:text-[11px] font-mono font-semibold text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>INTELLIGENT ACADEMIC & ROUTINE OS</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                Master Your Daily Routine. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
                  Elevate Your Academic Edge.
                </span>
              </h1>

              <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                TimeForge is the centralized workspace engineered for students, researchers, and faculty to synchronize daily habits, academic timetables, and productivity streaks with zero distractions.
              </p>
            </div>

            {/* Core Value Proposition Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Value Prop 1 */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all space-y-1.5 group">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  12 Pre-Seeded Routine Habits
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Start day one with a battle-tested daily schedule — morning workout, deep learning blocks, review sessions, and restorative sleep.
                </p>
              </div>

              {/* Value Prop 2 */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all space-y-1.5 group">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Dynamic Class Timetable
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Interactive schedule matrix with subject codes, classroom locations, professor assignments, and live period countdowns.
                </p>
              </div>

              {/* Value Prop 3 */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all space-y-1.5 group">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  Dual-Tier AI Copilot
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Intelligent agent to parse syllabi, balance study workloads, log deep work sessions, and keep your consistency streak alive.
                </p>
              </div>

              {/* Value Prop 4 */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all space-y-1.5 group">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Zero-Leak Tenant Isolation
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Strict isolation for every student. Zero guest visibility into personal tasks, routine logs, streak records, or private containers.
                </p>
              </div>
            </div>

            {/* Platform Feature Badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-1 text-[11px] text-slate-400 border-y border-white/5">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-cyan-400" /> Free Student Vault
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-cyan-400" /> 12 Pre-Configured Tasks
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-cyan-400" /> Zero Guest Leakage
              </span>
            </div>

            {/* Required Entry Points (Dual Action Buttons) */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                id="landing-register-cta"
                onClick={() => {
                  setActiveTab('register');
                  setRegError(null);
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Student Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                id="landing-login-cta"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError(null);
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl glass hover:bg-white/10 text-white text-xs font-semibold border border-white/15 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <LogIn className="w-4 h-4 text-cyan-400" />
                <span>Sign In to Account</span>
              </button>
            </div>

            {/* Institutional Administrator Callout */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-200 truncate">Institutional Administrator or Faculty?</p>
                  <p className="text-[11px] text-slate-400 truncate">Log in for administrative locks, timetable authoring & full AI tools.</p>
                </div>
              </div>
              <button
                type="button"
                id="landing-admin-login-cta"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-colors shrink-0"
              >
                Admin Sign In
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {activeTab === 'login' && (
          <div className="space-y-5 animate-fadeIn relative z-10">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Standard Sign In Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Email or Username</span>
                </label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@university.edu or your email"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-dark border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl glass-dark border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Account'}</span>
              </button>
            </form>

            <div className="text-center text-xs text-slate-400 space-y-2 pt-1 border-t border-white/5">
              <div>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  id="login-switch-to-register-btn"
                  onClick={() => setActiveTab('register')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4"
                >
                  Create student profile
                </button>
              </div>
              {!currentUser && (
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('landing')}
                    className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
                  >
                    <span>← Return to TimeForge Overview</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fadeIn relative z-10">
            {regError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{regSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  className="w-full px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Confirm Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Role & Access Notice */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Account Role & Access Level</span>
              </label>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">Student / Learner Workspace</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                      Standard
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    New accounts are created as isolated student workspaces with 12 pre-seeded routine habits, personal schedule, and streak tracking. Administrative access is restricted exclusively to the institutional administrator (<span className="text-cyan-300 font-mono">218r1a0543@gmail.com</span>).
                  </p>
                </div>
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-400" />
                <span>Department / Academic Track</span>
              </label>
              <input
                type="text"
                value={regDepartment}
                onChange={(e) => setRegDepartment(e.target.value)}
                placeholder="e.g. Computer Science / Robotics"
                className="w-full px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Avatar Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Choose Profile Avatar</label>
              <div className="flex items-center gap-2">
                {PRESET_AVATARS.map((avatarUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(avatarUrl)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform ${
                      selectedAvatar === avatarUrl
                        ? 'border-cyan-400 scale-110 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              id="register-submit-btn"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Creating Account & Seeding Tasks...' : 'Create Account & Start Learning'}</span>
            </button>

            <div className="text-center text-xs text-slate-400 space-y-2 pt-1 border-t border-white/5">
              <div>
                Already have an account?{' '}
                <button
                  type="button"
                  id="register-switch-to-login-btn"
                  onClick={() => setActiveTab('login')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4"
                >
                  Sign in here
                </button>
              </div>
              {!currentUser && (
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('landing')}
                    className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
                  >
                    <span>← Return to TimeForge Overview</span>
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {/* TAB 3: CURRENT PROFILE VIEW & EDIT */}
        {activeTab === 'profile' && currentUser && (
          <div className="space-y-5 animate-fadeIn relative z-10">
            {profileSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {/* Edit Mode vs View Mode */}
            {profileEditMode ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 p-4 rounded-2xl glass border border-white/10">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Edit Profile Details</span>
                  <button
                    type="button"
                    onClick={() => setProfileEditMode(false)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Display Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Department / Major</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-dark border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">Change Avatar</label>
                  <div className="flex items-center gap-2">
                    {PRESET_AVATARS.map((avatarUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditAvatar(avatarUrl)}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-transform ${
                          editAvatar === avatarUrl
                            ? 'border-cyan-400 scale-110 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Updates</span>
                </button>
              </form>
            ) : (
              /* Active User Profile Card */
              <div className="p-5 rounded-2xl glass border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl border-2 border-cyan-400/50 overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.3)] shrink-0">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{currentUser.name}</h3>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                          currentUser.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        }`}
                      >
                        {currentUser.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">{currentUser.email}</p>
                    {currentUser.department && (
                      <div className="text-[11px] text-cyan-400/90 font-mono truncate">
                        📍 {currentUser.department}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setProfileEditMode(true)}
                    className="p-2 rounded-xl glass hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>

                {/* Progress & Gamification Stat Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                  <div className="p-2.5 rounded-xl glass-dark border border-white/5 relative group">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Current Streak</div>
                    <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                      🔥 {currentUser.streak_count} {currentUser.streak_count === 1 ? 'Day' : 'Days'}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {currentUser.streak_count === 0 ? 'Starts from zero' : `Longest: ${currentUser.longest_streak}d`}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl glass-dark border border-white/5">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Experience</div>
                    <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
                      ⚡ {currentUser.xp} XP
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      Progress
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl glass-dark border border-white/5">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Mastery Level</div>
                    <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                      Lv. {currentUser.level}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      Rank
                    </div>
                  </div>
                </div>

                {/* Streak Reset Action */}
                <div className="flex items-center justify-between p-2.5 rounded-xl glass-dark border border-white/5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-300">Streak Engine:</span>
                    <span className="text-slate-400 ml-1">Starts at 0. Resets to 0 if a day is missed.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateProfile) {
                        onUpdateProfile({
                          ...currentUser,
                          streak_count: 0,
                        });
                        setProfileSuccess('Streak successfully reset to 0.');
                        setTimeout(() => setProfileSuccess(null), 2500);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg glass text-amber-400 hover:bg-amber-500/15 border border-amber-500/30 text-[11px] font-semibold shrink-0"
                  >
                    Reset Streak to 0
                  </button>
                </div>
              </div>
            )}

            {/* Logout and Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
