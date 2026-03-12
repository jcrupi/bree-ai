export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'done'

export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent'

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
