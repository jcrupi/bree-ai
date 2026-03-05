import React, { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskSpreadsheet } from './components/TaskSpreadsheet';
import { FilterBar } from './components/FilterBar';
import { StatsBar } from './components/StatsBar';
import { EditTaskModal } from './components/EditTaskModal';
import { AddTaskModal } from './components/AddTaskModal';
import { Task } from './types/task';
import { Plus, Zap, RefreshCw } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export function App() {
  const {
    tasks,
    filters,
    setFilters,
    updateTaskStatus,
    updateTask,
    addComment,
    deleteComment,
    addTask,
    deleteTask,
    stats,
  } = useTasks();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API refresh - in production this would call the Linear API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Crazy Fast Feature</h1>
                <p className="text-sm text-slate-400">AI Task Tracker</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Syncing...' : 'Sync Linear'}
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/25"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Filters */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Task List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">
              Tasks ({tasks.length})
            </h2>
          </div>

          <TaskSpreadsheet
            tasks={tasks}
            onStatusChange={updateTaskStatus}
            onEdit={setEditingTask}
            onDelete={deleteTask}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
          />
        </div>
      </main>

      {/* Modals */}
      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={updateTask}
      />

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTask}
      />
    </div>
  );
}

export default App;
