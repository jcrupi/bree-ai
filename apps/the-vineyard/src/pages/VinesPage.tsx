import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VinesVisual } from '../components/VinesVisual';
import {
  ArrowLeft,
  Command,
  Activity,
  ShieldCheck,
  MessageCircle,
  Leaf,
  X } from
'lucide-react';
import { Link } from 'react-router-dom';
import { TEAM_MEMBERS } from '../data/teamMembers';
import { VINE_CONVERSATIONS } from '../data/vineConversations';
import { TeamMemberCategory } from '../types';
import { useLensDropZone } from '../hooks/useAILens';
export function VinesPage() {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null>(
    null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedMember = TEAM_MEMBERS.find((m) => m.id === selectedMemberId);
  const selectedConversation = VINE_CONVERSATIONS.find(
    (c) => c.id === selectedConversationId
  );
  // AI Lens drop zone
  const vinesPageZone = useLensDropZone({
    id: 'vines-page',
    label: 'Vines',
    pageId: 'vines',
    dataType: 'vines',
    getData: () => ({
      tasks: [],
      vines: VINE_CONVERSATIONS,
      grapes: [],
      project: null
    }),
    getSummary: () => `${VINE_CONVERSATIONS.length} active vine conversations`
  });
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (selectedConversationId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [selectedConversationId]);
  // Filter conversations for the selected member
  const memberConversations = selectedMemberId ?
  VINE_CONVERSATIONS.filter((c) =>
  c.participants.includes(selectedMemberId)
  ) :
  [];
  const handleSelectMember = (id: string) => {
    if (selectedMemberId === id) {
      setSelectedMemberId(null);
      setSelectedConversationId(null);
    } else {
      setSelectedMemberId(id);
      setSelectedConversationId(null);
    }
  };
  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
  };
  const getSenderAvatar = (senderId: string) => {
    const member = TEAM_MEMBERS.find((m) => m.id === senderId);
    return member?.avatar || '??';
  };
  const getMessageStyle = (category: TeamMemberCategory) => {
    if (category === 'human-design') {
      return {
        container: 'justify-start',
        bubble:
        'bg-[#FFF7ED] border border-orange-100 text-slate-800 rounded-tl-none shadow-lg shadow-orange-900/5',
        meta: 'text-orange-500',
        avatar: 'bg-orange-500 text-white',
        time: 'text-[#8c827d]'
      };
    }
    // human-ai or ai-special
    return {
      container: 'justify-end',
      bubble:
      'bg-[#ECFEFF] border border-cyan-100 text-slate-800 rounded-tr-none shadow-lg shadow-cyan-900/5',
      meta: 'text-cyan-500',
      avatar: 'bg-cyan-500 text-white',
      time: 'text-[#8c827d]'
    };
  };
  return (
    <div className="min-h-screen bg-[#1a1614] text-[#e8dcd8] font-sans selection:bg-[#8B4513] selection:text-white overflow-hidden relative flex flex-col">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a2420] to-[#1a1614] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 px-8 py-6 flex justify-between items-center border-b border-[#8B4513]/20 bg-[#1a1614]/50 backdrop-blur-sm">
        <Link
          to="/"
          className="flex items-center gap-2 text-[#8B4513] hover:text-[#A0522D] transition-colors font-medium">

          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#5d544f]">
            <ShieldCheck size={16} />
            <span className="text-xs uppercase tracking-widest font-bold">
              Secure Connection
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-[#8B4513]/10 border border-[#8B4513]/30 text-[#A0522D] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} />
            System Active
          </div>
        </div>
      </nav>

      <main
        className={`relative z-10 flex-1 flex overflow-hidden ${vinesPageZone.dropClassName} transition-all duration-200`}
        {...vinesPageZone.dropProps}>

        {/* Left Side: Visual & Floating Messages */}
        <div className="flex-1 flex flex-col items-center justify-center relative p-8">
          {/* Header (hidden when conversation open) */}
          <AnimatePresence>
            {!selectedConversationId &&
            <motion.div
              initial={{
                opacity: 0,
                y: -20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                y: -20
              }}
              className="absolute top-8 left-8 z-20">

                <h1 className="text-4xl font-display font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-[#e8dcd8] to-[#8B4513]">
                  Vines
                  <br />
                  <span className="text-2xl font-light text-[#8B4513]">
                    Command & Control
                  </span>
                </h1>
                <p className="text-[#8c827d] text-sm mt-2 max-w-xs">
                  Select a node to inspect connections and monitor active
                  channels.
                </p>
              </motion.div>
            }
          </AnimatePresence>

          <div className="w-full h-full relative flex items-center justify-center">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-[#8B4513] opacity-5 blur-[120px] rounded-full pointer-events-none" />

            {/* Vine Visual */}
            <div
              className={`transition-opacity duration-500 ${selectedConversationId ? 'opacity-40 blur-[2px]' : 'opacity-100'}`}>

              <VinesVisual
                onSelectMember={handleSelectMember}
                selectedMemberId={selectedMemberId}
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversationId} />

            </div>

            {/* Floating Messages Overlay */}
            <AnimatePresence>
              {selectedConversationId && selectedConversation &&
              <motion.div
                initial={{
                  opacity: 0
                }}
                animate={{
                  opacity: 1
                }}
                exit={{
                  opacity: 0
                }}
                className="absolute inset-0 z-30 flex flex-col">

                  {/* Overlay Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#1a1614]/30 to-[#1a1614]/60 pointer-events-none" />

                  {/* Floating Header */}
                  <div className="absolute top-0 left-0 right-0 flex justify-center pt-4 pointer-events-none z-40">
                    <motion.div
                    initial={{
                      y: -50,
                      opacity: 0
                    }}
                    animate={{
                      y: 0,
                      opacity: 1
                    }}
                    className="bg-[#1a1614]/80 backdrop-blur-md rounded-xl px-6 py-3 border border-[#8B4513]/20 text-center shadow-xl shadow-black/20 pointer-events-auto">

                      <h3 className="text-lg font-bold text-[#e8dcd8]">
                        {selectedConversation.topic}
                      </h3>
                      <p className="text-xs text-[#5d544f] mt-0.5 font-medium uppercase tracking-wider">
                        {selectedConversation.participants.length} Participants
                      </p>
                    </motion.div>
                  </div>

                  {/* Close Button */}
                  <motion.button
                  initial={{
                    scale: 0.8,
                    opacity: 0
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1
                  }}
                  onClick={() => setSelectedConversationId(null)}
                  className="absolute top-4 right-4 z-50 bg-[#2a2420]/80 backdrop-blur-sm border border-[#8B4513]/30 rounded-full px-4 py-2 text-sm font-bold text-[#8c827d] hover:text-[#e8dcd8] hover:border-[#8B4513]/60 transition-all flex items-center gap-2 shadow-lg">

                    <X size={14} />
                    Close View
                  </motion.button>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-24 space-y-8">
                    {selectedConversation.messages.map((msg, idx) => {
                    const style = getMessageStyle(msg.senderCategory);
                    const isRight = msg.senderCategory !== 'human-design';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{
                          opacity: 0,
                          y: 30,
                          scale: 0.95
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1
                        }}
                        transition={{
                          delay: idx * 0.08,
                          type: 'spring',
                          damping: 20
                        }}
                        className={`flex gap-4 ${style.container} max-w-4xl mx-auto w-full`}>

                          {/* Left Avatar */}
                          {!isRight &&
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-lg flex-shrink-0 mt-1 border-2 border-white/10 ${style.avatar}`}>

                              {getSenderAvatar(msg.senderId)}
                            </div>
                        }

                          <div className={`max-w-[400px] space-y-2`}>
                            <div
                            className={`flex items-baseline gap-3 ${isRight ? 'justify-end' : 'justify-start'}`}>

                              {isRight ?
                            <>
                                  <span className={`text-xs ${style.time}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }
                                )}
                                  </span>
                                  <span
                                className={`text-[11px] font-bold uppercase tracking-wider ${style.meta}`}>

                                    {msg.senderName}
                                  </span>
                                </> :

                            <>
                                  <span
                                className={`text-[11px] font-bold uppercase tracking-wider ${style.meta}`}>

                                    {msg.senderName}
                                  </span>
                                  <span className={`text-xs ${style.time}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }
                                )}
                                  </span>
                                </>
                            }
                            </div>
                            <div
                            className={`px-6 py-4 text-base leading-relaxed ${style.bubble}`}>

                              {msg.content}
                            </div>
                          </div>

                          {/* Right Avatar */}
                          {isRight &&
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-lg flex-shrink-0 mt-1 border-2 border-white/10 ${style.avatar}`}>

                              {getSenderAvatar(msg.senderId)}
                            </div>
                        }
                        </motion.div>);

                  })}
                    <div ref={messagesEndRef} />
                  </div>
                </motion.div>
              }
            </AnimatePresence>
          </div>

          {/* Bottom Stats (hidden when conversation open) */}
          {!selectedConversationId &&
          <div className="absolute bottom-8 left-8 right-8 grid grid-cols-3 gap-8 border-t border-[#8B4513]/20 pt-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#e8dcd8]">
                  {VINE_CONVERSATIONS.length}
                </div>
                <div className="text-xs text-[#5d544f] uppercase tracking-wider mt-1">
                  Active Vines
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#e8dcd8]">
                  {TEAM_MEMBERS.filter((m) => m.status === 'online').length}
                </div>
                <div className="text-xs text-[#5d544f] uppercase tracking-wider mt-1">
                  Online Nodes
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#e8dcd8]">12ms</div>
                <div className="text-xs text-[#5d544f] uppercase tracking-wider mt-1">
                  Latency
                </div>
              </div>
            </div>
          }
        </div>

        {/* Right Side: Context Panel */}
        <AnimatePresence mode="wait">
          {selectedMember ?
          <motion.div
            key="member-panel"
            initial={{
              x: '100%',
              opacity: 0
            }}
            animate={{
              x: 0,
              opacity: 1
            }}
            exit={{
              x: '100%',
              opacity: 0
            }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200
            }}
            className="w-[400px] border-l border-[#8B4513]/20 bg-[#1a1614]/95 backdrop-blur-md flex flex-col z-20">

              {/* Member Header */}
              <div className="p-6 border-b border-[#8B4513]/20 bg-[#2a2420]/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white border-2 border-[#8B4513]/50"
                    style={{
                      backgroundColor:
                      selectedMember.category === 'human-design' ?
                      '#D97706' :
                      selectedMember.category === 'human-ai' ?
                      '#0891B2' :
                      '#7C3AED'
                    }}>

                      {selectedMember.isAI ? '⚡' : selectedMember.avatar}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {selectedMember.name}
                      </h2>
                      <p className="text-sm text-[#8c827d]">
                        {selectedMember.role}
                      </p>
                    </div>
                  </div>
                  <button
                  onClick={() => setSelectedMemberId(null)}
                  className="p-2 hover:bg-[#8B4513]/20 rounded-full text-[#8c827d] transition-colors">

                    <X size={20} />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedMember.skills.map((skill) =>
                <span
                  key={skill}
                  className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-[#8B4513]/10 text-[#A0522D] border border-[#8B4513]/20">

                      {skill}
                    </span>
                )}
                </div>
              </div>

              {/* Conversations List (Hidden when conversation is open) */}
              {!selectedConversationId &&
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  <h3 className="text-xs font-bold text-[#5d544f] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MessageCircle size={12} />
                    Active Conversations
                  </h3>

                  {memberConversations.length === 0 ?
              <div className="text-center py-12 text-[#5d544f]">
                      <Leaf className="mx-auto mb-2 opacity-20" size={32} />
                      <p>No active vines found.</p>
                    </div> :

              <div className="space-y-3">
                      {memberConversations.map((vine) =>
                <button
                  key={vine.id}
                  onClick={() => handleSelectConversation(vine.id)}
                  className="w-full text-left p-4 rounded-xl bg-[#2a2420]/50 border border-[#8B4513]/10 hover:border-[#8B4513]/40 hover:bg-[#2a2420] transition-all group">

                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-[#e8dcd8] group-hover:text-[#A0522D] transition-colors">
                              {vine.topic}
                            </h4>
                            {vine.unreadCount > 0 &&
                    <span className="px-2 py-0.5 rounded-full bg-[#10B981] text-[#1a1614] text-[10px] font-bold">
                                {vine.unreadCount}
                              </span>
                    }
                          </div>
                          <p className="text-xs text-[#8c827d] line-clamp-2 mb-3">
                            {vine.messages[vine.messages.length - 1]?.content}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {vine.participants.map((pId) => {
                        const p = TEAM_MEMBERS.find((m) => m.id === pId);
                        if (!p) return null;
                        return (
                          <div
                            key={pId}
                            className="w-5 h-5 rounded-full border border-[#1a1614] flex items-center justify-center text-[8px] font-bold text-white"
                            style={{
                              backgroundColor:
                              p.category === 'human-design' ?
                              '#D97706' :
                              p.category === 'human-ai' ?
                              '#0891B2' :
                              '#7C3AED'
                            }}>

                                    {p.isAI ? '⚡' : p.avatar}
                                  </div>);

                      })}
                            </div>
                            <span className="text-[10px] text-[#5d544f]">
                              {new Date(vine.lastActivity).toLocaleDateString(
                        undefined,
                        {
                          month: 'short',
                          day: 'numeric'
                        }
                      )}
                            </span>
                          </div>
                        </button>
                )}
                    </div>
              }
                </div>
            }

              {/* Minimal Info when Conversation is Open */}
              {selectedConversationId &&
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center opacity-50">
                  <MessageCircle size={48} className="text-[#8B4513] mb-4" />
                  <p className="text-[#8c827d] text-sm">
                    Viewing conversation...
                  </p>
                </div>
            }
            </motion.div> /* Default Right Panel (System Status) */ :

          <motion.div
            key="default-panel"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            className="w-[300px] border-l border-[#8B4513]/20 bg-[#1a1614]/50 p-8 flex flex-col justify-center items-center text-center z-20">

              <div className="w-16 h-16 rounded-full bg-[#8B4513]/10 flex items-center justify-center text-[#A0522D] mb-6 animate-pulse">
                <Command size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#e8dcd8] mb-2">
                System Ready
              </h3>
              <p className="text-[#8c827d] text-sm">
                Select a node on the vine to inspect active communication
                channels.
              </p>
            </motion.div>
          }
        </AnimatePresence>
      </main>
    </div>);

}