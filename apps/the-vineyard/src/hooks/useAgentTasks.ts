import { useState, useMemo, useEffect } from 'react';
import { Agent, Area, Project, Task, TaskStatus, ViewMode } from '../types';
import { client } from '../api/client';
import { SPECIALTIES, SpecialtyType } from '../data/specialties';

/**
 * useAgentTasks — now powered by Eden-style API client.
 *
 * Data flows through client.api.* which returns { data, error }
 * matching the Eden Treaty pattern. Currently backed by mock data;
 * flip USE_MOCK in api/client.ts to connect to a real Elysia server.
 */
export function useAgentTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [selectedGrapeId, setSelectedGrapeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // New state for specialties
  const [selectedSpecialties, setSelectedSpecialties] = useState<
    Set<SpecialtyType>>(
    new Set());

  const toggleSpecialty = (id: SpecialtyType) => {
    setSelectedSpecialties((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Fetch all data via Eden client on mount ───────────────
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [tasksRes, agentsRes, areasRes, projectsRes] = await Promise.all([
      client.api.tasks.get(),
      client.api.agents.get(),
      client.api.areas.get(),
      client.api.projects.get()]
      );
      if (tasksRes.data) setTasks(tasksRes.data);
      if (agentsRes.data) setAgents(agentsRes.data);
      if (areasRes.data) setAreas(areasRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      setLoading(false);
    }
    fetchAll();
  }, []);

  // ── Filter tasks based on selection ───────────────────────
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (selectedProjectId) {
      result = result.filter((t) => t.projectId === selectedProjectId);
    }
    if (selectedAgentId) {
      result = result.filter((t) => t.assigneeId === selectedAgentId);
    }
    if (selectedGrapeId) {
      result = result.filter((t) => t.assigneeId === selectedGrapeId);
    }
    if (selectedAreaId) {
      result = result.filter((t) => t.areaId === selectedAreaId);
    }

    // Filter by specialties
    if (selectedSpecialties.size > 0) {
      result = result.filter((t) => {
        if (!t.specialties || t.specialties.length === 0) return false;
        return t.specialties.some((s) => selectedSpecialties.has(s));
      });
    }

    return result;
  }, [
  tasks,
  selectedProjectId,
  selectedAgentId,
  selectedGrapeId,
  selectedAreaId,
  selectedSpecialties]
  );

  // ── Group tasks by status ─────────────────────────────────
  const tasksByStatus = useMemo(
    () => ({
      todo: filteredTasks.filter((t) => t.status === 'todo'),
      'in-progress': filteredTasks.filter((t) => t.status === 'in-progress'),
      done: filteredTasks.filter((t) => t.status === 'done')
    }),
    [filteredTasks]
  );

  // ── Group tasks by area ───────────────────────────────────
  const tasksByArea = useMemo(() => {
    return areas.reduce(
      (acc, area) => {
        acc[area.id] = filteredTasks.filter((t) => t.areaId === area.id);
        return acc;
      },
      {} as Record<string, Task[]>
    );
  }, [filteredTasks, areas]);

  // ── Lookups ───────────────────────────────────────────────
  const getAgent = (id: string) => agents.find((a) => a.id === id);
  const getArea = (id: string) => areas.find((a) => a.id === id);
  const getProject = (id: string) => projects.find((p) => p.id === id);

  // ── Mutations (via Eden client) ───────────────────────────
  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    // Optimistic update
    setTasks((prev) =>
    prev.map((t) =>
    t.id === taskId ?
    {
      ...t,
      status
    } :
    t
    )
    );
    // Sync with API
    await client.api.tasks.byId(taskId).put({
      status
    });
  };
  const updateTaskProject = async (taskId: string, projectId: string) => {
    setTasks((prev) =>
    prev.map((t) =>
    t.id === taskId ?
    {
      ...t,
      projectId
    } :
    t
    )
    );
    await client.api.tasks.byId(taskId).put({
      projectId
    });
  };
  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
    const { data } = await client.api.projects.post(project);
    if (data) {
      setProjects((prev) => [...prev, data]);
      return data;
    }
    return null;
  };
  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const { data } = await client.api.tasks.post(task);
    if (data) {
      setTasks((prev) => [...prev, data]);
      return data;
    }
    return null;
  };

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: filteredTasks.length,
      todo: tasksByStatus.todo.length,
      inProgress: tasksByStatus['in-progress'].length,
      done: tasksByStatus.done.length
    }),
    [filteredTasks, tasksByStatus]
  );
  return {
    tasks: filteredTasks,
    allTasks: tasks,
    agents,
    areas,
    projects,
    loading,
    selectedAgentId,
    setSelectedAgentId,
    selectedAreaId,
    setSelectedAreaId,
    selectedProjectId,
    setSelectedProjectId,
    selectedGrapeId,
    setSelectedGrapeId,
    viewMode,
    setViewMode,
    tasksByStatus,
    tasksByArea,
    getAgent,
    getArea,
    getProject,
    updateTaskStatus,
    updateTaskProject,
    addProject,
    addTask,
    stats,
    selectedSpecialties,
    toggleSpecialty
  };
}