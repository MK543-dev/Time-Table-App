import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { authAPI, type User } from './api/index.ts';
import AuthModal from './components/AuthModal.tsx';
import DailyTasksSection from './components/DailyTasksSection.tsx';
import HistoryMatrix from './components/HistoryMatrix.tsx';
import AIAssistantModal from './components/AIAssistantModal.tsx';
import AgentChatModal from './components/AgentChatModal.tsx';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [streak, setStreak] = useState(0);

  // Check existing session
  useEffect(() => {
    const token = localStorage.getItem('timeforge_token');
    if (!token) {
      setShowAuth(true);
      setLoading(false);
      return;
    }
    authAPI.me()
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('timeforge_token');
        localStorage.removeItem('timeforge_user');
        setShowAuth(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = () => {
    const stored = localStorage.getItem('timeforge_user');
    if (stored) setUser(JSON.parse(stored));
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('timeforge_token');
    localStorage.removeItem('timeforge_user');
    setUser(null);
    setShowAuth(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#e5e7eb',
            border: '1px solid #374151',
            borderRadius: '0.75rem',
          },
        }}
      />

      {/* Auth modal */}
      {showAuth && (
        <AuthModal
          onClose={() => {}}
          onLogin={handleLogin}
        />
      )}

      {/* Main app */}
      {!showAuth && user && (
        <>
          <DailyTasksSection
            user={user}
            onLogout={handleLogout}
            onOpenHistory={() => setShowHistory(true)}
            onOpenAI={() => setShowAI(true)}
            onOpenAgent={() => setShowAgent(true)}
            streak={streak}
            onStreakChange={setStreak}
          />

          {/* History Matrix overlay */}
          {showHistory && (
            <HistoryMatrix onClose={() => setShowHistory(false)} />
          )}

          {/* One-shot AI helpers */}
          {showAI && (
            <AIAssistantModal onClose={() => setShowAI(false)} />
          )}

          {/* Chat-based AI Agent (admin only) */}
          {showAgent && user.role === 'admin' && (
            <AgentChatModal user={user} onClose={() => setShowAgent(false)} />
          )}
        </>
      )}
    </>
  );
}

export default App;
