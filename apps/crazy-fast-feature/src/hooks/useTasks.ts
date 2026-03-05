import { useState, useCallback, useMemo } from 'react';
import { Task, TaskStatus, TaskFilters, Comment } from '../types/task';
import { mockTasks } from '../data/mockTasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filters, setFilters] = useState<TaskFilters>({
    productName: 'all',
    status: 'all',
    search: '',
  });

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
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status } : task
      )
    );
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  }, []);

  const addComment = useCallback((taskId: string, text: string, author: string = 'Current User') => {
    const newComment: Comment = {
      id: Date.now().toString(),
      text,
      author,
      createdAt: new Date().toISOString(),
    };
    
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, comments: [...task.comments, newComment] }
          : task
      )
    );
  }, []);

  const deleteComment = useCallback((taskId: string, commentId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, comments: task.comments.filter((c) => c.id !== commentId) }
          : task
      )
    );
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'comments'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      comments: [],
    };
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

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
