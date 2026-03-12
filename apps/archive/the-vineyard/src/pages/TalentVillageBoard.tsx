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
  ChevronRight,
  Activity,
  Plus,
  Copy,
  Check,
  X
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useVillageVine } from '../hooks/useVillageVine';
import { useSaveCandidateConversation } from '../hooks/useSaveCandidateConversation';
import { getSavedVillages } from '../utils/talentVillages';

// Types for consistent message handling
interface AssessmentMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isInjection?: boolean;
}

// Anti-cheat helper
const generateGibberish = (lines: number = 1) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  const genLine = () => Array.from({ length: 40 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return Array.from({ length: lines }, genLine).join('\n');
};

export function TalentVillageBoard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as 'candidate' | 'expert') || 'candidate';
  const initialName = searchParams.get('name') || '';
  const urlIsLead = searchParams.get('isLead');
  const initialIsLead = urlIsLead === 'true';
  const isInvitedExpert = initialRole === 'expert' && urlIsLead === 'false';
  const [role, setRole] = useState<'candidate' | 'expert'>(initialRole);
  const [userName, setUserName] = useState<string>(initialName);
  const [hasEnteredName, setHasEnteredName] = useState(!!initialName);
  const [tempName, setTempName] = useState('');
  const [isLeadRole, setIsLeadRole] = useState<boolean>(initialIsLead);
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
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState('');
  const [showAIAnswer, setShowAIAnswer] = useState(false);

  // Profile switcher: which panel to show in expert view
  const [viewProfile, setViewProfile] = useState<'candidate' | 'self' | 'experts'>('self');

  // Talent Vine creation (Lead Expert only)
  const [showCreateVine, setShowCreateVine] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'expert' | 'candidate'>('expert');
  const [createdVineLink, setCreatedVineLink] = useState('');
  const [createdVineId, setCreatedVineId] = useState('');
  const [vineLinkCopied, setVineLinkCopied] = useState(false);

  // Collapsible State
  const [isExpertChatCollapsed, setIsExpertChatCollapsed] = useState(false);
  const [isBottomToolsCollapsed, setIsBottomToolsCollapsed] = useState(false);
  // Which AI tool side panel is open (slides in from right)
  const [openToolPanel, setOpenToolPanel] = useState<'roster' | 'config' | 'queue' | 'designer' | null>(null);

  // Expert chat permission state (Lead controls which experts can chat with candidate)
  const [enabledExperts, setEnabledExperts] = useState<Set<string>>(new Set());
  const [canChatWithCandidate, setCanChatWithCandidate] = useState(false);
  const [isStealthMode, setIsStealthMode] = useState(false);

  // Determine if the user is the Lead expert. Invited experts (isLead=false in URL) are never Lead.
  const isLead = isInvitedExpert ? false : (isLeadRole || userName === 'Expert 1' || userName.toLowerCase().includes('lead'));
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const expertEndRef = useRef<HTMLDivElement>(null);

  // Update userName if search param changes
  useEffect(() => {
    const nameParam = searchParams.get('name');
    if (nameParam) {
      setUserName(nameParam);
      setHasEnteredName(true);
    }
  }, [searchParams]);

  const villageId = searchParams.get('villageId') || '';
  const villageName = searchParams.get('villageName') || 'Talent Village';

  // LIVE NATS VINES
  // 1. Assessment Vine: Shared between Candidate and Expert (Mirror) - persisted to DB
  const { 
    isConnected: isAssessmentConnected, 
    messages: assessmentMessages, 
    sendMessage: sendAssessmentMessage 
  } = useSaveCandidateConversation({
    vineId: villageId ? `talent-assessment-live-${villageId}` : 'talent-assessment-live',
    userName: userName,
    loadHistory: true,
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
    vineId: role === 'expert' ? (villageId ? `talent-expert-private-live-${villageId}` : 'talent-expert-private-live') : null,
    userName: userName,
  });

  // 3. Assessment Queue Vine: For moderated interventions
  const {
    messages: queueMessages,
    sendMessage: sendQueueMessage
  } = useVillageVine({
    vineId: role === 'expert' ? (villageId ? `talent-assessment-queue-live-${villageId}` : 'talent-assessment-queue-live') : null,
    userName: userName,
  });

  // 4. Permissions Vine: Lead broadcasts which experts can chat with candidate
  const {
    messages: permissionMessages,
    sendMessage: sendPermissionMessage
  } = useVillageVine({
    vineId: (villageId ? `talent-permissions-live-${villageId}` : 'talent-permissions-live'),
    userName: userName,
  });

  // 5. Stealth Alerts Vine: Only for Experts in Stealth Mode
  const {
    messages: stealthMessages,
    sendMessage: sendStealthMessage
  } = useVillageVine({
    vineId: (villageId ? `talent-stealth-live-${villageId}` : 'talent-stealth-live'),
    userName: userName,
  });

  // Derive the list of unique expert names from expert vine messages
  const expertRoster = useMemo(() => {
    const names = new Set<string>();
    privateExpertMessages.forEach(msg => {
      const senderIsLead = msg.sender === 'Expert 1' || msg.sender.toLowerCase().includes('lead');
      if (!senderIsLead) {
        names.add(msg.sender);
      }
    });
    return Array.from(names);
  }, [privateExpertMessages]);

  // Listen for permission and stealth updates (non-lead experts and candidate)
  useEffect(() => {
    // Find the latest PERMISSIONS/STEALTH message
    for (let i = permissionMessages.length - 1; i >= 0; i--) {
      try {
        const data = JSON.parse(permissionMessages[i].content);
        if (data.type === 'PERMISSIONS' && !isLead) {
          setCanChatWithCandidate(data.enabledExperts.includes(userName));
        } else if (data.type === 'STEALTH_UPDATE') {
          setIsStealthMode(data.isStealth);
        }
        // If we found a relevant message, we could break, but let's check for both
      } catch { /* skip */ }
    }
  }, [permissionMessages, userName, isLead]);

  // Lead: broadcast permissions when enabledExperts changes
  const broadcastPermissions = (newSet: Set<string>) => {
    sendPermissionMessage(userName, JSON.stringify({
      type: 'PERMISSIONS',
      enabledExperts: Array.from(newSet)
    }));
  };

  const broadcastStealthStatus = (stealth: boolean) => {
    sendPermissionMessage(userName, JSON.stringify({
      type: 'STEALTH_UPDATE',
      isStealth: stealth
    }));
  };

  const toggleStealthMode = () => {
    if (!isLead) return;
    const next = !isStealthMode;
    setIsStealthMode(next);
    broadcastStealthStatus(next);
  };

  const toggleExpertPermission = (expertName: string) => {
    setEnabledExperts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expertName)) {
        newSet.delete(expertName);
      } else {
        newSet.add(expertName);
      }
      broadcastPermissions(newSet);
      return newSet;
    });
  };

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

  // Combined messages for Expert Mirror (Assessment + Stealth Alerts)
  const allMessagesForExpert = useMemo(() => {
    const combined = [
      ...assessmentMessages.map(m => ({ ...m, isStealth: false })),
      ...stealthMessages.map(m => ({ ...m, isStealth: true }))
    ];
    // Sort by timestamp
    return combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [assessmentMessages, stealthMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    expertEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assessmentMessages, privateExpertMessages]);

  // No global copy listener - restricted to chat area via onCopy

  // Handle initial message after creation
  useEffect(() => {
    const startVining = searchParams.get('startVining') === 'true';
    if (startVining && isAssessmentConnected && isLead) {
      sendAssessmentMessage(userName, 'Start Vining...');
      // Remove the flag from URL to prevent duplicate sends on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('startVining');
      setSearchParams(newParams, { replace: true });
    }
  }, [isAssessmentConnected, isLead, searchParams, setSearchParams, userName, sendAssessmentMessage]);

  // Anti-cheat Handlers
  const handleCopyAction = () => {
    if (role === 'candidate') {
      const selectedText = window.getSelection()?.toString() || '';
      if (!selectedText) return;
      const gibberish = `COPIED-\n${generateGibberish(2)}\nOriginal: ${selectedText}`;
      
      if (isStealthMode) {
        sendStealthMessage(userName, gibberish);
      } else {
        sendAssessmentMessage(userName, gibberish);
      }
    }
  };

  const handlePasteAction = (e: React.ClipboardEvent, isSim?: boolean) => {
    if (role === 'candidate' || isSim) {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const gibberish = `🚨 PASTED- ${generateGibberish(1)} 🚨\nOriginal: ${pastedText}`;
      const sender = isSim ? 'Candidate' : userName;
      
      // Auto-submit as requested
      if (isStealthMode) {
        sendStealthMessage(sender, gibberish);
      } else {
        sendAssessmentMessage(sender, gibberish);
      }
      
      // Also update the input so they see what happened, but it's already sent
      if (isSim) setSimulationInput(''); else setInputText('');
    }
  };

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
        await sendAssessmentMessage(userName, text || '');
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
        await sendAssessmentMessage(userName, content);
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
      setGeneratedAnswer('');
      setShowAIAnswer(false);
      setIsGenerating(false);
    }, 800);
  };

  const handleGenerateAnswer = () => {
    if (!generatedQuestion) return;
    setIsGeneratingAnswer(true);
    
    setTimeout(() => {
      // Simple mock answers based on question content
      let answer = "To answer a question about " + specialty + ", one should focus on best practices, scalability, and performance optimization. Provide code examples where relevant.";
      
      if (generatedQuestion.includes('state management')) {
        answer = "A robust state management strategy involves choosing between local state (useState/useReducer) and global state (Context/Redux/Zustand). For large-scale apps, Zustand or Redux are preferred for predictable state transitions and better debugging tools.";
      } else if (generatedQuestion.includes('hooks')) {
        answer = "Hooks allow for easier logic reuse, better code organization than HOCs or Render Props, and they work perfectly with functional components. They also avoid the 'this' keyword complexities found in class components.";
      } else if (generatedQuestion.includes('event loop')) {
        answer = "The Node.js event loop allows for non-blocking I/O operations by offloading tasks to the system kernel whenever possible. It consists of several phases including timers, pending callbacks, poll, check, and close callbacks.";
      } else if (generatedQuestion.includes('microservices')) {
        answer = "Microservices offer independent scaling and technology diversity but introduce network complexity and data consistency challenges (Eventual Consistency). Monoliths are simpler to deploy and test initially but can become a bottleneck as the team grows.";
      }
      
      setGeneratedAnswer(answer);
      setIsGeneratingAnswer(false);
      setShowAIAnswer(true);
    }, 1200);
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
    if (newRole === 'expert') {
      setHasEnteredName(false); // Force name entry when switching to expert
    } else {
      setHasEnteredName(true); // Candidates bypass name entry for now
    }
    setSearchParams({ role: newRole, name: userName });
  };

  const handleCreateTalentVine = () => {
    if (inviteRole === 'expert' && !inviteName.trim()) return;
    const vineId = `talent-${Math.random().toString(36).slice(2, 10)}`;
    let link = `${window.location.origin}/talent-village?role=${inviteRole}&vineId=${vineId}&villageId=${villageId}&villageName=${encodeURIComponent(villageName)}`;
    if (inviteRole === 'expert') {
      if (inviteName.trim()) link += `&name=${encodeURIComponent(inviteName.trim())}`;
      link += `&isLead=false`;
    }
    setCreatedVineId(vineId);
    setCreatedVineLink(link);
  };

  const copyVineLink = () => {
    navigator.clipboard.writeText(createdVineLink);
    setVineLinkCopied(true);
    setTimeout(() => setVineLinkCopied(false), 2000);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setUserName(tempName.trim());
      setHasEnteredName(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('name', tempName.trim());
      if (role === 'expert') {
        newParams.set('isLead', isInvitedExpert ? 'false' : isLeadRole.toString());
      }
      setSearchParams(newParams);
    }
  };

  // Hub: show villages list + Start new when no village selected and no name
  const savedVillages = getSavedVillages();
  const showHub = !villageId && !hasEnteredName && !initialName;

  if (showHub) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-900">
                Genius<span className="text-indigo-600">Talent.ai</span>
              </span>
              <span className="ml-3 text-xs font-black text-slate-400 uppercase tracking-widest">Talent Village</span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Villages</h1>
            <p className="text-slate-500 mt-1">Select a village to join or start a new assessment session.</p>
          </div>

          <div className="grid gap-4">
            {savedVillages.map((v) => (
              <motion.div
                key={v.villageId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/talent-village?villageId=${v.villageId}&villageName=${encodeURIComponent(v.villageName)}&role=expert`)}
              >
                <div className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                    <Users size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{v.villageName}</h3>
                    <p className="text-sm text-slate-500 truncate mt-0.5">{v.description}</p>
                    <p className="text-xs text-slate-400 mt-1">Lead: {v.leadName}</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>

          {savedVillages.length === 0 && (
            <p className="text-slate-500 text-center py-8">No villages yet. Start your first one below.</p>
          )}

          <Link
            to="/talent-village/setup"
            className="mt-8 flex items-center justify-center gap-3 w-full py-5 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-indigo-600 font-bold"
          >
            <Plus size={24} />
            Start New Village
          </Link>
        </div>
      </div>
    );
  }

  if (!hasEnteredName) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl p-8 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
              {role === 'candidate' ? <User size={32} /> : <Shield size={32} />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Welcome, {role === 'candidate' ? 'Candidate' : 'Expert'}</h2>
              <p className="text-slate-500 text-sm mt-2">
                {role === 'candidate' 
                  ? "Please enter your name to begin your assessment." 
                  : "Please enter your name to join the Talent Village Board."}
              </p>
            </div>
            <form onSubmit={handleNameSubmit} className="w-full space-y-4">
              <input
                type="text"
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder={role === 'candidate' ? "e.g. John Doe" : "e.g. Sarah, Alex..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-center font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {role === 'expert' && !isInvitedExpert && (
                <label className="flex items-center justify-center gap-2 cursor-pointer mt-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={isLeadRole}
                    onChange={(e) => setIsLeadRole(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span>Join as Lead Expert</span>
                </label>
              )}
              {role === 'expert' && isInvitedExpert && (
                <p className="text-xs text-slate-500 mt-2 text-center">You’re joining as an Expert. You’ll see the Candidate mirror and Expert vine only.</p>
              )}
              <button
                type="submit"
                disabled={!tempName.trim()}
                className="w-full bg-indigo-600 text-white font-bold rounded-xl py-4 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join {role === 'candidate' ? 'Assessment' : 'Board'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1e293b] font-sans overflow-hidden flex flex-col">
      {/* Dynamic Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-display font-semibold tracking-tight flex items-center">
              Genius <span className="text-[#3876F2] font-bold ml-1">Talent.ai</span>
              {villageId && (
                <span className="ml-4 px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  {villageName}
                </span>
              )}
            </h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              LIVE ASSESSMENT ENGINE — {role === 'candidate' ? 'CANDIDATE PORTAL' : isLead ? 'LEAD DASHBOARD' : 'EXPERT TERMINAL'}
            </span>
            {role === 'expert' && isLead && (
              <span className="text-[9px] font-bold text-indigo-500 mt-0.5">You: {userName} (Lead)</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Connection Status */}
           <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all ${
             isAssessmentConnected ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'
           }`}>
             <Activity size={10} className={isAssessmentConnected ? 'animate-pulse' : ''} />
             NATS: {isAssessmentConnected ? 'CONNECTED' : 'CONNECTING...'}
           </div>

           <div className="h-8 w-px bg-slate-200 mx-2" />

           {/* Profile Switcher (Expert view) */}
           {role === 'expert' ? (
             <div className="flex items-center gap-2">
               <div className="flex p-1 bg-slate-100 rounded-full gap-1">
                 {([
                   { id: 'candidate', label: 'CANDIDATE', icon: User, title: 'See candidate view' },
                   { id: 'self', label: isLead ? 'LEAD DASHBOARD' : 'MY DASHBOARD', icon: Shield, title: isLead ? 'My lead dashboard — chat with candidate, advanced tools, invite others' : 'My expert dashboard' },
                   { id: 'experts', label: 'EXPERTS', icon: Users, title: 'Expert collaboration' },
                 ] as const).map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setViewProfile(tab.id)}
                     title={tab.title}
                     className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                       viewProfile === tab.id
                         ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                         : 'text-slate-500 hover:text-slate-700'
                     }`}
                   >
                     <tab.icon size={12} />
                     {tab.label}
                   </button>
                 ))}
               </div>
                {isLead && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleStealthMode}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all ${
                        isStealthMode 
                          ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm shadow-rose-100' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                      title="Stealth Mode: Alerts only visible to experts"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isStealthMode ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        Stealth: {isStealthMode ? 'ON' : 'OFF'}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => { setShowCreateVine(true); setCreatedVineLink(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3876F2] text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600 transition-all shadow-md shadow-blue-200"
                      title="Invite candidate or other experts"
                    >
                      <Plus size={12} />
                      INVITE
                    </button>
                  </div>
                )}
             </div>
           ) : (
             <button 
               onClick={toggleRole}
               className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-all flex items-center gap-2"
             >
               <Zap size={12} className="text-amber-500" />
               Expert View
             </button>
           )}

           {role === 'expert' && (
             <button
               onClick={toggleRole}
               className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-all"
             >
               EXIT EXPERT
             </button>
           )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-y-auto p-4 md:p-6 gap-4 md:gap-6">
        
        <AnimatePresence mode="wait">
          {role === 'candidate' ? (
            /* VIEW 1: CANDIDATE ASSESSMENT */
            <motion.div 
              key="candidate-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-shrink-0 flex flex-col h-[65vh] max-w-4xl mx-auto w-full resize-y overflow-hidden"
            >
              <div className="flex-1 min-h-0 bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
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

                <div 
                  className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6 bg-[#FDFDFD]"
                  onCopy={handleCopyAction}
                >
                  {assessmentMessages.length === 0 && (
                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-12 opacity-40">
                       <Sparkles size={48} className="text-amber-400 mb-4" />
                       <h4 className="text-lg font-bold">Initializing Assessment...</h4>
                       <p className="text-sm max-w-xs">Start the conversation by sending a message.</p>
                    </div>
                  )}
                  {assessmentMessages.map((msg) => {
                    const isMe = msg.sender === userName;
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
                            <div 
                              className={`px-5 py-4 rounded-[24px] shadow-sm text-sm leading-relaxed transition-all whitespace-pre-wrap ${
                                isMe 
                                  ? 'bg-slate-800 text-white rounded-tr-none' 
                                  : isAI 
                                    ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none' 
                                    : 'bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-tl-none font-medium'
                              }`}
                            >
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
                      onPaste={handlePasteAction}
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
              {/* Profile: Candidate — show the candidate mirror full-screen */}
              {viewProfile === 'candidate' && (
                <div className="flex-shrink-0 flex flex-col h-[65vh] max-w-4xl mx-auto w-full resize-y overflow-hidden">
                  <div className="flex-1 min-h-0 bg-white rounded-[32px] md:rounded-[40px] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="px-6 md:px-8 py-4 border-b border-slate-100 flex items-center gap-3 bg-indigo-50/30">
                      <div className="p-2 bg-indigo-500 rounded-xl text-white"><Eye size={16} /></div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Candidate View</h3>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Viewing as Candidate</p>
                      </div>
                    </div>
                    <div 
                      className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6 bg-[#FDFDFD]"
                      onCopy={() => handleCopyAction()}
                    >
                      {allMessagesForExpert.length === 0 && (
                        <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-12 opacity-40">
                          <Sparkles size={48} className="text-amber-400 mb-4" />
                          <h4 className="text-lg font-bold">No messages yet</h4>
                          <p className="text-sm max-w-xs">The candidate hasn't sent anything yet.</p>
                        </div>
                      )}
                      {allMessagesForExpert.map((msg: any) => {
                        const isCandidate = msg.sender === 'Candidate';
                        const isInjection = msg.sender === 'EXPERT_INJECTION';
                        const isStealth = msg.isStealth;
                        
                        return (
                          <div key={msg.id} className={`flex ${isCandidate ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] flex flex-col gap-1 ${isCandidate ? 'items-end' : 'items-start'}`}>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-1 flex items-center gap-1.5 ${
                                isCandidate ? 'text-slate-400' : isInjection ? 'text-rose-500' : 'text-[#3876F2]'
                              }`}>
                                {isInjection ? '🔴 EXPERT INTERVENTION' : msg.sender}
                                {isStealth && (
                                  <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded text-[8px] animate-pulse">🕵️ STEALTH ALERT</span>
                                )}
                              </span>
                              <div className={`px-5 py-4 rounded-[24px] shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                                isCandidate ? 'bg-slate-800 text-white rounded-tr-none'
                                : isInjection ? 'bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-tl-none'
                                : isStealth ? 'bg-rose-50 border-2 border-dashed border-rose-300 text-rose-900 rounded-tl-none'
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                              }`}>{msg.content}</div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                    {/* Simulation input for expert acting as candidate */}
                    <div className="p-6 bg-white border-t border-slate-100">
                      <form onSubmit={handleSendSimulationMessage} className="flex gap-3">
                        <input
                          type="text"
                          value={simulationInput}
                          onChange={(e) => setSimulationInput(e.target.value)}
                          onPaste={(e) => handlePasteAction(e, true)}
                          placeholder="Type as Candidate (simulation)..."
                          className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-100"
                        />
                        <button type="submit" className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                          <Send size={18} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile: Experts — show private expert collaboration */}
              {viewProfile === 'experts' && (
                <div className="flex-shrink-0 flex flex-col h-[65vh] max-w-4xl mx-auto w-full resize-y overflow-hidden">
                  <div className="flex-1 min-h-0 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-indigo-500/5 flex flex-col overflow-hidden">
                    <div className="px-6 py-5 bg-[#D3CFEF] border-b border-indigo-200 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                          <Shield size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-indigo-950 text-sm">{userName}</h4>
                          <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">Channel · all experts see this chat · {isExpertConnected ? 'Live' : 'Connecting...'}</p>
                        </div>
                      </div>
                      {isLead && (
                        <button
                          onClick={() => { setShowCreateVine(true); setCreatedVineLink(''); setInviteName(''); setInviteRole('expert'); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all"
                        >
                          <Plus size={12} /> Invite
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-indigo-50/10">
                      {privateExpertMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                          <Users size={40} className="text-indigo-300 mb-3" />
                          <p className="text-sm font-bold text-indigo-400">No expert messages yet</p>
                          <p className="text-xs text-indigo-300 mt-1">Everyone in this village sees messages here. Invite experts to join the channel.</p>
                        </div>
                      )}
                      {privateExpertMessages.map((msg) => {
                        const isMe = msg.sender === userName;
                        const senderIsLead = msg.sender === 'Expert 1' || msg.sender.toLowerCase().includes('lead');
                        const displayName = isMe && isLead ? 'Lead' : (senderIsLead ? 'Lead' : msg.sender);
                        // Current expert's messages on the right; other experts on the left
                        return (
                          <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">{displayName}</span>
                            <div className={`border p-4 rounded-2xl shadow-sm text-[13px] leading-relaxed max-w-[85%] ${
                              isMe
                                ? 'bg-indigo-600 text-white border-indigo-700 rounded-tl-none'
                                : 'bg-white text-slate-600 border-indigo-100 rounded-tr-none'
                            }`}>{msg.content}</div>
                          </div>
                        );
                      })}
                      <div ref={expertEndRef} />
                    </div>
                    <div className="p-4 bg-white border-t border-slate-100">
                      <form onSubmit={handleSendExpertMessage} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={expertInput}
                          onChange={(e) => setExpertInput(e.target.value)}
                          placeholder="Message the channel..."
                          className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-4 text-xs focus:ring-1 focus:ring-indigo-200"
                        />
                        <button type="submit" className="p-4 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors">
                          <Send size={18} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile: Self — Candidate chat (left) + Expert Vine Chat (right) at top, tools below */}
              {viewProfile === 'self' && (
              <div className="flex-1 flex flex-col min-h-0 gap-6 overflow-hidden pr-1">

                {/* TOP ROW: Candidate Chat + Expert Vine Chat side by side */}
                <div className="flex-shrink-0 flex flex-col md:flex-row gap-6 h-[65vh] resize-y overflow-hidden">
                  {/* LEFT: Candidate Mirror */}
                  <div className="flex-1 min-h-0 bg-[#D3CFEF]/30 rounded-[32px] border-2 border-[#D3CFEF] flex flex-col overflow-hidden relative">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-indigo-200/50 bg-[#D3CFEF]/50 flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500 rounded-xl text-white">
                          <Eye size={16} />
                        </div>
                        <span className="text-xs font-bold text-indigo-900/80 uppercase tracking-widest">Candidate Mirror · Live</span>
                      </div>
                      {isAssessmentConnected && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">Live Sync</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                      {assessmentMessages.length === 0 && (
                        <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center opacity-30">
                          <Eye size={32} className="text-indigo-300 mb-2" />
                          <p className="text-sm font-medium text-slate-400">Waiting for candidate...</p>
                        </div>
                      )}
                      {assessmentMessages.map((msg) => {
                        const isMe = msg.sender === userName;
                        return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] flex flex-col gap-1 ${isMe ? 'items-start' : 'items-end'}`}>
                            <span className="text-[9px] font-bold text-indigo-900/40 uppercase px-1">{msg.sender}</span>
                            <div className={`px-4 py-3 rounded-[18px] text-[13px] ${
                              isMe ? 'bg-indigo-600 text-white rounded-tl-none' : 'bg-[#7FE1C7] text-slate-800 rounded-tr-none'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Lead Expert Chat to Candidate Vine */}
                    {isLead && (
                      <div className="p-4 bg-white border-t border-indigo-200/50 flex-shrink-0">
                        <form onSubmit={handleSendCandidateMessage} className="flex gap-2">
                          <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Message the candidate..."
                            className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                          />
                          <button 
                            type="submit" 
                            disabled={!inputText.trim()}
                            className="px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send size={16} />
                            <span>Send</span>
                          </button>
                        </form>
                      </div>
                    )}

                    {!isLead && !canChatWithCandidate && (
                      <div className="p-4 bg-slate-50 border-t border-slate-200/50 flex-shrink-0 space-y-3">
                         <span className="block text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Read-Only Mirror</span>
                         <form onSubmit={(e) => { e.preventDefault(); handleProposeToQueue(injectionInput); setInjectionInput(''); }} className="flex gap-2">
                           <input
                             type="text"
                             value={injectionInput}
                             onChange={(e) => setInjectionInput(e.target.value)}
                             placeholder="Suggest a question for Lead to send..."
                             className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-amber-100 placeholder:text-slate-400"
                           />
                           <button
                             type="submit"
                             disabled={!injectionInput.trim()}
                             className="px-4 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all text-[10px] uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             Propose to Queue
                           </button>
                         </form>
                      </div>
                    )}

                    {!isLead && canChatWithCandidate && (
                      <div className="p-4 bg-white border-t border-emerald-200/50 flex-shrink-0">
                        <form onSubmit={handleSendCandidateMessage} className="flex gap-2">
                          <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Message the candidate..."
                            className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400"
                          />
                          <button 
                            type="submit" 
                            disabled={!inputText.trim()}
                            className="px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send size={16} />
                            <span>Send</span>
                          </button>
                        </form>
                        <div className="mt-1 text-center">
                          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Chat Enabled by Lead</span>
                        </div>
                      </div>
                    )}

                    {/* Simulation input (Lead Only) */}
                    {isLead && isActingAsCandidate && (
                      <div className="p-4 bg-slate-900/5 border-t border-indigo-200/50 flex-shrink-0">
                        <form onSubmit={handleSendSimulationMessage} className="flex gap-2">
                          <input
                            type="text"
                            value={simulationInput}
                            onChange={(e) => setSimulationInput(e.target.value)}
                            placeholder="Type as Candidate..."
                            className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-100"
                          />
                          <button type="submit" className="px-4 py-3 bg-[#7FE1C7] text-slate-800 font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-sm">
                            <Send size={16} />
                          </button>
                        </form>
                      </div>
                    )}

                    {/* AI Lenses badge — hidden for now
                    <div className="absolute bottom-20 right-4 bg-slate-900 rounded-full px-4 py-2 flex items-center gap-2 shadow-xl border border-white/5 z-10 cursor-pointer hover:scale-105 transition-transform">
                      <Sparkles size={14} className="text-indigo-400" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">AI Lenses</span>
                      <div className="bg-slate-800 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-slate-400">6</div>
                    </div>
                    */}
                  </div>

                  {/* RIGHT: Expert Vine Chat */}
                  <motion.div 
                    animate={{ 
                      width: isExpertChatCollapsed ? '48px' : 'auto',
                      flex: isExpertChatCollapsed ? '0 0 48px' : '1 1 0%'
                    }}
                    className="min-h-0 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-indigo-500/5 flex flex-col overflow-hidden relative"
                  >
                    <div className="px-6 py-4 bg-[#D3CFEF] border-b border-indigo-200 flex justify-between items-center flex-shrink-0">
                      {!isExpertChatCollapsed ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                              <Shield size={18} />
                            </div>
                            <div>
                              <h4 className="font-bold text-indigo-950 text-sm">{isLead ? 'Expert Vine Chat' : userName}</h4>
                              <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">
                                CHANNEL · ALL EXPERTS SEE THIS CHAT · {isExpertConnected ? 'LIVE' : 'CONNECTING...'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isLead && (
                              <button
                                onClick={() => { setShowCreateVine(true); setCreatedVineLink(''); setInviteName(''); setInviteRole('expert'); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all"
                              >
                                <Plus size={12} /> INVITE
                              </button>
                            )}
                            <button 
                              onClick={() => setIsExpertChatCollapsed(true)}
                              className="p-2 hover:bg-black/5 rounded-full transition-colors text-indigo-900/40"
                              title="Collapse Chat"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <button 
                          onClick={() => setIsExpertChatCollapsed(false)}
                          className="w-full h-full py-6 flex flex-col items-center gap-8 text-indigo-900/40 hover:text-indigo-900 transition-colors"
                          title="Expand Expert Chat"
                        >
                          <Shield size={18} />
                          <div className="rotate-90 whitespace-nowrap text-[10px] font-black uppercase tracking-widest">Expert Chat</div>
                          <div className="flex-1" />
                          <ChevronRight size={18} className="rotate-180" />
                        </button>
                      )}
                    </div>

                    {!isExpertChatCollapsed && (
                      <>
                        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bg-indigo-50/10">
                      {privateExpertMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                          <Users size={32} className="text-indigo-300 mb-2" />
                          <p className="text-xs font-bold text-indigo-400">No expert messages yet</p>
                          <p className="text-[10px] text-indigo-300 mt-1">Everyone in this village sees messages here.</p>
                        </div>
                      )}
                      {privateExpertMessages.map((msg) => {
                        const isMe = msg.sender === userName;
                        const senderIsLead = msg.sender === 'Expert 1' || msg.sender.toLowerCase().includes('lead');
                        const displayName = isMe && isLead ? 'Lead' : (senderIsLead ? 'Lead' : msg.sender);
                        // Current expert's messages on the right; other experts on the left
                        return (
                          <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">{displayName}</span>
                            <div className={`border p-3 rounded-2xl shadow-sm text-[13px] leading-relaxed max-w-[85%] ${
                              isMe
                                ? 'bg-indigo-600 text-white border-indigo-700 rounded-tl-none'
                                : 'bg-white text-slate-600 border-indigo-100 rounded-tr-none'
                            }`}>{msg.content}</div>
                          </div>
                        );
                      })}
                      <div ref={expertEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                      <form onSubmit={handleSendExpertMessage} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={expertInput}
                          onChange={(e) => setExpertInput(e.target.value)}
                          placeholder="Message the channel..."
                          className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-indigo-200"
                        />
                        <button type="submit" className="p-3 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors">
                          <Send size={16} />
                        </button>
                      </form>
                    </div>
                  </>
                )}
                </motion.div>
              </div>

              {/* BOTTOM ROW (Lead Expert Only) — tool strip + slide-in side panels */}
              {isLead && (
                <div className="flex flex-col gap-4 mt-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800 rounded-lg text-white">
                        <Zap size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">AI Intervention & Tools</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">MODERATION & OPTIMIZATION SUITE</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { if (!isBottomToolsCollapsed) setOpenToolPanel(null); setIsBottomToolsCollapsed(!isBottomToolsCollapsed); }}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                    >
                      {isBottomToolsCollapsed ? (
                        <>
                          <Plus size={14} />
                          <span>Show Tools</span>
                        </>
                      ) : (
                        <>
                          <X size={14} />
                          <span>HIDE TOOLS</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Tool strip: open panels from the right */}
                  <AnimatePresence>
                    {!isBottomToolsCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex flex-wrap gap-2 pb-4"
                      >
                        <button
                          onClick={() => setOpenToolPanel(openToolPanel === 'roster' ? null : 'roster')}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${openToolPanel === 'roster' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'}`}
                        >
                          <Users size={14} />
                          Expert Roster
                        </button>
                        <button
                          onClick={() => setOpenToolPanel(openToolPanel === 'config' ? null : 'config')}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${openToolPanel === 'config' ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}
                        >
                          <Zap size={14} />
                          AI Configuration
                        </button>
                        <button
                          onClick={() => setOpenToolPanel(openToolPanel === 'queue' ? null : 'queue')}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${openToolPanel === 'queue' ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-amber-50'}`}
                        >
                          <MessageSquare size={14} />
                          Intervention Queue
                          {assessmentQueue.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">{assessmentQueue.length}</span>
                          )}
                        </button>
                        <button
                          onClick={() => setOpenToolPanel(openToolPanel === 'designer' ? null : 'designer')}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${openToolPanel === 'designer' ? 'bg-purple-500 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50'}`}
                        >
                          <Sparkles size={14} />
                          AI Question Designer
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Slide-in side panel (right) */}
                  <AnimatePresence>
                    {openToolPanel && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setOpenToolPanel(null)}
                          className="fixed inset-0 bg-black/30 z-40"
                        />
                        <motion.div
                          initial={{ x: '100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '100%' }}
                          transition={{ type: 'tween', duration: 0.25 }}
                          className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col overflow-hidden"
                        >
                          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                            <span className="font-bold text-slate-800 text-sm">
                              {openToolPanel === 'roster' && 'Expert Roster'}
                              {openToolPanel === 'config' && 'AI Configuration'}
                              {openToolPanel === 'queue' && 'Intervention Queue'}
                              {openToolPanel === 'designer' && 'AI Question Designer'}
                            </span>
                            <button onClick={() => setOpenToolPanel(null)} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                              <X size={18} />
                            </button>
                          </div>
                          <div className="flex-1 overflow-y-auto p-6">
                  {openToolPanel === 'roster' && (
                  <div className="space-y-3">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-4">CANDIDATE CHAT ACCESS</p>
                      {expertRoster.length === 0 ? (
                        <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                          <Users size={24} className="text-slate-200 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NO EXPERTS CONNECTED YET</p>
                          <p className="text-[9px] text-slate-400 mt-1">Experts will appear here after they send a message in the Expert Vine Chat.</p>
                        </div>
                      ) : (
                        expertRoster.map(name => (
                          <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <User size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700">{name}</span>
                                <span className="text-[9px] text-slate-400">
                                  {enabledExperts.has(name) ? 'Can chat with candidate' : 'Read-only mirror'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleExpertPermission(name)}
                              className={`w-10 h-5 rounded-full transition-all relative ${enabledExperts.has(name) ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enabledExperts.has(name) ? 'left-6' : 'left-1'}`} />
                            </button>
                          </div>
                        ))
                      )}
                  </div>
                  )}

                  {openToolPanel === 'config' && (
                  <div className="space-y-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-700">Auto-AI Response</span>
                          <span className="text-[9px] text-slate-400">Trigger follow-ups automatically.</span>
                        </div>
                        <button onClick={() => setIsAutoAIEnabled(!isAutoAIEnabled)} className={`w-10 h-5 rounded-full transition-all relative ${isAutoAIEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoAIEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border-2 border-indigo-100">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-700">AI Auto-Suggest</span>
                            <span className="px-1.5 py-0.5 bg-indigo-500 text-[7px] text-white font-black rounded uppercase tracking-tighter">QUEUE</span>
                          </div>
                          <span className="text-[9px] text-slate-400">Suggest questions for review.</span>
                        </div>
                        <button onClick={() => setIsAutoSuggestEnabled(!isAutoSuggestEnabled)} className={`w-10 h-5 rounded-full transition-all relative ${isAutoSuggestEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoSuggestEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-indigo-700">Candidate Simulation</span>
                          <span className="text-[9px] text-indigo-400">Act as candidate in the mirror.</span>
                        </div>
                        <button onClick={() => setIsActingAsCandidate(!isActingAsCandidate)} className={`w-10 h-5 rounded-full transition-all relative ${isActingAsCandidate ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isActingAsCandidate ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[11px] font-bold text-slate-700">Question Limit</span>
                          <span className="text-[11px] font-bold text-blue-500">{currentQuestionCount}/{maxQuestions}</span>
                        </div>
                        <input type="range" min="1" max="10" value={maxQuestions} onChange={(e) => setMaxQuestions(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                      </div>
                    </div>
                  </div>
                  )}

                  {openToolPanel === 'queue' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100 uppercase tracking-wider">
                        {assessmentQueue.length} Pending
                      </span>
                    </div>
                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                      {assessmentQueue.length === 0 ? (
                        <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NO PENDING ACTIONS</p>
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
                                  <button onClick={() => handleQueueAction(item.id, 'send', item.content)} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-colors shadow-sm">
                                    Approve & Send
                                  </button>
                                  <button onClick={() => handleQueueAction(item.id, 'delete')} className="px-3 py-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-rose-500 hover:border-rose-200 transition-all">
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
                  )}

                  {openToolPanel === 'designer' && (
                  <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 px-1">SPECIALTY</label>
                        <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:ring-1 focus:ring-purple-200">
                          <option>React</option>
                          <option>Node</option>
                          <option>Architecture</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 px-1">LEVEL</label>
                        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                          {(['beginner', 'junior', 'expert'] as const).map(lvl => (
                            <button key={lvl} onClick={() => setDifficulty(lvl)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${difficulty === lvl ? 'bg-indigo-500 text-white shadow-sm' : 'bg-white text-slate-500 hover:text-slate-700'}`}>
                              {lvl === 'beginner' ? 'BEGINNER' : lvl === 'junior' ? 'JUNIOR' : 'EXPERT'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 px-1">SEED CONTEXT</label>
                        <input type="text" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="e.g. React 19, Hooks..." className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs text-slate-700 placeholder:text-slate-300 focus:ring-1 focus:ring-purple-200" />
                      </div>
                      <button onClick={handleGenerateQuestion} disabled={isGenerating} className="w-full py-3 bg-purple-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all flex items-center justify-center gap-2">
                        {isGenerating ? 'Designing...' : 'Generate AI Question'}
                        {!isGenerating && <ChevronRight size={14} />}
                      </button>
                      {generatedQuestion && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 px-1">Exact Question for Candidate</p>
                          <p className="text-xs text-purple-900 leading-relaxed italic mb-4 p-3 bg-white/50 rounded-xl border border-purple-100/50">"{generatedQuestion}"</p>
                          
                          {showAIAnswer && generatedAnswer && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 overflow-hidden"
                            >
                              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <Shield size={10} /> AI Expected Answer
                              </p>
                              <p className="text-[11px] text-emerald-900 leading-relaxed">{generatedAnswer}</p>
                            </motion.div>
                          )}

                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button onClick={() => handleProposeToQueue(generatedQuestion, true)} className="flex-1 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-600 transition-colors">
                                {isLead ? 'Queue for Send' : 'Propose to Lead'}
                              </button>
                              {isLead && (
                                <button onClick={() => handleInjectQuestion(undefined, generatedQuestion)} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-bold hover:bg-rose-600 transition-colors">
                                  Send Now
                                </button>
                              )}
                            </div>
                            
                            {isLead && !showAIAnswer && (
                              <button 
                                onClick={handleGenerateAnswer}
                                disabled={isGeneratingAnswer}
                                className="w-full py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2"
                              >
                                {isGeneratingAnswer ? 'Analyzing Question...' : 'See AI Answer'}
                                {!isGeneratingAnswer && <Eye size={12} />}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                  </div>
                  )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
        </div>
      )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Vine Creation Modal (Lead Expert only) */}
      <AnimatePresence>
        {showCreateVine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowCreateVine(false); setCreatedVineLink(''); } }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-blue-500/10 border border-slate-200 p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#3876F2] flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Invite to Village</h2>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Send link to candidate or other experts</p>
                  </div>
                </div>
                <button onClick={() => { setShowCreateVine(false); setCreatedVineLink(''); }} className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Role Selection */}
                <div className="flex p-1 bg-slate-100 rounded-full gap-1">
                  <button
                    onClick={() => { setInviteRole('candidate'); setCreatedVineLink(''); setInviteName(''); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${inviteRole === 'candidate' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Candidate
                  </button>
                  <button
                    onClick={() => { setInviteRole('expert'); setCreatedVineLink(''); setInviteName(''); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${inviteRole === 'expert' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Expert
                  </button>
                </div>

                {inviteRole === 'expert' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">
                      Expert Name
                    </label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateTalentVine()}
                      placeholder="e.g. Expert Celeste"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-[#3876F2]/20 focus:border-[#3876F2]/40 transition-all outline-none"
                      autoFocus
                    />
                  </div>
                )}

                <button
                  onClick={handleCreateTalentVine}
                  disabled={inviteRole === 'expert' && !inviteName.trim()}
                  className="w-full py-4 bg-[#3876F2] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  Generate {inviteRole === 'candidate' ? 'Candidate' : 'Expert'} Link
                </button>

                {createdVineLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">✅ Vine Created</span>
                        <span className="text-[9px] font-mono text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-lg">{createdVineId}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white border border-emerald-100 rounded-xl p-2">
                        <span className="flex-1 text-[10px] font-mono text-slate-500 truncate">{createdVineLink}</span>
                        <button
                          onClick={copyVineLink}
                          className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                            vineLinkCopied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {vineLinkCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-emerald-600 mt-2 text-center">
                        Share this link {inviteName ? `with ` : `for the candidate `}<strong>{inviteName}</strong> to join the vine
                      </p>
                    </div>
                    <button
                      onClick={() => { setShowCreateVine(false); setCreatedVineLink(''); }}
                      className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
