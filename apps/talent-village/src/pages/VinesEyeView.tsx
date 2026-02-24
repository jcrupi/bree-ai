import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Maximize2, Monitor, Users, ShieldCheck, Terminal, ChevronUp, ChevronDown, Activity, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVillageVine } from '../hooks/useVillageVine';

export const VinesEyeView: React.FC = () => {
  const navigate = useNavigate();
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);

  // Monitor all three vines for the "God View" console
  const { messages: assessmentMessages } = useVillageVine({ vineId: 'talent-assessment-live', userName: 'VinesEye' });
  const { messages: privateMessages } = useVillageVine({ vineId: 'talent-expert-private-live', userName: 'VinesEye' });
  const { messages: queueMessages } = useVillageVine({ vineId: 'talent-assessment-queue-live', userName: 'VinesEye' });

  // Merge and sort all messages for the console
  const allMessages = useMemo(() => {
    const combined = [
      ...assessmentMessages.map(m => ({ ...m, vine: 'ASSESSMENT' })),
      ...privateMessages.map(m => ({ ...m, vine: 'PRIVATE' })),
      ...queueMessages.map(m => ({ ...m, vine: 'QUEUE' }))
    ];
    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [assessmentMessages, privateMessages, queueMessages]);

  const views = [
    {
      id: 'candidate',
      title: 'Candidate Perspective',
      role: 'candidate',
      name: 'Candidate',
      icon: <Users size={16} className="text-emerald-500" />,
      color: 'border-emerald-200'
    },
    {
      id: 'lead',
      title: 'Lead Expert (Moderator)',
      role: 'expert',
      name: 'Expert 1',
      icon: <ShieldCheck size={16} className="text-rose-500" />,
      color: 'border-rose-200'
    },
    {
      id: 'expert',
      title: 'Expert Contributor',
      role: 'expert',
      name: 'Expert 2',
      icon: <Monitor size={16} className="text-amber-500" />,
      color: 'border-amber-200'
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden font-outfit text-slate-200">
      {/* Header */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between shadow-xl z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/talent-village')}
            className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-slate-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none uppercase italic">Vines-eye View</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Multi-Perspective Real-time Monitoring</span>
              <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-[8px] font-black rounded border border-rose-500/20 uppercase tracking-tighter">Live Debug</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-indigo-400" />
              <span>Nodes: 3</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-400" />
              <span>Ping: 12ms</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">NATS CLUSTER: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Tiled Views - T-Shape Layout */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top: Candidate View (Responsive Height) */}
        <div className="h-[35%] bg-slate-900 border-b border-slate-800 relative group overflow-hidden">
          <div className="absolute top-2 left-4 z-10 flex items-center gap-2 px-3 py-1 bg-slate-950/80 rounded-full border border-slate-800">
            <Users size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Candidate Perspective</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-2" />
          </div>
          <iframe 
            src={`/talent-village?role=candidate&name=Candidate`}
            className="w-full h-full border-none opacity-90 group-hover:opacity-100 transition-opacity"
            title="Candidate Perspective"
          />
        </div>

        {/* Bottom: Side-by-Side Experts */}
        <div className="flex-1 flex min-h-0 bg-slate-900">
          {/* Bottom Left: Lead Expert */}
          <div className="flex-1 flex flex-col border-r border-slate-800 relative group overflow-hidden">
            <div className="absolute top-2 left-4 z-10 flex items-center gap-2 px-3 py-1 bg-slate-950/80 rounded-full border border-slate-800">
              <ShieldCheck size={14} className="text-rose-500" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Lead Expert (Moderator)</span>
              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[8px] font-black rounded border border-rose-500/20 uppercase ml-2 tracking-tighter">Auth: LEVEL_1</span>
            </div>
            <iframe 
              src={`/talent-village?role=expert&name=Expert%201&hideMirror=true`}
              className="w-full h-full border-none opacity-90 group-hover:opacity-100 transition-opacity"
              title="Lead Expert Dashboard"
            />
          </div>

          {/* Bottom Right: Expert */}
          <div className="flex-1 flex flex-col relative group overflow-hidden">
            <div className="absolute top-2 left-4 z-10 flex items-center gap-2 px-3 py-1 bg-slate-950/80 rounded-full border border-slate-800">
              <Monitor size={14} className="text-amber-500" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Expert Contributor</span>
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black rounded border border-amber-500/20 uppercase ml-2 tracking-tighter">Auth: GUEST</span>
            </div>
            <iframe 
              src={`/talent-village?role=expert&name=Expert%202&hideMirror=true`}
              className="w-full h-full border-none opacity-90 group-hover:opacity-100 transition-opacity"
              title="Expert Contributor"
            />
          </div>
        </div>
      </div>

      {/* Collapsable NATS Console */}
      <motion.div 
        animate={{ height: isConsoleExpanded ? '300px' : '40px' }}
        className="bg-slate-950 border-t border-slate-800 flex flex-col z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
      >
        <div 
          onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
          className="h-10 px-6 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-all border-b border-slate-800/50"
        >
          <div className="flex items-center gap-3">
            <Terminal size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              NATS Messaging Console
              <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] text-slate-500 font-bold">{allMessages.length} PKTS</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-800">
               <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Filter: ALL VINES</span>
            </div>
            {isConsoleExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronUp size={14} className="text-slate-500" />}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-2">
          {allMessages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              key={msg.id || i} 
              className="flex gap-4 items-start py-1 border-b border-white/[0.02] last:border-0"
            >
              <span className="text-slate-600 shrink-0 select-none">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
              <span className={`shrink-0 font-bold px-1.5 py-0.5 rounded-[4px] text-[9px] min-w-[75px] text-center ${
                msg.vine === 'ASSESSMENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                msg.vine === 'PRIVATE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}>
                {msg.vine}
              </span>
              <span className="text-indigo-400 font-bold">@{msg.sender}</span>
              <span className="text-slate-300 break-all">
                <span className="text-slate-500">{'>'}</span> {msg.content}
              </span>
            </motion.div>
          ))}
          {allMessages.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-700 italic uppercase font-bold tracking-widest text-[10px]">
              Waiting for NATS packets...
            </div>
          )}
        </div>
      </motion.div>

      {/* Global Status Bar */}
      <div className="h-8 bg-slate-950 border-t border-slate-800 px-8 flex items-center justify-between z-40">
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">System: OPTIMAL</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap size={10} className="text-amber-500" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter italic">VINE_PROTOCOL_V3.1_LSEC</span>
          </div>
          <div className="text-[9px] font-black text-slate-700 uppercase tracking-tighter flex gap-3">
            <span>UPTIME: 01:27:44</span>
            <span>SECURE TUNNEL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VinesEyeView;
