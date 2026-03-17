import React, { useState } from 'react';
import { Columns, ArrowRightLeft, FileCode2, Copy, Check, MessageSquare, Send, Sparkles, Zap, ChevronUp, ChevronDown, PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen, Cpu } from 'lucide-react';
import { api } from './api/client';

/**
 * AIChat Component - Reusable for both legacy and refactored views
 */
function AIChat({ messages, onSendMessage, title, colorScheme, isComparing, isOpen, onToggle }: any) {
  const [input, setInput] = useState('');
  
  if (!isOpen) {
     return (
        <div 
          onClick={onToggle}
          className={`border-t ${colorScheme === 'indigo' ? 'border-indigo-500/20' : 'border-white/10'} p-3 flex justify-between items-center bg-black/20 shrink-0 cursor-pointer transition-colors hover:bg-black/40`}
        >
           <div className="flex items-center gap-2 px-3">
              <Sparkles size={14} className={colorScheme === 'indigo' ? 'text-indigo-400' : 'text-neutral-400'} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${colorScheme === 'indigo' ? 'text-indigo-400' : 'text-neutral-400'}`}>
                  {title}
              </span>
           </div>
           <div className="flex items-center gap-2 px-2 text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
               Click to expand <ChevronUp size={16} />
           </div>
        </div>
     );
  }

  return (
    <div className={`border-t ${colorScheme === 'indigo' ? 'border-indigo-500/20' : 'border-white/10'} pt-4 flex flex-col h-[400px] min-h-[200px] max-h-[80vh] bg-black/20 shrink-0 resize-y overflow-auto`} style={{ position: 'relative' }}>
       <div className="flex items-center justify-between mb-2 px-6 py-1 sticky top-0 bg-transparent z-10">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className={colorScheme === 'indigo' ? 'text-indigo-400' : 'text-neutral-400'} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${colorScheme === 'indigo' ? 'text-indigo-400' : 'text-neutral-400'}`}>
                {title}
            </span>
          </div>
          <button onClick={onToggle} className="text-neutral-500 hover:text-white transition-colors bg-black/50 rounded p-1">
             <ChevronDown size={16} />
          </button>
       </div>
       <div className="flex-1 overflow-y-auto space-y-3 px-6 mb-3">
          {messages.length === 0 && (
              <div className="text-xs text-neutral-500/70 italic h-full flex flex-col items-center justify-center gap-2">
                 <MessageSquare size={20} className="opacity-20" />
                 No messages yet. Ask the AI about this code!
              </div>
          )}
          {messages.map((m: any, i: number) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                     m.role === 'user' 
                       ? 'bg-neutral-800 text-neutral-200 border border-white/5 rounded-br-none' 
                       : colorScheme === 'indigo' ? 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/20 rounded-bl-none' : 'bg-neutral-800/80 text-rose-100 border border-white/10 rounded-bl-none'
                 }`}>
                    {m.content}
                 </div>
              </div>
          ))}
          {isComparing && (
              <div className="flex justify-start">
                   <div className="max-w-[85%] rounded-xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm bg-neutral-800/50 text-neutral-400 border border-white/5 flex items-center gap-2 animate-pulse rounded-bl-none">
                      <Sparkles size={12} className={colorScheme === 'indigo' ? 'text-indigo-400' : 'text-neutral-400'} /> AI is analyzing...
                   </div>
              </div>
          )}
       </div>
       <div className="relative mt-auto mx-6 mb-5">
           <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && input.trim() && !isComparing) {
                      onSendMessage(input);
                      setInput('');
                  }
              }}
              disabled={isComparing}
              className={`w-full bg-black/40 border ${colorScheme === 'indigo' ? 'border-indigo-500/30 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/50' : 'border-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/20'} rounded-lg py-2.5 pl-4 pr-10 text-xs outline-none transition-all placeholder:text-neutral-600 disabled:opacity-50`}
              placeholder="Ask a question..."
           />
           <button 
              onClick={() => {
                 if (input.trim() && !isComparing) {
                    onSendMessage(input);
                    setInput('');
                 }
              }}
              disabled={isComparing || !input.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md ${colorScheme === 'indigo' ? 'text-indigo-400 hover:bg-indigo-500/20' : 'text-neutral-400 hover:bg-white/10'} transition-colors disabled:opacity-50`}
           >
               <Send size={14} />
           </button>
       </div>
    </div>
  );
}

/**
 * CodeEditor Component
 */
function CodeEditor({ code, setCode, title, colorScheme, isOpen, onToggle, placeholder, onHorizontalCollapse, CollapseIcon }: any) {
  if (!isOpen) {
     return (
        <div 
          onClick={onToggle}
          className={`p-3 flex justify-between items-center bg-black/50 shrink-0 cursor-pointer transition-colors hover:bg-black/70`}
        >
           <div className="flex items-center gap-2 px-3">
              <FileCode2 size={16} className={colorScheme === 'indigo' ? 'text-indigo-400' : 'text-neutral-600'} />
              <span className={`text-xs font-semibold uppercase tracking-widest ${colorScheme === 'indigo' ? 'text-indigo-300' : 'text-neutral-400'}`}>
                  {title}
              </span>
           </div>
           
           <div className="flex items-center gap-1">
               {CollapseIcon && onHorizontalCollapse && (
                  <button onClick={(e) => { e.stopPropagation(); onHorizontalCollapse(); }} className="text-neutral-500 hover:text-white transition-colors bg-black/50 rounded p-1 flex items-center justify-center mr-2" title="Collapse panel">
                     <CollapseIcon size={14} />
                  </button>
               )}
               <div className="flex items-center gap-2 px-1 text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
                   Click to expand <ChevronDown size={16} />
               </div>
           </div>
        </div>
     );
  }

  return (
      <div className="flex flex-col flex-1 border-b border-white/5 bg-neutral-900/20">
          <div className="bg-black/50 p-3 px-5 border-b border-white/5 flex items-center justify-between shrink-0 sticky top-0 z-10 font-bold backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className={`flex h-3 w-3 rounded-full ${colorScheme === 'indigo' ? 'bg-emerald-500/20' : 'bg-rose-500/20'} items-center justify-center`}>
                <span className={`h-1.5 w-1.5 rounded-full ${colorScheme === 'indigo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className={`text-[11px] font-bold tracking-widest uppercase ${colorScheme === 'indigo' ? 'text-indigo-300' : 'text-neutral-400'}`}>
                 {title}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
               {CollapseIcon && onHorizontalCollapse && (
                  <button onClick={onHorizontalCollapse} className="text-neutral-500 hover:text-white transition-colors bg-black/50 rounded p-1.5 flex items-center justify-center" title="Collapse panel to side">
                     <CollapseIcon size={14} />
                  </button>
               )}
               <button onClick={onToggle} className="text-neutral-500 hover:text-white transition-colors bg-black/50 rounded p-1.5 flex items-center justify-center" title="Collapse code vertically">
                  <ChevronUp size={14} />
               </button>
            </div>
          </div>
          
          <div className="flex-1 min-h-0 relative group">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full h-full bg-transparent p-6 font-mono text-[13px] ${colorScheme === 'indigo' ? 'text-indigo-100 selection:bg-indigo-500/30' : 'text-neutral-300 selection:bg-rose-500/30'} outline-none leading-relaxed resize-none overflow-auto custom-scrollbar`}
              placeholder={placeholder}
              spellCheck="false"
            />
            {/* Resizer Handle logic would go here if we used a library, for now we ensure the container fills space */}
          </div>
      </div>
  );
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const EXAMPLES = [
  { 
    id: 'auth', name: 'api/routes/auth.py', 
    left: `router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/login")
async def login(credentials: UserLogin):
    user = await authenticate_user(credentials.email, credentials.password)
    # ... logic ...
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}`, 
    right: `export const authRoutes = new Elysia({ prefix: "/api/v1/auth" })
  .post("/login", async ({ body }) => {
    const user = await authService.login(body.email, body.password);
    const token = await jwt.sign({ sub: user.email });
    return { token };
  });`,
    leftAnalysis: '📌 Legacy FastAPI Auth',
    rightAnalysis: '📌 Refactored Elysia Auth'
  },
  { 
    id: 'positions', name: 'api/routes/positions.py', 
    left: `@router.post("", response_model=dict)
async def create_position(position_data: PositionCreate, current_user: User):
    require_administrator(current_user)
    # ... logic ...
    position = await storage.create("positions", position_dict)
    return {"id": position["id"], "title": position["title"]}`, 
    right: `.post("", async ({ body, headers }) => {
    const auth = await requireAuth(headers);
    # ... logic ...
    const newPosition = positionDb.create({ ...body, id: crypto.randomUUID() });
    return newPosition;
  });`,
    leftAnalysis: '📌 Legacy Position Storage',
    rightAnalysis: '📌 BREE SQLite Storage'
  },
  { id: 'candidates', name: 'api/routes/candidates.py', left: '# Candidates Logic', right: '// TODO: Refactor' },
  { id: 'assessments', name: 'api/routes/assessments.py', left: '# Assessments Logic', right: '// TODO: Refactor' },
  { id: 'dashboard', name: 'api/routes/dashboard.py', left: '# Dashboard Logic', right: '// TODO: Refactor' },
  { id: 'roles', name: 'api/routes/roles.py', left: '# Roles Logic', right: '// TODO: Refactor' },
  { id: 'users', name: 'api/routes/users.py', left: '# Users Logic', right: '// TODO: Refactor' },
];

export default function AgentXGrapeApp() {
  const [selectedExampleId, setSelectedExampleId] = useState(EXAMPLES[0].id);
  const [leftCode, setLeftCode] = useState(EXAMPLES[0].left);
  const [rightCode, setRightCode] = useState(EXAMPLES[0].right);
  const [isComparing, setIsComparing] = useState(false);
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftChatOpen, setLeftChatOpen] = useState(true);
  const [rightChatOpen, setRightChatOpen] = useState(true);

  const [leftMessages, setLeftMessages] = useState<any[]>([
    { role: 'assistant', content: 'Scan the legacy code. What do you want to break down?' }
  ]);
  const [rightMessages, setRightMessages] = useState<any[]>([
    { role: 'assistant', content: 'Elysia structure ready. How can I optimize this refactor?' }
  ]);

  const handleRefactorTrigger = async () => {
    setIsComparing(true);
    try {
      const { data, error } = await api.api.v1.figler.refactor.post({
        prompt: `Refactor this Python code to TypeScript Elysia: \n\n ${leftCode}`,
      });
      if (error) {
        alert(`Failed to trigger: ${error.message ?? JSON.stringify(error)}`);
      } else if (data?.success) {
        alert("Refactor request successfully broadcast via Figler!");
      } else {
        alert(`Failed to trigger: ${(data as any)?.error ?? 'Unknown error'}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Network error: ${message}`);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      <header className="p-4 lg:px-6 border-b border-white/10 flex justify-between items-center backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
            <Cpu size={18} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">Figler Console</h1>
            <select 
              value={selectedExampleId}
              onChange={(e) => {
                const ex = EXAMPLES.find(x => x.id === e.target.value);
                if (ex) {
                  setSelectedExampleId(ex.id);
                  setLeftCode(ex.left);
                  setRightCode(ex.right);
                }
              }}
              className="bg-black/40 border border-white/10 text-[10px] text-neutral-400 rounded px-2 py-0.5 outline-none hover:border-white/20 transition-colors mt-0.5"
            >
              {EXAMPLES.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            <span className="text-[10px] text-indigo-400/60 font-medium mt-1 leading-tight max-w-[200px]">
              "Riddle me this... How do you keep a lagacy system runing while incrementatlly integrating refactorings....Figler"
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 bg-black/20 border border-white/5 rounded-full px-6 py-2">
           <div className="flex flex-col items-center">
              <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-[0.2em]">Refactored</span>
              <span className="text-[10px] text-emerald-400 font-mono">/api/v1/auth</span>
           </div>
           <ArrowRightLeft size={14} className="text-neutral-700" />
           <div className="flex flex-col items-center">
              <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-[0.2em]">Legacy Proxy</span>
              <span className="text-[10px] text-rose-400 font-mono">geni-py.internal/*</span>
           </div>
           <div className="h-4 w-px bg-white/10 mx-2"></div>
           <div className="flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[9px] text-neutral-300 font-bold uppercase tracking-widest">Strangler Fig Active</span>
           </div>
        </div>
        
        <div className="flex gap-3 items-center">
            <button 
              onClick={handleRefactorTrigger}
              disabled={isComparing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
              <Zap size={14} className={isComparing ? 'animate-pulse' : ''} />
              {isComparing ? 'Refactoring...' : 'Trigger Figler'}
            </button>
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
               <Sparkles size={14} />
               Verify
            </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-5 p-4 lg:p-6 h-[calc(100vh-76px)] overflow-hidden">
        {/* Left Column: Legacy */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <section className={`flex-1 min-w-0 flex flex-col border border-white/10 rounded-2xl bg-[#111] overflow-hidden`}>
               <CodeEditor 
                 code={leftCode}
                 setCode={setLeftCode}
                 title="Legacy Source (Python)"
                 colorScheme="neutral"
                 isOpen={leftPanelOpen}
                 onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
               />
               <AIChat 
                 messages={leftMessages}
                 onSendMessage={(msg: string) => {
                   setLeftMessages([...leftMessages, { role: 'user', content: msg }]);
                   // Add mock AI response
                   setTimeout(() => {
                     setLeftMessages(prev => [...prev, { role: 'assistant', content: `Analyzing legacy logic: "${msg}"` }]);
                   }, 1000);
                 }}
                 title="Legacy Analyzer"
                 colorScheme="neutral"
                 isOpen={leftChatOpen}
                 onToggle={() => setLeftChatOpen(!leftChatOpen)}
               />
          </section>
        </div>

        <div className="flex items-center justify-center shrink-0">
           <ArrowRightLeft className="text-neutral-700 hidden lg:block" size={24} />
        </div>

        {/* Right Column: Refactored */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <section className={`flex-1 min-w-0 flex flex-col border border-indigo-500/30 rounded-2xl bg-[#111] overflow-hidden`}>
               <CodeEditor 
                 code={rightCode}
                 setCode={setRightCode}
                 title="BREE Target (TypeScript)"
                 colorScheme="indigo"
                 isOpen={rightPanelOpen}
                 onToggle={() => setRightPanelOpen(!rightPanelOpen)}
               />
               <AIChat 
                 messages={rightMessages}
                 onSendMessage={(msg: string) => {
                   setRightMessages([...rightMessages, { role: 'user', content: msg }]);
                    // Add mock AI response
                    setTimeout(() => {
                      setRightMessages(prev => [...prev, { role: 'assistant', content: `Suggesting BREE patterns: "${msg}"` }]);
                    }, 1000);
                 }}
                 title="BREE Expert"
                 colorScheme="indigo"
                 isOpen={rightChatOpen}
                 onToggle={() => setRightChatOpen(!rightChatOpen)}
               />
          </section>
        </div>
      </main>
    </div>
  );
}
