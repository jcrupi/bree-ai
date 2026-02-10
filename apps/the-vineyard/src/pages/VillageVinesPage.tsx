import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Send, 
  X, 
  ArrowLeft, 
  MessageCircle, 
  Share2, 
  Link as LinkIcon, 
  Trash2,
  Check,
  UserPlus,
  Rocket,
  Shield,
  Activity,
  Plus
} from 'lucide-react';
import { TEAM_MEMBERS } from '../data/teamMembers';
import { useVillageVine } from '../hooks/useVillageVine';

interface VillageMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isMe?: boolean;
}

export function VillageVinesPage() {
  const [searchParams] = useSearchParams();
  const inviteeName = searchParams.get('invitee');
  
  const [inputText, setInputText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [topic, setTopic] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [activeVineId, setActiveVineId] = useState<string | null>(null);
  const [currentUser] = useState('You'); // In a real app, get from auth context
  
  // Real NATS integration
  const { isConnected, messages: natsMessages, sendMessage, createVine } = useVillageVine({
    vineId: activeVineId,
    onMessage: (msg) => {
      console.log('📨 Received NATS message:', msg);
    },
    onError: (err) => {
      console.error('🔥 NATS error:', err);
    }
  });

  // Transform NATS messages to include isMe flag
  const messages: VillageMessage[] = natsMessages.map(msg => ({
    ...msg,
    isMe: msg.sender === currentUser
  }));
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inviteeName && !activeVineId) {
      // Auto-create vine when invitee joins via link
      setTopic(`Chat with ${inviteeName}`);
      const vineId = `village-demo-${Date.now()}`;
      setActiveVineId(vineId);
    }
  }, [inviteeName, activeVineId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleCreateVine = async () => {
    if (!topic || !inviteName) return;
    
    try {
      // Real NATS vine creation
      const result = await createVine(topic, [inviteName]);
      
      // Generate Invite Link
      const link = `${window.location.origin}/village-vine?invitee=${encodeURIComponent(inviteName)}`;
      setGeneratedLink(link);
      setIsCreating(false);
      setActiveVineId(result.vineId);
      
      console.log('✅ Village Vine created:', result);
    } catch (error) {
      console.error('Failed to create vine:', error);
      alert('Failed to create Village Vine. Please try again.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      // Send via real NATS
      await sendMessage(currentUser, inputText);
      setInputText('');
      
      console.log('✅ Message sent via NATS');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert('Invite link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#0a090a] text-slate-200 font-sans flex flex-col selection:bg-emerald-500/30">
      {/* Cinematic Header */}
      <nav className="h-16 flex items-center justify-between px-8 border-b border-emerald-900/30 bg-[#0a090a]/80 backdrop-blur-md z-20">
        <Link to="/" className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 font-bold transition-colors">
          <ArrowLeft size={18} />
          <span>Village Hub</span>
        </Link>
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
            isConnected 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
          }`}>
            <Activity size={12} className={isConnected ? 'animate-pulse' : ''} />
            NATS: {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
            <Shield size={12} />
            Secure Tunnel
          </div>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Active Village Vines */}
        <div className="w-80 border-r border-emerald-900/20 bg-[#0f0e0f] p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-[0.2em]">Village Vines</h2>
            <button 
              onClick={() => setIsCreating(true)}
              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                  <Users size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">The Town Square</h3>
                  <p className="text-[10px] text-emerald-500/60 font-medium">PUBLIC CHANNEL</p>
                </div>
              </div>
            </div>

            {activeVineId && (
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 border-l-4 border-l-indigo-500">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                    {inviteeName?.substring(0, 2).toUpperCase() || 'VV'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-indigo-100 truncate">{topic}</h3>
                    <p className="text-[10px] text-indigo-500/60 font-medium uppercase tracking-tight">VINE ID: {activeVineId.substring(0, 12)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {generatedLink && (
            <div className="mt-auto p-4 bg-indigo-600/10 border border-indigo-600/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Share2 size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Share Invite</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-indigo-900/30">
                <input 
                  readOnly 
                  value={generatedLink} 
                  className="flex-1 bg-transparent border-none text-[10px] font-mono text-indigo-300 focus:ring-0" 
                />
                <button 
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-indigo-500/20 rounded-lg transition-colors text-indigo-400"
                >
                  <LinkIcon size={14} />
                </button>
              </div>
              <p className="text-[10px] text-indigo-300/60 italic text-center">NATS session expires in 24h</p>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#0a090a] relative">
          {activeVineId ? (
            <>
              {/* Chat Header */}
              <div className="h-14 px-8 border-b border-emerald-900/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-sm font-bold text-slate-100">{topic}</span>
                  {isConnected && (
                    <span className="text-[9px] text-emerald-500/60 font-bold uppercase tracking-widest">● LIVE</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-slate-500 font-mono">{messages.length} messages</span>
                  <button className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-widest flex items-center gap-2">
                    <Trash2 size={14} />
                    End Vine
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] group ${msg.isMe ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                      <div className="flex items-center gap-3 mx-1">
                        {!msg.isMe && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{msg.sender}</span>}
                        <span className="text-[9px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.isMe && <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">You</span>}
                      </div>
                      <div className={`px-4 py-3 rounded-2xl shadow-xl transition-all ${
                        msg.isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none hover:bg-indigo-700' 
                          : 'bg-[#151415] border border-emerald-900/30 text-slate-200 rounded-tl-none hover:border-emerald-500/30'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-gradient-to-t from-[#0a090a] to-transparent">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative group">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-3 bg-[#111] border border-emerald-900/30 rounded-2xl p-2 pl-6 focus-within:border-emerald-500/50 transition-all">
                    <MessageCircle size={18} className="text-emerald-900 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Message the village..."
                      className="flex-1 bg-transparent border-none text-slate-100 placeholder-emerald-900/60 focus:ring-0 text-sm py-3"
                    />
                    <button 
                      type="submit"
                      className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
                <div className="text-center mt-4 flex items-center justify-center gap-4 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                  <span>P2P TUNNEL ENCRYPTED</span>
                  <div className="w-1 h-1 rounded-full bg-emerald-900" />
                  <span>NATS PROTOCOL READY</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 rounded-[32px] bg-emerald-900/20 flex items-center justify-center text-emerald-500 mb-8 border border-emerald-500/20 animate-pulse transition-all">
                <Rocket size={48} />
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-4">Start a Village Vine</h2>
              <p className="text-slate-400 max-w-sm leading-relaxed">
                Connect with anyone in the village via instant NATS messengers. 
                Invite them by name, generate a link, and start collaborating.
              </p>
              <button 
                onClick={() => setIsCreating(true)}
                className="mt-8 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/30 active:scale-95 flex items-center gap-3"
              >
                <UserPlus size={20} />
                Create New Vine
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal Overlay */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-[#0f0e0f] border border-emerald-500/20 rounded-[32px] p-8 shadow-2xl shadow-emerald-500/10"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500 rounded-xl text-white shadow-lg">
                    <Users size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Generate Village Invite</h2>
                </div>
                <button onClick={() => setIsCreating(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest pl-1">Vine Topic</label>
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Brainstorming UI Redesign"
                    className="w-full bg-black/40 border border-emerald-900/30 rounded-2xl px-5 py-4 text-sm text-slate-100 placeholder:text-emerald-900/50 focus:border-emerald-500/50 focus:ring-0 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest pl-1">Who are you inviting?</label>
                  <input 
                    type="text" 
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Enter name (e.g. Johnny)"
                    className="w-full bg-black/40 border border-emerald-900/30 rounded-2xl px-5 py-4 text-sm text-slate-100 placeholder:text-emerald-900/50 focus:border-emerald-500/50 focus:ring-0 transition-all"
                  />
                </div>

                <button 
                  onClick={handleCreateVine}
                  disabled={!topic || !inviteName}
                  className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-30 transition-all active:scale-[0.98]"
                >
                  Generate NATS Invite Link
                </button>

                <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">Village Vine Registry · Version 1.0.4</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
