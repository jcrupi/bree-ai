/**
 * Agent Types and Capabilities
 */
export type AgentType = 
  | "database" 
  | "knowledge-base" 
  | "domain-modeling" 
  | "code-analysis"
  | "governance"
  | "snippet-manager";

export type AgentStatus = "UP" | "DOWN" | "STARTING" | "ERROR";

export interface AgentCapability {
  name: string;
  version?: string;
}

export interface AgentMetadata {
  status: AgentStatus;
  type: AgentType;
  capabilities?: string[];
  [key: string]: any;
}

/**
 * Manifest and Endpoints
 */
export interface AgentEndpoint {
  path: string;
  method: string;
  action: string;
  description?: string;
  isMultipart?: boolean;
}

export interface AgentManifest {
  httpRoot?: string;
  natsPrefix: string;
  endpoints: AgentEndpoint[];
}

/**
 * Lifecycle Events
 */
export interface LifecycleEvent {
  status: AgentStatus;
  type: AgentType;
  timestamp?: string;
  manifest?: AgentManifest;
  [key: string]: any;
}

/**
 * Request/Response Types
 */
export interface AgentRequest<T = any> {
  requestId?: string;
  timestamp?: string;
  payload: T;
}

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
  timestamp?: string;
}

/**
 * Database Agent Types
 */
export interface DatabaseGetRequest {
  path: string;
}

export interface DatabaseListRequest {
  dir: string;
}

export interface DatabaseSetRequest {
  path: string;
  frontMatter?: Record<string, any>;
  content?: string;
}

export interface DatabaseQueryRequest {
  options?: Record<string, any>;
}

export interface DatabaseEntry {
  id: string;
  path: string;
  frontMatter: Record<string, any>;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Knowledge Base Agent Types
 */
export interface KnowledgeSearchRequest {
  query: string;
  topK?: number;
  collection?: string;
}

export interface KnowledgeSearchResult {
  id: string;
  text: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface KnowledgeCollectionsRequest {}

export interface KnowledgeCollection {
  id: string;
  name: string;
  description?: string;
}

/**
 * Domain Modeling Agent Types
 */
export interface DomainListRequest {
  workspace?: string;
}

export interface DomainViewRequest {
  path: string;
}

export interface DomainEntry {
  name: string;
  path: string;
  type?: string;
}

/**
 * Subject Patterns
 */
export const SUBJECTS = {
  // Lifecycle
  LIFECYCLE: (agentId: string) => `agent.lifecycle.${agentId}`,
  DISCOVERY: "agent.discovery",
  
  // Database Agent
  DATABASE_GET: "agent.antimatter-db.get",
  DATABASE_LIST: "agent.antimatter-db.list",
  DATABASE_SET: "agent.antimatter-db.set",
  DATABASE_QUERY: "agent.antimatter-db.query",
  
  // Knowledge Agent
  KNOWLEDGE_SEARCH: "agent.ragster.search",
  KNOWLEDGE_COLLECTIONS: "agent.ragster.collections",
  
  // Domain Modeling Agent
  DOMAIN_LIST: "agent.voodo.list",
  DOMAIN_VIEW: "agent.voodo.view",
  
  // Logs
  LOGS: (agentId: string) => `logs.agent.${agentId}`,
  
  // Collective
  COLLECTIVE_CHAT_LOG: "collective.chat.log",

  // Tasks (JetStream Pull)
  TASKS: "agent.tasks",
} as const;

/**
 * JetStream Stream Names
 */
export const STREAMS = {
  LOGS: "LOGS",
  EVENTS: "EVENTS",
  TASKS: "TASKS"
} as const;


