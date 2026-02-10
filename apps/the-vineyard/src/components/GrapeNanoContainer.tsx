import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  MessageCircle, 
  FileText, 
  Play, 
  Square, 
  Send, 
  GitBranch, 
  Folder, 
  Cpu, 
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Grape, CLILog, VineMessage, TeamMemberCategory } from '../types';
import { TEAM_MEMBERS } from '../data/teamMembers';

interface GrapeNanoContainerProps {
  grape: Grape;
  onClose: () => void;
}

export function GrapeNanoContainer({ grape, onClose }: GrapeNanoContainerProps) {
  const [activeTab, setActiveTab] = useState<'persona' | 'chat' | 'cli'>('persona');
  const [cliInput, setCliInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [cliLogs, setCliLogs] = useState<CLILog[]>(grape.cliHistory || []);
  const [messages, setMessages] = useState<VineMessage[]>(grape.chatHistory || []);
  const [isRunning, setIsRunning] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'cli' && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    if (activeTab === 'chat' && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [cliLogs, messages, activeTab]);

  const handleRunCLI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const newLog: CLILog = {
      id: Date.now().toString(),
      command: cliInput,
      output: `Executing on ${grape.directory}...\n[Simulation] Processing command...\nDone.`,
      timestamp: new Date().toISOString(),
      status: 'success'
    };

    setCliLogs([...cliLogs, newLog]);
    setCliInput('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: VineMessage = {
      id: `u-${Date.now()}`,
      conversationId: grape.id,
      senderId: 'user-1',
      senderName: 'You',
      senderCategory: 'human-design',
      content: chatInput,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMsg]);
    setChatInput('');

    // Agent response simulation
    setTimeout(() => {
      const agentMsg: VineMessage = {
        id: `a-${Date.now()}`,
        conversationId: grape.id,
        senderId: grape.agentId || 'agent-1',
        senderName: 'Agent',
        senderCategory: 'ai-special',
        content: `Acknowledged. I'll analyze the current state in ${grape.directory} on branch ${grape.branchId}.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, agentMsg]);
    }, 1000);
  };

  const toggleContainer = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${isRunning ? 'bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-200' : 'bg-slate-800 text-white'}`}>
            <Cpu size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{grape.title}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <GitBranch size={12} className="text-slate-400" />
                <span className="font-mono">{grape.branchId || 'main'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Folder size={12} className="text-slate-400" />
                <span className="font-mono">{grape.directory || './'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleContainer}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isRunning ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'}`}
          >
            {isRunning ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            {isRunning ? 'Stop Container' : 'Start Grape'}
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-6 bg-white border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('persona')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${activeTab === 'persona' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <FileText size={16} /> Persona Note
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${activeTab === 'chat' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <MessageCircle size={16} /> Agent Chat
        </button>
        <button 
          onClick={() => setActiveTab('cli')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all ${activeTab === 'cli' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Terminal size={16} /> Terminal
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'persona' && (
            <motion.div 
              key="persona"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full p-8 overflow-y-auto bg-white/50 backdrop-blur-sm"
            >
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="p-6 bg-white rounded-2xl border border-violet-100 shadow-sm">
                  <h3 className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-3">{grape.agentxNoteId || 'Agent Note'}</h3>
                  <div className="prose prose-slate max-w-none">
                    <h1 className="text-2xl font-bold mb-4">Grape Persona: UI Specialist</h1>
                    <p className="text-slate-600 leading-relaxed italic mb-6 border-l-4 border-violet-200 pl-4 bg-violet-50/50 py-3 rounded-r-lg">
                      "I am an AI agent specialized in React, Tailwind CSS, and Framer Motion. I help build stunning, accessible user interfaces within the RipCode collective."
                    </p>
                    <h4 className="font-bold text-slate-900 mb-2">Capabilities:</h4>
                    <ul className="list-disc pl-5 space-y-2 text-slate-600">
                      <li>Automated UI component generation based on descriptions.</li>
                      <li>Refactoring legacy CSS to modern utility patterns.</li>
                      <li>Implementing complex animations using Framer Motion.</li>
                      <li>Ensuring WCAG accessibility standards across the branch.</li>
                    </ul>
                    <h4 className="font-bold text-slate-900 mt-6 mb-2">Contextual Knowledge:</h4>
                    <p className="text-slate-600">
                      I have access to the <code className="bg-slate-100 px-1 rounded text-violet-600">/packages/ui-core</code> library and can leverage existing tokens for consistency.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-800 font-medium"> This note is executable. Any changes to the persona will immediately affect the agent's behavior in this grape container.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full flex flex-col"
            >
              <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                  const isUser = msg.senderCategory === 'human-design';
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3`}>
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0">
                          AI
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none'}`}>
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {msg.senderName}
                          </span>
                          <span className={`text-[10px] ${isUser ? 'text-indigo-200' : 'text-slate-300'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask the Agent to do something..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <button className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'cli' && (
            <motion.div 
              key="cli"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full flex flex-col bg-[#0f172a]"
            >
              <div ref={terminalRef} className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-4 custom-scrollbar">
                <div className="text-slate-500 mb-6 flex items-center gap-2">
                  <Terminal size={14} />
                  <span>Grape CLI Terminal - Running in {grape.directory}</span>
                </div>
                
                {cliLogs.map((log) => (
                  <div key={log.id} className="space-y-2">
                    <div className="flex items-start gap-2 text-emerald-400">
                      <span className="text-slate-600">$</span>
                      <span className="font-bold">{log.command}</span>
                      <span className="text-slate-600 text-[10px] ml-auto">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="pl-4 text-slate-300 whitespace-pre-wrap leading-relaxed animate-in fade-in slide-in-from-top-1 duration-300">
                      {log.output}
                    </div>
                    <div className="h-px bg-slate-800/50 w-24 ml-4" />
                  </div>
                ))}
                
                {cliLogs.length === 0 && (
                  <div className="text-slate-600 italic">No command history for this grape.</div>
                )}
              </div>
              <div className="p-4 bg-slate-800/30 border-t border-slate-800 backdrop-blur-md">
                <form onSubmit={handleRunCLI} className="flex items-center gap-2 max-w-4xl mx-auto font-mono text-xs">
                  <span className="text-emerald-500 font-bold ml-2">$</span>
                  <input 
                    type="text" 
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    placeholder="Enter command (e.g., npm run build)..."
                    className="flex-1 bg-transparent border-none text-emerald-400 placeholder-slate-600 focus:outline-none focus:ring-0 py-2"
                    autoFocus
                  />
                  <div className="flex items-center gap-3 mr-2">
                    <span className="text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Enter</span>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            VINE LINK ACTIVE
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            AGENTX DISCOVERABLE
          </div>
        </div>
        <div>
          GIT SYNCED • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
