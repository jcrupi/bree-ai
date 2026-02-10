import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Bot,
  User,
  Users,
  Hash,
  LayoutGrid,
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  Plus,
  X,
  Layers,
  Palette,
  Code,
  Brain,
  GitFork,
  ChevronRight,
  ChevronDown,
  List,
  CheckSquare,
  Leaf,
  MessageCircle } from
'lucide-react';
import {
  Agent,
  Area,
  Project,
  Task,
  TeamMember,
  VineConversation,
  SpecialtyType,
  TaskStatus,
  Grape } from
'../types';
import { TEAM_MEMBERS } from '../data/teamMembers';
import { MOCK_GRAPES } from '../data/grapes';
import { VinesSidebarSection } from './VinesSidebarSection';
interface SidebarProps {
  agents: Agent[];
  areas: Area[];
  projects: Project[];
  tasks: Task[];
  selectedAgentId: string | null;
  selectedAreaId: string | null;
  selectedProjectId: string | null;
  selectedGrapeId?: string | null;
  selectedSpecialties: Set<SpecialtyType>;
  vineConversations?: VineConversation[];
  selectedVineId?: string | null;
  onSelectVine?: (id: string | null) => void;
  onSelectAgent: (id: string | null) => void;
  onSelectArea: (id: string | null) => void;
  onSelectProject: (id: string | null) => void;
  onSelectGrape?: (id: string | null) => void;
  onToggleSpecialty: (id: SpecialtyType) => void;
  onAddProject: (project: {
    name: string;
    description?: string;
    color: string;
    icon: string;
  }) => void;
  onDropTaskOnProject: (taskId: string, projectId: string) => void;
  stats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
  onAddVine?: (vine: {
    topic: string;
    projectId: string;
    participants: string[];
    specialties?: SpecialtyType[];
  }) => void;
}
const PROJECT_ICONS = [
'📁',
'🚀',
'💼',
'🎯',
'⚡',
'🔧',
'📱',
'🌐',
'🎨',
'📊'];

const PROJECT_COLORS = [
'#3B82F6',
'#10B981',
'#8B5CF6',
'#F59E0B',
'#EF4444',
'#EC4899',
'#06B6D4',
'#84CC16'];

export function Sidebar({
  agents,
  areas,
  projects,
  tasks,
  selectedAgentId,
  selectedAreaId,
  selectedProjectId,
  selectedGrapeId = null,
  selectedSpecialties,
  vineConversations = [],
  selectedVineId = null,
  onSelectVine = () => {},
  onSelectAgent,
  onSelectArea,
  onSelectProject,
  onSelectGrape = () => {},
  onToggleSpecialty,
  onAddProject,
  onDropTaskOnProject,
  stats,
  onAddVine
}: SidebarProps) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectIcon, setNewProjectIcon] = useState('📁');
  const [newProjectColor, setNewProjectColor] = useState('#3B82F6');
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(
    null
  );
  // Board section expand states
  const [projectBoardExpanded, setProjectBoardExpanded] = useState(true);
  const [vineBoardExpanded, setVineBoardExpanded] = useState(false);
  const [grapesBoardExpanded, setGrapesBoardExpanded] = useState(false);
  const [teamBoardExpanded, setTeamBoardExpanded] = useState(true); // Default expanded
  // Team sub-section expand states
  const [designTeamExpanded, setDesignTeamExpanded] = useState(true);
  const [humanAgentsExpanded, setHumanAgentsExpanded] = useState(true);
  const [aiAgentsExpanded, setAiAgentsExpanded] = useState(true);
  let currentPath = '/';
  try {
    currentPath = window.location.pathname;
  } catch (e) {}
  const getProjectTasks = (projectId: string) => {
    return tasks.filter((t) => t.projectId === projectId);
  };
  const handleSelectProject = (id: string | null) => {
    onSelectProject(id);
    if (id) {
      onSelectAgent(null);
      onSelectArea(null);
      onSelectVine(null);
    }
  };
  const handleSelectAgent = (id: string | null) => {
    onSelectAgent(id);
    if (id) {
      onSelectArea(null);
      onSelectProject(null);
      onSelectVine(null);
      onSelectGrape(null);
    }
  };
  const handleSelectVine = (id: string | null) => {
    onSelectVine(id);
    if (id) {
      onSelectAgent(null);
      onSelectArea(null);
      onSelectProject(null);
      onSelectGrape(null);
    }
  };
  const handleSelectGrape = (id: string | null) => {
    onSelectGrape(id);
    if (id) {
      onSelectAgent(null);
      onSelectArea(null);
      onSelectProject(null);
      onSelectVine(null);
    }
  };
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onAddProject({
        name: newProjectName.trim(),
        color: newProjectColor,
        icon: newProjectIcon
      });
      setNewProjectName('');
      setNewProjectIcon('📁');
      setNewProjectColor('#3B82F6');
      setShowNewProject(false);
    }
  };
  const handleDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    setDragOverProjectId(projectId);
  };
  const handleDragLeave = () => {
    setDragOverProjectId(null);
  };
  const handleDrop = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDropTaskOnProject(taskId, projectId);
    }
    setDragOverProjectId(null);
  };
  // Group vines by project for display
  const getProjectForVine = (projectId: string) =>
  projects.find((p) => p.id === projectId);
  // Total unread vines
  const totalUnread = vineConversations.reduce(
    (sum, v) => sum + v.unreadCount,
    0
  );
  return (
    <div className="w-[240px] h-full bg-white border-r border-violet-100 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] z-10">
      {/* Header */}
      <div className="p-5 border-b border-violet-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <Bot size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-slate-900 text-lg tracking-tight">
            Grapes & Vines
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3 py-4 border-b border-violet-50 space-y-1">
        <Link
          to="/"
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPath === '/' ? 'bg-violet-50 text-violet-900 border-l-2 border-violet-600' : 'text-slate-600 hover:bg-violet-50/50 hover:text-violet-700'}`}>

          <LayoutGrid
            size={18}
            className={
            currentPath === '/' ? 'text-violet-600' : 'text-slate-400'
            } />

          <span>Dashboard</span>
        </Link>
        <Link
          to="/team"
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPath === '/team' ? 'bg-violet-50 text-violet-900 border-l-2 border-violet-600' : 'text-slate-600 hover:bg-violet-50/50 hover:text-violet-700'}`}>

          <Users
            size={18}
            className={
            currentPath === '/team' ? 'text-violet-600' : 'text-slate-400'
            } />

          <span>Team</span>
        </Link>
        <Link
          to="/architecture"
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPath === '/architecture' ? 'bg-violet-50 text-violet-900 border-l-2 border-violet-600' : 'text-slate-600 hover:bg-violet-50/50 hover:text-violet-700'}`}>

          <Layers
            size={18}
            className={
            currentPath === '/architecture' ?
            'text-violet-600' :
            'text-slate-400'
            } />

          <span>Architecture</span>
        </Link>
      </div>

      {/* Scrollable Boards Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* ═══════════════ PROJECT BOARD ═══════════════ */}
        <div className="px-3 py-4 border-b border-violet-50">
          <div className="flex items-center justify-between px-2 mb-2">
            <button
              onClick={() => setProjectBoardExpanded(!projectBoardExpanded)}
              className="flex items-center gap-2 text-xs font-bold text-violet-500 uppercase tracking-wider hover:text-violet-700 transition-colors">

              {projectBoardExpanded ?
              <ChevronDown size={12} /> :

              <ChevronRight size={12} />
              }
              <FolderKanban size={12} />
              Project Board
            </button>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full">
                {projects.length}
              </span>
              <button
                onClick={() => setShowNewProject(!showNewProject)}
                className="p-1 hover:bg-violet-100 text-violet-400 hover:text-violet-600 rounded transition-colors">

                {showNewProject ? <X size={12} /> : <Plus size={12} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {projectBoardExpanded &&
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
              transition={{
                duration: 0.2
              }}
              className="overflow-hidden">

                {/* New Project Form */}
                <AnimatePresence>
                  {showNewProject &&
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

                      <div className="mb-3 p-3 bg-violet-50/50 rounded-xl border border-violet-100 space-y-2">
                        <input
                      type="text"
                      placeholder="Project name..."
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) =>
                      e.key === 'Enter' && handleCreateProject()
                      }
                      className="w-full px-3 py-2 bg-white text-slate-900 text-sm rounded-lg border border-violet-200 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 placeholder:text-violet-300"
                      autoFocus />

                        <div className="flex gap-1.5 flex-wrap">
                          {PROJECT_ICONS.map((icon) =>
                      <button
                        key={icon}
                        onClick={() => setNewProjectIcon(icon)}
                        className={`p-1.5 rounded-md text-sm transition-colors ${newProjectIcon === icon ? 'bg-white shadow-sm ring-1 ring-violet-200' : 'hover:bg-white/50 text-slate-500'}`}>

                              {icon}
                            </button>
                      )}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {PROJECT_COLORS.map((color) =>
                      <button
                        key={color}
                        onClick={() => setNewProjectColor(color)}
                        className={`w-5 h-5 rounded-full transition-transform ${newProjectColor === color ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-violet-50 scale-110' : 'hover:scale-110'}`}
                        style={{
                          backgroundColor: color
                        }} />

                      )}
                        </div>
                        <button
                      onClick={handleCreateProject}
                      disabled={!newProjectName.trim()}
                      className="w-full py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-violet-200">

                          Create Project
                        </button>
                      </div>
                    </motion.div>
                }
                </AnimatePresence>

                {/* Project List */}
                <div className="space-y-0.5">
                  {projects.map((project) => {
                  const projectTasks = getProjectTasks(project.id);
                  const isSelected =
                  selectedProjectId === project.id ||
                  currentPath === `/project/${project.id}`;
                  const tasksDone = projectTasks.filter(
                    (t) => t.status === 'done'
                  ).length;
                  const progress =
                  projectTasks.length > 0 ?
                  Math.round(tasksDone / projectTasks.length * 100) :
                  0;
                  return (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}`}
                      onDragOver={(e) => handleDragOver(e, project.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, project.id)}
                      onClick={() => onSelectProject(project.id)}
                      className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all group ${dragOverProjectId === project.id ? 'bg-violet-100' : isSelected ? 'bg-violet-50 text-violet-900 font-medium' : 'text-slate-600 hover:bg-violet-50/50 hover:text-violet-700'}`}>

                        <span className="text-base flex-shrink-0">
                          {project.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="block truncate text-sm">
                            {project.name}
                          </span>
                          {/* Mini progress bar */}
                          <div className="h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: project.color
                            }} />

                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {projectTasks.length}
                        </span>
                      </Link>);

                })}
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

        {/* ═══════════════ VINE BOARD ═══════════════ */}
        <div className="px-3 py-4 border-b border-violet-50">
          <button
            onClick={() => setVineBoardExpanded(!vineBoardExpanded)}
            className="flex items-center justify-between w-full px-2 mb-2">

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider hover:text-emerald-700 transition-colors">
              {vineBoardExpanded ?
              <ChevronDown size={12} /> :

              <ChevronRight size={12} />
              }
              <Leaf size={12} />
              Vine Board
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                {vineConversations.length}
              </span>
              {totalUnread > 0 &&
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              }
            </div>
          </button>

          <AnimatePresence>
            {vineBoardExpanded &&
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
              transition={{
                duration: 0.2
              }}
              className="overflow-hidden">

                <div className="space-y-0.5">
                  {vineConversations.map((vine) => {
                  const project = getProjectForVine(vine.projectId);
                  const lastMsg = vine.messages[vine.messages.length - 1];
                  const isSelected = selectedVineId === vine.id;
                  return (
                    <button
                      key={vine.id}
                      onClick={() =>
                      handleSelectVine(isSelected ? null : vine.id)
                      }
                      className={`w-full flex items-start gap-2.5 px-2 py-2 rounded-lg text-left transition-all ${isSelected ? 'bg-emerald-50 text-emerald-900' : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'}`}>

                        <div
                        className={`mt-0.5 p-1.5 rounded-md flex-shrink-0 ${isSelected ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-50 text-emerald-400'}`}>

                          <MessageCircle size={12} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                            className={`text-xs font-medium truncate ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>

                              {vine.topic}
                            </span>
                            {vine.unreadCount > 0 &&
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          }
                          </div>
                          {project &&
                        <span className="text-[10px] text-slate-400 truncate block">
                              {project.icon} {project.name}
                            </span>
                        }
                          {lastMsg &&
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              <span className="font-medium">
                                {lastMsg.senderName}:
                              </span>{' '}
                              {lastMsg.content}
                            </p>
                        }
                        </div>
                      </button>);

                })}
                  {vineConversations.length === 0 &&
                <div className="px-2 py-4 text-center text-[11px] text-slate-400 italic">
                      No vine conversations yet
                    </div>
                }
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

        {/* ═══════════════ GRAPES BOARD ═══════════════ */}
        <div className="px-3 py-4 border-b border-violet-50">
          <button
            onClick={() => setGrapesBoardExpanded(!grapesBoardExpanded)}
            className="flex items-center justify-between w-full px-2 mb-2">

            <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-500 uppercase tracking-wider hover:text-fuchsia-700 transition-colors">
              {grapesBoardExpanded ?
              <ChevronDown size={12} /> :

              <ChevronRight size={12} />
              }
              <Circle size={12} />
              Grapes Board
            </div>
            <span className="text-[9px] font-bold text-fuchsia-600 bg-fuchsia-50 px-1.5 py-0.5 rounded-full">
              {MOCK_GRAPES.length}
            </span>
          </button>

          <AnimatePresence>
            {grapesBoardExpanded &&
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
              transition={{
                duration: 0.2
              }}
              className="overflow-hidden">

                <div className="space-y-0.5">
                  {MOCK_GRAPES.map((grape) => {
                  const project = projects.find(
                    (p) => p.id === grape.projectId
                  );
                  const isSelected = selectedGrapeId === grape.id;
                  const grapeTaskCount = tasks.filter(
                    (t) => t.assigneeId === grape.id
                  ).length;
                  return (
                    <button
                      key={grape.id}
                      onClick={() =>
                      handleSelectGrape(isSelected ? null : grape.id)
                      }
                      className={`w-full flex items-start gap-2.5 px-2 py-2 rounded-lg text-left transition-all ${isSelected ? 'bg-fuchsia-50 text-fuchsia-900' : 'text-slate-600 hover:bg-fuchsia-50/50 hover:text-fuchsia-700'}`}>

                        <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${grape.status === 'ripe' ? 'bg-fuchsia-400' : grape.status === 'harvested' ? 'bg-emerald-400' : 'bg-amber-400'}`} />

                        <div className="flex-1 min-w-0">
                          <span
                          className={`text-xs font-medium truncate block ${isSelected ? 'text-fuchsia-900' : 'text-slate-700'}`}>

                            {grape.title}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {project &&
                          <span className="text-[10px] text-slate-400 truncate">
                                {project.icon} {project.name}
                              </span>
                          }
                            <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${grape.status === 'ripe' ? 'bg-fuchsia-50 text-fuchsia-500' : grape.status === 'harvested' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>

                              {grape.status}
                            </span>
                          </div>
                        </div>
                        {grapeTaskCount > 0 &&
                      <span className="text-[9px] font-bold text-fuchsia-500 bg-fuchsia-50 px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                            {grapeTaskCount}
                          </span>
                      }
                      </button>);

                })}
                  {MOCK_GRAPES.length === 0 &&
                <div className="px-2 py-4 text-center text-[11px] text-slate-400 italic">
                      No grapes yet
                    </div>
                }
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

        {/* ═══════════════ TEAM BOARD ═══════════════ */}
        <div className="px-3 py-4">
          <button
            onClick={() => setTeamBoardExpanded(!teamBoardExpanded)}
            className="flex items-center justify-between w-full px-2 mb-2">

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors">
              {teamBoardExpanded ?
              <ChevronDown size={12} /> :

              <ChevronRight size={12} />
              }
              <Users size={12} />
              Team Board
            </div>
            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
              {TEAM_MEMBERS.length}
            </span>
          </button>

          <AnimatePresence>
            {teamBoardExpanded &&
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
              transition={{
                duration: 0.2
              }}
              className="overflow-hidden space-y-3">

                {/* Design Team */}
                <div>
                  <button
                  onClick={() => setDesignTeamExpanded(!designTeamExpanded)}
                  className="flex items-center gap-2 px-2 py-1 w-full text-left hover:bg-orange-50/50 rounded transition-colors">

                    {designTeamExpanded ?
                  <ChevronDown size={10} className="text-orange-300" /> :

                  <ChevronRight size={10} className="text-orange-300" />
                  }
                    <Palette size={10} className="text-orange-400" />
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex-1">
                      Design Team
                    </span>
                    <span className="text-[9px] font-bold text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded-full">
                      {
                    TEAM_MEMBERS.filter(
                      (m) => m.category === 'human-design'
                    ).length
                    }
                    </span>
                  </button>

                  <AnimatePresence>
                    {designTeamExpanded &&
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
                    className="overflow-hidden pl-2 space-y-0.5 mt-1">

                        {TEAM_MEMBERS.filter(
                      (m) => m.category === 'human-design'
                    ).map((member) =>
                    <TeamMemberButton
                      key={member.id}
                      member={member}
                      isSelected={selectedAgentId === member.id}
                      onClick={() =>
                      handleSelectAgent(
                        selectedAgentId === member.id ?
                        null :
                        member.id
                      )
                      } />

                    )}
                      </motion.div>
                  }
                  </AnimatePresence>
                </div>

                {/* Human Agents */}
                <div>
                  <button
                  onClick={() => setHumanAgentsExpanded(!humanAgentsExpanded)}
                  className="flex items-center gap-2 px-2 py-1 w-full text-left hover:bg-cyan-50/50 rounded transition-colors">

                    {humanAgentsExpanded ?
                  <ChevronDown size={10} className="text-cyan-300" /> :

                  <ChevronRight size={10} className="text-cyan-300" />
                  }
                    <Code size={10} className="text-cyan-400" />
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex-1">
                      Human Agents
                    </span>
                    <span className="text-[9px] font-bold text-cyan-400 bg-cyan-50 px-1.5 py-0.5 rounded-full">
                      {
                    TEAM_MEMBERS.filter((m) => m.category === 'human-ai').
                    length
                    }
                    </span>
                  </button>

                  <AnimatePresence>
                    {humanAgentsExpanded &&
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
                    className="overflow-hidden pl-2 space-y-0.5 mt-1">

                        {TEAM_MEMBERS.filter(
                      (m) => m.category === 'human-ai'
                    ).map((member) =>
                    <TeamMemberButton
                      key={member.id}
                      member={member}
                      isSelected={selectedAgentId === member.id}
                      onClick={() =>
                      handleSelectAgent(
                        selectedAgentId === member.id ?
                        null :
                        member.id
                      )
                      } />

                    )}
                      </motion.div>
                  }
                  </AnimatePresence>
                </div>

                {/* AI Special Agents */}
                <div>
                  <button
                  onClick={() => setAiAgentsExpanded(!aiAgentsExpanded)}
                  className="flex items-center gap-2 px-2 py-1 w-full text-left hover:bg-violet-50/50 rounded transition-colors">

                    {aiAgentsExpanded ?
                  <ChevronDown size={10} className="text-violet-300" /> :

                  <ChevronRight size={10} className="text-violet-300" />
                  }
                    <Brain size={10} className="text-violet-400" />
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex-1">
                      AI Agents
                    </span>
                    <span className="text-[9px] font-bold text-violet-400 bg-violet-50 px-1.5 py-0.5 rounded-full">
                      {
                    TEAM_MEMBERS.filter((m) => m.category === 'ai-special').
                    length
                    }
                    </span>
                  </button>

                  <AnimatePresence>
                    {aiAgentsExpanded &&
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
                    className="overflow-hidden pl-2 space-y-0.5 mt-1">

                        {TEAM_MEMBERS.filter(
                      (m) => m.category === 'ai-special'
                    ).map((member) =>
                    <TeamMemberButton
                      key={member.id}
                      member={member}
                      isSelected={selectedAgentId === member.id}
                      onClick={() =>
                      handleSelectAgent(
                        selectedAgentId === member.id ?
                        null :
                        member.id
                      )
                      } />

                    )}
                      </motion.div>
                  }
                  </AnimatePresence>
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-violet-100 bg-violet-50/30">
        <div className="flex items-center justify-between px-1 text-[10px] font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <Circle size={8} className="text-slate-400" />
            <span>{stats.todo} todo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={8} className="text-violet-500" />
            <span>{stats.inProgress} active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={8} className="text-emerald-500" />
            <span>{stats.done} done</span>
          </div>
        </div>
      </div>
    </div>);

}
function TeamMemberButton({
  member,
  isSelected,
  onClick




}: {member: TeamMember;isSelected: boolean;onClick: () => void;}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'active':
        return 'bg-blue-500';
      case 'busy':
        return 'bg-amber-500';
      case 'idle':
        return 'bg-slate-400';
      default:
        return 'bg-slate-400';
    }
  };
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'human-design':
        return '#f97316';
      case 'human-ai':
        return '#06b6d4';
      case 'ai-special':
        return '#8b5cf6';
      default:
        return '#71717a';
    }
  };
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isSelected ? 'bg-violet-50 text-violet-900 font-medium' : 'text-slate-600 hover:bg-violet-50/50 hover:text-violet-700'}`}>

      <div className="relative">
        {member.isAI ?
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm"
          style={{
            backgroundColor: getCategoryColor(member.category),
            color: 'white'
          }}>

            <Bot size={14} />
          </div> :

        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
          style={{
            backgroundColor: getCategoryColor(member.category)
          }}>

            {member.avatar ||
          member.name.
          split(' ').
          map((n) => n[0]).
          join('')}
          </div>
        }
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />

      </div>
      <span className="flex-1 text-left truncate">{member.name}</span>
    </button>);

}