import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Users, 
  Send, 
  Sparkles, 
  Eye, 
  Shield, 
  MessageSquare,
  Zap,
  Info,
  ChevronRight,
  Activity
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useVillageVine } from '../hooks/useVillageVine';

// Types for consistent message handling
interface AssessmentMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isInjection?: boolean;
}

export function TalentVillageBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as 'candidate' | 'expert') || 'candidate';
  const initialName = searchParams.get('name') || (initialRole === 'candidate' ? 'Candidate' : 'Expert 1');
  const [role, setRole] = useState<'candidate' | 'expert'>(initialRole);
  const [userName, setUserName] = useState<string>(initialName);
  const hideMirror = searchParams.get('hideMirror') === 'true';
  
  const [inputText, setInputText] = useState('');
  const [expertInput, setExpertInput] = useState('');
  const [injectionInput, setInjectionInput] = useState('');

  // AI Feature State
  const [isAutoAIEnabled, setIsAutoAIEnabled] = useState(false);
  const [isAutoSuggestEnabled, setIsAutoSuggestEnabled] = useState(false);
  const [maxQuestions, setMaxQuestions] = useState(5);
  const [currentQuestionCount, setCurrentQuestionCount] = useState(0);
  const [isActingAsCandidate, setIsActingAsCandidate] = useState(false);
  const [simulationInput, setSimulationInput] = useState('');
  
  // Question Designer State
  const [specialty, setSpecialty] = useState('React');
  const [difficulty, setDifficulty] = useState<'beginner' | 'junior' | 'expert'>('junior');
  const [seed, setSeed] = useState('');
  const [generatedQuestion, setGeneratedQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const isLead = userName === 'Expert 1';
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const expertEndRef = useRef<HTMLDivElement>(null);

  // Update userName if search param changes
  useEffect(() => {
    const nameParam = searchParams.get('name');
    if (nameParam) {
      setUserName(nameParam);
    }
  }, [searchParams]);

  // LIVE NATS VINES
  // 1. Assessment Vine: Shared between Candidate and Expert (Mirror)
  const { 
    isConnected: isAssessmentConnected, 
    messages: assessmentMessages, 
    sendMessage: sendAssessmentMessage 
  } = useVillageVine({
    vineId: 'talent-assessment-live',
    userName: userName,
    onMessage: (msg) => {
      console.log('Assessment Message:', msg);
    }
  });

  // 2. Private Expert Vine: Only for Experts
  const { 
    isConnected: isExpertConnected, 
    messages: privateExpertMessages, 
    sendMessage: sendPrivateExpertMessage 
  } = useVillageVine({
    vineId: role === 'expert' ? 'talent-expert-private-live' : null,
    userName: userName,
  });

  // 3. Assessment Queue Vine: For moderated interventions
  const {
    messages: queueMessages,
    sendMessage: sendQueueMessage
  } = useVillageVine({
    vineId: role === 'expert' ? 'talent-assessment-queue-live' : null,
    userName: userName,
  });

  // Parse queue messages to get active items
  const assessmentQueue = useMemo(() => {
    const items: { id: string, expert: string, content: string, status: 'pending' | 'sent' | 'deleted', isAI?: boolean }[] = [];
    
    queueMessages.forEach(msg => {
      try {
        const data = JSON.parse(msg.content);
        if (data.type === 'PROPOSE') {
          items.push({ 
            id: msg.id, 
            expert: msg.sender, 
            content: data.text, 
            status: 'pending',
            isAI: data.isAI 
          });
        } else if (data.type === 'RESOLVE') {
          const item = items.find(i => i.id === data.targetId);
          if (item) item.status = data.status;
        }
      } catch (e) {
        // Fallback for legacy messages
        items.push({ id: msg.id, expert: msg.sender, content: msg.content, status: 'pending' });
      }
    });

    return items.filter(i => i.status === 'pending');
  }, [queueMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    expertEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assessmentMessages, privateExpertMessages]);

  // Handlers
  const handleSendCandidateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    try {
      await sendAssessmentMessage(userName, inputText);
      setInputText('');
      
      // AI response disabled per user request
    } catch (err) {
      console.error('Failed to send candidate message:', err);
    }
  };

  const handleSendExpertMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expertInput.trim()) return;
    
    try {
      await sendPrivateExpertMessage(userName, expertInput);
      setExpertInput('');
    } catch (err) {
      console.error('Failed to send expert message:', err);
    }
  };

  const handleProposeToQueue = async (content: string, isAI: boolean = false) => {
    if (!content.trim()) return;
    try {
      await sendQueueMessage(userName, JSON.stringify({ 
        type: 'PROPOSE', 
        text: content,
        isAI 
      }));
      setInjectionInput('');
      setGeneratedQuestion(''); // Clear designer if it was from there
    } catch (err) {
      console.error('Failed to propose to queue:', err);
    }
  };

  const handleQueueAction = async (id: string, action: 'send' | 'delete', text?: string) => {
    try {
      if (action === 'send') {
        await sendAssessmentMessage('EXPERT_INJECTION', text || '');
        await sendQueueMessage(userName, JSON.stringify({ type: 'RESOLVE', targetId: id, status: 'sent' }));
      } else {
        await sendQueueMessage(userName, JSON.stringify({ type: 'RESOLVE', targetId: id, status: 'deleted' }));
      }
    } catch (err) {
      console.error('Failed to resolve queue item:', err);
    }
  };

  const handleInjectQuestion = async (e?: React.FormEvent, customContent?: string) => {
    e?.preventDefault();
    const content = customContent || injectionInput;
    if (!content.trim()) return;
    
    if (isLead) {
      try {
        await sendAssessmentMessage('EXPERT_INJECTION', content);
        if (!customContent) setInjectionInput('');
      } catch (err) {
        console.error('Failed to inject question:', err);
      }
    } else {
      handleProposeToQueue(content);
    }
  };

  const handleSendSimulationMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulationInput.trim()) return;
    try {
      await sendAssessmentMessage('Candidate', simulationInput);
      setSimulationInput('');
    } catch (err) {
      console.error('Failed to send simulation message:', err);
    }
  };

  const handleGenerateQuestion = () => {
    setIsGenerating(true);
    // Simulate AI generation with templates based on user parameters
    setTimeout(() => {
      const templates: Record<string, string[]> = {
        'React': [
          `Can you explain how you would handle state management in a large-scale ${seed || 'React'} application?`,
          `What are the advantages of using ${seed || 'hooks'} over class components in this context?`,
          `How would you optimize performance for a complex list rendering in ${seed || 'React'}?`
        ],
        'Node': [
          `Describe the event loop in Node.js and how it relates to ${seed || 'asynchronous I/O'}.`,
          `How do you handle error management in a ${seed || 'distributed'} Node ecosystem?`,
          `What's your approach to securing a ${seed || 'REST API'} using Node?`
        ],
        'Architecture': [
          `Design a system that handles ${seed || 'real-time data'} with high availability.`,
          `Explain the trade-offs between microservices and a monolith for ${seed || 'this project'}.`,
          `How do you ensure data consistency across ${seed || 'multiple databases'}?`
        ]
      };

      const baseQuestions = templates[specialty] || templates['Architecture'];
      const question = baseQuestions[Math.floor(Math.random() * baseQuestions.length)];
      
      // Add difficulty modifiers
      let finalQuestion = question;
      if (difficulty === 'beginner') finalQuestion = "Starting with the basics: " + question;
      if (difficulty === 'expert') finalQuestion = "At an advanced level: " + question;
      
      setGeneratedQuestion(finalQuestion);
      setIsGenerating(false);
    }, 800);
  };

  // Effect to handle Auto-AI response logic
  useEffect(() => {
    if (role === 'expert' && isAutoAIEnabled && assessmentMessages.length > 0) {
      const lastMessage = assessmentMessages[assessmentMessages.length - 1];
      
      // If last message was from Candidate and we haven't hit the limit
      if (lastMessage.sender === 'Candidate' && currentQuestionCount < maxQuestions) {
        const timer = setTimeout(async () => {
          await sendAssessmentMessage('Genius AI', `[AI Auto-Response] Interesting point about "${lastMessage.content.slice(0, 20)}...". Let's dig deeper. Question ${currentQuestionCount + 1}/${maxQuestions}: How does this scale?`);
          setCurrentQuestionCount(prev => prev + 1);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [assessmentMessages, isAutoAIEnabled, role, maxQuestions, currentQuestionCount]);

  // Effect for AI Auto-Suggest to Queue
  useEffect(() => {
    if (role === 'expert' && isAutoSuggestEnabled && assessmentMessages.length > 0) {
      const lastMessage = assessmentMessages[assessmentMessages.length - 1];
      
      // If last message was from Candidate and NOT already handled
      if (lastMessage.sender === 'Candidate') {
        const timer = setTimeout(() => {
          const suggestedQuestion = `[Auto-Suggest] Follow up: How would you resolve the potential bottleneck in your ${lastMessage.content.slice(0, 15)}... approach?`;
          handleProposeToQueue(suggestedQuestion, true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [assessmentMessages, isAutoSuggestEnabled, role]);

  const toggleRole = () => {
    const newRole = role === 'candidate' ? 'expert' : 'candidate';
    setRole(newRole);
    setSearchParams({ role: newRole });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1e293b] font-sans overflow-hidden flex flex-col">
      {/* Dynamic Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-display font-semibold tracking-tight">
              Genius <span className="text-[#3876F2] font-bold">Talent.ai</span>
            </h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Live Assessment Engine • {role === 'candidate' ? 'Candidate Portal' : 'Expert Terminal'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Connection Status */}
           <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all ${
             isAssessmentConnected ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'
           }`}>
             <Activity size={10} className={isAssessmentConnected ? 'animate-pulse' : ''} />
             NATS: {isAssessmentConnected ? 'Connected' : 'Connecting...'}
           </div>

           <div className="h-8 w-px bg-slate-200 mx-2" />

           <button 
             onClick={toggleRole}
             className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-all flex items-center gap-2"
           >
             <Zap size={12} className="text-amber-500" />
             Switch role
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-4 md:gap-6">
        
        <AnimatePresence mode="wait">
          {role === 'candidate' ? (
            /* VIEW 1: CANDIDATE ASSESSMENT */
            <motion.div 
              key="candidate-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col max-w-4xl mx-auto w-full"
            >
              <div className="flex-1 bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="px-6 md:px-8 py-4 md:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#7FE1C7] flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Live Assessment</h3>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Communication Channel Active</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-widest">End-to-End Encrypted</div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#FDFDFD]">
                  {assessmentMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                       <Sparkles size={48} className="text-amber-400 mb-4" />
                       <h4 className="text-lg font-bold">Initializing Assessment...</h4>
                       <p className="text-sm max-w-xs">Start the conversation by sending a message.</p>
                    </div>
                  )}
                  {assessmentMessages.map((msg) => {
                    const isMe = msg.sender === 'Candidate';
                    const isAI = msg.sender === 'Genius AI';
                    const isInjection = msg.sender === 'EXPERT_INJECTION';

                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[80%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 px-1">
                               <span className={`text-[9px] font-black uppercase tracking-widest ${
                                 isMe ? 'text-slate-400' : isAI ? 'text-[#3876F2]' : 'text-rose-500'
                               }`}>
                                 {isInjection ? '🔴 EXPERT INTERVENTION' : msg.sender}
                               </span>
                            </div>
                            <div className={`px-5 py-4 rounded-[24px] shadow-sm text-sm leading-relaxed transition-all ${
                              isMe 
                                ? 'bg-slate-800 text-white rounded-tr-none' 
                                : isAI 
                                  ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none' 
                                  : 'bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-tl-none font-medium'
                            }`}>
                              {msg.content}
                            </div>
                         </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-6 bg-white border-t border-slate-100">
                  <form onSubmit={handleSendCandidateMessage} className="relative flex items-center gap-3">
                    <input 
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your response to the AI..."
                      className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-[#3876F2]/20 transition-all shadow-inner placeholder:text-slate-400"
                    />
                    <button 
                      type="submit"
                      className="w-12 h-12 bg-[#3876F2] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-105 transition-all active:scale-95"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          ) : (
            /* VIEW 2: EXPERT DASHBOARD */
            <motion.div 
              key="expert-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex-1 flex flex-col md:flex-row gap-6 ${hideMirror ? 'justify-center overflow-x-auto p-4' : ''}`}
            >
              <div className={`flex-1 flex flex-col md:flex-row gap-6 ${hideMirror ? 'justify-center' : ''}`}>
                {!hideMirror && (
                  <div className="flex-[5] flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {/* TOP: CANDIDATE MIRROR (FIXED HEIGHT) */}
                    <div className="h-[430px] flex-shrink-0 bg-[#D3CFEF]/30 rounded-[32px] md:rounded-[48px] border-2 border-[#D3CFEF] flex flex-col overflow-hidden relative">
                      <div className="px-6 md:px-8 py-4 md:py-5 flex items-center justify-between border-b border-indigo-200/50 bg-[#D3CFEF]/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500 rounded-xl text-white">
                            <Eye size={16} />
                          </div>
                          <span className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest">Candidate Mirror • LIVE NATS STREAM</span>
                        </div>
                        {isAssessmentConnected && (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">Live Sync</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto p-8 space-y-4">
                        {assessmentMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender === 'Candidate' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] flex flex-col gap-1 ${msg.sender === 'Candidate' ? 'items-end' : 'items-start'}`}>
                              <span className="text-[9px] font-bold text-indigo-900/40 uppercase px-1">{msg.sender}</span>
                              <div className={`px-4 py-3 rounded-[18px] text-[13px] ${
                                msg.sender === 'Candidate' ? 'bg-[#7FE1C7] text-slate-800' : 'bg-white text-slate-500 border border-indigo-100'
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* CANDIDATE SIMULATION INPUT */}
                      {isActingAsCandidate && (
                        <div className="p-6 bg-slate-900/5 border-t border-indigo-200/50">
                          <form onSubmit={handleSendSimulationMessage} className="flex gap-3">
                            <input 
                              type="text"
                              value={simulationInput}
                              onChange={(e) => setSimulationInput(e.target.value)}
                              placeholder="Type as Candidate..."
                              className="flex-1 bg-white border-none rounded-xl px-5 py-3 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-100"
                            />
                            <button 
                              type="submit"
                              className="px-6 py-3 bg-[#7FE1C7] text-slate-800 font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-sm"
                            >
                              <Send size={16} />
                            </button>
                          </form>
                          <p className="mt-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center">
                            Candidate Simulation Mode Active
                          </p>
                        </div>
                      )}
                      {/* AI LENSES FLOATING BADGE */}
                      <div className="absolute bottom-10 left-8 bg-slate-900 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-2xl border border-white/5 backdrop-blur-sm z-30 transition-transform hover:scale-105 cursor-pointer">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Sparkles size={16} />
                        </div>
                        <span className="text-[11px] font-black text-white uppercase tracking-[0.15em]">AI Lenses</span>
                        <div className="bg-slate-800 px-2 py-0.5 rounded-lg text-[11px] font-bold text-slate-400 min-w-[20px] text-center">
                          6
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM: INTERVENTION CONTROL & QUEUE */}
                    <div className="flex flex-col gap-6">
                      {/* INTERVENTION CONTROL */}
                      <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-xl shadow-indigo-500/5">
                        <div className="mb-4">
                          <label className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={14} className="text-amber-500" />
                            {isLead ? 'Inject Intervention' : 'Propose Intervention'}
                          </label>
                        </div>
                        <form onSubmit={handleInjectQuestion} className="flex gap-4">
                          <input 
                            type="text"
                            value={injectionInput}
                            onChange={(e) => setInjectionInput(e.target.value)}
                            placeholder={isLead ? "Send a message to the candidate..." : "Propose a message..."}
                            className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm text-indigo-900 focus:ring-2 focus:ring-indigo-100"
                          />
                          <button 
                            type="submit"
                            className={`px-8 py-4 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-lg ${
                              isLead ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                            }`}
                          >
                            {isLead ? 'Send' : 'Propose'}
                            <ChevronRight size={18} />
                          </button>
                        </form>
                      </div>

                      {/* ASSESSMENT QUEUE PANEL */}
                      <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-xl shadow-indigo-500/5 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                              <MessageSquare size={16} />
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm">Intervention Queue</h4>
                          </div>
                          <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100">
                            {assessmentQueue.length} Pending
                          </span>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {assessmentQueue.length === 0 ? (
                            <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No pending actions</p>
                            </div>
                          ) : (
                            assessmentQueue.map((item) => (
                              <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-4 rounded-2xl border ${item.isAI ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}
                              >
                                <div className="flex justify-between items-start gap-3 mb-2">
                                  <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                                    item.isAI ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'
                                  }`}>
                                    {item.isAI ? 'AI SUGGESTION' : `PROPOSED BY ${item.expert}`}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">"{item.content}"</p>
                                <div className="flex gap-2">
                                  {isLead ? (
                                    <>
                                      <button 
                                        onClick={() => handleQueueAction(item.id, 'send', item.content)}
                                        className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                                      >
                                        Approve & Send
                                      </button>
                                      <button 
                                        onClick={() => handleQueueAction(item.id, 'delete')}
                                        className="px-3 py-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-rose-500 hover:border-rose-200 transition-all"
                                      >
                                        Dismiss
                                      </button>
                                    </>
                                  ) : (
                                    <div className="w-full py-2 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-bold text-center uppercase tracking-widest">
                                      Awaiting Lead Approval
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`${hideMirror ? 'flex-1 max-w-4xl flex flex-row flex-wrap gap-6 items-start justify-center' : 'flex-[5] flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar'}`}>
                  {/* EXPERT TERMINAL */}
                  <div className={`flex flex-col gap-6 ${hideMirror ? 'w-full max-w-md' : 'flex-1'}`}>
                    {/* AI CONFIGURATION PANEL */}
                    <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-xl shadow-indigo-500/5">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                          <Zap size={16} />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">AI Configuration</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-700">Auto-AI Response</span>
                            <span className="text-[9px] text-slate-400">Trigger follow-ups automatically</span>
                          </div>
                          <button 
                            onClick={() => setIsAutoAIEnabled(!isAutoAIEnabled)}
                            className={`w-10 h-5 rounded-full transition-all relative ${isAutoAIEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoAIEnabled ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border-2 border-indigo-100">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-700">AI Auto-Suggest</span>
                              <span className="px-1.5 py-0.5 bg-indigo-500 text-[7px] text-white font-black rounded uppercase tracking-tighter">Queue</span>
                            </div>
                            <span className="text-[9px] text-slate-400">Suggest questions for review</span>
                          </div>
                          <button 
                            onClick={() => setIsAutoSuggestEnabled(!isAutoSuggestEnabled)}
                            className={`w-10 h-5 rounded-full transition-all relative ${isAutoSuggestEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoSuggestEnabled ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-indigo-700">Candidate Simulation</span>
                            <span className="text-[9px] text-indigo-400">Act as candidate in the mirror</span>
                          </div>
                          <button 
                            onClick={() => setIsActingAsCandidate(!isActingAsCandidate)}
                            className={`w-10 h-5 rounded-full transition-all relative ${isActingAsCandidate ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isActingAsCandidate ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[11px] font-bold text-slate-700">Question Limit</span>
                            <span className="text-[11px] font-bold text-blue-500">{currentQuestionCount}/{maxQuestions}</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={maxQuestions} 
                            onChange={(e) => setMaxQuestions(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* AI QUESTION DESIGNER */}
                    <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-xl shadow-indigo-500/5 flex flex-col">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-100">
                          <Sparkles size={16} />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">AI Question Designer</h4>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 px-1">Specialty</label>
                          <select 
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:ring-1 focus:ring-purple-200"
                          >
                            <option>React</option>
                            <option>Node</option>
                            <option>Architecture</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 px-1">Level</label>
                          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                            {(['beginner', 'junior', 'expert'] as const).map(lvl => (
                              <button
                                key={lvl}
                                onClick={() => setDifficulty(lvl)}
                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                                  difficulty === lvl ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 px-1">Seed Context</label>
                          <input 
                            type="text" 
                            value={seed}
                            onChange={(e) => setSeed(e.target.value)}
                            placeholder="e.g. React 19, Hooks..."
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs text-slate-700 placeholder:text-slate-300 focus:ring-1 focus:ring-purple-200"
                          />
                        </div>

                        <button 
                          onClick={handleGenerateQuestion}
                          disabled={isGenerating}
                          className="w-full py-3 bg-purple-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                        >
                          {isGenerating ? 'Designing...' : 'Generate AI Question'}
                          {!isGenerating && <ChevronRight size={14} />}
                        </button>

                        {generatedQuestion && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-100"
                          >
                            <p className="text-xs text-purple-900 leading-relaxed italic mb-3">"{generatedQuestion}"</p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleProposeToQueue(generatedQuestion, true)}
                                className="flex-1 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-600 transition-colors"
                              >
                                {isLead ? 'Queue for Send' : 'Propose to Lead'}
                              </button>
                              {isLead && (
                                <button 
                                  onClick={() => handleInjectQuestion(undefined, generatedQuestion)}
                                  className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-bold hover:bg-rose-600 transition-colors"
                                >
                                  Send Now
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>


                    {/* EXPERT COLLABORATION */}
                    <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-indigo-500/5 flex flex-col overflow-hidden min-h-[400px]">
                      <div className="px-6 py-5 bg-[#D3CFEF] border-b border-indigo-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                            <Shield size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-indigo-950 text-sm">Lead Expert Panel</h4>
                            <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">Private Collaboration</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-indigo-50/10">
                        {privateExpertMessages.map((msg) => (
                          <div key={msg.id} className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">{msg.sender}</span>
                            <div className="bg-white border border-indigo-100 p-4 rounded-2xl rounded-tl-none shadow-sm text-[13px] text-slate-600 leading-relaxed">
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        <div ref={expertEndRef} />
                      </div>

                      <div className="p-4 bg-white border-t border-slate-100">
                        <form onSubmit={handleSendExpertMessage} className="flex items-center gap-2">
                          <input 
                            type="text"
                            value={expertInput}
                            onChange={(e) => setExpertInput(e.target.value)}
                            placeholder="Type a message to other experts..."
                            className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-4 text-xs focus:ring-1 focus:ring-indigo-200"
                          />
                          <button 
                            type="submit"
                            className="p-4 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors"
                          >
                            <Send size={18} />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="px-12 py-6 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-4">
           <span>Engine Status: OPTIMAL</span>
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
           <span>NATS Tunnel: SECURE P2P</span>
        </div>
        <div>
           talent.ai // village protocol v3.0
        </div>
      </footer>
    </div>
  );
}
