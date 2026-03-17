// Core types for LeanBoard

export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'done'

export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent'

export type ProviderType = 'linear' | 'jira' | 'clickup' | 'github' | 'demo'

export interface User {
  id: string
  name: string
  email?: string
  avatar?: string
}

export interface Comment {
  id: string
  author: User
  content: string
  createdAt: Date
}

export interface Issue {
  id: string
  title: string
  description: string
  status: IssueStatus
  assignee?: User
  priority?: IssuePriority
  createdAt: Date
  updatedAt: Date
  comments: Comment[]
  labels: string[]

  // Provider-specific raw data
  _raw?: any
}

export interface IssueFilters {
  statuses?: IssueStatus[]
  assignee?: string
  priority?: IssuePriority
  labels?: string[]
  search?: string
}

export interface CreateIssueInput {
  title: string
  description: string
  status?: IssueStatus
  assigneeId?: string
  priority?: IssuePriority
  labels?: string[]
}

export interface UpdateIssueInput {
  title?: string
  description?: string
  status?: IssueStatus
  assigneeId?: string
  priority?: IssuePriority
  labels?: string[]
}

// Provider interface
export interface IssueProvider {
  name: ProviderType
  authenticate(apiKey: string): Promise<boolean>
  listIssues(filters?: IssueFilters): Promise<Issue[]>
  getIssue(id: string): Promise<Issue>
  createIssue(data: CreateIssueInput): Promise<Issue>
  updateIssue(id: string, data: UpdateIssueInput): Promise<Issue>
  addComment(issueId: string, comment: string): Promise<Comment>
  disconnect(): void
}

// Provider config stored in localStorage
export interface ProviderConfig {
  type: ProviderType
  apiKey?: string
  domain?: string // For Jira
  workspaceId?: string // For ClickUp
  isConnected: boolean
}
