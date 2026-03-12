import type { User, Issue } from './types'

export const sampleUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', avatar: '👨‍💻' },
  { id: '2', name: 'Sarah Smith', email: 'sarah@example.com', avatar: '👩‍💻' },
  { id: '3', name: 'Mike Chen', email: 'mike@example.com', avatar: '👨‍💼' },
]

export const sampleIssues: Issue[] = [
  {
    id: 'demo-1',
    title: 'Fix login bug with Google OAuth',
    description: 'Users are getting 403 errors when trying to authenticate with Google. Might be a CORS issue.',
    status: 'in_progress',
    assignee: sampleUsers[0],
    priority: 'high',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-08'),
    labels: ['bug', 'auth', 'urgent'],
    comments: [
      {
        id: 'c1',
        author: sampleUsers[1],
        content: 'I checked the backend logs - definitely a CORS issue',
        createdAt: new Date('2024-03-07')
      },
      {
        id: 'c2',
        author: sampleUsers[0],
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
    assignee: sampleUsers[2],
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
    assignee: sampleUsers[1],
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
    assignee: sampleUsers[2],
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
    assignee: sampleUsers[1],
    priority: 'high',
    createdAt: new Date('2024-02-28'),
    updatedAt: new Date('2024-03-01'),
    labels: ['bug', 'mobile'],
    comments: []
  },
  {
    id: 'demo-8',
    title: 'Migrate to BREE stack',
    description: 'Move from Next.js to Bun + React + Elysia + Eden for better performance',
    status: 'done',
    assignee: sampleUsers[0],
    priority: 'high',
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-03-09'),
    labels: ['tech-debt', 'performance'],
    comments: []
  },
]
