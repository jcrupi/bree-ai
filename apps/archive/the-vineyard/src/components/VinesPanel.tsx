import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  MessageCircle,
  CheckCircle2,
  Clock,
  Circle,
  CheckSquare } from
'lucide-react';
import { Link } from 'react-router-dom';
import { VineConversation, TeamMemberCategory, Task } from '../types';
import { TEAM_MEMBERS } from '../data/teamMembers';
interface VinesPanelProps {
  conversation: VineConversation;
  onClose: () => void;
  className?: string;
  tasks?: Task[];
}
export function VinesPanel({
  conversation,
  onClose,
  className = '',
  tasks = []
}: VinesPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Auto-scroll to bottom on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);
  const getSenderAvatar = (senderId: string) => {
    const member = TEAM_MEMBERS.find((m) => m.id === senderId);
    return member?.avatar || '??';
  };
  return (
    <div
      className={`flex flex-col bg-white h-full overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex flex-col items-center justify-center pt-8 pb-6 px-6 relative z-10 bg-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">

          <X size={20} />
        </button>

        <div
          className="w-11 h-11 rounded-[14px] flex items-center justify-center text-white shadow-lg mb-3"
          style={{
            background: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
            boxShadow: '0 4px 16px rgba(45, 106, 79, 0.25)'
          }}>

          <MessageCircle size={22} fill="white" />
        </div>

        <h3 className="font-vine font-bold text-xl text-[#3c2415] text-center leading-tight">
          {conversation.topic}
        </h3>

        <div className="flex items-center gap-1.5 mt-1">
          <p className="text-xs font-medium text-[#2d6a4f]">
            {conversation.participants.
            map((p) => {
              const m = TEAM_MEMBERS.find((tm) => tm.id === p);
              return m?.name.split(' ')[0];
            }).
            join(' & ')}
          </p>
        </div>
      </div>

      {/* Task Tags (Optional context) */}
      {conversation.taskIds && conversation.taskIds.length > 0 &&
      <div className="px-6 py-2 border-b border-slate-50 bg-white flex flex-wrap gap-2 justify-center z-10">
          {conversation.taskIds.map((taskId) => {
          const task = tasks.find((t) => t.id === taskId);
          return (
            <Link
              key={taskId}
              to={`/task/${taskId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">

                {task ?
              <>
                    {task.status === 'done' ?
                <CheckCircle2 size={10} className="text-emerald-500" /> :
                task.status === 'in-progress' ?
                <Clock size={10} className="text-violet-500" /> :

                <Circle size={10} className="text-slate-300" />
                }
                    <span className="truncate max-w-[100px]">{task.title}</span>
                  </> :

              <>
                    <CheckSquare size={10} />
                    <span>{taskId}</span>
                  </>
              }
              </Link>);

        })}
        </div>
      }

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar relative px-4 py-8">

        {/* Vine SVG Spine Background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 flex justify-center">
          <svg width="100%" height="100%" className="opacity-30">
            <path
              d="M190,0 Q210,100 190,200 Q170,300 190,400 Q210,500 190,600 Q170,700 190,800 Q210,900 190,1000"
              fill="none"
              stroke="#52b788"
              strokeWidth="2.5"
              strokeLinecap="round" />

          </svg>
        </div>

        <div className="relative z-10 flex flex-col max-w-full mx-auto pb-20">
          <AnimatePresence initial={false}>
            {conversation.messages.map((msg, idx) => {
              const isLeft = msg.senderCategory === 'human-design';
              // Overlap logic: negative margin for all except first
              const marginTop = idx === 0 ? 0 : -24;
              return (
                <motion.div
                  key={msg.id}
                  initial={{
                    opacity: 0,
                    y: 16
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  transition={{
                    delay: idx * 0.12,
                    duration: 0.5,
                    ease: 'easeOut'
                  }}
                  style={{
                    marginTop
                  }}
                  className={`flex w-full ${isLeft ? 'justify-start pr-[15%]' : 'justify-end pl-[15%] flex-row-reverse'} gap-3`}>

                  {/* Avatar */}
                  <div
                    className="w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center text-[10px] font-vine font-bold text-white shadow-sm z-20 mt-1"
                    style={{
                      backgroundColor: isLeft ? '#e07852' : '#0284c7',
                      boxShadow: '0 3px 14px rgba(0,0,0,0.12)'
                    }}>

                    {getSenderAvatar(msg.senderId)}
                  </div>

                  {/* Message Body */}
                  <div
                    className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'} min-w-0 flex-1 z-10`}>

                    {/* Meta */}
                    <div
                      className={`flex items-center gap-2 mb-1.5 ${isLeft ? '' : 'flex-row-reverse'}`}>

                      <span className="font-vine font-medium text-xs text-[#3c2415]">
                        {msg.senderName}
                      </span>
                      <span className="text-[10px] text-[#94a3b8]">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Bubble */}
                    <div
                      className={`relative p-4 text-sm leading-relaxed text-[#334155] bg-white transition-shadow hover:shadow-md`}
                      style={{
                        borderRadius: isLeft ?
                        '22px 22px 22px 4px' :
                        '22px 22px 4px 22px',
                        border: isLeft ?
                        '1.5px solid rgba(45, 106, 79, 0.12)' :
                        '1.5px solid rgba(2, 132, 199, 0.10)',
                        boxShadow: isLeft ?
                        '0 2px 12px rgba(45, 106, 79, 0.06)' :
                        '0 2px 12px rgba(2, 132, 199, 0.06)'
                      }}>

                      {/* Accent Strip */}
                      {isLeft ?
                      <div
                        className="absolute top-0 left-0 w-1 h-full rounded-l-[4px] opacity-40"
                        style={{
                          background:
                          'linear-gradient(to bottom, #52b788, #2d6a4f)'
                        }} /> :


                      <div
                        className="absolute top-0 right-0 w-1 h-full rounded-r-[4px] opacity-35"
                        style={{
                          background:
                          'linear-gradient(to bottom, #38bdf8, #0284c7)'
                        }} />

                      }

                      {msg.content}
                    </div>
                  </div>
                </motion.div>);

            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gradient-to-t from-white via-white to-transparent z-20">
        <div className="relative max-w-md mx-auto flex items-center gap-3">
          <input
            type="text"
            placeholder="Message the team..."
            className="flex-1 px-6 py-3.5 rounded-[28px] bg-white text-sm text-[#1e293b] outline-none transition-all placeholder-[#94a3b8]"
            style={{
              border: '1.5px solid rgba(45, 106, 79, 0.15)',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
            }}
            disabled />

          <button
            className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-80"
            style={{
              background: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
              boxShadow: '0 4px 16px rgba(45, 106, 79, 0.25)'
            }}
            disabled>

            <Send size={18} color="white" className="ml-0.5" />
          </button>
        </div>
        <p className="text-[10px] text-center text-[#94a3b8] mt-3">
          Read-only mode •{' '}
          <span className="text-[#52b788] font-medium">
            Vine Connection Active
          </span>
        </p>
      </div>
    </div>);

}