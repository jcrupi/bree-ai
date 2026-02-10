import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { TeamMember, TeamMemberCategory } from '../types';
interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
}
const categoryStyles: Record<
  TeamMemberCategory,
  {
    accentColor: string;
    iconColor: string;
    tagBg: string;
    tagText: string;
    bgHover: string;
  }> =
{
  'human-design': {
    accentColor: 'border-l-orange-500',
    iconColor: 'text-orange-500',
    tagBg: 'bg-orange-50',
    tagText: 'text-orange-600',
    bgHover: 'group-hover:bg-orange-50/10'
  },
  'human-ai': {
    accentColor: 'border-l-cyan-500',
    iconColor: 'text-cyan-500',
    tagBg: 'bg-cyan-50',
    tagText: 'text-cyan-600',
    bgHover: 'group-hover:bg-cyan-50/10'
  },
  'ai-special': {
    accentColor: 'border-l-violet-500',
    iconColor: 'text-violet-500',
    tagBg: 'bg-violet-50',
    tagText: 'text-violet-600',
    bgHover: 'group-hover:bg-violet-50/10'
  }
};
const statusColors = {
  online: 'bg-emerald-500',
  busy: 'bg-amber-500',
  idle: 'bg-slate-400',
  active: 'bg-violet-500 animate-pulse'
};
export function TeamMemberCard({ member, index }: TeamMemberCardProps) {
  const style = categoryStyles[member.category];
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        delay: index * 0.05,
        duration: 0.3
      }}
      whileHover={{
        x: 4
      }}
      className={`group relative flex items-center gap-4 py-3 px-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 border-l-[3px] ${style.accentColor} ${member.isAI ? 'bg-slate-50/30' : ''}`}>

      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${member.isAI ? 'bg-violet-50 border-violet-100' : 'bg-slate-50 border-slate-200'}`}>

          {member.isAI ?
          <Bot className={`w-4 h-4 ${style.iconColor}`} /> :

          <span className="text-slate-600">{member.avatar}</span>
          }
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusColors[member.status]}`} />

      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-slate-700 transition-colors">
            {member.name}
          </h3>
          {member.isAI &&
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
              AI
            </span>
          }
        </div>
        <p className="text-xs text-slate-400 truncate font-medium">
          {member.role}
        </p>
      </div>

      {/* Skills - Pushed to right, hidden on very small screens if needed */}
      <div className="hidden sm:flex items-center gap-1.5 justify-end max-w-[40%] flex-wrap">
        {member.skills.slice(0, 3).map((skill) =>
        <span
          key={skill}
          className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${style.tagBg} ${style.tagText} whitespace-nowrap`}>

            {skill}
          </span>
        )}
      </div>
    </motion.div>);

}