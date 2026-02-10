export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type AgentType = 'human' | 'ai';
export type AgentCategory = 'design-team' | 'human-ai' | 'ai-special';
export type SpecialtyType =
'ui' |
'ux' |
'backend' |
'messaging' |
'database' |
'security' |
'governance' |
'devops';

export interface GitBranch {
  id: string;
  name: string;
  isDefault: boolean;
  lastCommit?: string;
  lastCommitDate?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: string;
  repoUrl?: string;
  branches?: GitBranch[];
  defaultBranch?: string;
}
export interface Area {
  id: string;
  name: string;
  color: string;
}
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  areaId: string;
  assigneeId: string;
  createdAt: string;
  dueDate?: string;
  specialties?: SpecialtyType[];
  agentxNoteId?: string;
  agentxNoteContent?: string; // JSON string of BlockNote blocks
}
export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  avatar?: string;
  color: string;
  category?: AgentCategory;
}
export type ViewMode = 'all' | 'my-tasks' | 'by-area' | 'by-agent';
export type DisplayMode = 'list' | 'card';

// Team Page Types
export type TeamMemberCategory = 'human-design' | 'human-ai' | 'ai-special';
export type MemberStatus = 'online' | 'busy' | 'idle' | 'active';
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: TeamMemberCategory;
  status: MemberStatus;
  skills: string[];
  avatar?: string;
  isAI: boolean;
}

// Vines (Chat) Types
export interface VineMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderCategory: TeamMemberCategory;
  content: string;
  timestamp: string;
}

export interface VineConversation {
  id: string;
  projectId: string;
  topic: string;
  participants: string[]; // TeamMember IDs
  messages: VineMessage[];
  lastActivity: string;
  unreadCount: number;
  specialties?: SpecialtyType[];
  taskIds?: string[]; // Linked task IDs
}

// Grapes Types
export type GrapeStatus = 'growing' | 'ripe' | 'harvested';
export interface Grape {
  id: string;
  projectId: string;
  title: string;
  status: GrapeStatus;
  description?: string;
}

// ─── AI Lens Types (First-Class Bree Component) ─────────────
export type LensCategory = 'analysis' | 'generation' | 'audit' | 'optimization';
export type LensStatus = 'idle' | 'scanning' | 'complete' | 'error';

export interface AILens {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  systemPrompt: string;
  category: LensCategory;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

export interface AILensAnalysis {
  id: string;
  lensId: string;
  targetType: string; // 'tasks' | 'vines' | 'grapes' | 'git' | 'team'
  targetId: string; // zone or page ID
  projectId?: string;
  status: LensStatus;
  result: string;
  summary: string;
  severity?: 'critical' | 'warning' | 'info' | 'success';
  actionItems: string[];
  createdAt: string;
  durationMs: number;
}

// AgentX Communication Types
export interface AgentXRequest {
  lensId: string;
  systemPrompt: string;
  targetType: string;
  targetSummary: string;
  contextData: {
    tasks?: Task[];
    vines?: VineConversation[];
    grapes?: Grape[];
    project?: Project | null;
  };
  requestedBy: string; // agent or user ID
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface AgentXResponse {
  requestId: string;
  lensId: string;
  analysis: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  actionItems: string[];
  confidence: number; // 0-1
  processingTimeMs: number;
  model: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// ─── AgentX Notes (Component Front Matter) ──────────────────
// Each TSX component publishes a "note" — a structured metadata
// block that AI agents, lenses, and other components can discover
// over the AgentX NATS network. Think of it as front matter for
// executable UI components.

export type ComponentType =
'page' |
'component' |
'hook' |
'data' |
'api' |
'provider' |
'lens';
export type NatsVerb = 'publish' | 'subscribe' | 'request' | 'reply';

export interface NatsBinding {
  subject: string; // e.g. "bree.pages.dashboard.render"
  verb: NatsVerb;
  description: string;
  schema?: string; // reference to a type name
}

export interface AgentXNote {
  // ── Identity ──
  id: string;
  component: string;
  title: string;
  description: string;
  type: ComponentType;
  version: string;

  // ── AgentX Network ──
  natsSubject: string;
  bindings: NatsBinding[];

  // ── AI Lens Integration ──
  lensAccepts: string[]; // lens IDs this component can receive via drop
  lensIncludes: string[]; // lens IDs this component embeds/renders in its UI
  lensDropZoneId?: string; // the drop zone ID if lens-aware
  targetComponents?: string[]; // (for lens notes) component IDs this lens can analyze

  agents: {
    id: string;
    role: string;
    permissions: ('read' | 'write' | 'execute' | 'analyze')[];
  }[];

  // ── Data Contract ──
  dataProvides: string[];
  dataConsumes: string[];
  stateKeys?: string[];

  // ── Capabilities ──
  capabilities: string[];
  specialties: SpecialtyType[];

  // ── Metadata ──
  author: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}