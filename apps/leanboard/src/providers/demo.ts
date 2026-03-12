// Demo provider with sample data for testing

import type {
  Issue,
  IssueProvider,
  IssueFilters,
  CreateIssueInput,
  UpdateIssueInput,
  Comment,
  User
} from '@/types'

// Sample users
const users: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', avatar: '👨‍💻' },
  { id: '2', name: 'Sarah Smith', email: 'sarah@example.com', avatar: '👩‍💻' },
  { id: '3', name: 'Mike Chen', email: 'mike@example.com', avatar: '👨‍💼' },
]

// Sample issues
const sampleIssues: Issue[] = [
  {
    id: 'demo-1',
    title: 'Fix login bug with Google OAuth',
    description: 'Users are getting 403 errors when trying to authenticate with Google. Might be a CORS issue.',
    status: 'in_progress',
    assignee: users[0],
    priority: 'high',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-08'),
    labels: ['bug', 'auth', 'urgent'],
    comments: [
      {
        id: 'c1',
        author: users[1],
        content: 'I checked the backend logs - definitely a CORS issue',
        createdAt: new Date('2024-03-07')
      },
      {
        id: 'c2',
        author: users[0],
        content: 'Working on a fix in PR #123',
        createdAt: new Date('2024-03-08')
      }
    ]
  },
  {
    id: 'demo-2',
    title: 'Add dark mode support',
    description: 'Implement dark mode theme throughout the application',
    status: 'todo',
    assignee: users[2],
    priority: 'medium',
    createdAt: new Date('2024-03-02'),
    updatedAt: new Date('2024-03-02'),
    labels: ['feature', 'ui'],
    comments: []
  },
  {
    id: 'demo-3',
    title: 'Optimize database queries',
    description: 'Some queries are taking >1s. Need to add indexes and optimize.',
    status: 'backlog',
    priority: 'medium',
    createdAt: new Date('2024-03-03'),
    updatedAt: new Date('2024-03-03'),
    labels: ['performance', 'backend'],
    comments: []
  },
  {
    id: 'demo-4',
    title: 'Write API documentation',
    description: 'Document all REST endpoints with examples',
    status: 'todo',
    assignee: users[1],
    priority: 'low',
    createdAt: new Date('2024-03-04'),
    updatedAt: new Date('2024-03-04'),
    labels: ['docs'],
    comments: []
  },
  {
    id: 'demo-5',
    title: 'Implement export feature',
    description: 'Users should be able to export data as CSV or JSON',
    status: 'backlog',
    priority: 'low',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
    labels: ['feature'],
    comments: []
  },
  {
    id: 'demo-6',
    title: 'Add keyboard shortcuts',
    description: 'Implement common keyboard shortcuts for power users',
    status: 'in_progress',
    assignee: users[2],
    priority: 'medium',
    createdAt: new Date('2024-03-06'),
    updatedAt: new Date('2024-03-09'),
    labels: ['feature', 'ux'],
    comments: []
  },
  {
    id: 'demo-7',
    title: 'Fix mobile responsive issues',
    description: 'Board view breaks on mobile screens <768px',
    status: 'done',
    assignee: users[1],
    priority: 'high',
    createdAt: new Date('2024-02-28'),
    updatedAt: new Date('2024-03-01'),
    labels: ['bug', 'mobile'],
    comments: []
  },
  {
    id: 'demo-8',
    title: 'Upgrade to Next.js 14',
    description: 'Migrate from Next.js 13 to 14 for improved performance',
    status: 'done',
    assignee: users[0],
    priority: 'medium',
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-02-27'),
    labels: ['tech-debt', 'performance'],
    comments: []
  },
]

export class DemoProvider implements IssueProvider {
  name = 'demo' as const
  private issues: Issue[] = [...sampleIssues]

  async authenticate(apiKey: string): Promise<boolean> {
    // Demo mode always authenticates
    return true
  }

  async listIssues(filters?: IssueFilters): Promise<Issue[]> {
    // Simulate network delay
    await this.delay(300)

    let filtered = [...this.issues]

    if (filters?.statuses?.length) {
      filtered = filtered.filter(issue => filters.statuses!.includes(issue.status))
    }

    if (filters?.assignee) {
      filtered = filtered.filter(issue => issue.assignee?.id === filters.assignee)
    }

    if (filters?.priority) {
      filtered = filtered.filter(issue => issue.priority === filters.priority)
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(search) ||
        issue.description.toLowerCase().includes(search)
      )
    }

    return filtered
  }

  async getIssue(id: string): Promise<Issue> {
    await this.delay(200)

    const issue = this.issues.find(i => i.id === id)
    if (!issue) throw new Error(`Issue ${id} not found`)

    return issue
  }

  async createIssue(data: CreateIssueInput): Promise<Issue> {
    await this.delay(400)

    const newIssue: Issue = {
      id: `demo-${Date.now()}`,
      title: data.title,
      description: data.description,
      status: data.status || 'backlog',
      assignee: data.assigneeId ? users.find(u => u.id === data.assigneeId) : undefined,
      priority: data.priority || 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      labels: data.labels || [],
      comments: []
    }

    this.issues.push(newIssue)
    return newIssue
  }

  async updateIssue(id: string, data: UpdateIssueInput): Promise<Issue> {
    await this.delay(300)

    const issueIndex = this.issues.findIndex(i => i.id === id)
    if (issueIndex === -1) throw new Error(`Issue ${id} not found`)

    const issue = this.issues[issueIndex]

    this.issues[issueIndex] = {
      ...issue,
      ...data,
      assignee: data.assigneeId ? users.find(u => u.id === data.assigneeId) : issue.assignee,
      updatedAt: new Date()
    }

    return this.issues[issueIndex]
  }

  async addComment(issueId: string, content: string): Promise<Comment> {
    await this.delay(300)

    const issue = this.issues.find(i => i.id === issueId)
    if (!issue) throw new Error(`Issue ${issueId} not found`)

    const comment: Comment = {
      id: `c-${Date.now()}`,
      author: users[0], // Default to first user in demo
      content,
      createdAt: new Date()
    }

    issue.comments.push(comment)
    return comment
  }

  disconnect(): void {
    // Nothing to disconnect in demo mode
  }

  // Utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get available users for assignee dropdown
  getUsers(): User[] {
    return users
  }
}
