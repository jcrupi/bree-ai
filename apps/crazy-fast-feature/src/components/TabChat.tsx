import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://bree-api.fly.dev';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('bree_jwt');
  return token
    ? { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TabChatProps {
  tab: 'tech' | 'biz' | 'marketing';
  context: string; // current tab content to give AI as context
}

const SYSTEM_PROMPTS: Record<TabChatProps['tab'], string> = {
  tech: `You are a sharp engineering assistant for Grelin AI's Crazy Week sprint tracker. 
You have access to the current week's task list in JSON format. 
Help the team with task analysis, prioritization, status questions, blockers, and sprint planning. 
Be concise and direct. Use bullet points when listing items.`,

  biz: `You are a strategic business advisor for Grelin AI. 
You have access to the current week's business notes including deals, leads, and partnerships. 
Help analyze opportunities, suggest follow-ups, spot risks, and provide business insight. 
Keep responses sharp and actionable.`,

  marketing: `You are a marketing strategist for Grelin AI. 
You have access to the current week's marketing notes. 
Help craft messaging, identify target audiences, suggest campaign angles, and analyze go-to-market strategies. 
Be creative yet data-grounded.`,
};

const PLACEHOLDERS: Record<TabChatProps['tab'], string> = {
  tech: 'Ask about tasks, blockers, priorities…',
  biz: 'Ask about deals, leads, risk analysis…',
  marketing: 'Ask about messaging, campaigns, audience…',
};

export function TabChat({ tab, context }: TabChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/openai/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          query: text,
          context: context || '(No content yet in this tab)',
          options: {
            model: 'gpt-4o',
            temperature: 0.6,
            max_tokens: 800,
            systemPrompt: SYSTEM_PROMPTS[tab],
          },
        }),
      });

      const data = await res.json();
      const reply = data.response || data.error || 'No response received.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Failed to reach AI. Check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-200">AI Assistant</span>
          {messages.length > 0 && (
            <span className="text-xs text-slate-500">{messages.length / 2 | 0} exchange{messages.length > 2 ? 's' : ''}</span>
          )}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="border-t border-slate-700/50">
          {/* Message list */}
          <div className="max-h-80 overflow-y-auto px-5 py-4 space-y-4 scroll-smooth">
            {messages.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-6">
                Ask anything about this week's {tab} content…
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
                <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="border-t border-slate-700/50 px-4 py-3 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={PLACEHOLDERS[tab]}
              disabled={loading}
              className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
