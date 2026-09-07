import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Terminal,
  User as UserIcon,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Flame,
  Shield,
  Zap,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import Markdown from 'react-markdown';
import { User } from '../types';

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolResults?: Array<{
    tool: string;
    result?: any;
    error?: string;
  }>;
  requiresConfirmation?: boolean;
  pendingAction?: any;
  timestamp: string;
}

interface AgentChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onStateModified?: () => void;
}

export const AgentChatModal: React.FC<AgentChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onStateModified,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [role, setRole] = useState<'developer' | 'user'>(() => {
    return currentUser?.role === 'admin' ? 'developer' : 'user';
  });

  useEffect(() => {
    setRole(currentUser?.role === 'admin' ? 'developer' : 'user');
  }, [currentUser?.role]);

  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        currentUser?.role === 'admin'
          ? "👋 **Developer AI Agent Online.** You have full administrative control. I can create, edit, or delete daily routine tasks, adjust dates, modify streaks, batch-complete routines, or inspect raw state. What would you like me to do?"
          : "👋 **Hello! I'm your TimeForge AI Assistant.** I can help you plan your routine, log task progress, check your current streak, and stay motivated. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    action: any;
    prompt: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      scrollToBottom();
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleRoleToggle = (newRole: 'developer' | 'user') => {
    setRole(newRole);
    setMessages((prev) => [
      ...prev,
      {
        id: `role-switch-${Date.now()}`,
        role: 'assistant',
        content:
          newRole === 'developer'
            ? "🛡️ **Switched to Developer Mode.** Full access unlocked: you can add/delete tasks, update streaks, toggle completions across any calendar date, and modify daily system state."
            : "👤 **Switched to User Mode.** Ready to assist with schedule recommendations, routine tracking, and daily productivity guidance.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const sendMessage = async (customPrompt?: string, confirmAction = false) => {
    const textToSend = customPrompt || inputMessage.trim();
    if (!textToSend && !confirmAction) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: AgentChatMessage = {
      id: userMsgId,
      role: 'user',
      content: confirmAction ? `[Confirmed Action: ${pendingConfirmation?.prompt || 'Proceed'}]` : textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setIsLoading(true);

    const confirmationPayload = confirmAction;
    const actionToConfirm = pendingConfirmation;
    setPendingConfirmation(null);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== 'init-1')
        .slice(-8)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/ai/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          role,
          userId: currentUser?.id || 'usr_1',
          user_id: currentUser?.id || 'usr_1',
          userEmail: currentUser?.email || '218r1a0543@gmail.com',
          confirm: confirmationPayload,
          confirmed_action: confirmationPayload ? actionToConfirm?.action : undefined,
          pending_action: confirmationPayload ? actionToConfirm?.action : undefined,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const replyContent = data.reply || data.message || 'Task processed successfully.';
      const toolResultsList = data.toolResults || (data.actions_taken?.map((a: any) => ({
        tool: a.tool_name,
        result: a.summary || (typeof a.data === 'string' ? a.data : JSON.stringify(a.data)),
        error: a.status === 'failed' ? (typeof a.data === 'string' ? a.data : 'Action failed') : undefined,
      }))) || [];

      const assistantMsg: AgentChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        toolResults: toolResultsList.length > 0 ? toolResultsList : undefined,
        requiresConfirmation: Boolean(data.requiresConfirmation || data.requires_confirmation),
        pendingAction: data.pendingAction || data.requires_confirmation?.payload || data.requires_confirmation?.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if ((data.requiresConfirmation || data.requires_confirmation)) {
        setPendingConfirmation({
          action: data.pendingAction || data.requires_confirmation?.action || data.requires_confirmation?.payload,
          prompt: textToSend,
        });
      }

      // Notify parent & dispatch custom events so all UI sections update immediately
      if (data.streak !== undefined) {
        window.dispatchEvent(new CustomEvent('timeforge-streak-updated', { detail: { streak: data.streak } }));
      }
      window.dispatchEvent(new Event('timeforge-state-updated'));
      onStateModified?.();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Failed to execute request: ${err.message || 'Network error'}. Please verify your connection or try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPromptsDeveloper = [
    { label: 'Add Deep Work Task', prompt: 'Add a new daily task called "Deep Work & Architecture" for 45 mins with category "Engineering"' },
    { label: 'Set Streak to 5', prompt: 'Set my streak to 5 consecutive days' },
    { label: 'Mark Today 100%', prompt: 'Mark all daily tasks as completed for today' },
    { label: 'Check Routine Status', prompt: 'List all current daily tasks and report their completion status for today' },
    { label: 'Reset Streak to 0', prompt: 'Reset my streak to 0' },
  ];

  const quickPromptsUser = [
    { label: 'How is my streak?', prompt: 'What is my current streak and what do I need to maintain it?' },
    { label: 'Focus Routine Advice', prompt: 'Suggest an optimized order to complete my remaining tasks today.' },
    { label: 'Mark First Task Done', prompt: 'Mark the first pending daily task for today as completed' },
    { label: 'Daily Motivation', prompt: 'Give me a brief boost of motivation to stay disciplined with my routine today!' },
  ];

  const activeQuickPrompts = role === 'developer' ? quickPromptsDeveloper : quickPromptsUser;

  return (
    <div
      id="agent-chat-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="agent-chat-modal-window"
        className="relative w-full max-w-2xl h-[85vh] max-h-[750px] flex flex-col rounded-2xl glass-dark border border-white/15 shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
              role === 'developer'
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
            }`}>
              {role === 'developer' ? <Terminal className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">TimeForge AI Agent</h3>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                  role === 'developer'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  {role === 'developer' ? 'Developer / Full Access' : 'User Assistant'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {role === 'developer'
                  ? 'Total access: add/modify tasks, streaks, dates, completions'
                  : 'Productivity companion & schedule assistant'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Role Switcher Pill - Only visible and toggleable for Admin / Developer */}
            {isAdmin && (
              <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10">
                <button
                  type="button"
                  id="agent-role-user-btn"
                  onClick={() => handleRoleToggle('user')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    role === 'user'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to User Mode"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>User</span>
                </button>
                <button
                  type="button"
                  id="agent-role-dev-btn"
                  onClick={() => handleRoleToggle('developer')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    role === 'developer'
                      ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to Developer Mode with Full Administrative Access"
                >
                  <Terminal className="w-3.5 h-3.5 text-purple-400" />
                  <span>Developer</span>
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              id="close-agent-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border text-xs font-bold ${
                    role === 'developer'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}>
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-cyan-600/90 text-white rounded-tr-none'
                      : 'glass-dark border border-white/10 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="markdown-body prose prose-invert max-w-none text-xs">
                    <Markdown>{msg.content}</Markdown>
                  </div>

                  {/* Tool Execution Badges */}
                  {msg.toolResults && msg.toolResults.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5 font-mono text-[11px]">
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span>Actions Executed by Agent:</span>
                      </div>
                      {msg.toolResults.map((tr, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] ${
                            tr.error
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          {tr.error ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span className="font-bold">{tr.tool}:</span>
                          <span className="truncate">
                            {tr.error || JSON.stringify(tr.result)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400/70 text-right mt-1.5 font-mono">
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-slate-800 border border-white/20 text-cyan-400 text-xs font-bold">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Pending Confirmation Alert Box */}
          {pendingConfirmation && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-200 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Confirmation Required for Destructive Action</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                The agent requested to execute: <span className="font-mono text-amber-200">{JSON.stringify(pendingConfirmation.action)}</span>. Do you confirm execution?
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => sendMessage(undefined, true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-sm"
                >
                  Yes, Execute Action
                </button>
                <button
                  type="button"
                  onClick={() => setPendingConfirmation(null)}
                  className="px-3 py-1.5 rounded-lg glass text-slate-300 hover:text-white text-xs border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs italic animate-pulse">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-500/20 border border-purple-500/30 text-purple-300">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <span>Agent is thinking and processing tools...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Quick:</span>
          {activeQuickPrompts.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => sendMessage(chip.prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium glass hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-slate-950/80 border-t border-white/10 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                id="agent-chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  role === 'developer'
                    ? 'Give developer task (e.g. "add daily task Gym 30m", "set streak to 5", "delete task X")...'
                    : 'Ask assistant anything (e.g. "how is my streak?", "suggest a focus schedule")...'
                }
                disabled={isLoading}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl glass-dark border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              id="agent-chat-send-btn"
              disabled={isLoading || !inputMessage.trim()}
              className={`p-2.5 rounded-xl font-bold transition-all shrink-0 ${
                role === 'developer'
                  ? 'bg-purple-500 hover:bg-purple-400 text-black shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_12px_rgba(34,211,238,0.3)]'
              } disabled:opacity-40 disabled:hover:bg-cyan-500`}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
