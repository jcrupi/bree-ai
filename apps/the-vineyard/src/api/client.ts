/**
 * BREE AI Eden-Style API Client
 *
 * Mimics the Eden Treaty pattern: client.api.tasks.get()
 * Returns { data, error } just like Eden Treaty.
 *
 * Currently uses mock data with optional fetch fallback.
 *
 * ── TO CONNECT REAL ELYSIA BACKEND ──────────────────────
 * Replace this file's contents with:
 *
 *   import { treaty } from '@elysiajs/eden';
 *   import type { App } from 'bree-ai-api';
 *
 *   export const client = treaty<App>(
 *     import.meta.env.VITE_API_URL || 'http://localhost:3000'
 *   );
 *
 * Everything else stays the same — all hooks already use
 * the { data, error } pattern.
 * ─────────────────────────────────────────────────────────
 */

import {
  Task,
  Agent,
  Area,
  Project,
  TaskStatus,
  AILens,
  AILensAnalysis,
  AgentXResponse,
} from "../types";
import type {
  AgentXNote,
  EdenResponse,
  CreateTaskBody,
  UpdateTaskBody,
  CreateProjectBody,
  CreateLensBody,
  UpdateLensBody,
  AnalyzeRequest,
} from "./types";

// ─── Configuration ──────────────────────────────────────────
const isProd = import.meta.env.PROD;
const API_BASE = isProd
  ? ""
  : import.meta.env.VITE_API_URL || "http://localhost:3000";
const USE_MOCK = !isProd && !import.meta.env.VITE_API_URL; // Use mock in dev unless API URL is set

// ─── Mock Data Store ────────────────────────────────────────
let mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Implement user authentication API",
    status: "done",
    priority: "high",
    projectId: "proj-1",
    areaId: "backend",
    assigneeId: "ha3",
    createdAt: "2024-01-15",
    specialties: ["backend", "security"],
    agentxNoteId: "bree.lens.security-auditor",
    agentxNoteContent: JSON.stringify([
      {
        type: "heading",
        props: { level: 1 },
        content: "Security Auditor Lens",
      },
      {
        type: "paragraph",
        content:
          "Reviews tasks, code activity, and conversations for security implications.",
      },
      { type: "heading", props: { level: 3 }, content: "AgentX Metadata" },
      { type: "bulletListItem", content: "ID: bree.lens.security-auditor" },
      {
        type: "bulletListItem",
        content: "NATS Subject: bree.lens.security-auditor",
      },
    ]),
  },
  {
    id: "task-2",
    title: "Set up database migrations",
    status: "in-progress",
    priority: "high",
    projectId: "proj-1",
    areaId: "backend",
    assigneeId: "ai2",
    createdAt: "2024-01-16",
    specialties: ["database", "devops"],
  },
  {
    id: "task-3",
    title: "Create REST endpoints for tasks",
    status: "todo",
    priority: "medium",
    projectId: "proj-1",
    areaId: "backend",
    assigneeId: "ha3",
    createdAt: "2024-01-17",
    specialties: ["backend"],
  },
  {
    id: "task-4",
    title: "Optimize database queries",
    status: "todo",
    priority: "low",
    projectId: "proj-1",
    areaId: "backend",
    assigneeId: "ai2",
    createdAt: "2024-01-18",
    specialties: ["database"],
  },
  {
    id: "task-5",
    title: "Build task list component",
    status: "in-progress",
    priority: "high",
    projectId: "proj-1",
    areaId: "frontend",
    assigneeId: "ha2",
    createdAt: "2024-01-15",
    specialties: ["ui", "ux"],
  },
  {
    id: "task-6",
    title: "Implement drag and drop",
    status: "todo",
    priority: "medium",
    projectId: "proj-1",
    areaId: "frontend",
    assigneeId: "ha2",
    createdAt: "2024-01-16",
    specialties: ["ui"],
  },
  {
    id: "task-7",
    title: "Add keyboard shortcuts",
    status: "todo",
    priority: "low",
    projectId: "proj-1",
    areaId: "frontend",
    assigneeId: "ai1",
    createdAt: "2024-01-17",
    specialties: ["ux", "governance"],
  },
  {
    id: "task-8",
    title: "Train task priority model",
    status: "in-progress",
    priority: "high",
    projectId: "proj-1",
    areaId: "ml",
    assigneeId: "ai2",
    createdAt: "2024-01-14",
    specialties: ["backend", "devops"],
  },
  {
    id: "task-9",
    title: "Implement auto-assignment algorithm",
    status: "todo",
    priority: "urgent",
    projectId: "proj-1",
    areaId: "ml",
    assigneeId: "ai1",
    createdAt: "2024-01-15",
    specialties: ["backend"],
  },
  {
    id: "task-10",
    title: "Set up analytics pipeline",
    status: "done",
    priority: "medium",
    projectId: "proj-1",
    areaId: "data",
    assigneeId: "ai2",
    createdAt: "2024-01-13",
    specialties: ["data", "devops"],
  },
  {
    id: "task-11",
    title: "Create dashboard metrics",
    status: "in-progress",
    priority: "medium",
    projectId: "proj-1",
    areaId: "data",
    assigneeId: "h3",
    createdAt: "2024-01-16",
    specialties: ["ui", "data"],
  },
  {
    id: "task-12",
    title: "Configure CI/CD pipeline",
    status: "done",
    priority: "high",
    projectId: "proj-1",
    areaId: "devops",
    assigneeId: "ai3",
    createdAt: "2024-01-12",
    specialties: ["devops"],
  },
  {
    id: "task-13",
    title: "Set up monitoring alerts",
    status: "todo",
    priority: "medium",
    projectId: "proj-1",
    areaId: "devops",
    assigneeId: "ai3",
    createdAt: "2024-01-17",
    specialties: ["devops", "security"],
  },
  {
    id: "task-14",
    title: "Design system documentation",
    status: "in-progress",
    priority: "medium",
    projectId: "proj-1",
    areaId: "design",
    assigneeId: "h2",
    createdAt: "2024-01-15",
    specialties: ["ui", "ux", "governance"],
  },
  {
    id: "task-15",
    title: "Create icon set",
    status: "todo",
    priority: "low",
    projectId: "proj-1",
    areaId: "design",
    assigneeId: "ha1",
    createdAt: "2024-01-18",
    specialties: ["ui"],
  },
  // Project 2 Tasks
  {
    id: "task-16",
    title: "Design API Gateway Architecture",
    status: "done",
    priority: "urgent",
    projectId: "proj-2",
    areaId: "backend",
    assigneeId: "h1",
    createdAt: "2024-01-20",
    specialties: ["backend", "security"],
  },
  {
    id: "task-17",
    title: "Implement Rate Limiting Middleware",
    status: "in-progress",
    priority: "high",
    projectId: "proj-2",
    areaId: "backend",
    assigneeId: "ha3",
    createdAt: "2024-01-22",
    specialties: ["backend", "security"],
  },
  {
    id: "task-18",
    title: "Setup Redis Cluster",
    status: "in-progress",
    priority: "medium",
    projectId: "proj-2",
    areaId: "devops",
    assigneeId: "ai3",
    createdAt: "2024-01-25",
    specialties: ["devops", "database"],
  },
  {
    id: "task-19",
    title: "Write API Documentation",
    status: "todo",
    priority: "medium",
    projectId: "proj-2",
    areaId: "backend",
    assigneeId: "ha2",
    createdAt: "2024-01-26",
    specialties: ["backend", "ui"],
  },
  {
    id: "task-20",
    title: "Implement JWT Auth Service",
    status: "todo",
    priority: "high",
    projectId: "proj-2",
    areaId: "security",
    assigneeId: "ai3",
    createdAt: "2024-01-27",
    specialties: ["security", "backend"],
  },
];

const mockAgents: Agent[] = [
  // Design Team Humans
  {
    id: "h1",
    name: "John",
    type: "human",
    color: "#7C3AED",
    category: "design-team",
  },
  {
    id: "h2",
    name: "Mary",
    type: "human",
    color: "#EC4899",
    category: "design-team",
  },
  {
    id: "h3",
    name: "Ingrid",
    type: "human",
    color: "#F59E0B",
    category: "design-team",
  },
  // Human AI Agents
  {
    id: "ha1",
    name: "Sara",
    type: "human",
    color: "#06B6D4",
    category: "human-ai",
  },
  {
    id: "ha2",
    name: "Marcus",
    type: "human",
    color: "#10B981",
    category: "human-ai",
  },
  {
    id: "ha3",
    name: "Alex",
    type: "human",
    color: "#3B82F6",
    category: "human-ai",
  },
  // AI Special Agents
  {
    id: "ai1",
    name: "ARIA",
    type: "ai",
    avatar: "🎨",
    color: "#8B5CF6",
    category: "ai-special",
  },
  {
    id: "ai2",
    name: "NEXUS",
    type: "ai",
    avatar: "⚡",
    color: "#6366F1",
    category: "ai-special",
  },
  {
    id: "ai3",
    name: "SENTINEL",
    type: "ai",
    avatar: "🛡️",
    color: "#EF4444",
    category: "ai-special",
  },
];

const mockAreas: Area[] = [
  {
    id: "backend",
    name: "Backend",
    color: "#10B981",
  },
  {
    id: "frontend",
    name: "Frontend",
    color: "#3B82F6",
  },
  {
    id: "ml",
    name: "ML/AI",
    color: "#8B5CF6",
  },
  {
    id: "data",
    name: "Data",
    color: "#F59E0B",
  },
  {
    id: "devops",
    name: "DevOps",
    color: "#EF4444",
  },
  {
    id: "design",
    name: "Design",
    color: "#EC4899",
  },
];

let mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Website Redesign",
    description: "Complete overhaul of the company website",
    color: "#3B82F6",
    icon: "🌐",
    createdAt: "2024-01-01",
    repoUrl: "github.com/grapes-vines/website-redesign",
    defaultBranch: "main",
    branches: [
      {
        id: "b1",
        name: "main",
        isDefault: true,
        lastCommit: "Update hero section",
        lastCommitDate: "2024-02-06",
      },
      {
        id: "b2",
        name: "feature/hero-animation",
        isDefault: false,
        lastCommit: "Add spring physics",
        lastCommitDate: "2024-02-06",
      },
      {
        id: "b3",
        name: "feature/mobile-nav",
        isDefault: false,
        lastCommit: "Fix touch targets",
        lastCommitDate: "2024-02-05",
      },
      {
        id: "b4",
        name: "fix/accessibility",
        isDefault: false,
        lastCommit: "Darken blue to #2563EB",
        lastCommitDate: "2024-02-03",
      },
    ],
  },
  {
    id: "proj-2",
    name: "API Platform",
    description: "Backend services and API gateway",
    color: "#10B981",
    icon: "⚡",
    createdAt: "2024-01-10",
    repoUrl: "github.com/grapes-vines/api-platform",
    defaultBranch: "main",
    branches: [
      {
        id: "b5",
        name: "main",
        isDefault: true,
        lastCommit: "Release v2.1",
        lastCommitDate: "2024-02-04",
      },
      {
        id: "b6",
        name: "feature/rate-limiting",
        isDefault: false,
        lastCommit: "Add Redis cache layer",
        lastCommitDate: "2024-02-04",
      },
      {
        id: "b7",
        name: "feature/auth-v2",
        isDefault: false,
        lastCommit: "JWT refresh tokens",
        lastCommitDate: "2024-02-01",
      },
    ],
  },
];

// ─── Mock Lens Data Store ───────────────────────────────────
let mockLenses: AILens[] = [
  {
    id: "urgent-lens",
    name: "Urgent Lens",
    icon: "🚨",
    color: "text-orange-600 bg-orange-100",
    description:
      "Scans all Vines for anything urgent that needs immediate attention.",
    systemPrompt:
      "Scan all active Vine conversations for anything urgent. Look for: blockers mentioned by team members, unresolved decisions that are holding up work, time-sensitive requests, escalations, missed deadlines, or any message indicating something needs immediate action. Prioritize by severity.",
    category: "analysis",
    isActive: true,
    createdAt: "2024-01-01",
    lastUsed: "2024-02-06",
    usageCount: 47,
  },
  {
    id: "risk-scanner",
    name: "Risk Scanner",
    icon: "🔍",
    color: "text-rose-600 bg-rose-100",
    description:
      "Identifies potential bottlenecks, delays, and high-risk items.",
    systemPrompt:
      "Analyze the following project data for risks. Highlight any overdue tasks, high-priority items without assignees, or stalled conversations.",
    category: "analysis",
    isActive: true,
    createdAt: "2024-01-01",
    lastUsed: "2024-02-05",
    usageCount: 83,
  },
  {
    id: "progress-analyst",
    name: "Progress Analyst",
    icon: "📊",
    color: "text-blue-600 bg-blue-100",
    description: "Summarizes completion rates and velocity trends.",
    systemPrompt:
      "Provide a progress report based on the task completion status and recent activity. Estimate completion time if possible.",
    category: "analysis",
    isActive: true,
    createdAt: "2024-01-01",
    lastUsed: "2024-02-06",
    usageCount: 112,
  },
  {
    id: "idea-generator",
    name: "Idea Generator",
    icon: "💡",
    color: "text-amber-600 bg-amber-100",
    description:
      "Suggests new features or improvements based on current context.",
    systemPrompt:
      "Based on the current tasks and conversations, suggest 3 creative ideas or features that could improve the project.",
    category: "generation",
    isActive: true,
    createdAt: "2024-01-01",
    lastUsed: "2024-02-04",
    usageCount: 56,
  },
  {
    id: "security-auditor",
    name: "Security Auditor",
    icon: "🛡️",
    color: "text-emerald-600 bg-emerald-100",
    description: "Checks for security-related tasks and vulnerabilities.",
    systemPrompt:
      "Review the tasks and code activity for security implications. Flag any missing security practices or potential vulnerabilities.",
    category: "audit",
    isActive: true,
    createdAt: "2024-01-01",
    lastUsed: "2024-02-03",
    usageCount: 34,
  },
  {
    id: "priority-optimizer",
    name: "Priority Optimizer",
    icon: "⚡",
    color: "text-violet-600 bg-violet-100",
    description: "Recommends task re-prioritization for maximum impact.",
    systemPrompt:
      "Analyze the task list and suggest an optimized order of execution to maximize impact and unblock other work.",
    category: "optimization",
    isActive: true,
    createdAt: "2024-01-01",
    lastUsed: "2024-02-06",
    usageCount: 91,
  },
];

let mockAnalyses: AILensAnalysis[] = [];

// ─── Fetch helper (for real API mode) ───────────────────────
async function edenFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<EdenResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });
    if (!res.ok) {
      return {
        data: null,
        error: {
          status: res.status,
          message: res.statusText,
        },
      };
    }
    const data = await res.json();
    return {
      data,
      error: null,
    };
  } catch (e) {
    return {
      data: null,
      error: {
        status: 0,
        message: (e as Error).message,
      },
    };
  }
}

// ─── Mock helper ────────────────────────────────────────────
function mockResponse<T>(data: T): Promise<EdenResponse<T>> {
  return Promise.resolve({
    data,
    error: null,
  });
}

// ─── Eden-Style Client ──────────────────────────────────────
// Usage: const { data, error } = await client.api.tasks.get()
export const client = {
  api: {
    // ── Tasks ─────────────────────────────────────────────
    tasks: {
      get: (): Promise<EdenResponse<Task[]>> => {
        if (USE_MOCK) return mockResponse([...mockTasks]);
        return edenFetch<Task[]>("/api/tasks");
      },
      post: (body: CreateTaskBody): Promise<EdenResponse<Task>> => {
        if (USE_MOCK) {
          const newTask: Task = {
            ...body,
            id: `task-${Date.now()}`,
            createdAt: new Date().toISOString().split("T")[0],
            // Ensure optional fields are handled
            agentxNoteId: body.agentxNoteId,
            agentxNoteContent: body.agentxNoteContent,
          };
          mockTasks = [...mockTasks, newTask];
          return mockResponse(newTask);
        }
        return edenFetch<Task>("/api/tasks", {
          method: "POST",
          body: JSON.stringify(body),
        });
      },
      byId: (id: string) => ({
        get: (): Promise<EdenResponse<Task>> => {
          if (USE_MOCK) {
            const task = mockTasks.find((t) => t.id === id);
            if (!task)
              return Promise.resolve({
                data: null,
                error: {
                  status: 404,
                  message: "Task not found",
                },
              });
            return mockResponse(task);
          }
          return edenFetch<Task>(`/api/tasks/${id}`);
        },
        put: (body: UpdateTaskBody): Promise<EdenResponse<Task>> => {
          if (USE_MOCK) {
            mockTasks = mockTasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...body,
                  }
                : t,
            );
            const updated = mockTasks.find((t) => t.id === id)!;
            return mockResponse(updated);
          }
          return edenFetch<Task>(`/api/tasks/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
          });
        },
        delete: (): Promise<
          EdenResponse<{
            success: boolean;
          }>
        > => {
          if (USE_MOCK) {
            mockTasks = mockTasks.filter((t) => t.id !== id);
            return mockResponse({
              success: true,
            });
          }
          return edenFetch<{
            success: boolean;
          }>(`/api/tasks/${id}`, {
            method: "DELETE",
          });
        },
      }),
    },
    // ── Agents ────────────────────────────────────────────
    agents: {
      get: (): Promise<EdenResponse<Agent[]>> => {
        if (USE_MOCK) return mockResponse([...mockAgents]);
        return edenFetch<Agent[]>("/api/agents");
      },
    },
    // ── Areas ─────────────────────────────────────────────
    areas: {
      get: (): Promise<EdenResponse<Area[]>> => {
        if (USE_MOCK) return mockResponse([...mockAreas]);
        return edenFetch<Area[]>("/api/areas");
      },
    },
    // ── Projects ──────────────────────────────────────────
    projects: {
      get: (): Promise<EdenResponse<Project[]>> => {
        if (USE_MOCK) return mockResponse([...mockProjects]);
        return edenFetch<Project[]>("/api/projects");
      },
      post: (body: CreateProjectBody): Promise<EdenResponse<Project>> => {
        if (USE_MOCK) {
          const newProject: Project = {
            ...body,
            id: `proj-${Date.now()}`,
            createdAt: new Date().toISOString().split("T")[0],
          };
          mockProjects = [...mockProjects, newProject];
          return mockResponse(newProject);
        }
        return edenFetch<Project>("/api/projects", {
          method: "POST",
          body: JSON.stringify(body),
        });
      },
    },

    // ── AI Lenses (First-Class Bree Component) ────────────
    lenses: {
      get: (): Promise<EdenResponse<AILens[]>> => {
        if (USE_MOCK) return mockResponse([...mockLenses]);
        return edenFetch<AILens[]>("/api/lenses");
      },
      post: (body: CreateLensBody): Promise<EdenResponse<AILens>> => {
        if (USE_MOCK) {
          const newLens: AILens = {
            ...body,
            id: `lens-${Date.now()}`,
            isActive: true,
            createdAt: new Date().toISOString().split("T")[0],
            usageCount: 0,
          };
          mockLenses = [...mockLenses, newLens];
          return mockResponse(newLens);
        }
        return edenFetch<AILens>("/api/lenses", {
          method: "POST",
          body: JSON.stringify(body),
        });
      },
      byId: (id: string) => ({
        get: (): Promise<EdenResponse<AILens>> => {
          if (USE_MOCK) {
            const lens = mockLenses.find((l) => l.id === id);
            if (!lens)
              return Promise.resolve({
                data: null,
                error: { status: 404, message: "Lens not found" },
              });
            return mockResponse(lens);
          }
          return edenFetch<AILens>(`/api/lenses/${id}`);
        },
        put: (body: UpdateLensBody): Promise<EdenResponse<AILens>> => {
          if (USE_MOCK) {
            mockLenses = mockLenses.map((l) =>
              l.id === id ? { ...l, ...body } : l,
            );
            const updated = mockLenses.find((l) => l.id === id)!;
            return mockResponse(updated);
          }
          return edenFetch<AILens>(`/api/lenses/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
          });
        },
        delete: (): Promise<EdenResponse<{ success: boolean }>> => {
          if (USE_MOCK) {
            mockLenses = mockLenses.filter((l) => l.id !== id);
            return mockResponse({ success: true });
          }
          return edenFetch<{ success: boolean }>(`/api/lenses/${id}`, {
            method: "DELETE",
          });
        },
        analyses: {
          get: (): Promise<EdenResponse<AILensAnalysis[]>> => {
            if (USE_MOCK) {
              const lensAnalyses = mockAnalyses.filter((a) => a.lensId === id);
              return mockResponse(lensAnalyses);
            }
            return edenFetch<AILensAnalysis[]>(`/api/lenses/${id}/analyses`);
          },
        },
      }),
    },

    // ── AgentX Collective (Orchestration Service) ─────────
    agentx: {
      analyze: (
        body: AnalyzeRequest,
      ): Promise<EdenResponse<AgentXResponse>> => {
        if (USE_MOCK) {
          const { getMockAnalysis } = require("../data/aiLenses");
          const lens = mockLenses.find((l) => l.id === body.lensId);
          if (!lens)
            return Promise.resolve({
              data: null,
              error: { status: 404, message: "Lens not found" },
            });

          const startTime = Date.now();
          const analysis = getMockAnalysis(
            body.lensId,
            body.targetType,
            body.contextSummary,
          );

          // Track usage
          mockLenses = mockLenses.map((l) =>
            l.id === body.lensId
              ? {
                  ...l,
                  lastUsed: new Date().toISOString(),
                  usageCount: l.usageCount + 1,
                }
              : l,
          );

          // Store analysis record
          const analysisRecord: AILensAnalysis = {
            id: `analysis-${Date.now()}`,
            lensId: body.lensId,
            targetType: body.targetType,
            targetId: body.targetId,
            projectId: body.projectId,
            status: "complete",
            result: analysis,
            summary: body.contextSummary,
            severity:
              body.lensId === "urgent-lens" || body.lensId === "risk-scanner"
                ? "warning"
                : "info",
            actionItems: [],
            createdAt: new Date().toISOString(),
            durationMs: Date.now() - startTime + 280, // simulate latency
          };
          mockAnalyses = [analysisRecord, ...mockAnalyses].slice(0, 100); // keep last 100

          const response: AgentXResponse = {
            requestId: `req-${Date.now()}`,
            lensId: body.lensId,
            analysis,
            severity: analysisRecord.severity!,
            actionItems: [],
            confidence: 0.87,
            processingTimeMs: analysisRecord.durationMs,
            model: "bree-agentx-v1",
            tokenUsage: { prompt: 420, completion: 380, total: 800 },
          };

          return mockResponse(response);
        }
        return edenFetch<AgentXResponse>("/api/agentx/analyze", {
          method: "POST",
          body: JSON.stringify(body),
        });
      },
      health: (): Promise<
        EdenResponse<{ status: string; agents: number; queueDepth: number }>
      > => {
        if (USE_MOCK)
          return mockResponse({
            status: "operational",
            agents: 6,
            queueDepth: 0,
          });
        return edenFetch<{
          status: string;
          agents: number;
          queueDepth: number;
        }>("/api/agentx/health");
      },
      // ── AgentX Notes (Component Registry) ───────────────
      notes: {
        get: (): Promise<EdenResponse<AgentXNote[]>> => {
          if (USE_MOCK) {
            const { AGENTX_NOTES } = require("../data/agentxNotes");
            return mockResponse([...AGENTX_NOTES]);
          }
          return edenFetch<AgentXNote[]>("/api/agentx/notes");
        },
        byId: (id: string) => ({
          get: (): Promise<EdenResponse<AgentXNote>> => {
            if (USE_MOCK) {
              const { getNoteById } = require("../data/agentxNotes");
              const note = getNoteById(id);
              if (!note)
                return Promise.resolve({
                  data: null,
                  error: { status: 404, message: "Note not found" },
                });
              return mockResponse(note);
            }
            return edenFetch<AgentXNote>(`/api/agentx/notes/${id}`);
          },
        }),
        byLens: (lensId: string) => ({
          get: (): Promise<EdenResponse<AgentXNote[]>> => {
            if (USE_MOCK) {
              const { getNotesByLensTarget } = require("../data/agentxNotes");
              return mockResponse(getNotesByLensTarget(lensId));
            }
            return edenFetch<AgentXNote[]>(
              `/api/agentx/notes/by-lens/${lensId}`,
            );
          },
        }),
        byAgent: (agentId: string) => ({
          get: (): Promise<EdenResponse<AgentXNote[]>> => {
            if (USE_MOCK) {
              const { getNotesByAgent } = require("../data/agentxNotes");
              return mockResponse(getNotesByAgent(agentId));
            }
            return edenFetch<AgentXNote[]>(
              `/api/agentx/notes/by-agent/${agentId}`,
            );
          },
        }),
        byNats: (subject: string) => ({
          get: (): Promise<EdenResponse<AgentXNote[]>> => {
            if (USE_MOCK) {
              const { getNotesByNatsSubject } = require("../data/agentxNotes");
              return mockResponse(getNotesByNatsSubject(subject));
            }
            return edenFetch<AgentXNote[]>(
              `/api/agentx/notes/by-nats/${encodeURIComponent(subject)}`,
            );
          },
        }),
      },
    },

    // ── Health ────────────────────────────────────────────
    health: {
      get: (): Promise<
        EdenResponse<{
          status: string;
          uptime: number;
        }>
      > => {
        if (USE_MOCK)
          return mockResponse({
            status: "ok",
            uptime: Date.now(),
          });
        return edenFetch<{
          status: string;
          uptime: number;
        }>("/api/health");
      },
    },
  },
};
