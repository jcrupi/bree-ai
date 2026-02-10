import React, { useEffect, useState, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Task,
  Agent,
  Area,
  Project,
  TaskStatus,
  TaskPriority,
  DisplayMode,
  VineConversation,
  SpecialtyType } from
'../types';
import {
  Circle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  GripVertical,
  List,
  LayoutGrid,
  Calendar,
  Leaf,
  MessageCircle,
  Check,
  GitBranch,
  GitFork,
  ExternalLink,
  CheckSquare,
  Send,
  FileText,
  Bot } from
'lucide-react';
import { SPECIALTIES } from '../data/specialties';
import { TEAM_MEMBERS } from '../data/teamMembers';
import { MOCK_GRAPES } from '../data/grapes';
import { TaskNoteEditor } from './TaskNoteEditor';
import { AssigneeSelector } from './AssigneeSelector';
interface TaskListProps {
  tasks: Task[];
  tasksByStatus: Record<TaskStatus, Task[]>;
  getAgent: (id: string) => Agent | undefined;
  getArea: (id: string) => Area | undefined;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  title: string;
  subtitle?: string;
  projects: Project[];
  areas: Area[];
  agents: Agent[];
  selectedProjectId: string | null;
  vineConversations?: VineConversation[];
  onSelectVine?: (id: string) => void;
  onAddVine?: (vine: {
    topic: string;
    projectId: string;
    participants: string[];
    specialties?: SpecialtyType[];
  }) => void;
}
export function TaskList({
  tasks,
  tasksByStatus,
  getAgent,
  getArea,
  onUpdateStatus,
  onAddTask,
  title,
  subtitle,
  projects,
  areas,
  agents,
  selectedProjectId,
  vineConversations = [],
  onSelectVine = () => {},
  onAddVine
}: TaskListProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(['done'])
  );
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState(
    selectedProjectId || projects[0]?.id || ''
  );
  const [newTaskAreaId, setNewTaskAreaId] = useState(areas[0]?.id || '');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState(
    agents[0]?.id || ''
  );
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  // New State for AgentX Note
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [newTaskNoteId, setNewTaskNoteId] = useState<string | null>(null);
  const [newTaskNoteContent, setNewTaskNoteContent] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const [activeTab, setActiveTab] = useState<'tasks' | 'vines'>('tasks');
  // New Vine State
  const [showNewVine, setShowNewVine] = useState(false);
  const [newVineTopic, setNewVineTopic] = useState('');
  const [newVineParticipants, setNewVineParticipants] = useState<Set<string>>(
    new Set()
  );
  // Expanded vine cards
  const [expandedVineIds, setExpandedVineIds] = useState<Set<string>>(new Set());
  // Branch Selection State
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const selectedProject = selectedProjectId ?
  projects.find((p) => p.id === selectedProjectId) :
  null;
  // Reset branch selection when project changes
  useEffect(() => {
    if (selectedProject?.defaultBranch && selectedProject.branches) {
      const defaultBranch = selectedProject.branches.find((b) => b.isDefault);
      if (defaultBranch) {
        setSelectedBranchId(defaultBranch.id);
      } else if (selectedProject.branches.length > 0) {
        setSelectedBranchId(selectedProject.branches[0].id);
      }
    } else {
      setSelectedBranchId(null);
    }
  }, [selectedProjectId, selectedProject]);
  const activeBranch = selectedProject?.branches?.find(
    (b) => b.id === selectedBranchId
  );
  // Filter vines for this project
  const projectVines = selectedProjectId ?
  vineConversations.filter((v) => v.projectId === selectedProjectId) :
  [];
  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };
  const handleCreateTask = () => {
    if (newTaskTitle.trim() && newTaskProjectId) {
      onAddTask({
        title: newTaskTitle.trim(),
        status: 'todo',
        priority: newTaskPriority,
        projectId: newTaskProjectId,
        areaId: newTaskAreaId,
        assigneeId: newTaskAssigneeId,
        agentxNoteId: newTaskNoteId || undefined,
        agentxNoteContent: newTaskNoteContent || undefined
      });
      setNewTaskTitle('');
      // Reset note state
      setNewTaskNoteId(null);
      setNewTaskNoteContent('');
      setShowNoteEditor(false);
      setShowNewTask(false);
    }
  };
  const handleCreateVine = () => {
    if (
    newVineTopic.trim() &&
    selectedProjectId &&
    newVineParticipants.size > 0 &&
    onAddVine)
    {
      onAddVine({
        topic: newVineTopic.trim(),
        projectId: selectedProjectId,
        participants: Array.from(newVineParticipants),
        specialties: []
      });
      setNewVineTopic('');
      setNewVineParticipants(new Set());
      setShowNewVine(false);
    }
  };
  const toggleVineParticipant = (id: string) => {
    setNewVineParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const toggleVineExpanded = (vineId: string) => {
    setExpandedVineIds((prev) => {
      const next = new Set(prev);
      if (next.has(vineId)) {
        next.delete(vineId);
      } else {
        next.add(vineId);
      }
      return next;
    });
  };
  const sections: {
    key: TaskStatus;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
  {
    key: 'todo',
    label: 'To Do',
    icon: <Circle size={16} />,
    color: 'text-slate-400'
  },
  {
    key: 'in-progress',
    label: 'In Progress',
    icon: <Clock size={16} />,
    color: 'text-violet-500'
  },
  {
    key: 'done',
    label: 'Done',
    icon: <CheckCircle2 size={16} />,
    color: 'text-emerald-500'
  }];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-violet-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 mr-8">
            <h1 className="text-2xl font-display font-bold text-slate-900 truncate">
              {title}
            </h1>
            {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}

            {/* Git Info & Branch Selector */}
            {selectedProject && selectedProject.repoUrl &&
            <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                  <GitBranch size={12} />
                  <span className="font-mono">
                    {selectedProject.repoUrl.replace('https://', '')}
                  </span>
                  <ExternalLink size={10} className="ml-1 opacity-50" />
                </div>

                {selectedProject.branches &&
              selectedProject.branches.length > 0 &&
              <div className="relative">
                      <button
                  onClick={() =>
                  setShowBranchSelector(!showBranchSelector)
                  }
                  className="flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:border-violet-300 hover:text-violet-600 transition-colors shadow-sm">

                        <GitFork size={12} className="text-slate-400" />
                        <span className="font-mono">
                          {activeBranch?.name || 'Select Branch'}
                        </span>
                        <ChevronDown size={12} className="text-slate-400" />
                      </button>

                      <AnimatePresence>
                        {showBranchSelector &&
                  <>
                            <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowBranchSelector(false)} />

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
                      className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-100 z-20 overflow-hidden">

                              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Switch Branch
                              </div>
                              <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                {selectedProject.branches.map((branch) =>
                        <button
                          key={branch.id}
                          onClick={() => {
                            setSelectedBranchId(branch.id);
                            setShowBranchSelector(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors ${selectedBranchId === branch.id ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50'}`}>

                                    <div
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${branch.isDefault ? 'bg-emerald-500' : 'bg-slate-300'}`} />

                                    <span className="font-mono flex-1 truncate">
                                      {branch.name}
                                    </span>
                                    {selectedBranchId === branch.id &&
                          <Check size={12} />
                          }
                                  </button>
                        )}
                              </div>
                            </motion.div>
                          </>
                  }
                      </AnimatePresence>
                    </div>
              }
              </div>
            }
          </div>

          {/* Tabs for Project View */}
          {selectedProjectId &&
          <div className="flex bg-slate-100 p-1 rounded-lg flex-shrink-0">
              <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'tasks' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                Tasks
              </button>
              <button
              onClick={() => setActiveTab('vines')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'vines' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}>

                <span>Vines</span>
                <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'vines' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>

                  {projectVines.length}
                </span>
              </button>
            </div>
          }
        </div>

        {/* Controls Row */}
        {activeTab === 'tasks' ?
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-violet-50 rounded-lg p-1 border border-violet-100">
                <button
                onClick={() => setDisplayMode('list')}
                className={`p-1.5 rounded-md transition-all ${displayMode === 'list' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 hover:text-violet-500'}`}
                title="List view">

                  <List size={18} />
                </button>
                <button
                onClick={() => setDisplayMode('card')}
                className={`p-1.5 rounded-md transition-all ${displayMode === 'card' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 hover:text-violet-500'}`}
                title="Card view">

                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>

            <button
            onClick={() => setShowNewTask(!showNewTask)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-full hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300">

              {showNewTask ? <X size={16} /> : <Plus size={16} />}
              <span>{showNewTask ? 'Cancel' : 'New Task'}</span>
            </button>
          </div> :

        // Vines Controls
        <div className="flex items-center justify-end">
            <button
            onClick={() => setShowNewVine(!showNewVine)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300">

              {showNewVine ? <X size={16} /> : <Plus size={16} />}
              <span>{showNewVine ? 'Cancel' : 'New Vine'}</span>
            </button>
          </div>
        }

        {/* New Task Form */}
        <AnimatePresence>
          {showNewTask && activeTab === 'tasks' &&
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

              <div className="mt-6 p-5 bg-violet-50/50 rounded-2xl border border-violet-100 space-y-4">
                <input
                type="text"
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                className="w-full px-4 py-3 bg-white text-slate-900 text-sm rounded-xl border border-violet-200 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-400"
                autoFocus />


                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-violet-400 uppercase tracking-wider mb-1.5">
                      Project
                    </label>
                    <select
                    value={newTaskProjectId}
                    onChange={(e) => setNewTaskProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-sm rounded-lg border border-violet-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20">

                      {projects.map((p) =>
                    <option key={p.id} value={p.id}>
                          {p.icon} {p.name}
                        </option>
                    )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-violet-400 uppercase tracking-wider mb-1.5">
                      Area
                    </label>
                    <select
                    value={newTaskAreaId}
                    onChange={(e) => setNewTaskAreaId(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-sm rounded-lg border border-violet-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20">

                      {areas.map((a) =>
                    <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                    )}
                    </select>
                  </div>

                  <div className="relative z-20">
                    <AssigneeSelector
                    selectedId={newTaskAssigneeId}
                    onChange={setNewTaskAssigneeId}
                    teamMembers={TEAM_MEMBERS}
                    grapes={MOCK_GRAPES} />

                  </div>

                  <div>
                    <label className="block text-xs font-bold text-violet-400 uppercase tracking-wider mb-1.5">
                      Priority
                    </label>
                    <select
                    value={newTaskPriority}
                    onChange={(e) =>
                    setNewTaskPriority(e.target.value as TaskPriority)
                    }
                    className="w-full px-3 py-2 bg-white text-sm rounded-lg border border-violet-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20">

                      <option value="urgent">🔴 Urgent</option>
                      <option value="high">🟠 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">⚪ Low</option>
                    </select>
                  </div>
                </div>

                {/* AgentX Note Section */}
                <div className="border-t border-violet-100 pt-2">
                  <button
                  onClick={() => setShowNoteEditor(!showNoteEditor)}
                  className="flex items-center gap-2 text-xs font-bold text-violet-500 hover:text-violet-700 transition-colors py-2">

                    <FileText size={14} />
                    {showNoteEditor ? 'Hide AgentX Note' : 'Attach AgentX Note'}
                    <ChevronDown
                    size={14}
                    className={`transition-transform ${showNoteEditor ? 'rotate-180' : ''}`} />

                  </button>

                  <AnimatePresence>
                    {showNoteEditor &&
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

                        <div className="pt-2 pb-4">
                          <TaskNoteEditor
                        onNoteChange={(id, content) => {
                          setNewTaskNoteId(id);
                          setNewTaskNoteContent(content);
                        }} />

                        </div>
                      </motion.div>
                  }
                  </AnimatePresence>
                </div>

                <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim() || !newTaskProjectId}
                className="w-full py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-200">

                  Create Task
                </button>
              </div>
            </motion.div>
          }
        </AnimatePresence>

        {/* New Vine Form */}
        <AnimatePresence>
          {showNewVine && activeTab === 'vines' &&
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

              <div className="mt-6 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                <input
                type="text"
                placeholder="What's the topic of this vine?"
                value={newVineTopic}
                onChange={(e) => setNewVineTopic(e.target.value)}
                className="w-full px-4 py-3 bg-white text-slate-900 text-sm rounded-xl border border-emerald-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-emerald-300/70"
                autoFocus />


                <div>
                  <label className="block text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">
                    Select Participants
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {TEAM_MEMBERS.map((member) =>
                  <button
                    key={member.id}
                    onClick={() => toggleVineParticipant(member.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all border ${newVineParticipants.has(member.id) ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-100'}`}>

                        <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border ${newVineParticipants.has(member.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>

                          {newVineParticipants.has(member.id) &&
                      <Check size={10} />
                      }
                        </div>
                        <span className="truncate font-medium">
                          {member.name}
                        </span>
                      </button>
                  )}
                  </div>
                </div>

                <button
                onClick={handleCreateVine}
                disabled={
                !newVineTopic.trim() || newVineParticipants.size === 0
                }
                className="w-full py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-200">

                  Start Conversation
                </button>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {activeTab === 'tasks' ?
        displayMode === 'list' ?
        // List View
        sections.map((section) => {
          const sectionTasks = tasksByStatus[section.key];
          const isCollapsed = collapsedSections.has(section.key);
          return (
            <div key={section.key} className="mb-2">
                  {/* Section Header */}
                  <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center gap-3 px-6 py-3 hover:bg-violet-50/50 transition-colors rounded-lg group">

                    <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform group-hover:text-violet-500 ${isCollapsed ? '-rotate-90' : ''}`} />


                    <span className={section.color}>{section.icon}</span>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-violet-700">
                      {section.label}
                    </span>
                    <span className="text-xs font-medium text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                      {sectionTasks.length}
                    </span>
                  </button>

                  {/* Tasks */}
                  <AnimatePresence>
                    {!isCollapsed &&
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
                  }}>

                        {sectionTasks.length === 0 ?
                  <div className="px-12 py-4 text-sm text-slate-400 italic">
                            No tasks in this section
                          </div> :

                  <div className="pb-2 space-y-1 px-2">
                            {sectionTasks.map((task, idx) =>
                    <TaskRow
                      key={task.id}
                      task={task}
                      agent={getAgent(task.assigneeId)}
                      area={getArea(task.areaId)}
                      onUpdateStatus={onUpdateStatus}
                      index={idx}
                      vineConversations={vineConversations}
                      onSelectVine={onSelectVine} />

                    )}
                          </div>
                  }
                      </motion.div>
                }
                  </AnimatePresence>
                </div>);

        }) :

        // Card View
        <div className="p-6 space-y-8">
              {sections.map((section) => {
            const sectionTasks = tasksByStatus[section.key];
            if (sectionTasks.length === 0) return null;
            return (
              <div key={section.key}>
                    <div className="flex items-center gap-3 mb-4 px-1">
                      <span className={section.color}>{section.icon}</span>
                      <span className="text-sm font-bold text-slate-700">
                        {section.label}
                      </span>
                      <span className="text-xs font-medium text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                        {sectionTasks.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sectionTasks.map((task, idx) =>
                  <TaskCard
                    key={task.id}
                    task={task}
                    agent={getAgent(task.assigneeId)}
                    area={getArea(task.areaId)}
                    onUpdateStatus={onUpdateStatus}
                    index={idx}
                    vineConversations={vineConversations}
                    onSelectVine={onSelectVine} />

                  )}
                    </div>
                  </div>);

          })}
            </div> :


        // Vines View
        <div className="p-6">
            {projectVines.length === 0 ?
          <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mb-4">
                  <Leaf size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  No Vines Yet
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Start a conversation with your team to discuss this project.
                </p>
              </div> :

          <div className="space-y-4">
                {projectVines.map((vine, idx) => {
              const lastMessage = vine.messages[vine.messages.length - 1];
              const isExpanded = expandedVineIds.has(vine.id);
              return (
                <motion.div
                  key={vine.id}
                  initial={{
                    opacity: 0,
                    y: 10
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  transition={{
                    delay: idx * 0.05
                  }}
                  className="rounded-2xl border border-emerald-100 bg-white overflow-hidden transition-shadow hover:shadow-lg hover:shadow-emerald-100/50">

                      {/* Card Header — always visible, click to toggle */}
                      <button
                    onClick={() => toggleVineExpanded(vine.id)}
                    className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-emerald-50/30">

                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 flex-shrink-0">
                          <MessageCircle size={20} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-base text-slate-900 truncate">
                              {vine.topic}
                            </h3>
                            {vine.unreadCount > 0 &&
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex-shrink-0">
                                {vine.unreadCount} new
                              </span>
                        }
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex -space-x-1.5">
                              {vine.participants.slice(0, 4).map((pId) => {
                            const member = TEAM_MEMBERS.find(
                              (m) => m.id === pId
                            );
                            return (
                              <div
                                key={pId}
                                className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-bold text-white"
                                style={{
                                  backgroundColor:
                                  member?.category === 'human-design' ?
                                  '#e07852' :
                                  '#0284c7'
                                }}>

                                    {member?.avatar ||
                                pId.substring(0, 2).toUpperCase()}
                                  </div>);

                          })}
                            </span>
                            <span className="text-xs text-slate-400">
                              {vine.participants.length} participants ·{' '}
                              {vine.messages.length} messages
                            </span>
                          </div>
                        </div>

                        {/* Collapse/Expand indicator */}
                        <div
                      className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${isExpanded ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'}`}>

                          {isExpanded ?
                      <ChevronUp size={18} /> :

                      <ChevronDown size={18} />
                      }
                        </div>
                      </button>

                      {/* Task Tags — always visible below header */}
                      {vine.taskIds && vine.taskIds.length > 0 &&
                  <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                          {vine.taskIds.map((taskId) => {
                      const task = tasks.find((t) => t.id === taskId);
                      return (
                        <Link
                          key={taskId}
                          to={`/task/${taskId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 hover:bg-violet-100 hover:border-violet-200 transition-all">

                                {task ?
                          <>
                                    {task.status === 'done' ?
                            <CheckCircle2
                              size={9}
                              className="text-emerald-500" /> :

                            task.status === 'in-progress' ?
                            <Clock
                              size={9}
                              className="text-violet-500" /> :


                            <Circle
                              size={9}
                              className="text-slate-300" />

                            }
                                    <span className="max-w-[100px] truncate">
                                      {task.title}
                                    </span>
                                  </> :

                          <>
                                    <CheckSquare size={9} />
                                    <span>{taskId}</span>
                                  </>
                          }
                              </Link>);

                    })}
                        </div>
                  }

                      {/* Collapsible Messages Area */}
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
                      transition={{
                        type: 'spring',
                        damping: 28,
                        stiffness: 300
                      }}
                      className="overflow-hidden">

                            <div className="border-t border-emerald-50">
                              {/* Messages */}
                              <div className="max-h-[400px] overflow-y-auto custom-scrollbar px-5 py-4 space-y-4 relative">
                                {/* Vine spine decoration */}
                                <div
                            className="absolute left-1/2 top-0 bottom-0 w-px pointer-events-none"
                            style={{
                              background:
                              'linear-gradient(to bottom, transparent, rgba(82,183,136,0.15), transparent)'
                            }} />


                                {vine.messages.length === 0 ?
                          <div className="text-center py-8 text-slate-400 text-sm">
                                    <Leaf
                              size={24}
                              className="mx-auto mb-2 opacity-30" />

                                    No messages yet
                                  </div> :

                          vine.messages.map((msg, msgIdx) => {
                            const isLeft =
                            msg.senderCategory === 'human-design';
                            return (
                              <motion.div
                                key={msg.id}
                                initial={{
                                  opacity: 0,
                                  y: 8
                                }}
                                animate={{
                                  opacity: 1,
                                  y: 0
                                }}
                                transition={{
                                  delay: msgIdx * 0.06,
                                  duration: 0.3
                                }}
                                className={`flex ${isLeft ? 'justify-start pr-[20%]' : 'justify-end pl-[20%] flex-row-reverse'} gap-2.5`}>

                                        {/* Avatar */}
                                        <div
                                  className="w-8 h-8 min-w-[32px] rounded-full flex items-center justify-center text-[9px] font-vine font-bold text-white flex-shrink-0 mt-0.5"
                                  style={{
                                    backgroundColor: isLeft ?
                                    '#e07852' :
                                    '#0284c7',
                                    boxShadow:
                                    '0 2px 8px rgba(0,0,0,0.1)'
                                  }}>

                                          {(() => {
                                    const member = TEAM_MEMBERS.find(
                                      (m) => m.id === msg.senderId
                                    );
                                    return member?.avatar || '??';
                                  })()}
                                        </div>

                                        {/* Body */}
                                        <div
                                  className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'} min-w-0 flex-1`}>

                                          <div
                                    className={`flex items-center gap-1.5 mb-1 ${isLeft ? '' : 'flex-row-reverse'}`}>

                                            <span className="font-vine font-medium text-[11px] text-[#3c2415]">
                                              {msg.senderName}
                                            </span>
                                            <span className="text-[9px] text-[#94a3b8]">
                                              {new Date(
                                        msg.timestamp
                                      ).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                            </span>
                                          </div>
                                          <div
                                    className="relative px-3.5 py-2.5 text-[13px] leading-relaxed text-[#334155] bg-white"
                                    style={{
                                      borderRadius: isLeft ?
                                      '18px 18px 18px 4px' :
                                      '18px 18px 4px 18px',
                                      border: isLeft ?
                                      '1.5px solid rgba(45, 106, 79, 0.12)' :
                                      '1.5px solid rgba(2, 132, 199, 0.10)',
                                      boxShadow: isLeft ?
                                      '0 1px 8px rgba(45, 106, 79, 0.05)' :
                                      '0 1px 8px rgba(2, 132, 199, 0.05)'
                                    }}>

                                            {isLeft ?
                                    <div
                                      className="absolute top-0 left-0 w-[3px] h-full rounded-l-[4px] opacity-40"
                                      style={{
                                        background:
                                        'linear-gradient(to bottom, #52b788, #2d6a4f)'
                                      }} /> :


                                    <div
                                      className="absolute top-0 right-0 w-[3px] h-full rounded-r-[4px] opacity-35"
                                      style={{
                                        background:
                                        'linear-gradient(to bottom, #38bdf8, #0284c7)'
                                      }} />

                                    }
                                            {msg.content}
                                          </div>
                                        </div>
                                      </motion.div>);

                          })
                          }
                              </div>

                              {/* Footer */}
                              <div className="px-5 py-3 border-t border-emerald-50 bg-emerald-50/20 flex items-center justify-between">
                                <p className="text-[10px] text-[#94a3b8]">
                                  Read-only ·{' '}
                                  <span className="text-[#52b788] font-medium">
                                    Vine Active
                                  </span>
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  Last active{' '}
                                  {new Date(
                              vine.lastActivity
                            ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                    }
                      </AnimatePresence>

                      {/* Collapsed preview — show last message when collapsed */}
                      {!isExpanded && lastMessage &&
                  <div className="px-5 pb-4">
                          <div className="p-3 bg-slate-50 rounded-xl text-[13px] text-slate-500 line-clamp-2">
                            <span className="font-semibold text-slate-700">
                              {lastMessage.senderName}:
                            </span>{' '}
                            {lastMessage.content}
                          </div>
                        </div>
                  }
                    </motion.div>);

            })}
              </div>
          }
          </div>
        }
      </div>
    </div>);

}
function TaskRow({
  task,
  agent,
  area,
  onUpdateStatus,
  index,
  vineConversations = [],
  onSelectVine








}: {task: Task;agent?: Agent;area?: Area;onUpdateStatus: (taskId: string, status: TaskStatus) => void;index: number;vineConversations?: VineConversation[];onSelectVine?: (id: string) => void;}) {
  // Check if assignee is a Grape
  const grapeAssignee = !agent ?
  MOCK_GRAPES.find((g) => g.id === task.assigneeId) :
  null;
  // Check if assignee is a TeamMember (if not found in agents prop but exists in TEAM_MEMBERS)
  const teamMemberAssignee =
  !agent && !grapeAssignee ?
  TEAM_MEMBERS.find((m) => m.id === task.assigneeId) :
  null;
  const cycleStatus = () => {
    const statusOrder: TaskStatus[] = ['todo', 'in-progress', 'done'];
    const currentIdx = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIdx + 1) % statusOrder.length];
    onUpdateStatus(task.id, nextStatus);
  };
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const priorityColors = {
    urgent: 'bg-rose-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-400',
    low: 'bg-slate-300'
  };
  // Find vines linked to this task
  const linkedVines = vineConversations.filter(
    (v) => v.taskIds && v.taskIds.includes(task.id)
  );
  return (
    <div draggable onDragStart={handleDragStart} className="group">
      <motion.div
        initial={{
          opacity: 0,
          x: -10
        }}
        animate={{
          opacity: 1,
          x: 0
        }}
        transition={{
          delay: index * 0.02
        }}
        className="flex items-center gap-4 px-6 py-3 bg-white border border-transparent hover:border-violet-100 hover:shadow-sm rounded-xl transition-all cursor-grab active:cursor-grabbing">

        {/* Drag Handle */}
        <GripVertical
          size={16}
          className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />


        {/* Status Toggle */}
        <button
          onClick={cycleStatus}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-transform active:scale-90">

          {task.status === 'done' ?
          <CheckCircle2 size={20} className="text-emerald-500" /> :
          task.status === 'in-progress' ?
          <div className="w-5 h-5 rounded-full border-2 border-violet-500 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            </div> :

          <Circle
            size={20}
            className="text-slate-300 group-hover:text-violet-400" />

          }
        </button>

        {/* Priority Indicator */}
        <div
          className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority]}`}
          title={`${task.priority} priority`} />


        {/* Task Title */}
        <span
          className={`flex-1 text-sm font-medium ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>

          {task.title}
        </span>

        {/* Vine Link */}
        {linkedVines.length > 0 &&
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectVine) onSelectVine(linkedVines[0].id);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all"
          title={`Open vine: ${linkedVines[0].topic}`}>

            <Leaf size={12} />
            {linkedVines.length > 1 &&
          <span className="text-[9px] font-bold">{linkedVines.length}</span>
          }
          </button>
        }

        {/* Specialties */}
        {task.specialties && task.specialties.length > 0 &&
        <div className="flex items-center gap-1 mr-2">
            {task.specialties.map((spec) =>
          <SpecialtyBadge key={spec} type={spec} />
          )}
          </div>
        }

        {/* Area Tag */}
        {area &&
        <span
          className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide"
          style={{
            backgroundColor: `${area.color}15`,
            color: area.color
          }}>

            {area.name}
          </span>
        }

        {/* Assignee */}
        {(agent || teamMemberAssignee || grapeAssignee) &&
        <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
            {grapeAssignee ?
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-fuchsia-600 bg-fuchsia-100 shadow-sm"
            title={`Grape: ${grapeAssignee.title}`}>

                <Circle size={12} />
              </div> :
          teamMemberAssignee ?
          teamMemberAssignee.isAI ?
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-violet-100 text-violet-600 shadow-sm">
                  <Bot size={14} />
                </div> :

          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
            style={{
              backgroundColor:
              teamMemberAssignee.category === 'human-design' ?
              '#f97316' :
              '#06b6d4'
            }}>

                  {teamMemberAssignee.avatar}
                </div> :

          agent ?
          agent.type === 'ai' ?
          <span className="text-base">{agent.avatar}</span> :

          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
            style={{
              backgroundColor: agent.color
            }}>

                  {agent.name.
            split(' ').
            map((n) => n[0]).
            join('')}
                </div> :

          null}
          </div>
        }
      </motion.div>
    </div>);

}
// Card View Component
function TaskCard({
  task,
  agent,
  area,
  onUpdateStatus,
  index,
  vineConversations = [],
  onSelectVine








}: {task: Task;agent?: Agent;area?: Area;onUpdateStatus: (taskId: string, status: TaskStatus) => void;index: number;vineConversations?: VineConversation[];onSelectVine?: (id: string) => void;}) {
  // Check if assignee is a Grape
  const grapeAssignee = !agent ?
  MOCK_GRAPES.find((g) => g.id === task.assigneeId) :
  null;
  // Check if assignee is a TeamMember
  const teamMemberAssignee =
  !agent && !grapeAssignee ?
  TEAM_MEMBERS.find((m) => m.id === task.assigneeId) :
  null;
  const cycleStatus = () => {
    const statusOrder: TaskStatus[] = ['todo', 'in-progress', 'done'];
    const currentIdx = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIdx + 1) % statusOrder.length];
    onUpdateStatus(task.id, nextStatus);
  };
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const priorityConfig = {
    urgent: {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      dot: 'bg-rose-500',
      label: 'Urgent'
    },
    high: {
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      dot: 'bg-orange-500',
      label: 'High'
    },
    medium: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      dot: 'bg-amber-400',
      label: 'Medium'
    },
    low: {
      bg: 'bg-slate-50',
      border: 'border-slate-100',
      dot: 'bg-slate-400',
      label: 'Low'
    }
  };
  const priority = priorityConfig[task.priority];
  // Find vines linked to this task
  const linkedVines = vineConversations.filter(
    (v) => v.taskIds && v.taskIds.includes(task.id)
  );
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="cursor-grab active:cursor-grabbing">

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
          delay: index * 0.03
        }}
        className={`group p-5 rounded-2xl border bg-white hover:shadow-lg hover:shadow-violet-100/50 transition-all ${task.status === 'done' ? 'opacity-75' : ''}`}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <button
            onClick={cycleStatus}
            className="flex-shrink-0 mt-0.5 transition-transform active:scale-90">

            {task.status === 'done' ?
            <CheckCircle2 size={20} className="text-emerald-500" /> :
            task.status === 'in-progress' ?
            <div className="w-5 h-5 rounded-full border-2 border-violet-500 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              </div> :

            <Circle
              size={20}
              className="text-slate-300 group-hover:text-violet-400" />

            }
          </button>
          <span
            className={`flex-1 text-sm font-bold ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>

            {task.title}
          </span>

          {/* Vine Link on Card */}
          {linkedVines.length > 0 &&
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectVine) onSelectVine(linkedVines[0].id);
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all flex-shrink-0"
            title={linkedVines.map((v) => v.topic).join(', ')}>

              <Leaf size={13} />
              <span className="text-[10px] font-bold">
                {linkedVines.length}
              </span>
            </button>
          }
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Priority */}
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${priority.bg} ${priority.border} border text-slate-600`}>

            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
          </span>

          {/* Area */}
          {area &&
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider"
            style={{
              backgroundColor: `${area.color}15`,
              color: area.color
            }}>

              {area.name}
            </span>
          }

          {/* Specialties */}
          {task.specialties &&
          task.specialties.map((spec) =>
          <SpecialtyBadge key={spec} type={spec} />
          )}
        </div>

        {/* Vine Details (shown below tags if linked) */}
        {linkedVines.length > 0 &&
        <div className="flex flex-wrap gap-1.5 mb-4">
            {linkedVines.map((vine) =>
          <button
            key={vine.id}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectVine) onSelectVine(vine.id);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all">

                <Leaf size={10} />
                <span className="max-w-[120px] truncate">{vine.topic}</span>
                {vine.unreadCount > 0 &&
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            }
              </button>
          )}
          </div>
        }

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {/* Assignee */}
          {agent || teamMemberAssignee || grapeAssignee ?
          <div className="flex items-center gap-2">
              {grapeAssignee ?
            <>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-fuchsia-600 bg-fuchsia-100 shadow-sm">
                    <Circle size={12} />
                  </div>
                  <span className="text-xs font-medium text-slate-500 truncate max-w-[100px]">
                    {grapeAssignee.title}
                  </span>
                </> :
            teamMemberAssignee ?
            <>
                  {teamMemberAssignee.isAI ?
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-violet-100 text-violet-600 shadow-sm">
                      <Bot size={14} />
                    </div> :

              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{
                  backgroundColor:
                  teamMemberAssignee.category === 'human-design' ?
                  '#f97316' :
                  '#06b6d4'
                }}>

                      {teamMemberAssignee.avatar}
                    </div>
              }
                  <span className="text-xs font-medium text-slate-500">
                    {teamMemberAssignee.name}
                  </span>
                </> :
            agent ?
            <>
                  {agent.type === 'ai' ?
              <span className="text-sm">{agent.avatar}</span> :

              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{
                  backgroundColor: agent.color
                }}>

                      {agent.name.
                split(' ').
                map((n) => n[0]).
                join('')}
                    </div>
              }
                  <span className="text-xs font-medium text-slate-500">
                    {agent.name}
                  </span>
                </> :
            null}
            </div> :

          <span className="text-xs text-slate-400 italic">Unassigned</span>
          }

          {/* Date */}
          {task.createdAt &&
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Calendar size={12} />
              {new Date(task.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
            </div>
          }
        </div>
      </motion.div>
    </div>);

}
// Helper component for Specialty Badges
function SpecialtyBadge({ type }: {type: SpecialtyType;}) {
  const config = SPECIALTIES[type];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        borderColor: `${config.color}30` // 30% opacity for border
      }}
      title={config.name}>

      <Icon size={10} />
      {config.name}
    </span>);

}