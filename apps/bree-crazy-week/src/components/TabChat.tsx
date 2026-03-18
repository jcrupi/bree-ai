import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ChevronDown, Sparkles, GripHorizontal } from 'lucide-react';

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
  tab: 'tech' | 'biz' | 'marketing' | 'sales' | 'news';
  context: string;
}

const SYSTEM_PROMPTS: Record<TabChatProps['tab'], string> = {
  tech: `You are a sharp engineering assistant for Grelin AI's Crazy Week sprint tracker. 
You have access to the current week's task list. 
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
  sales: `You are a senior sales coach and strategist for Grelin AI. 
You have access to the current week's sales notes including pipeline, leads, and deal progress. 
Help prioritize follow-ups, craft outreach, handle objections, and accelerate deals to close. 
Be direct, tactical, and results-focused.`,
  news: `You are a healthcare AI industry analyst for Grelin AI. 
Help interpret the latest healthcare AI news, identify competitive signals, and surface opportunities and risks relevant to Grelin AI's Chart AI and Claims AI products.`,
};

const PLACEHOLDERS: Record<TabChatProps['tab'], string> = {
  tech: 'Ask about tasks, blockers, priorities…',
  biz: 'Ask about deals, leads, risk analysis…',
  marketing: 'Ask about messaging, campaigns, audience…',
  sales: 'Ask about pipeline, follow-ups, close strategy…',
  news: 'Ask about competitive signals, market trends…',
};

const SUGGESTIONS: Record<TabChatProps['tab'], string[]> = {
  tech: ['What are the highest priority tasks?', 'Any blockers this week?', 'Summarize task status'],
  biz: ['What deals need follow-up?', 'Biggest risks this week?', 'Summarize pipeline'],
  marketing: ['Key messages this week?', 'Suggest a campaign angle', 'Who is our top audience?'],
  sales: ['Which deals are closest to closing?', 'Draft a follow-up email', 'What objections should I prep for?'],
  news: ['What are the competitive signals?', 'How should we respond to this news?', 'Summarize the market trends'],
};

// ─── Resize hook ──────────────────────────────────────────────────────────────

function useDrag(onDelta: (dy: number) => void) {
  const startY = useRef(0);
  const dragging = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startY.current = e.clientY;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      onDelta(ev.clientY - startY.current);
      startY.current = ev.clientY;
    };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  return onMouseDown;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TabChat({ tab, context }: TabChatProps) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(340);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 300);
    }
  }, [open, messages]);

  const dragHandle = useDrag((dy) =>
    setHeight(h => Math.max(180, Math.min(640, h - dy)))
  );

  const send = async (text = input.trim()) => {
    if (!text || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
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
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Failed to reach AI. Check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div
      className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur overflow-hidden shadow-2xl shadow-black/20 transition-all duration-300"
      style={{ marginTop: 24 }}
    >
      {/* ── Toggle header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/50 transition-colors group"
        aria-expanded={open}
        aria-label="Toggle AI assistant"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg transition-all ${open ? 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-slate-200">AI Assistant</span>
            {messages.length > 0 && (
              <span className="ml-2 text-xs text-slate-500">
                {Math.floor(messages.length / 2)} exchange{messages.length > 2 ? 's' : ''}
              </span>
            )}
          </div>
          {loading && (
            <div className="flex gap-1 ml-1">
              <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ── Collapsible body (CSS transition) ── */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? height + 64 : 0, opacity: open ? 1 : 0 }}
        aria-hidden={!open}
      >
        <div className="border-t border-slate-700/50">
          {/* Resize handle */}
          <div
            onMouseDown={dragHandle}
            className="flex items-center justify-center py-1.5 cursor-ns-resize hover:bg-slate-800/40 transition-colors group"
            title="Drag to resize"
          >
            <GripHorizontal className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition-colors" />
          </div>

          {/* Message list */}
          <div
            className="overflow-y-auto px-5 py-3 space-y-3 scroll-smooth"
            style={{ height }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-6">
                <p className="text-xs text-slate-600 text-center">
                  Ask anything about this week's {tab} content…
                </p>
                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS[tab].map(s => (
                    <button
                      key={s}
                      onClick={() => { setOpen(true); send(s); }}
                      className="px-3 py-1.5 text-xs rounded-full bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-700/60 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mt-0.5 shadow shadow-indigo-500/30">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm shadow shadow-indigo-500/20'
                      : 'bg-slate-800/80 text-slate-200 rounded-bl-sm border border-slate-700/40'
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
              <div className="flex gap-2.5">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow shadow-indigo-500/30">
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
                <div className="bg-slate-800/80 rounded-2xl rounded-bl-sm px-4 py-3 border border-slate-700/40">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="border-t border-slate-700/50 px-4 py-3 flex gap-2 bg-slate-900/40">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={PLACEHOLDERS[tab]}
              disabled={loading}
              className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="flex-shrink-0 p-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-colors shadow shadow-indigo-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
