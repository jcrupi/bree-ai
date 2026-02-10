import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  Layers,
  FolderKanban,
  Plus,
  X,
  Check,
  CheckSquare } from
'lucide-react';
import { VineConversation, Project, SpecialtyType, Task } from '../types';
import { SPECIALTIES } from '../data/specialties';
import { TEAM_MEMBERS } from '../data/teamMembers';
interface VinesSidebarSectionProps {
  conversations: VineConversation[];
  projects: Project[];
  selectedVineId: string | null;
  onSelectVine: (id: string | null) => void;
  onAddVine?: (vine: {
    topic: string;
    projectId: string;
    participants: string[];
    specialties?: SpecialtyType[];
  }) => void;
  tasks?: Task[];
}
type GroupingMode = 'project' | 'specialty';
export function VinesSidebarSection({
  conversations,
  projects,
  selectedVineId,
  onSelectVine,
  onAddVine,
  tasks = []
}: VinesSidebarSectionProps) {
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('project');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showNewVine, setShowNewVine] = useState(false);
  // New Vine State
  const [newTopic, setNewTopic] = useState('');
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || '');
  const [newParticipants, setNewParticipants] = useState<Set<string>>(new Set());
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };
  const handleCreateVine = () => {
    if (
    newTopic.trim() &&
    newProjectId &&
    newParticipants.size > 0 &&
    onAddVine)
    {
      onAddVine({
        topic: newTopic.trim(),
        projectId: newProjectId,
        participants: Array.from(newParticipants),
        specialties: [] // Could infer from participants or add UI for it
      });
      setNewTopic('');
      setNewParticipants(new Set());
      setShowNewVine(false);
    }
  };
  const toggleParticipant = (id: string) => {
    setNewParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  // Group conversations logic
  const getGroupedVines = () => {
    if (groupingMode === 'project') {
      const grouped = conversations.reduce(
        (acc, vine) => {
          if (!acc[vine.projectId]) {
            acc[vine.projectId] = [];
          }
          acc[vine.projectId].push(vine);
          return acc;
        },
        {} as Record<string, VineConversation[]>
      );
      return {
        grouped,
        keys: Object.keys(grouped)
      };
    } else {
      // Group by specialty
      const grouped: Record<string, VineConversation[]> = {};
      conversations.forEach((vine) => {
        if (vine.specialties && vine.specialties.length > 0) {
          vine.specialties.forEach((spec) => {
            if (!grouped[spec]) {
              grouped[spec] = [];
            }
            grouped[spec].push(vine);
          });
        } else {
          // No specialty
          if (!grouped['uncategorized']) {
            grouped['uncategorized'] = [];
          }
          grouped['uncategorized'].push(vine);
        }
      });
      return {
        grouped,
        keys: Object.keys(grouped)
      };
    }
  };
  const { grouped: vinesByGroup, keys: groupKeys } = getGroupedVines();
  return (
    <div className="px-3 py-4 border-b border-violet-50">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider">
          <Leaf size={12} />
          Vines
        </div>

        <div className="flex items-center gap-1">
          {onAddVine &&
          <button
            onClick={() => setShowNewVine(!showNewVine)}
            className={`p-1 rounded-md transition-all ${showNewVine ? 'bg-emerald-100 text-emerald-600' : 'text-emerald-400 hover:bg-emerald-50 hover:text-emerald-500'}`}>

              {showNewVine ? <X size={12} /> : <Plus size={12} />}
            </button>
          }
          <div className="flex bg-emerald-50 rounded-lg p-0.5 border border-emerald-100">
            <button
              onClick={() => setGroupingMode('project')}
              className={`p-1 rounded-md transition-all ${groupingMode === 'project' ? 'bg-white shadow-sm text-emerald-600' : 'text-emerald-400 hover:text-emerald-500'}`}
              title="Group by Project">

              <FolderKanban size={12} />
            </button>
            <button
              onClick={() => setGroupingMode('specialty')}
              className={`p-1 rounded-md transition-all ${groupingMode === 'specialty' ? 'bg-white shadow-sm text-emerald-600' : 'text-emerald-400 hover:text-emerald-500'}`}
              title="Group by Specialty">

              <Layers size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* New Vine Form */}
      <AnimatePresence>
        {showNewVine &&
        <motion.div
          initial={{
            height: 0,
            opacity: 0
          }}
          animate={{
            height: 'auto',
            opacity: 1
          }}
          exit={{
            height: 0,
            opacity: 0
          }}
          className="overflow-hidden mb-3">

            <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
              <input
              type="text"
              placeholder="Topic..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              className="w-full px-2 py-1.5 bg-white text-slate-900 text-xs rounded-lg border border-emerald-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-emerald-300/70"
              autoFocus />


              <select
              value={newProjectId}
              onChange={(e) => setNewProjectId(e.target.value)}
              className="w-full px-2 py-1.5 bg-white text-slate-700 text-xs rounded-lg border border-emerald-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20">

                {projects.map((p) =>
              <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
              )}
              </select>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider px-1">
                  Participants
                </label>
                <div className="max-h-24 overflow-y-auto custom-scrollbar bg-white rounded-lg border border-emerald-100 p-1">
                  {TEAM_MEMBERS.map((member) =>
                <button
                  key={member.id}
                  onClick={() => toggleParticipant(member.id)}
                  className={`w-full flex items-center gap-2 px-1.5 py-1 rounded-md text-[10px] transition-colors ${newParticipants.has(member.id) ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>

                      <div
                    className={`w-3 h-3 rounded-full flex items-center justify-center border ${newParticipants.has(member.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>

                        {newParticipants.has(member.id) && <Check size={8} />}
                      </div>
                      <span className="truncate">{member.name}</span>
                    </button>
                )}
                </div>
              </div>

              <button
              onClick={handleCreateVine}
              disabled={
              !newTopic.trim() ||
              !newProjectId ||
              newParticipants.size === 0
              }
              className="w-full py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-200">

                Start Vine
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      <div className="space-y-1">
        {groupKeys.map((groupId) => {
          const vines = vinesByGroup[groupId];
          const isExpanded = expandedGroups.has(groupId);
          // Render Header Content based on mode
          let headerIcon;
          let headerName;
          let headerColorClass = 'bg-slate-100 text-slate-500';
          if (groupingMode === 'project') {
            const project = projects.find((p) => p.id === groupId);
            if (!project) return null;
            headerIcon = project.icon;
            headerName = project.name;
          } else {
            if (groupId === 'uncategorized') {
              headerIcon = <Leaf size={10} />;
              headerName = 'Uncategorized';
            } else {
              const specialty = SPECIALTIES[groupId as SpecialtyType];
              const Icon = specialty.icon;
              headerIcon = <Icon size={10} />;
              headerName = specialty.name;
              headerColorClass = ''; // We'll use inline styles for specialty colors
            }
          }
          return (
            <div key={groupId} className="space-y-0.5">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(groupId)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors group">

                {isExpanded ?
                <ChevronDown size={12} /> :

                <ChevronRight size={12} />
                }

                <span
                  className={`flex items-center justify-center w-4 h-4 rounded-md text-[10px] shadow-sm ${headerColorClass}`}
                  style={
                  groupingMode === 'specialty' && groupId !== 'uncategorized' ?
                  {
                    backgroundColor:
                    SPECIALTIES[groupId as SpecialtyType].color,
                    color: 'white'
                  } :
                  {}
                  }>

                  {headerIcon}
                </span>

                <span className="flex-1 text-left truncate">{headerName}</span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  {vines.length}
                </span>
              </button>

              {/* Vines List */}
              <AnimatePresence>
                {isExpanded &&
                <motion.div
                  initial={{
                    height: 0,
                    opacity: 0
                  }}
                  animate={{
                    height: 'auto',
                    opacity: 1
                  }}
                  exit={{
                    height: 0,
                    opacity: 0
                  }}
                  className="overflow-hidden">

                    <div className="pl-2 space-y-0.5 pb-1">
                      {vines.map((vine) => {
                      const isSelected = selectedVineId === vine.id;
                      const lastMessage =
                      vine.messages[vine.messages.length - 1];
                      return (
                        <button
                          key={`${groupId}-${vine.id}`}
                          onClick={() =>
                          onSelectVine(isSelected ? null : vine.id)
                          }
                          className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs transition-all group ${isSelected ? 'bg-violet-50 text-violet-900' : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'}`}>

                            <div
                            className={`mt-0.5 p-1 rounded-md transition-colors flex-shrink-0 ${isSelected ? 'bg-white text-emerald-600 shadow-sm' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100'}`}>

                              <MessageCircle size={10} />
                            </div>

                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                className={`font-medium truncate ${isSelected ? 'text-violet-900' : 'text-slate-700'}`}>

                                  {vine.topic}
                                </span>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {vine.taskIds && vine.taskIds.length > 0 &&
                                <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-violet-50 text-violet-500 text-[9px] font-bold border border-violet-100">
                                      <CheckSquare size={8} />
                                      {vine.taskIds.length}
                                    </span>
                                }
                                  {vine.unreadCount > 0 &&
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                }
                                </div>
                              </div>

                              {lastMessage &&
                            <p
                              className={`truncate mt-0.5 opacity-80 ${isSelected ? 'text-violet-600' : 'text-slate-400'}`}>

                                  <span className="font-medium">
                                    {lastMessage.senderName}:
                                  </span>{' '}
                                  {lastMessage.content}
                                </p>
                            }
                            </div>
                          </button>);

                    })}
                    </div>
                  </motion.div>
                }
              </AnimatePresence>
            </div>);

        })}
      </div>
    </div>);

}