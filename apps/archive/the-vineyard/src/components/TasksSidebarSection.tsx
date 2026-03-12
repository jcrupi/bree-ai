import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  FolderKanban,
  Layers,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  Clock,
  List } from
'lucide-react';
import { Task, Project, TaskStatus } from '../types';
import { SPECIALTIES, SpecialtyType } from '../data/specialties';
interface TasksSidebarSectionProps {
  tasks: Task[];
  projects: Project[];
  selectedProjectId: string | null;
  selectedSpecialties: Set<SpecialtyType>;
  onSelectProject: (id: string | null) => void;
  onToggleSpecialty: (id: SpecialtyType) => void;
}
type GroupingMode = 'project' | 'specialty';
export function TasksSidebarSection({
  tasks,
  projects,
  selectedProjectId,
  selectedSpecialties,
  onSelectProject,
  onToggleSpecialty
}: TasksSidebarSectionProps) {
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('project');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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
  const handleSelectAll = () => {
    onSelectProject(null);
    // We might want to clear specialties too, but the interface only allows toggling one by one.
    // For now, selecting "All Tasks" primarily clears the project filter as per standard behavior.
    // Ideally we'd have a clearAllSpecialties prop, but we'll stick to the requested scope.
  };
  // Helper to get task counts by status
  const getStatusCounts = (taskList: Task[]) => {
    return {
      todo: taskList.filter((t) => t.status === 'todo').length,
      inProgress: taskList.filter((t) => t.status === 'in-progress').length,
      done: taskList.filter((t) => t.status === 'done').length
    };
  };
  return (
    <div className="px-3 py-4 border-b border-violet-50">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-violet-600 uppercase tracking-wider">
          <LayoutGrid size={12} />
          Tasks
        </div>

        <div className="flex bg-violet-50 rounded-lg p-0.5 border border-violet-100">
          <button
            onClick={() => setGroupingMode('project')}
            className={`p-1 rounded-md transition-all ${groupingMode === 'project' ? 'bg-white shadow-sm text-violet-600' : 'text-violet-300 hover:text-violet-500'}`}
            title="Group by Project">

            <FolderKanban size={12} />
          </button>
          <button
            onClick={() => setGroupingMode('specialty')}
            className={`p-1 rounded-md transition-all ${groupingMode === 'specialty' ? 'bg-white shadow-sm text-violet-600' : 'text-violet-300 hover:text-violet-500'}`}
            title="Group by Specialty">

            <Layers size={12} />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {/* All Tasks Button */}
        <button
          onClick={handleSelectAll}
          className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm font-medium transition-all ${!selectedProjectId && selectedSpecialties.size === 0 ? 'bg-violet-50 text-violet-900' : 'text-slate-600 hover:bg-violet-50/50 hover:text-violet-700'}`}>

          <div
            className={`flex items-center justify-center w-5 h-5 rounded-md text-xs shadow-sm ${!selectedProjectId && selectedSpecialties.size === 0 ? 'bg-white text-violet-600' : 'bg-slate-100 text-slate-500'}`}>

            <List size={12} />
          </div>
          <span className="flex-1 text-left">All Tasks</span>
          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </button>

        {/* Groups */}
        {groupingMode === 'project' ?
        // PROJECT GROUPS
        projects.map((project) => {
          const projectTasks = tasks.filter(
            (t) => t.projectId === project.id
          );
          const isExpanded = expandedGroups.has(project.id);
          const isSelected = selectedProjectId === project.id;
          const counts = getStatusCounts(projectTasks);
          return (
            <div key={project.id} className="space-y-0.5">
                  <button
                onClick={() => {
                  toggleGroup(project.id);
                  onSelectProject(project.id);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md transition-colors group ${isSelected ? 'text-violet-900 bg-violet-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>

                    {isExpanded ?
                <ChevronDown size={12} /> :

                <ChevronRight size={12} />
                }

                    <span
                  className="flex items-center justify-center w-4 h-4 rounded-md text-[10px] shadow-sm"
                  style={{
                    backgroundColor: `${project.color}20`,
                    color: project.color
                  }}>

                      {project.icon}
                    </span>

                    <span className="flex-1 text-left truncate">
                      {project.name}
                    </span>
                    <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>

                      {projectTasks.length}
                    </span>
                  </button>

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

                        <div className="pl-8 pr-2 py-1 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Circle size={8} className="text-slate-400" />
                              <span>To Do</span>
                            </div>
                            <span className="font-medium">{counts.todo}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Clock size={8} className="text-violet-500" />
                              <span>In Progress</span>
                            </div>
                            <span className="font-medium">
                              {counts.inProgress}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2
                          size={8}
                          className="text-emerald-500" />

                              <span>Done</span>
                            </div>
                            <span className="font-medium">{counts.done}</span>
                          </div>
                        </div>
                      </motion.div>
                }
                  </AnimatePresence>
                </div>);

        }) :
        // SPECIALTY GROUPS
        Object.values(SPECIALTIES).map((specialty) => {
          const specialtyTasks = tasks.filter((t) =>
          t.specialties?.includes(specialty.id)
          );
          if (specialtyTasks.length === 0) return null;
          const isExpanded = expandedGroups.has(specialty.id);
          const isSelected = selectedSpecialties.has(specialty.id);
          const counts = getStatusCounts(specialtyTasks);
          const Icon = specialty.icon;
          return (
            <div key={specialty.id} className="space-y-0.5">
                  <button
                onClick={() => {
                  toggleGroup(specialty.id);
                  onToggleSpecialty(specialty.id);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-md transition-colors group ${isSelected ? 'text-violet-900 bg-violet-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>

                    {isExpanded ?
                <ChevronDown size={12} /> :

                <ChevronRight size={12} />
                }

                    <span
                  className="flex items-center justify-center w-4 h-4 rounded-md text-[10px] shadow-sm"
                  style={{
                    backgroundColor: specialty.color,
                    color: 'white'
                  }}>

                      <Icon size={10} />
                    </span>

                    <span className="flex-1 text-left truncate">
                      {specialty.name}
                    </span>
                    <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>

                      {specialtyTasks.length}
                    </span>
                  </button>

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

                        <div className="pl-8 pr-2 py-1 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Circle size={8} className="text-slate-400" />
                              <span>To Do</span>
                            </div>
                            <span className="font-medium">{counts.todo}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Clock size={8} className="text-violet-500" />
                              <span>In Progress</span>
                            </div>
                            <span className="font-medium">
                              {counts.inProgress}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2
                          size={8}
                          className="text-emerald-500" />

                              <span>Done</span>
                            </div>
                            <span className="font-medium">{counts.done}</span>
                          </div>
                        </div>
                      </motion.div>
                }
                  </AnimatePresence>
                </div>);

        })}
      </div>
    </div>);

}