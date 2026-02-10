import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  BarChart2, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  CheckCircle2, 
  Circle,
  AlertCircle,
  Zap,
  MoreHorizontal,
  Plus
} from 'lucide-react';
import { useAgentTasks } from '../hooks/useAgentTasks';
import { Project, Task, TaskStatus } from '../types';

export function FastTrackDashboard() {
  const { 
    projects, 
    allTasks, 
    updateTaskStatus,
    updateTaskProject
  } = useAgentTasks();

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Group tasks by project and allow reordering
  const [projectTasks, setProjectTasks] = useState<Record<string, Task[]>>({});

  // Sync tasks from hook to local state for reordering
  React.useEffect(() => {
    const grouped: Record<string, Task[]> = {};
    projects.forEach(p => {
      grouped[p.id] = allTasks.filter(t => t.projectId === p.id);
    });
    setProjectTasks(grouped);
  }, [allTasks, projects]);

  const handleReorder = (projectId: string, newOrder: Task[]) => {
    setProjectTasks(prev => ({
      ...prev,
      [projectId]: newOrder
    }));
    // In a real app, we'd sync the new order/priority to the backend
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'done': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'in-progress': return <Clock size={14} className="text-amber-500" />;
      default: return <Circle size={14} className="text-slate-300" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'high': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-600 border-blue-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB] overflow-hidden font-sans">
      {/* Header with Project Icons */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 z-20 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight flex items-center gap-2">
              <Zap className="text-amber-500 fill-amber-500" size={24} />
              Fast Track
            </h1>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className="flex items-center gap-1"><Circle size={8} className="fill-slate-300 text-slate-300" /> {allTasks.filter(t => t.status === 'todo').length} Todo</span>
              <span className="flex items-center gap-1"><Circle size={8} className="fill-amber-400 text-amber-400" /> {allTasks.filter(t => t.status === 'in-progress').length} Active</span>
              <span className="flex items-center gap-1"><Circle size={8} className="fill-emerald-400 text-emerald-400" /> {allTasks.filter(t => t.status === 'done').length} Done</span>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            <button 
              onClick={() => setSelectedProjectId(null)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 border ${!selectedProjectId ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}`}
            >
              <BarChart2 size={18} />
              <span className="font-semibold text-sm">All Projects</span>
            </button>
            
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`flex-shrink-0 flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 border ${selectedProjectId === project.id ? 'bg-white border-slate-900 text-slate-900 shadow-md scale-105' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 opacity-70 hover:opacity-100'}`}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm"
                  style={{ backgroundColor: `${project.color}15`, color: project.color }}
                >
                  {project.icon || '📦'}
                </div>
                <span className="font-semibold text-sm whitespace-nowrap">{project.name}</span>
              </button>
            ))}

            <button className="flex-shrink-0 w-10 h-10 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Area */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
          {projects
            .filter(p => !selectedProjectId || p.id === selectedProjectId)
            .map(project => (
            <section key={project.id} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full" style={{ backgroundColor: project.color }}></div>
                  <h2 className="text-xl font-bold text-[#334155] tracking-tight">{project.name}</h2>
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md">
                    {projectTasks[project.id]?.length || 0}
                  </span>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <Reorder.Group 
                axis="y" 
                values={projectTasks[project.id] || []} 
                onReorder={(newOrder) => handleReorder(project.id, newOrder)}
                className="space-y-2.5"
              >
                <AnimatePresence>
                  {(projectTasks[project.id] || []).map(task => (
                    <Reorder.Item
                      key={task.id}
                      value={task}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`group relative bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing ${expandedTaskId === task.id ? 'ring-2 ring-indigo-500 border-transparent z-10' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          {getStatusIcon(task.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0" onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}>
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`text-sm font-semibold truncate ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {task.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              {expandedTaskId === task.id ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {expandedTaskId === task.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <p className="text-xs text-slate-500 mt-2 mb-4 leading-relaxed">
                                  {task.description || 'No detailed description available for this task.'}
                                </p>
                                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                    <AlertCircle size={12} />
                                    Area: {task.areaId}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                    <Zap size={12} />
                                    Specialties: {task.specialties?.join(', ') || 'General'}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      
                      {/* Interaction hint on hover */}
                      <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      </div>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
                
                {(projectTasks[project.id] || []).length === 0 && (
                  <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400 italic font-medium tracking-tight">No active tasks in this project</p>
                  </div>
                )}
              </Reorder.Group>
            </section>
          ))}
        </div>
      </main>

      {/* Quick Action Footer */}
      <footer className="bg-white border-t border-slate-200 p-4 px-8 flex items-center justify-between shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Fast Track View
          </div>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <p className="text-xs text-slate-400 font-medium italic">Drag tasks to reprioritize. Click to expand details.</p>
        </div>
        <div className="flex items-center gap-2">
           <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:shadow-indigo-200 hover:bg-slate-800 transition-all flex items-center gap-2">
             <Plus size={16} /> New Task
           </button>
        </div>
      </footer>
    </div>
  );
}
