import React, { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  GitBranch,
  GitFork,
  GitCommit,
  CheckSquare,
  Leaf,
  Circle,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Minimize2,
  Plus,
  X,
  Save } from
'lucide-react';
import { useAgentTasks } from '../hooks/useAgentTasks';
import { MOCK_GRAPES } from '../data/grapes';
import { TEAM_MEMBERS } from '../data/teamMembers';
import { VINE_CONVERSATIONS } from '../data/vineConversations';
import {
  TaskStatus,
  GrapeStatus,
  Task,
  Grape,
  VineConversation,
  Project } from
'../types';
import { useLensDropZone } from '../hooks/useAILens';
type ExpandedCardType = 'tasks' | 'vines' | 'grapes' | 'git' | null;
export function ProjectBoardPage() {
  const { projectId } = useParams<{
    projectId: string;
  }>();
  const [searchParams] = useSearchParams();
  const [expandedCard, setExpandedCard] = useState<ExpandedCardType>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showNewVineForm, setShowNewVineForm] = useState(false);
  const [showNewGrapeForm, setShowNewGrapeForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newVineTopic, setNewVineTopic] = useState('');
  const [newGrapeTitle, setNewGrapeTitle] = useState('');
  const { getProject, allTasks, projects } = useAgentTasks();
  const resolvedProjectId =
  projectId || (projects.length > 0 ? projects[0].id : null);
  const project = resolvedProjectId ? getProject(resolvedProjectId) : null;
  const projectTasks = allTasks.filter((t) => t.projectId === resolvedProjectId);
  const projectVines = VINE_CONVERSATIONS.filter(
    (v: any) => v.projectId === resolvedProjectId
  );
  const projectGrapes = MOCK_GRAPES.filter(
    (g) => g.projectId === resolvedProjectId
  );
  const taskStats = {
    total: projectTasks.length,
    todo: projectTasks.filter((t) => t.status === 'todo').length,
    inProgress: projectTasks.filter((t) => t.status === 'in-progress').length,
    done: projectTasks.filter((t) => t.status === 'done').length
  };
  const progress =
  taskStats.total > 0 ?
  Math.round(taskStats.done / taskStats.total * 100) :
  0;

  // ── Create Handlers ──
  const handleCreateTask = () => {
    if (!newTaskTitle.trim() || !resolvedProjectId) return;

    // Mock task creation - in real app would call API
    console.log('[Create Task]', {
      title: newTaskTitle,
      projectId: resolvedProjectId,
      status: 'todo' as TaskStatus,
      priority: 'medium',
      assigneeId: 'user-1'
    });

    setNewTaskTitle('');
    setShowNewTaskForm(false);
    // TODO: Integrate with useAgentTasks addTask method
  };

  const handleCreateVine = () => {
    if (!newVineTopic.trim() || !resolvedProjectId) return;

    // Mock vine creation
    console.log('[Create Vine]', {
      topic: newVineTopic,
      projectId: resolvedProjectId,
      participants: ['user-1'],
      messages: []
    });

    setNewVineTopic('');
    setShowNewVineForm(false);
    // TODO: Integrate with vine state management
  };

  const handleCreateGrape = () => {
    if (!newGrapeTitle.trim() || !resolvedProjectId) return;

    // Mock grape creation
    console.log('[Create Grape]', {
      title: newGrapeTitle,
      projectId: resolvedProjectId,
      status: 'growing' as GrapeStatus
    });

    setNewGrapeTitle('');
    setShowNewGrapeForm(false);
    // TODO: Integrate with grape state management
  };

  // ── AI Lens Drop Zones — MUST be called before any early return ──
  const tasksZone = useLensDropZone({
    id: `project-${resolvedProjectId || 'none'}-tasks`,
    label: 'Tasks',
    pageId: 'project-board',
    dataType: 'tasks',
    getData: () => ({
      tasks: projectTasks,
      vines: projectVines,
      grapes: projectGrapes,
      project
    }),
    getSummary: () =>
    `${taskStats.total} tasks (${taskStats.inProgress} active, ${taskStats.todo} todo)`
  });
  const vinesZone = useLensDropZone({
    id: `project-${resolvedProjectId || 'none'}-vines`,
    label: 'Vines',
    pageId: 'project-board',
    dataType: 'vines',
    getData: () => ({
      tasks: projectTasks,
      vines: projectVines,
      grapes: projectGrapes,
      project
    }),
    getSummary: () => `${projectVines.length} active conversations`
  });
  const grapesZone = useLensDropZone({
    id: `project-${resolvedProjectId || 'none'}-grapes`,
    label: 'Grapes',
    pageId: 'project-board',
    dataType: 'grapes',
    getData: () => ({
      tasks: projectTasks,
      vines: projectVines,
      grapes: projectGrapes,
      project
    }),
    getSummary: () => `${projectGrapes.length} grapes in the vineyard`
  });
  const gitZone = useLensDropZone({
    id: `project-${resolvedProjectId || 'none'}-git`,
    label: 'Repository',
    pageId: 'project-board',
    dataType: 'git',
    getData: () => ({
      tasks: projectTasks,
      vines: projectVines,
      grapes: projectGrapes,
      project
    }),
    getSummary: () =>
    `${project?.branches?.length || 0} branches in repository`
  });
  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8f6ff]">
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900">
            No projects found
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Create a project to get started.
          </p>
        </div>
      </div>);

  }
  const statusIcon = (status: TaskStatus, size = 12) => {
    if (status === 'done')
    return <CheckCircle2 size={size} className="text-emerald-500" />;
    if (status === 'in-progress')
    return <Clock size={size} className="text-violet-500" />;
    return <Circle size={size} className="text-slate-300" />;
  };
  const grapeStatusColor = (status: GrapeStatus) => {
    switch (status) {
      case 'growing':
        return 'bg-amber-400';
      case 'ripe':
        return 'bg-purple-500';
      case 'harvested':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-300';
    }
  };
  const grapeStatusLabel = (status: GrapeStatus) => {
    switch (status) {
      case 'growing':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-600'
        };
      case 'ripe':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-600'
        };
      case 'harvested':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-600'
        };
      default:
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-500'
        };
    }
  };
  const toggleExpand = (card: ExpandedCardType) => {
    setExpandedCard(expandedCard === card ? null : card);
  };
  const CompactTasksPanel = () =>
  <div className="space-y-1.5">
      <button
      onClick={() => setExpandedCard('tasks')}
      className="flex items-center gap-2 mb-2 group">

        <div className="p-1 bg-violet-100 text-violet-600 rounded">
          <CheckSquare size={10} />
        </div>
        <span className="text-xs font-bold text-slate-700 group-hover:text-violet-600 transition-colors">
          Tasks
        </span>
        <span className="text-[9px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full ml-auto">
          {taskStats.total}
        </span>
      </button>
      <div className="h-1 bg-white rounded-full overflow-hidden mb-2">
        <div
        className="h-full bg-violet-500 rounded-full"
        style={{
          width: `${progress}%`
        }} />

      </div>
      {projectTasks.slice(0, 3).map((task) =>
    <div
      key={task.id}
      className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-white/60 transition-colors">

          {statusIcon(task.status, 10)}
          <span
        className={`text-[10px] truncate flex-1 ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-600'}`}>

            {task.title}
          </span>
        </div>
    )}
      {projectTasks.length > 3 &&
    <button
      onClick={() => setExpandedCard('tasks')}
      className="text-[9px] font-bold text-violet-500 hover:text-violet-700 flex items-center gap-0.5 mt-1 transition-colors">

          +{projectTasks.length - 3} more <ChevronRight size={8} />
        </button>
    }
    </div>;

  const CompactVinesPanel = () =>
  <div className="space-y-1.5">
      <button
      onClick={() => setExpandedCard('vines')}
      className="flex items-center gap-2 mb-2 group">

        <div className="p-1 bg-emerald-100 text-emerald-600 rounded">
          <Leaf size={10} />
        </div>
        <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
          Vines
        </span>
        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full ml-auto">
          {projectVines.length}
        </span>
      </button>
      {projectVines.slice(0, 3).map((vine: any) => {
      const lastMsg = vine.messages[vine.messages.length - 1];
      return (
        <div
          key={vine.id}
          className="py-1.5 px-1.5 rounded hover:bg-white/60 transition-colors">

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-700 truncate flex-1">
                {vine.topic}
              </span>
              {vine.unreadCount > 0 &&
            <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
            }
            </div>
            {lastMsg &&
          <p className="text-[9px] text-slate-400 truncate mt-0.5">
                {lastMsg.senderName}: {lastMsg.content}
              </p>
          }
          </div>);

    })}
      {projectVines.length > 3 &&
    <button
      onClick={() => setExpandedCard('vines')}
      className="text-[9px] font-bold text-emerald-500 hover:text-emerald-700 flex items-center gap-0.5 mt-1 transition-colors">

          +{projectVines.length - 3} more <ChevronRight size={8} />
        </button>
    }
    </div>;

  const CompactGrapesPanel = () =>
  <div className="space-y-1.5">
      <button
      onClick={() => setExpandedCard('grapes')}
      className="flex items-center gap-2 mb-2 group">

        <div className="p-1 bg-fuchsia-100 text-fuchsia-600 rounded">
          <Circle size={10} />
        </div>
        <span className="text-xs font-bold text-slate-700 group-hover:text-fuchsia-600 transition-colors">
          Grapes
        </span>
        <span className="text-[9px] font-bold bg-fuchsia-100 text-fuchsia-600 px-1.5 py-0.5 rounded-full ml-auto">
          {projectGrapes.length}
        </span>
      </button>
      {projectGrapes.slice(0, 3).map((grape) => {
      const label = grapeStatusLabel(grape.status);
      return (
        <div
          key={grape.id}
          className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-white/60 transition-colors">

            <div
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${grapeStatusColor(grape.status)}`} />

            <span className="text-[10px] text-slate-600 truncate flex-1">
              {grape.title}
            </span>
            <span
            className={`text-[7px] font-bold uppercase px-1 py-0.5 rounded ${label.bg} ${label.text}`}>

              {grape.status}
            </span>
          </div>);

    })}
      {projectGrapes.length > 3 &&
    <button
      onClick={() => setExpandedCard('grapes')}
      className="text-[9px] font-bold text-fuchsia-500 hover:text-fuchsia-700 flex items-center gap-0.5 mt-1 transition-colors">

          +{projectGrapes.length - 3} more <ChevronRight size={8} />
        </button>
    }
    </div>;

  const CompactRepoPanel = () =>
  <div className="space-y-1.5">
      <button
      onClick={() => setExpandedCard('git')}
      className="flex items-center gap-2 mb-2 group">

        <div className="p-1 bg-slate-700 text-white rounded">
          <GitBranch size={10} />
        </div>
        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
          Repository
        </span>
        {project.branches &&
      <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full ml-auto">
            {project.branches.length}
          </span>
      }
      </button>
      {project.repoUrl &&
    <div className="flex items-center gap-1.5 py-1 px-1.5 rounded bg-white/40">
          <GitFork size={9} className="text-slate-400 flex-shrink-0" />
          <span className="font-mono text-[9px] text-slate-500 truncate">
            {project.repoUrl.replace('https://', '')}
          </span>
        </div>
    }
      {project.branches?.slice(0, 3).map((branch) =>
    <div
      key={branch.id}
      className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-white/60 transition-colors">

          <div
        className={`w-1 h-1 rounded-full flex-shrink-0 ${branch.isDefault ? 'bg-emerald-500' : 'bg-slate-300'}`} />

          <span
        className={`font-mono text-[9px] truncate ${branch.isDefault ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>

            {branch.name}
          </span>
        </div>
    )}
    </div>;

  const ContextSidebar = ({ exclude }: {exclude: ExpandedCardType;}) =>
  <div className="w-72 flex-shrink-0 space-y-4 overflow-y-auto">
      {exclude !== 'tasks' &&
    <div className="bg-violet-50/50 rounded-xl border border-violet-100 p-3">
          <CompactTasksPanel />
        </div>
    }
      {exclude !== 'vines' &&
    <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-3">
          <CompactVinesPanel />
        </div>
    }
      {exclude !== 'grapes' &&
    <div className="bg-fuchsia-50/50 rounded-xl border border-fuchsia-100 p-3">
          <CompactGrapesPanel />
        </div>
    }
      {exclude !== 'git' &&
    <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-3">
          <CompactRepoPanel />
        </div>
    }
    </div>;

  return (
    <div className="min-h-screen bg-[#f8f6ff] font-sans relative">
      {/* Header */}
      <header className="bg-white border-b border-violet-100 px-6 py-3.5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-1.5 -ml-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">

                <ArrowLeft size={18} />
              </Link>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm border"
                  style={{
                    backgroundColor: `${project.color}12`,
                    borderColor: `${project.color}25`
                  }}>

                  {project.icon}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-tight">
                    {project.name}
                  </h1>
                  <p className="text-xs text-slate-400 max-w-md truncate">
                    {project.description || 'No description'}
                  </p>
                </div>
              </div>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 relative">
        <AnimatePresence mode="popLayout">
          {expandedCard ?
          <motion.div
            key="expanded-container"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            transition={{
              duration: 0.2
            }}
            className="fixed inset-0 z-30 bg-[#f8f6ff] pt-[72px] overflow-hidden">

              <div className="max-w-7xl mx-auto h-full px-6 py-6 flex gap-5">
                <div className="flex-1 min-w-0 h-full">
                  {expandedCard === 'tasks' &&
                <ExpandedCard
                  title="Tasks"
                  icon={<CheckSquare size={18} />}
                  color="violet"
                  onClose={() => setExpandedCard(null)}
                  headerContent={
                  <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          {taskStats.total}
                        </span>
                  }>

                      <div className="flex items-center gap-6 mb-5 p-4 bg-white/50 rounded-xl border border-violet-100">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                            <span>Overall Progress</span>
                            <span className="font-bold text-slate-800">
                              {progress}%
                            </span>
                          </div>
                          <div className="h-2 bg-white rounded-full overflow-hidden border border-violet-100">
                            <div
                          className="h-full bg-violet-500 rounded-full transition-all"
                          style={{
                            width: `${progress}%`
                          }} />

                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Circle size={8} className="text-slate-300" />
                            {taskStats.todo} todo
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={8} className="text-violet-500" />
                            {taskStats.inProgress} active
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2
                          size={8}
                          className="text-emerald-500" />

                            {taskStats.done} done
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {projectTasks.map((task) => {
                      const taskVines = projectVines.filter(
                        (v: any) =>
                        v.taskIds && v.taskIds.includes(task.id)
                      );
                      const isExpanded = expandedTaskId === task.id;
                      const hasRelated =
                      taskVines.length > 0 || projectGrapes.length > 0;
                      return (
                        <div
                          key={task.id}
                          className="rounded-xl border border-violet-100/50 overflow-hidden transition-all">

                              <div
                            onClick={() =>
                            hasRelated &&
                            setExpandedTaskId(isExpanded ? null : task.id)
                            }
                            className={`flex items-center gap-3 p-3 bg-white/50 hover:bg-white transition-all ${hasRelated ? 'cursor-pointer' : ''} group`}>

                                {statusIcon(task.status)}
                                <span
                              className={`text-sm flex-1 font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>

                                  {task.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  {taskVines.length > 0 &&
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedCard('vines');
                                }}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 transition-colors">

                                      <Leaf
                                  size={9}
                                  className="text-emerald-500" />

                                      <span className="text-[9px] font-bold text-emerald-600">
                                        {taskVines.length}
                                      </span>
                                    </button>
                              }
                                  {projectGrapes.length > 0 &&
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedCard('grapes');
                                }}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-fuchsia-50 hover:bg-fuchsia-100 transition-colors">

                                      <Circle
                                  size={9}
                                  className="text-fuchsia-500" />

                                      <span className="text-[9px] font-bold text-fuchsia-600">
                                        {projectGrapes.length}
                                      </span>
                                    </button>
                              }
                                  {task.priority === 'urgent' &&
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-600 uppercase tracking-wider">
                                      Urgent
                                    </span>
                              }
                                  {task.priority === 'high' &&
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-600 uppercase tracking-wider">
                                      High
                                    </span>
                              }
                                  {task.priority === 'medium' &&
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                                      Med
                                    </span>
                              }
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {task.assigneeId}
                                  </span>
                                  {hasRelated &&
                              <ChevronRight
                                size={12}
                                className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />

                              }
                                </div>
                              </div>
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
                                duration: 0.2
                              }}
                              className="overflow-hidden">

                                    <div className="px-4 pb-4 pt-1 bg-violet-50/30 border-t border-violet-100/30 space-y-3">
                                      {taskVines.length > 0 &&
                                <div>
                                          <div className="flex items-center gap-1.5 mb-2">
                                            <Leaf
                                      size={10}
                                      className="text-emerald-500" />

                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                              Linked Vines
                                            </span>
                                          </div>
                                          <div className="space-y-1.5">
                                            {taskVines.map((vine: any) => {
                                      const lastMsg =
                                      vine.messages[
                                      vine.messages.length - 1];

                                      return (
                                        <button
                                          key={vine.id}
                                          onClick={() =>
                                          setExpandedCard('vines')
                                          }
                                          className="w-full text-left p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all group/vine">

                                                  <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-xs font-semibold text-slate-700 group-hover/vine:text-emerald-700 transition-colors">
                                                      {vine.topic}
                                                    </span>
                                                    {vine.unreadCount > 0 &&
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            }
                                                  </div>
                                                  {lastMsg &&
                                          <p className="text-[10px] text-slate-400 truncate">
                                                      <span className="font-medium text-slate-500">
                                                        {lastMsg.senderName}:
                                                      </span>{' '}
                                                      {lastMsg.content}
                                                    </p>
                                          }
                                                  <div className="flex items-center justify-between mt-1.5">
                                                    <div className="flex -space-x-1">
                                                      {vine.participants.
                                              slice(0, 4).
                                              map((pId: string) => {
                                                const m =
                                                TEAM_MEMBERS.find(
                                                  (tm) =>
                                                  tm.id === pId
                                                );
                                                return (
                                                  <div
                                                    key={pId}
                                                    className="w-4 h-4 rounded-full border border-white bg-slate-200 flex items-center justify-center text-[6px] font-bold text-slate-600">

                                                              {m?.avatar ||
                                                    pId.substring(
                                                      0,
                                                      2
                                                    )}
                                                            </div>);

                                              })}
                                                    </div>
                                                    <span className="text-[9px] text-emerald-500 font-medium flex items-center gap-0.5">
                                                      Open vine{' '}
                                                      <ChevronRight size={8} />
                                                    </span>
                                                  </div>
                                                </button>);

                                    })}
                                          </div>
                                        </div>
                                }
                                      {projectGrapes.length > 0 &&
                                <div>
                                          <div className="flex items-center gap-1.5 mb-2">
                                            <Circle
                                      size={10}
                                      className="text-fuchsia-500" />

                                            <span className="text-[10px] font-bold text-fuchsia-600 uppercase tracking-wider">
                                              Grapes (CLI)
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap gap-1.5">
                                            {projectGrapes.map((grape) => {
                                      const label = grapeStatusLabel(
                                        grape.status
                                      );
                                      return (
                                        <button
                                          key={grape.id}
                                          onClick={() =>
                                          setExpandedCard('grapes')
                                          }
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-fuchsia-50/60 border border-fuchsia-100 hover:bg-fuchsia-50 hover:border-fuchsia-200 transition-all group/grape">

                                                  <div
                                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${grapeStatusColor(grape.status)}`} />

                                                  <span className="text-[10px] font-medium text-slate-700 group-hover/grape:text-fuchsia-700 transition-colors">
                                                    {grape.title}
                                                  </span>
                                                  <span
                                            className={`text-[7px] font-bold uppercase px-1 py-0.5 rounded ${label.bg} ${label.text}`}>

                                                    {grape.status}
                                                  </span>
                                                </button>);

                                    })}
                                          </div>
                                        </div>
                                }
                                    </div>
                                  </motion.div>
                            }
                              </AnimatePresence>
                            </div>);

                    })}
                      </div>
                    </ExpandedCard>
                }
                  {expandedCard === 'vines' &&
                <ExpandedCard
                  title="Vines"
                  icon={<Leaf size={18} />}
                  color="emerald"
                  onClose={() => setExpandedCard(null)}
                  headerContent={
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          {projectVines.length}
                        </span>
                  }>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projectVines.map((vine: any) => {
                      const lastMsg =
                      vine.messages[vine.messages.length - 1];
                      const linkedTasks = vine.taskIds ?
                      projectTasks.filter((t: Task) =>
                      vine.taskIds.includes(t.id)
                      ) :
                      [];
                      return (
                        <div
                          key={vine.id}
                          className="p-4 bg-white/60 hover:bg-white rounded-xl border border-emerald-100 hover:border-emerald-200 transition-all cursor-pointer group">

                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                  {vine.topic}
                                </h3>
                                {vine.unreadCount > 0 &&
                            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {vine.unreadCount} new
                                  </span>
                            }
                              </div>
                              {lastMsg &&
                          <div className="bg-emerald-50/50 p-3 rounded-lg mb-3">
                                  <p className="text-xs text-slate-600 line-clamp-2">
                                    <span className="font-bold text-emerald-700">
                                      {lastMsg.senderName}:
                                    </span>{' '}
                                    {lastMsg.content}
                                  </p>
                                </div>
                          }
                              {linkedTasks.length > 0 &&
                          <div className="mb-3 space-y-1">
                                  {linkedTasks.map((t: Task) =>
                            <div
                              key={t.id}
                              className="flex items-center gap-1.5 text-[10px] text-slate-500">

                                      {statusIcon(t.status, 9)}
                                      <span className="truncate">
                                        {t.title}
                                      </span>
                                    </div>
                            )}
                                </div>
                          }
                              <div className="flex items-center justify-between">
                                <div className="flex -space-x-1.5">
                                  {vine.participants.map((pId: string) => {
                                const m = TEAM_MEMBERS.find(
                                  (tm) => tm.id === pId
                                );
                                return (
                                  <div
                                    key={pId}
                                    className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">

                                        {m?.avatar || pId.substring(0, 2)}
                                      </div>);

                              })}
                                </div>
                                <span className="text-xs text-slate-400 font-medium">
                                  {new Date(
                                vine.lastActivity
                              ).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                                </span>
                              </div>
                            </div>);

                    })}
                      </div>
                    </ExpandedCard>
                }
                  {expandedCard === 'grapes' &&
                <ExpandedCard
                  title="Grapes"
                  icon={<Circle size={18} />}
                  color="fuchsia"
                  onClose={() => setExpandedCard(null)}
                  headerContent={
                  <span className="bg-fuchsia-100 text-fuchsia-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          {projectGrapes.length}
                        </span>
                  }>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projectGrapes.map((grape) => {
                      const label = grapeStatusLabel(grape.status);
                      return (
                        <div
                          key={grape.id}
                          className="flex items-start gap-4 p-4 bg-white/60 hover:bg-white rounded-xl border border-fuchsia-100 hover:border-fuchsia-200 transition-all cursor-pointer">

                              <div
                            className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${grapeStatusColor(grape.status)}`} />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h3 className="font-bold text-slate-800">
                                    {grape.title}
                                  </h3>
                                  <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${label.bg} ${label.text}`}>

                                    {grape.status}
                                  </span>
                                </div>
                                {grape.description &&
                            <p className="text-sm text-slate-500 leading-relaxed">
                                    {grape.description}
                                  </p>
                            }
                              </div>
                            </div>);

                    })}
                      </div>
                    </ExpandedCard>
                }
                  {expandedCard === 'git' &&
                <ExpandedCard
                  title="Repository"
                  icon={<GitBranch size={18} />}
                  color="slate"
                  onClose={() => setExpandedCard(null)}
                  headerContent={
                  project.branches &&
                  <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            {project.branches.length} branches
                          </span>

                  }>

                      <div className="space-y-4">
                        {project.repoUrl &&
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100 border border-slate-200">
                            <GitFork size={16} className="text-slate-500" />
                            <span className="font-mono text-sm font-medium text-slate-700 flex-1">
                              {project.repoUrl}
                            </span>
                            <a
                        href={`https://${project.repoUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">

                              Open <ExternalLink size={12} />
                            </a>
                          </div>
                    }
                        <div className="grid grid-cols-1 gap-2">
                          {project.branches?.map((branch) =>
                      <div
                        key={branch.id}
                        className="flex items-center gap-3 p-3 bg-white/60 hover:bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all">

                              <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${branch.isDefault ? 'bg-emerald-500' : 'bg-slate-300'}`} />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                              className={`font-mono text-sm ${branch.isDefault ? 'font-bold text-slate-900' : 'text-slate-600'}`}>

                                    {branch.name}
                                  </span>
                                  {branch.isDefault &&
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                      Default
                                    </span>
                            }
                                </div>
                                {branch.lastCommit &&
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                                    <GitCommit size={10} />
                                    <span className="font-mono">
                                      {branch.lastCommit}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span>{branch.lastCommitDate}</span>
                                  </div>
                          }
                              </div>
                            </div>
                      )}
                        </div>
                      </div>
                    </ExpandedCard>
                }
                </div>
                <ContextSidebar exclude={expandedCard} />
              </div>
            </motion.div> :

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TASKS CARD */}
              <motion.div
              layoutId="card-tasks"
              {...tasksZone.dropProps}
              className={`bg-violet-50/60 rounded-xl border ${tasksZone.isOver ? 'border-violet-400 ring-2 ring-violet-200' : 'border-violet-200/60'} shadow-sm overflow-hidden flex flex-col h-[320px] transition-all duration-200`}>

                <div className="px-4 py-3 border-b border-violet-100/50 flex items-center justify-between bg-violet-50/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-violet-100 text-violet-600 rounded-md">
                      <CheckSquare size={14} />
                    </div>
                    <h2 className="font-bold text-sm text-slate-900">Tasks</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {taskStats.total}
                    </span>
                    <button
                    onClick={() => setShowNewTaskForm(!showNewTaskForm)}
                    className="p-1 text-violet-400 hover:text-violet-600 hover:bg-violet-100 rounded transition-colors"
                    title="Add new task">

                      <Plus size={14} />
                    </button>
                    <button
                    onClick={() => toggleExpand('tasks')}
                    className="p-1 text-violet-400 hover:text-violet-600 hover:bg-violet-100 rounded transition-colors">

                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  {/* New Task Form */}
                  <AnimatePresence>
                    {showNewTaskForm &&
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
                    className="mb-3 overflow-hidden">

                        <div className="p-3 bg-white rounded-lg border border-violet-200 shadow-sm">
                          <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTask();
                          if (e.key === 'Escape') setShowNewTaskForm(false);
                        }}
                        placeholder="Enter task title..."
                        autoFocus
                        className="w-full text-sm px-2 py-1.5 border border-violet-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent mb-2" />

                          <div className="flex items-center gap-2 justify-end">
                            <button
                          onClick={() => setShowNewTaskForm(false)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">

                              Cancel
                            </button>
                            <button
                          onClick={handleCreateTask}
                          disabled={!newTaskTitle.trim()}
                          className="px-3 py-1 text-xs font-semibold bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">

                              Create Task
                            </button>
                          </div>
                        </div>
                      </motion.div>
                  }
                  </AnimatePresence>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 mb-1.5">
                      <span>Progress</span>
                      <span className="text-slate-700 font-bold">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white rounded-full overflow-hidden border border-violet-100">
                      <motion.div
                      initial={{
                        width: 0
                      }}
                      animate={{
                        width: `${progress}%`
                      }}
                      transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: 'easeOut'
                      }}
                      className="h-full bg-violet-500 rounded-full" />

                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Circle size={6} className="text-slate-300" />
                        {taskStats.todo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={6} className="text-violet-500" />
                        {taskStats.inProgress}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={6} className="text-emerald-500" />
                        {taskStats.done}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {projectTasks.slice(0, 4).map((task) =>
                  <div
                    key={task.id}
                    className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-lg hover:bg-white/60 transition-colors cursor-pointer group">

                        {statusIcon(task.status)}
                        <span
                      className={`text-xs flex-1 truncate group-hover:text-violet-700 transition-colors ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>

                          {task.title}
                        </span>
                        {task.priority === 'urgent' &&
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    }
                      </div>
                  )}
                  </div>
                  {projectTasks.length > 4 &&
                <button
                  onClick={() => toggleExpand('tasks')}
                  className="flex items-center gap-1 text-[10px] font-bold text-violet-500 hover:text-violet-700 mt-auto pt-2 border-t border-violet-100/50 transition-colors">

                      View all {projectTasks.length} tasks{' '}
                      <ChevronRight size={10} />
                    </button>
                }
                </div>
              </motion.div>

              {/* VINES CARD */}
              <motion.div
              layoutId="card-vines"
              {...vinesZone.dropProps}
              className={`bg-emerald-50/60 rounded-xl border ${vinesZone.isOver ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-emerald-200/60'} shadow-sm overflow-hidden flex flex-col h-[320px] transition-all duration-200`}>

                <div className="px-4 py-3 border-b border-emerald-100/50 flex items-center justify-between bg-emerald-50/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md">
                      <Leaf size={14} />
                    </div>
                    <h2 className="font-bold text-sm text-slate-900">Vines</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {projectVines.length}
                    </span>
                    <button
                    onClick={() => setShowNewVineForm(!showNewVineForm)}
                    className="p-1 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                    title="Start new vine">

                      <Plus size={14} />
                    </button>
                    <button
                    onClick={() => toggleExpand('vines')}
                    className="p-1 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 rounded transition-colors">

                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-2 flex-1 overflow-hidden">
                  {/* New Vine Form */}
                  <AnimatePresence>
                    {showNewVineForm &&
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

                        <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-sm">
                          <input
                        type="text"
                        value={newVineTopic}
                        onChange={(e) => setNewVineTopic(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateVine();
                          if (e.key === 'Escape') setShowNewVineForm(false);
                        }}
                        placeholder="Enter conversation topic..."
                        autoFocus
                        className="w-full text-sm px-2 py-1.5 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent mb-2" />

                          <div className="flex items-center gap-2 justify-end">
                            <button
                          onClick={() => setShowNewVineForm(false)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">

                              Cancel
                            </button>
                            <button
                          onClick={handleCreateVine}
                          disabled={!newVineTopic.trim()}
                          className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">

                              Start Vine
                            </button>
                          </div>
                        </div>
                      </motion.div>
                  }
                  </AnimatePresence>

                  {projectVines.slice(0, 3).map((vine: any) => {
                  const lastMsg = vine.messages[vine.messages.length - 1];
                  return (
                    <div
                      key={vine.id}
                      className="p-2.5 rounded-lg border border-emerald-100/50 bg-white/40 hover:bg-white/80 hover:border-emerald-200 transition-all cursor-pointer group">

                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-xs text-slate-800 group-hover:text-emerald-700 truncate pr-2 transition-colors">
                            {vine.topic}
                          </h3>
                          {vine.unreadCount > 0 &&
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        }
                        </div>
                        {lastMsg &&
                      <p className="text-[10px] text-slate-500 line-clamp-1">
                            <span className="font-medium text-slate-600">
                              {lastMsg.senderName}:
                            </span>{' '}
                            {lastMsg.content}
                          </p>
                      }
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex -space-x-1">
                            {vine.participants.
                          slice(0, 3).
                          map((pId: string) => {
                            const m = TEAM_MEMBERS.find(
                              (tm) => tm.id === pId
                            );
                            return (
                              <div
                                key={pId}
                                className="w-4 h-4 rounded-full border border-white bg-slate-200 flex items-center justify-center text-[6px] font-bold text-slate-600">

                                    {m?.avatar || pId.substring(0, 2)}
                                  </div>);

                          })}
                          </div>
                          <span className="text-[9px] text-slate-400">
                            {new Date(vine.lastActivity).toLocaleDateString(
                            undefined,
                            {
                              month: 'short',
                              day: 'numeric'
                            }
                          )}
                          </span>
                        </div>
                      </div>);

                })}
                  {projectVines.length === 0 &&
                <div className="text-center py-6 text-slate-400 text-xs italic">
                      No vines started.
                    </div>
                }
                </div>
              </motion.div>

              {/* GRAPES CARD */}
              <motion.div
              layoutId="card-grapes"
              {...grapesZone.dropProps}
              className={`bg-fuchsia-50/60 rounded-xl border ${grapesZone.isOver ? 'border-fuchsia-400 ring-2 ring-fuchsia-200' : 'border-fuchsia-200/60'} shadow-sm overflow-hidden flex flex-col h-[320px] transition-all duration-200`}>

                <div className="px-4 py-3 border-b border-fuchsia-100/50 flex items-center justify-between bg-fuchsia-50/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-fuchsia-100 text-fuchsia-600 rounded-md">
                      <Circle size={14} />
                    </div>
                    <h2 className="font-bold text-sm text-slate-900">Grapes</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-fuchsia-100 text-fuchsia-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {projectGrapes.length}
                    </span>
                    <button
                    onClick={() => setShowNewGrapeForm(!showNewGrapeForm)}
                    className="p-1 text-fuchsia-400 hover:text-fuchsia-600 hover:bg-fuchsia-100 rounded transition-colors"
                    title="Plant new grape">

                      <Plus size={14} />
                    </button>
                    <button
                    onClick={() => toggleExpand('grapes')}
                    className="p-1 text-fuchsia-400 hover:text-fuchsia-600 hover:bg-fuchsia-100 rounded transition-colors">

                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-2 flex-1 overflow-hidden">
                  {/* New Grape Form */}
                  <AnimatePresence>
                    {showNewGrapeForm &&
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

                        <div className="p-3 bg-white rounded-lg border border-fuchsia-200 shadow-sm">
                          <input
                        type="text"
                        value={newGrapeTitle}
                        onChange={(e) => setNewGrapeTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateGrape();
                          if (e.key === 'Escape') setShowNewGrapeForm(false);
                        }}
                        placeholder="Enter grape title..."
                        autoFocus
                        className="w-full text-sm px-2 py-1.5 border border-fuchsia-200 rounded focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent mb-2" />

                          <div className="flex items-center gap-2 justify-end">
                            <button
                          onClick={() => setShowNewGrapeForm(false)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">

                              Cancel
                            </button>
                            <button
                          onClick={handleCreateGrape}
                          disabled={!newGrapeTitle.trim()}
                          className="px-3 py-1 text-xs font-semibold bg-fuchsia-600 text-white rounded hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">

                              Plant Grape
                            </button>
                          </div>
                        </div>
                      </motion.div>
                  }
                  </AnimatePresence>

                  {projectGrapes.map((grape) => {
                  const label = grapeStatusLabel(grape.status);
                  return (
                    <div
                      key={grape.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border border-fuchsia-100/50 bg-white/40 hover:bg-white/80 hover:border-fuchsia-200 transition-all cursor-pointer">

                        <div
                        className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${grapeStatusColor(grape.status)}`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-semibold text-slate-800 truncate">
                              {grape.title}
                            </h3>
                            <span
                            className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${label.bg} ${label.text} flex-shrink-0`}>

                              {grape.status}
                            </span>
                          </div>
                          {grape.description &&
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                              {grape.description}
                            </p>
                        }
                        </div>
                      </div>);

                })}
                  {projectGrapes.length === 0 &&
                <div className="text-center py-6 text-slate-400 text-xs italic">
                      No grapes found.
                    </div>
                }
                </div>
              </motion.div>

              {/* GIT REPO CARD */}
              <motion.div
              layoutId="card-git"
              {...gitZone.dropProps}
              className={`bg-slate-50/60 rounded-xl border ${gitZone.isOver ? 'border-slate-400 ring-2 ring-slate-200' : 'border-slate-200/60'} shadow-sm overflow-hidden flex flex-col h-[320px] transition-all duration-200`}>

                <div className="px-4 py-3 border-b border-slate-100/50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-800 text-white rounded-md">
                      <GitBranch size={14} />
                    </div>
                    <h2 className="font-bold text-sm text-slate-900">
                      Repository
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.branches &&
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {project.branches.length} branches
                      </span>
                  }
                    <button
                    onClick={() => toggleExpand('git')}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors">

                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-1 overflow-hidden">
                  {project.repoUrl ?
                <>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/60 border border-slate-200 mb-3">
                        <GitFork
                      size={12}
                      className="text-slate-400 flex-shrink-0" />

                        <span className="font-mono text-[11px] font-medium text-slate-600 truncate flex-1">
                          {project.repoUrl.replace('https://', '')}
                        </span>
                        <ExternalLink
                      size={10}
                      className="text-slate-400 flex-shrink-0 hover:text-slate-600 cursor-pointer transition-colors" />

                      </div>
                      {project.branches && project.branches.length > 0 &&
                  <div className="space-y-1">
                          {project.branches.map((branch) =>
                    <div
                      key={branch.id}
                      className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-lg hover:bg-white/60 transition-colors group">

                              <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${branch.isDefault ? 'bg-emerald-500' : 'bg-slate-300'}`} />

                              <span
                        className={`font-mono text-[11px] flex-1 truncate ${branch.isDefault ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>

                                {branch.name}
                              </span>
                              {branch.lastCommit &&
                      <span className="flex items-center gap-1 text-[9px] text-slate-400 flex-shrink-0">
                                  <GitCommit size={8} />
                                  <span className="max-w-[80px] truncate">
                                    {branch.lastCommit}
                                  </span>
                                </span>
                      }
                              {branch.isDefault &&
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 flex-shrink-0">
                                  default
                                </span>
                      }
                            </div>
                    )}
                        </div>
                  }
                    </> :

                <div className="text-center py-6 text-slate-400 text-xs italic">
                      No repository connected.
                    </div>
                }
                </div>
              </motion.div>
            </div>
          }
        </AnimatePresence>
      </main>
    </div>);

}
function ExpandedCard({
  title,
  icon,
  color,
  onClose,
  children,
  headerContent







}: {title: string;icon: React.ReactNode;color: 'violet' | 'emerald' | 'fuchsia' | 'slate';onClose: () => void;children: React.ReactNode;headerContent?: React.ReactNode;}) {
  const colors = {
    violet: {
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      iconBg: 'bg-violet-100',
      iconText: 'text-violet-600'
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600'
    },
    fuchsia: {
      bg: 'bg-fuchsia-50',
      border: 'border-fuchsia-200',
      iconBg: 'bg-fuchsia-100',
      iconText: 'text-fuchsia-600'
    },
    slate: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      iconBg: 'bg-slate-800',
      iconText: 'text-white'
    }
  };
  const c = colors[color];
  return (
    <motion.div
      layoutId={`card-${title.toLowerCase()}`}
      className={`w-full h-full rounded-2xl border ${c.border} ${c.bg} shadow-xl overflow-hidden flex flex-col`}>

      <div
        className={`px-6 py-4 border-b ${c.border} flex items-center justify-between bg-white/50 backdrop-blur-sm flex-shrink-0`}>

        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${c.iconBg} ${c.iconText}`}>
            {icon}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {headerContent}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-700 transition-colors">

          <Minimize2 size={20} />
        </button>
      </div>
      <div className="p-6 overflow-y-auto flex-1">{children}</div>
    </motion.div>);

}