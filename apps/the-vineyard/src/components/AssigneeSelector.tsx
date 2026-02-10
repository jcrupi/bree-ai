import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  User,
  Bot,
  Circle,
  Check,
  Palette,
  Code,
  Brain } from
'lucide-react';
import { TeamMember, Grape } from '../types';
interface AssigneeSelectorProps {
  selectedId: string;
  onChange: (id: string) => void;
  teamMembers: TeamMember[];
  grapes: Grape[];
}
type GroupedAssignees = {
  'Design Team': TeamMember[];
  'Human Agents': TeamMember[];
  'AI Agents': TeamMember[];
  Grapes: Grape[];
};
export function AssigneeSelector({
  selectedId,
  onChange,
  teamMembers,
  grapes
}: AssigneeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Group data
  const grouped = useMemo(() => {
    const groups: GroupedAssignees = {
      'Design Team': [],
      'Human Agents': [],
      'AI Agents': [],
      Grapes: []
    };
    teamMembers.forEach((m) => {
      if (
      searchTerm &&
      !m.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !m.role.toLowerCase().includes(searchTerm.toLowerCase()))
      {
        return;
      }
      if (m.category === 'human-design') groups['Design Team'].push(m);else
      if (m.category === 'human-ai') groups['Human Agents'].push(m);else
      if (m.category === 'ai-special') groups['AI Agents'].push(m);
    });
    grapes.forEach((g) => {
      if (
      searchTerm &&
      !g.title.toLowerCase().includes(searchTerm.toLowerCase()))
      {
        return;
      }
      groups['Grapes'].push(g);
    });
    return groups;
  }, [teamMembers, grapes, searchTerm]);
  // Find selected item for display
  const selectedItem =
  teamMembers.find((m) => m.id === selectedId) ||
  grapes.find((g) => g.id === selectedId);
  const renderTriggerContent = () => {
    if (!selectedItem) {
      return (
        <div className="flex items-center gap-2 text-slate-400">
          <User size={16} />
          <span>Unassigned</span>
        </div>);

    }
    if ('category' in selectedItem) {
      // It's a TeamMember
      return (
        <div className="flex items-center gap-2 text-slate-700">
          {selectedItem.isAI ?
          <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
              <Bot size={12} />
            </div> :

          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{
              backgroundColor:
              selectedItem.category === 'human-design' ?
              '#f97316' :
              '#06b6d4'
            }}>

              {selectedItem.avatar}
            </div>
          }
          <span className="text-sm font-medium">{selectedItem.name}</span>
        </div>);

    } else {
      // It's a Grape
      return (
        <div className="flex items-center gap-2 text-slate-700">
          <div className="w-5 h-5 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600">
            <Circle size={12} />
          </div>
          <span className="text-sm font-medium">{selectedItem.title}</span>
        </div>);

    }
  };
  return (
    <div className="relative">
      <label className="block text-xs font-bold text-violet-400 uppercase tracking-wider mb-1.5">
        Assignee
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-violet-200 rounded-lg hover:border-violet-300 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/20">

        {renderTriggerContent()}
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />

      </button>

      <AnimatePresence>
        {isOpen &&
        <>
            <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)} />

            <motion.div
            initial={{
              opacity: 0,
              y: 5
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              y: 5
            }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-[320px] flex flex-col overflow-hidden">

              <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                <div className="relative">
                  <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                  type="text"
                  placeholder="Search people or grapes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200"
                  autoFocus />

                </div>
              </div>

              <div className="overflow-y-auto custom-scrollbar p-2 space-y-3">
                {/* Design Team */}
                {grouped['Design Team'].length > 0 &&
              <div>
                    <div className="px-2 mb-1 text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette size={10} /> Design Team
                    </div>
                    <div className="space-y-1">
                      {grouped['Design Team'].map((m) =>
                  <AssigneeOption
                    key={m.id}
                    id={m.id}
                    name={m.name}
                    role={m.role}
                    avatar={m.avatar}
                    category="human-design"
                    isSelected={selectedId === m.id}
                    onClick={() => {
                      onChange(m.id);
                      setIsOpen(false);
                    }} />

                  )}
                    </div>
                  </div>
              }

                {/* Human Agents */}
                {grouped['Human Agents'].length > 0 &&
              <div>
                    <div className="px-2 mb-1 text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Code size={10} /> Human Agents
                    </div>
                    <div className="space-y-1">
                      {grouped['Human Agents'].map((m) =>
                  <AssigneeOption
                    key={m.id}
                    id={m.id}
                    name={m.name}
                    role={m.role}
                    avatar={m.avatar}
                    category="human-ai"
                    isSelected={selectedId === m.id}
                    onClick={() => {
                      onChange(m.id);
                      setIsOpen(false);
                    }} />

                  )}
                    </div>
                  </div>
              }

                {/* AI Agents */}
                {grouped['AI Agents'].length > 0 &&
              <div>
                    <div className="px-2 mb-1 text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Brain size={10} /> AI Agents
                    </div>
                    <div className="space-y-1">
                      {grouped['AI Agents'].map((m) =>
                  <AssigneeOption
                    key={m.id}
                    id={m.id}
                    name={m.name}
                    role={m.role}
                    isAI
                    category="ai-special"
                    isSelected={selectedId === m.id}
                    onClick={() => {
                      onChange(m.id);
                      setIsOpen(false);
                    }} />

                  )}
                    </div>
                  </div>
              }

                {/* Grapes */}
                {grouped['Grapes'].length > 0 &&
              <div>
                    <div className="px-2 mb-1 text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Circle size={10} /> Grapes
                    </div>
                    <div className="space-y-1">
                      {grouped['Grapes'].map((g) =>
                  <button
                    key={g.id}
                    onClick={() => {
                      onChange(g.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-left transition-colors group ${selectedId === g.id ? 'bg-fuchsia-50' : 'hover:bg-slate-50'}`}>

                          <div className="w-6 h-6 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600 shrink-0">
                            <Circle size={12} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                        className={`text-xs font-medium truncate ${selectedId === g.id ? 'text-fuchsia-700' : 'text-slate-700'}`}>

                              {g.title}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate">
                              {g.status}
                            </div>
                          </div>
                          {selectedId === g.id &&
                    <Check size={14} className="text-fuchsia-500" />
                    }
                        </button>
                  )}
                    </div>
                  </div>
              }
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>
    </div>);

}
function AssigneeOption({
  id,
  name,
  role,
  avatar,
  isAI,
  category,
  isSelected,
  onClick









}: {id: string;name: string;role: string;avatar?: string;isAI?: boolean;category: string;isSelected: boolean;onClick: () => void;}) {
  const getTheme = () => {
    switch (category) {
      case 'human-design':
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-700',
          hover: 'bg-orange-50'
        };
      case 'human-ai':
        return {
          bg: 'bg-cyan-500',
          text: 'text-cyan-700',
          hover: 'bg-cyan-50'
        };
      case 'ai-special':
        return {
          bg: 'bg-violet-500',
          text: 'text-violet-700',
          hover: 'bg-violet-50'
        };
      default:
        return {
          bg: 'bg-slate-500',
          text: 'text-slate-700',
          hover: 'bg-slate-50'
        };
    }
  };
  const theme = getTheme();
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-left transition-colors group ${isSelected ? theme.hover : 'hover:bg-slate-50'}`}>

      <div className="shrink-0">
        {isAI ?
        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
            <Bot size={12} />
          </div> :

        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{
            backgroundColor:
            category === 'human-design' ? '#f97316' : '#06b6d4'
          }}>

            {avatar}
          </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-xs font-medium truncate ${isSelected ? theme.text : 'text-slate-700'}`}>

          {name}
        </div>
        <div className="text-[9px] text-slate-400 truncate">{role}</div>
      </div>
      {isSelected &&
      <Check
        size={14}
        className={
        category === 'human-design' ?
        'text-orange-500' :
        category === 'human-ai' ?
        'text-cyan-500' :
        'text-violet-500'
        } />

      }
    </button>);

}