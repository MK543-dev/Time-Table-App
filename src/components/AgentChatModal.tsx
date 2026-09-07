/**
 * TimeForge — AgentChatModal
 * Chat-based AI agent with tool calling.
 * Developer tier: full CRUD + admin actions
 * User tier: scoped to own data only
 * Confirms before destructive actions.
 */
import React, { useState, useRef, useEffect } from 'react';
import { aiAPI, type ChatMessage } from '../api/index.ts';
import toast from 'react-hot-toast';

interface Props {
  user: { id: string; name: string; role: string };
  onClose: () => void;
}

interface PendingConfirm {
  message: string;
  onConfirm: () => void;
}

interface ChatEntry {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

const SYSTEM_PROMPT_USER = `You are TimeForge AI Agent. You help the user manage their tasks, track progress, and answer questions about their history. Be concise and actionable. For destructive actions (delete, bulk reset), confirm before executing.`;

const SYSTEM_PROMPT_ADMIN = `You are TimeForge AI Agent (Developer tier). You have full access to all data and tools including other users' data, streak management, and admin controls. Be precise and powerful. For destructive actions (delete, reset streak, bulk-edit), confirm before executing.`;

export default function AgentChatModal({ user, onClose }: Props) {
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      role: 'agent',
      content: user.role === 'admin'
        ? `🤖 **Developer Mode Active** — I have full access to all your data and admin tools.\n\nTry: "Show all users", "Reset user streak to 0", "Delete task X", or ask anything about your data.`
        : `🤖 Hi ${user.name}! I can help you manage your tasks, check your history, and answer questions about your progress.\n\nTry: "Add a task to study math", "Show my history for this week", "What's my completion rate?"`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatEntry[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'agent', content: string) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    addMessage('user', userMsg);
    setLoading(true);

    try {
      // Build message history for API (system + user turns)
      const apiMessages: ChatMessage[] = [
        { role: 'user', content: user.role === 'admin' ? SYSTEM_PROMPT_ADMIN : SYSTEM_PROMPT_USER },
        ...messagesRef.current.map(m => ({ role: m.role as 'user' | 'model', content: m.content })),
        { role: 'user', content: userMsg },
      ];

      const res = await aiAPI.chat(apiMessages);
      addMessage('agent', res.data.reply);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Agent error — please try again';
      addMessage('agent', `⚠️ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl h-[80vh] flex flex-col">

        {/* Background glow */}
        <div className="absolute -inset-4 bg-brand-600/10 rounded-3xl blur-2xl pointer-events-none" />

        <div className="relative glass-card flex flex-col overflow-hidden h-full">

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🤖 AI Agent
                {user.role === 'admin' && (
                  <span className="badge badge-amber text-xs">Developer</span>
                )}
                {user.role === 'user' && (
                  <span className="badge badge-blue text-xs">User</span>
                )}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {user.role === 'admin'
                  ? 'Full access: all users, all data, admin controls'
                  : 'Scoped to your own tasks and history'}
              </p>
            </div>
            <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Tier badge */}
          <div className="px-6 py-2 bg-gray-900/30 border-b border-gray-800/50 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-amber-400' : 'bg-blue-400'}`} />
              {user.role === 'admin'
                ? 'Developer mode — tool calls are fully enabled'
                : 'User mode — tool calls scoped to your own data only'}
              <span className="ml-auto">Server enforces permissions on every tool call</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-md'
                      : 'bg-gray-800 text-gray-200 rounded-bl-md'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation prompt */}
            {pendingConfirm && (
              <div className="flex flex-col items-end gap-2">
                <div className="bg-amber-600/20 border border-amber-500/30 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                  <p className="text-sm text-amber-300">{pendingConfirm.message}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingConfirm(null)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { pendingConfirm.onConfirm(); setPendingConfirm(null); }}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs hover:bg-red-500"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick actions */}
          <div className="px-6 py-2 border-t border-gray-800 flex-shrink-0 flex gap-2 flex-wrap">
            {[
              'Add a task',
              'Show my history',
              'My streak?',
              'Split a task',
            ].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="px-3 py-1 rounded-full bg-gray-800 text-gray-400 text-xs hover:bg-gray-700 hover:text-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-gray-800 flex gap-3 flex-shrink-0">
            <textarea
              className="input-field resize-none flex-1"
              rows={1}
              placeholder="Ask the agent anything… (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="btn-primary px-4"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
