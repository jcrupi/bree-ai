import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Task, TaskStatus, TaskFilters, Comment } from '../types/task';
import { mockTasks } from '../data/mockTasks';
import { loadCurrentWeek, saveWeekTab, currentWeekKey } from '../services/leadNotes';

/** Debounce helper */
function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]) as T;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({
    productName: 'all',
    status: 'all',
    search: '',
  });

  // Load from server on mount — prefer server data over local seed
  useEffect(() => {
    loadCurrentWeek().then((data) => {
      if (data.tech) {
        try {
          const parsed = JSON.parse(data.tech);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTasks(parsed);
          }
        } catch {
          // server data not valid JSON yet — fall back to seed
        }
      }
      setLoaded(true);
    });
  }, []);

  // Persist tasks to server whenever they change (debounced 800ms)
  const persistTasks = useDebouncedCallback(
    useCallback((current: Task[]) => {
      saveWeekTab('tech', JSON.stringify(current, null, 2));
    }, []),
    800
  );

  // Wrap setTasks so every mutation also persists
  const setAndPersist = useCallback((updater: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (loaded) persistTasks(next);
      return next;
    });
  }, [loaded, persistTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesProduct = filters.productName === 'all' || task.productName === filters.productName;
      const matchesStatus = filters.status === 'all' || task.status === filters.status;
      const matchesSearch = filters.search === '' ||
        task.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.taskId.toLowerCase().includes(filters.search.toLowerCase());
      return matchesProduct && matchesStatus && matchesSearch;
    });
  }, [tasks, filters]);

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    setAndPersist((prev) => prev.map((task) => task.id === taskId ? { ...task, status } : task));
  }, [setAndPersist]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setAndPersist((prev) => prev.map((task) => task.id === taskId ? { ...task, ...updates } : task));
  }, [setAndPersist]);

  const addComment = useCallback((taskId: string, text: string, author: string = 'Current User') => {
    const newComment: Comment = {
      id: Date.now().toString(),
      text,
      author,
      createdAt: new Date().toISOString(),
    };
    setAndPersist((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, comments: [...task.comments, newComment] } : task
      )
    );
  }, [setAndPersist]);

  const deleteComment = useCallback((taskId: string, commentId: string) => {
    setAndPersist((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, comments: task.comments.filter((c) => c.id !== commentId) }
          : task
      )
    );
  }, [setAndPersist]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'comments'>) => {
    const newTask: Task = { ...task, id: Date.now().toString(), comments: [] };
    setAndPersist((prev) => [newTask, ...prev]);
  }, [setAndPersist]);

  const deleteTask = useCallback((taskId: string) => {
    setAndPersist((prev) => prev.filter((task) => task.id !== taskId));
  }, [setAndPersist]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const investigating = tasks.filter((t) => t.status === 'investigating').length;
    const active = tasks.filter((t) => t.status === 'active').length;
    const complete = tasks.filter((t) => t.status === 'complete').length;
    return { total, pending, investigating, active, complete };
  }, [tasks]);

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    loaded,
    currentWeek: currentWeekKey(),
    filters,
    setFilters,
    updateTaskStatus,
    updateTask,
    addComment,
    deleteComment,
    addTask,
    deleteTask,
    stats,
  };
}
