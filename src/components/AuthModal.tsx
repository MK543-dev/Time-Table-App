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
  ArrowRight
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
  initialMode?: 'login' | 'register' | 'profile';
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
  initialMode = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'profile'>(
    currentUser && initialMode === 'profile' ? 'profile' : initialMode
  );

  // Synchronize activeTab with incoming initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'profile' && currentUser) {
        setActiveTab('profile');
      } else {
        setActiveTab(initialMode);
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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailClean = loginEmail.trim().toLowerCase();
    const userFound = registeredUsers.find(
      (u) =>
        u.email.toLowerCase() === emailClean ||
        u.name.toLowerCase() === emailClean ||
        (emailClean.includes('218r1a0543') && u.email.includes('218r1a0543'))
    );

    if (!userFound) {
      setLoginError(`No account found matching "${loginEmail}". Please check your email or click One-Click Preset Accounts below.`);
      return;
    }

    if (userFound.password && loginPassword.trim()) {
      const isExactMatch = userFound.password === loginPassword.trim();
      const isCaseInsensitiveMatch = userFound.password.toLowerCase() === loginPassword.trim().toLowerCase();
      if (!isExactMatch && !isCaseInsensitiveMatch) {
        setLoginError('Incorrect password. Please verify your credentials.');
        return;
      }
    }

    // Login successful
    onLogin(userFound);
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
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

    // Check if email already exists
    const exists = registeredUsers.some(
      (u) => u.email.toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (exists) {
      setRegError('An account with this email address already exists. Please sign in instead.');
      return;
    }

    const newUser: RegisteredAccount = {
      id: `usr_${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      role: regRole,
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
    setRegSuccess('Account created successfully! Logging you in...');
    setTimeout(() => {
      onLogin(newUser);
      onClose();
    }, 800);
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

  const handleFillAdminCredentials = () => {
    setLoginEmail('218r1a0543@gmail.com');
    setLoginPassword('Admin@0543');
    setLoginError(null);
  };

  const handleFillStudentCredentials = () => {
    setLoginEmail('alex.rivera@university.edu');
    setLoginPassword('password123');
    setLoginError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl glass-dark border border-white/10 shadow-2xl p-6 space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              {activeTab === 'profile' ? (
                <UserIcon className="w-5 h-5 text-cyan-400" />
              ) : activeTab === 'register' ? (
                <UserPlus className="w-5 h-5 text-cyan-400" />
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
                  : 'Sign In to TimeForge'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeTab === 'profile'
                  ? 'Manage your personal details, academic major & credentials'
                  : 'Timetable, task progress & academic management platform'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Mode Pill Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl glass border border-white/10 text-xs font-semibold relative z-10">
          <button
            type="button"
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

        {/* TAB 1: SIGN IN */}
        {activeTab === 'login' && (
          <div className="space-y-5 animate-fadeIn relative z-10">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {/* One-Click Quick Login Cards (Always Clickable) */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>One-Click Instant Logins</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Admin Card */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:border-amber-400 transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500 text-black font-mono">
                        ADMIN
                      </span>
                      <button
                        type="button"
                        onClick={handleFillAdminCredentials}
                        className="text-[10px] text-amber-300 hover:underline font-semibold"
                      >
                        Auto-fill form
                      </button>
                    </div>
                    <div className="text-xs font-bold text-white mt-1.5">Institutional Admin</div>
                    <div className="text-[11px] font-mono text-amber-200/80 truncate">
                      218r1a0543@gmail.com
                    </div>
                    <div className="text-[10px] text-slate-400">Pass: Admin@0543</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const adminAcc = registeredUsers.find((u) => u.email === '218r1a0543@gmail.com' || u.role === 'admin');
                      if (adminAcc) {
                        onLogin(adminAcc);
                        onClose();
                      }
                    }}
                    className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                  >
                    <span>Log In as Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Student Card */}
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col justify-between gap-2 shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:border-cyan-400 transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                        STUDENT
                      </span>
                      <button
                        type="button"
                        onClick={handleFillStudentCredentials}
                        className="text-[10px] text-cyan-300 hover:underline font-semibold"
                      >
                        Auto-fill form
                      </button>
                    </div>
                    <div className="text-xs font-bold text-white mt-1.5">Alex Rivera</div>
                    <div className="text-[11px] font-mono text-cyan-200/80 truncate">
                      alex.rivera@university.edu
                    </div>
                    <div className="text-[10px] text-slate-400">Pass: password123</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const studentAcc = registeredUsers.find((u) => u.role === 'user');
                      if (studentAcc) {
                        onLogin(studentAcc);
                        onClose();
                      }
                    }}
                    className="w-full py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                  >
                    <span>Log In as Student</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Or Sign In With Custom Email
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>

            {/* Manual Form */}
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
                  placeholder="e.g. 218r1a0543@gmail.com"
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
                    placeholder="Enter password (e.g. Admin@0543)"
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
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01]"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Account</span>
              </button>
            </form>

            <div className="text-center text-xs text-slate-400">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4"
              >
                Create a new profile
              </button>
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

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Account Role & Access Level</span>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRegRole('user')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    regRole === 'user'
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                      : 'glass border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <GraduationCap className="w-4 h-4 text-cyan-400" />
                    <span>Student / Learner</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Timetables, 3D torus ring, time logs & streak badges
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('admin')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    regRole === 'admin'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'glass border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Faculty / Admin</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Institutional caps, curriculum locks & notices
                  </div>
                </button>
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
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account & Start Learning</span>
            </button>
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

            {/* Quick Switch Registered Accounts */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Switch to Another Account:</span>
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setLoginError(null);
                  }}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  + Sign In Different Account
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {registeredUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id || u.email === currentUser.email;
                  return (
                    <div
                      key={u.id}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                        isCurrent
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-white'
                          : 'glass-dark border-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-6 h-6 rounded-full object-cover border border-white/10"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold truncate text-white block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono truncate block">{u.email}</span>
                        </div>
                        <span className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded ${
                          u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400'
                        }`}>
                          {u.role}
                        </span>
                      </div>

                      {isCurrent ? (
                        <span className="text-[10px] font-bold text-cyan-400 shrink-0">Active</span>
                      ) : (
                        <button
                          onClick={() => {
                            onLogin(u);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg glass text-cyan-300 hover:bg-cyan-500/15 text-[11px] font-semibold border border-cyan-500/20 shrink-0"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

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
