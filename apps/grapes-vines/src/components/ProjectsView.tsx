import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, Task, VineConversation } from '../types';
import { List, LayoutGrid, FolderKanban, CheckCircle2, Clock, Circle, Leaf, ChevronDown, ChevronUp, GitBranch, GitCommit, GitFork } from 'lucide-react';
import { VinesPanel } from './VinesPanel';
import { Badge } from './ui/Badge';
type DisplayMode = 'list' | 'card';
interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  onSelectProject: (id: string) => void;
  vineConversations: VineConversation[];
}
export function ProjectsView({
  projects,
  tasks,
  onSelectProject,
  vineConversations
}: ProjectsViewProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('card');
  const [expandedProjectVineId, setExpandedProjectVineId] = useState<string | null>(null);
  const [expandedProjectBranchId, setExpandedProjectBranchId] = useState<string | null>(null);
  const getProjectStats = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    return {
      total: projectTasks.length,
      todo: projectTasks.filter((t) => t.status === 'todo').length,
      inProgress: projectTasks.filter((t) => t.status === 'in-progress').length,
      done: projectTasks.filter((t) => t.status === 'done').length
    };
  };
  const getProjectVines = (projectId: string) => {
    return vineConversations.filter((v) => v.projectId === projectId);
  };
  const toggleProjectVines = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setExpandedProjectVineId(expandedProjectVineId === projectId ? null : projectId);
    if (expandedProjectBranchId === projectId) {
      setExpandedProjectBranchId(null);
    }
  };
  const toggleProjectBranches = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setExpandedProjectBranchId(expandedProjectBranchId === projectId ? null : projectId);
    if (expandedProjectVineId === projectId) {
      setExpandedProjectVineId(null);
    }
  };
  return <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900">
            Projects
          </h2>
          <p className="text-slate-500 mt-1">
            {projects.length} active projects
          </p>
        </div>
        <div className="flex items-center bg-violet-50 rounded-lg p-1 border border-violet-100">
          <button onClick={() => setDisplayMode('list')} className={`p-2 rounded-md transition-all ${displayMode === 'list' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 hover:text-violet-500'}`} title="List view">

            <List size={18} />
          </button>
          <button onClick={() => setDisplayMode('card')} className={`p-2 rounded-md transition-all ${displayMode === 'card' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 hover:text-violet-500'}`} title="Card view">

            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* Projects */}
      {displayMode === 'card' ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => {
        const stats = getProjectStats(project.id);
        const vines = getProjectVines(project.id);
        const progress = stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0;
        const isVinesExpanded = expandedProjectVineId === project.id;
        const isBranchesExpanded = expandedProjectBranchId === project.id;
        return <motion.div key={project.id} initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: idx * 0.05
        }} onClick={() => onSelectProject(project.id)} className="group p-4 rounded-2xl border border-violet-100 bg-white hover:shadow-xl hover:shadow-violet-100/30 hover:border-violet-200 transition-all cursor-pointer relative overflow-hidden flex flex-col items-center gap-4">
                
                <h3 className="font-serif font-bold text-xl text-[#0f172a] group-hover:text-violet-600 transition-colors">
                  {project.name}
                </h3>

                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-sm transition-transform duration-500 group-hover:scale-110" style={{
            backgroundColor: `${project.color}15`
          }}>
                  <div className="filter drop-shadow-md">
                    {project.icon}
                  </div>
                </div>
                
                {project.description && <p className="text-xs text-slate-400 font-medium text-center line-clamp-1 px-2">
                    {project.description}
                  </p>}
              </motion.div>;
      })}
        </div> : <div className="space-y-3">
          {projects.map((project, idx) => {
        const stats = getProjectStats(project.id);
        const vines = getProjectVines(project.id);
        const progress = stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0;
        return <motion.div key={project.id} initial={{
          opacity: 0,
          x: -10
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: idx * 0.03
        }} onClick={() => onSelectProject(project.id)} className="group flex items-center gap-6 p-4 rounded-xl border border-violet-100 bg-white hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/50 transition-all cursor-pointer">

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm" style={{
            backgroundColor: `${project.color}15`
          }}>

                  {project.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                      {project.name}
                    </h3>
                    {project.repoUrl && <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded text-xs text-slate-400 border border-slate-100">
                        <GitBranch size={10} />
                        <span className="font-mono truncate max-w-[150px]">
                          {project.repoUrl.replace('https://', '')}
                        </span>
                      </div>}
                  </div>
                  {project.description && <p className="text-sm text-slate-500 truncate mt-0.5">
                      {project.description}
                    </p>}
                </div>

                {/* Branches Badge */}
                {project.branches && project.branches.length > 0 && <Badge variant="outline" className="flex items-center gap-1">
                    <GitFork size={10} />
                    {project.branches.length}
                  </Badge>}

                {/* Vines Badge */}
                {vines.length > 0 && <Badge variant="green" className="flex items-center gap-1">
                    <Leaf size={10} />
                    {vines.length}
                  </Badge>}

                {/* Progress */}
                <div className="w-32 flex-shrink-0">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                width: `${progress}%`,
                backgroundColor: project.color
              }} />

                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Circle size={14} />
                    <span>{stats.todo}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-violet-500">
                    <Clock size={14} />
                    <span>{stats.inProgress}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 size={14} />
                    <span>{stats.done}</span>
                  </div>
                </div>
              </motion.div>;
      })}
        </div>}
    </div>;
}