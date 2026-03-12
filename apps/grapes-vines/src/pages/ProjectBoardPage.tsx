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
  Save
} from 'lucide-react';
import { useAgentTasks } from '../hooks/useAgentTasks';
import { MOCK_GRAPES } from '../data/grapes';
import { TEAM_MEMBERS } from '../data/teamMembers';
import { VINE_CONVERSATIONS } from '../data/vineConversations';
import { TaskStatus, GrapeStatus, Task, Grape, VineConversation, Project } from '../types';
import { useLensDropZone } from '../hooks/useAILens';

type ExpandedCardType = 'tasks' | 'vines' | 'grapes' | 'git' | null;

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
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
  const resolvedProjectId = projectId || (projects.length > 0 ? projects[0].id : null);
  const project = resolvedProjectId ? getProject(resolvedProjectId) : null;

  const projectTasks = allTasks.filter((t) => t.projectId === resolvedProjectId);
  const projectVines = VINE_CONVERSATIONS.filter((v: any) => v.projectId === resolvedProjectId);
  const projectGrapes = MOCK_GRAPES.filter((g) => g.projectId === resolvedProjectId);

  const taskStats = {
    total: projectTasks.length,
    todo: projectTasks.filter((t) => t.status === 'todo').length,
    inProgress: projectTasks.filter((t) => t.status === 'in-progress').length,
    done: projectTasks.filter((t) => t.status === 'done').length
  };

  const progress = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

  // ── Handlers ──
  const handleCreateTask = () => {
    if (!newTaskTitle.trim() || !resolvedProjectId) return;
    console.log('[Create Task]', { title: newTaskTitle, projectId: resolvedProjectId });
    setNewTaskTitle('');
    setShowNewTaskForm(false);
  };

  const handleCreateVine = () => {
    if (!newVineTopic.trim() || !resolvedProjectId) return;
    console.log('[Create Vine]', { topic: newVineTopic, projectId: resolvedProjectId });
    setNewVineTopic('');
    setShowNewVineForm(false);
  };

  const handleCreateGrape = () => {
    if (!newGrapeTitle.trim() || !resolvedProjectId) return;
    console.log('[Create Grape]', { title: newGrapeTitle, projectId: resolvedProjectId });
    setNewGrapeTitle('');
    setShowNewGrapeForm(false);
  };

  // ── AI Lens Drop Zones ──
  const tasksZone = useLensDropZone({
    id: `project-${resolvedProjectId}-tasks`,
    label: 'Tasks',
    pageId: 'project-board',
    dataType: 'tasks',
    getData: () => ({ tasks: projectTasks, project }),
    getSummary: () => `${taskStats.total} tasks`
  });

  const vinesZone = useLensDropZone({
    id: `project-${resolvedProjectId}-vines`,
    label: 'Vines',
    pageId: 'project-board',
    dataType: 'vines',
    getData: () => ({ vines: projectVines, project }),
    getSummary: () => `${projectVines.length} vines`
  });

  const grapesZone = useLensDropZone({
    id: `project-${resolvedProjectId}-grapes`,
    label: 'Grapes',
    pageId: 'project-board',
    dataType: 'grapes',
    getData: () => ({ grapes: projectGrapes, project }),
    getSummary: () => `${projectGrapes.length} grapes`
  });

  const gitZone = useLensDropZone({
    id: `project-${resolvedProjectId}-git`,
    label: 'Repository',
    pageId: 'project-board',
    dataType: 'git',
    getData: () => ({ project }),
    getSummary: () => `Repository info`
  });

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8f6ff]">
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900">No project found</h2>
          <Link to="/" className="text-violet-500 hover:underline mt-2 inline-block">Go back home</Link>
        </div>
      </div>
    );
  }

  const statusIcon = (status: TaskStatus, size = 12) => {
    if (status === 'done') return <CheckCircle2 size={size} className="text-emerald-500" />;
    if (status === 'in-progress') return <Clock size={size} className="text-violet-500" />;
    return <Circle size={size} className="text-slate-300" />;
  };

  const grapeStatusColor = (status: GrapeStatus) => {
    switch (status) {
      case 'growing': return 'bg-amber-400';
      case 'ripe': return 'bg-purple-500';
      case 'harvested': return 'bg-emerald-500';
      default: return 'bg-slate-300';
    }
  };

  const grapeStatusLabel = (status: GrapeStatus) => {
    switch (status) {
      case 'growing': return { bg: 'bg-amber-50', text: 'text-amber-600' };
      case 'ripe': return { bg: 'bg-purple-50', text: 'text-purple-600' };
      case 'harvested': return { bg: 'bg-emerald-50', text: 'text-emerald-600' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-500' };
    }
  };

  const toggleExpand = (card: ExpandedCardType) => {
    setExpandedCard(expandedCard === card ? null : card);
  };

  const CompactTasksPanel = () => (
    <div className="space-y-1.5">
      <button onClick={() => setExpandedCard('tasks')} className="flex items-center gap-2 mb-2 group w-full">
        <div className="p-1 bg-violet-100 text-violet-600 rounded">
          <CheckSquare size={10} />
        </div>
        <span className="text-xs font-bold text-slate-700 group-hover:text-violet-600 transition-colors">Tasks</span>
        <span className="text-[9px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full ml-auto">{taskStats.total}</span>
      </button>
      <div className="h-1 bg-white rounded-full overflow-hidden mb-2">
        <div className="h-full bg-violet-500" style={{ width: `${progress}%` }} />
      </div>
      {projectTasks.slice(0, 3).map(task => (
        <div key={task.id} className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-white/60 transition-colors overflow-hidden">
          {statusIcon(task.status, 10)}
          <span className={`text-[10px] truncate flex-1 ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-600'}`}>
            {task.title}
          </span>
        </div>
      ))}
    </div>
  );

  const CompactVinesPanel = () => (
    <div className="space-y-1.5">
      <button onClick={() => setExpandedCard('vines')} className="flex items-center gap-2 mb-2 group w-full">
        <div className="p-1 bg-emerald-100 text-emerald-600 rounded">
          <Leaf size={10} />
        </div>
        <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">Vines</span>
        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full ml-auto">{projectVines.length}</span>
      </button>
      {projectVines.slice(0, 2).map((vine: any) => (
        <div key={vine.id} className="py-1 px-1.5 rounded hover:bg-white/60 transition-colors overflow-hidden">
          <span className="text-[10px] font-semibold text-slate-700 block truncate">{vine.topic}</span>
          <p className="text-[8px] text-slate-400 truncate">Last active recently</p>
        </div>
      ))}
    </div>
  );

  const CompactGrapesPanel = () => (
    <div className="space-y-1.5">
      <button onClick={() => setExpandedCard('grapes')} className="flex items-center gap-2 mb-2 group w-full">
        <div className="p-1 bg-fuchsia-100 text-fuchsia-600 rounded">
          <Circle size={10} />
        </div>
        <span className="text-xs font-bold text-slate-700 group-hover:text-fuchsia-600 transition-colors">Grapes</span>
        <span className="text-[9px] font-bold bg-fuchsia-100 text-fuchsia-600 px-1.5 py-0.5 rounded-full ml-auto">{projectGrapes.length}</span>
      </button>
      {projectGrapes.slice(0, 3).map(grape => (
        <div key={grape.id} className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-white/60 transition-colors overflow-hidden">
          <div className={`w-1 h-1 rounded-full flex-shrink-0 ${grapeStatusColor(grape.status)}`} />
          <span className="text-[10px] text-slate-600 truncate">{grape.title}</span>
        </div>
      ))}
    </div>
  );

  const CompactRepoPanel = () => (
    <div className="space-y-1.5">
      <button onClick={() => setExpandedCard('git')} className="flex items-center gap-2 mb-2 group w-full">
        <div className="p-1 bg-slate-700 text-white rounded">
          <GitBranch size={10} />
        </div>
        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Repo</span>
      </button>
      {project.repoUrl && (
        <div className="flex items-center gap-1.5 py-1 px-1.5 rounded bg-white/40">
          <GitFork size={9} className="text-slate-400" />
          <span className="font-mono text-[9px] text-slate-500 truncate">{project.repoUrl.replace('https://', '')}</span>
        </div>
      )}
    </div>
  );

  const ContextSidebar = ({ exclude }: { exclude: ExpandedCardType }) => (
    <div className="w-72 flex-shrink-0 space-y-4 overflow-y-auto">
      {exclude !== 'tasks' && <div className="bg-violet-50/50 rounded-xl border border-violet-100 p-3"><CompactTasksPanel /></div>}
      {exclude !== 'vines' && <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-3"><CompactVinesPanel /></div>}
      {exclude !== 'grapes' && <div className="bg-fuchsia-50/50 rounded-xl border border-fuchsia-100 p-3"><CompactGrapesPanel /></div>}
      {exclude !== 'git' && <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-3"><CompactRepoPanel /></div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f6ff] font-sans relative">
      <header className="bg-white border-b border-violet-100 px-6 py-3.5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-1.5 -ml-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm border" style={{ backgroundColor: `${project.color}12`, borderColor: `${project.color}25` }}>
                {project.icon}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">{project.name}</h1>
                <p className="text-xs text-slate-400 max-w-md truncate">{project.description || 'No description'}</p>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><MoreHorizontal size={18} /></button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 relative">
        <AnimatePresence mode="popLayout">
          {expandedCard ? (
            <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 bg-[#f8f6ff] pt-[72px]">
              <div className="max-w-7xl mx-auto h-full px-6 py-6 flex gap-5">
                <div className="flex-1 min-w-0 h-full overflow-hidden">
                  <ExpandedCard 
                    title={expandedCard.charAt(0).toUpperCase() + expandedCard.slice(1)} 
                    icon={expandedCard === 'tasks' ? <CheckSquare /> : expandedCard === 'vines' ? <Leaf /> : expandedCard === 'grapes' ? <Circle /> : <GitBranch />}
                    color={expandedCard === 'tasks' ? 'violet' : expandedCard === 'vines' ? 'emerald' : expandedCard === 'grapes' ? 'fuchsia' : 'slate'}
                    onClose={() => setExpandedCard(null)}
                  >
                    {/* Placeholder content for expanded view - simple list */}
                    <div className="space-y-2">
                      {expandedCard === 'tasks' && projectTasks.map(t => <div key={t.id} className="p-3 bg-white rounded-xl border border-violet-100">{t.title}</div>)}
                      {expandedCard === 'vines' && projectVines.map((v:any) => <div key={v.id} className="p-3 bg-white rounded-xl border border-emerald-100">{v.topic}</div>)}
                      {expandedCard === 'grapes' && projectGrapes.map(g => <div key={g.id} className="p-3 bg-white rounded-xl border border-fuchsia-100">{g.title}</div>)}
                      {expandedCard === 'git' && project.branches?.map(b => <div key={b.id} className="p-3 bg-white rounded-xl border border-slate-200 font-mono">{b.name}</div>)}
                    </div>
                  </ExpandedCard>
                </div>
                <ContextSidebar exclude={expandedCard} />
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
              {/* TASKS CARD */}
              <motion.div layoutId="card-tasks" {...tasksZone.dropProps} className="bg-white rounded-3xl border border-violet-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-violet-100/50">
                <div className="px-6 py-5 border-b border-violet-50 flex items-center justify-between bg-violet-50/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-100 text-violet-600 rounded-2xl"><CheckSquare size={20} /></div>
                    <h2 className="font-bold text-xl text-slate-900">Tasks</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1 rounded-full">{taskStats.total}</span>
                    <button onClick={() => toggleExpand('tasks')} className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-100 rounded-xl transition-colors"><Maximize2 size={18} /></button>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col overflow-hidden">
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                       <span>Progress</span>
                       <span className="text-violet-600">{progress}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-violet-500 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-2 overflow-y-auto pr-1">
                    {projectTasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-violet-100 hover:shadow-sm transition-all group/task">
                        {statusIcon(task.status, 16)}
                        <span className={`text-sm font-medium flex-1 truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* VINES CARD */}
              <motion.div layoutId="card-vines" {...vinesZone.dropProps} className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100/50">
                <div className="px-6 py-5 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl"><Leaf size={20} /></div>
                    <h2 className="font-bold text-xl text-slate-900">Vines</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">{projectVines.length}</span>
                    <button onClick={() => toggleExpand('vines')} className="p-1.5 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors"><Maximize2 size={18} /></button>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col overflow-hidden">
                  <div className="space-y-3 overflow-y-auto pr-1">
                    {projectVines.slice(0, 3).map((vine: any) => (
                      <div key={vine.id} className="p-4 rounded-2xl border border-emerald-50 bg-emerald-50/30 hover:bg-white hover:border-emerald-100 hover:shadow-md transition-all cursor-pointer group/vine">
                        <h3 className="font-bold text-sm text-slate-800 mb-2">{vine.topic}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-1.5">
                            {vine.participants.slice(0, 3).map((pId: string) => (
                              <div key={pId} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                                {pId.substring(0, 2).toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] font-medium text-emerald-600 opacity-0 group-hover/vine:opacity-100 transition-opacity">Open conversation</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* GRAPES CARD */}
              <motion.div layoutId="card-grapes" {...grapesZone.dropProps} className="bg-white rounded-3xl border border-fuchsia-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-fuchsia-100/50">
                <div className="px-6 py-5 border-b border-fuchsia-50 flex items-center justify-between bg-fuchsia-50/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-fuchsia-100 text-fuchsia-600 rounded-2xl"><Circle size={20} fill="currentColor" fillOpacity={0.2} /></div>
                    <h2 className="font-bold text-xl text-slate-900">Grapes</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-fuchsia-100 text-fuchsia-700 text-xs font-bold px-3 py-1 rounded-full">{projectGrapes.length}</span>
                    <button onClick={() => toggleExpand('grapes')} className="p-1.5 text-fuchsia-400 hover:text-fuchsia-600 hover:bg-fuchsia-100 rounded-xl transition-colors"><Maximize2 size={18} /></button>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col overflow-hidden">
                  <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-1">
                    {projectGrapes.slice(0, 4).map(grape => (
                      <div key={grape.id} className="flex items-center gap-4 p-4 rounded-2xl border border-fuchsia-50 bg-fuchsia-50/10 hover:bg-white transition-all group/grape">
                        <div className={`w-3 h-3 rounded-full ${grapeStatusColor(grape.status)} shadow-sm`} />
                        <span className="text-sm font-bold text-slate-800 flex-1 truncate">{grape.title}</span>
                        <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${grapeStatusLabel(grape.status).bg} ${grapeStatusLabel(grape.status).text}`}>
                          {grape.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* GIT CARD */}
              <motion.div layoutId="card-git" {...gitZone.dropProps} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50">
                <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-800 text-white rounded-2xl"><GitBranch size={20} /></div>
                    <h2 className="font-bold text-xl text-slate-900">Repository</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleExpand('git')} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"><Maximize2 size={18} /></button>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col overflow-hidden">
                  <div className="space-y-4">
                    {project.repoUrl && (
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-100/50 border border-slate-200">
                        <GitFork size={18} className="text-slate-400" />
                        <span className="font-mono text-xs font-bold text-slate-600 truncate flex-1">{project.repoUrl.replace('https://', '')}</span>
                        <ExternalLink size={14} className="text-slate-400" />
                      </div>
                    )}
                    <div className="space-y-2 overflow-y-auto pr-1">
                      {project.branches?.slice(0, 2).map((branch) => (
                        <div key={branch.id} className="p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 transition-all">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${branch.isDefault ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className={`font-mono text-xs truncate ${branch.isDefault ? 'font-bold text-slate-900' : 'text-slate-500'}`}>{branch.name}</span>
                          </div>
                          {branch.lastCommit && <p className="text-[10px] text-slate-400 truncate">{branch.lastCommit}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ExpandedCard({ title, icon, color, onClose, children, headerContent }: { title: string; icon: React.ReactNode; color: 'violet' | 'emerald' | 'fuchsia' | 'slate'; onClose: () => void; children: React.ReactNode; headerContent?: React.ReactNode }) {
  const colors = {
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
    fuchsia: { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', iconBg: 'bg-fuchsia-100', iconText: 'text-fuchsia-600' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', iconBg: 'bg-slate-800', iconText: 'text-white' }
  };
  const c = colors[color];
  return (
    <motion.div layoutId={`card-${title.toLowerCase()}`} className={`w-full h-full rounded-3xl border ${c.border} ${c.bg} shadow-2xl overflow-hidden flex flex-col`}>
      <div className={`px-8 py-5 border-b ${c.border} flex items-center justify-between bg-white/60 backdrop-blur-md flex-shrink-0`}>
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${c.iconBg} ${c.iconText}`}>{icon}</div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          {headerContent}
        </div>
        <button onClick={onClose} className="p-2.5 hover:bg-white rounded-xl text-slate-400 hover:text-slate-700 transition-colors"><Minimize2 size={24} /></button>
      </div>
      <div className="p-8 overflow-y-auto flex-1">{children}</div>
    </motion.div>
  );
}