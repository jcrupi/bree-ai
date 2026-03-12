import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { sampleIssues, sampleUsers } from './data'
import type { Issue, CreateIssueInput, UpdateIssueInput, Comment } from './types'

// In-memory storage (replace with database in production)
let issues: Issue[] = [...sampleIssues]

const app = new Elysia()
  .use(cors())
  .get('/', () => ({
    message: 'FatBoard API - BREE Stack',
    version: '0.1.0',
    stack: {
      runtime: 'Bun',
      framework: 'Elysia',
      client: 'Eden'
    }
  }))

  // List all issues
  .get('/api/issues', () => ({
    issues,
    count: issues.length
  }))

  // Get single issue
  .get('/api/issues/:id', ({ params: { id } }) => {
    const issue = issues.find(i => i.id === id)
    if (!issue) {
      throw new Error(`Issue ${id} not found`)
    }
    return issue
  })

  // Create issue
  .post('/api/issues', ({ body }) => {
    const newIssue: Issue = {
      id: `issue-${Date.now()}`,
      title: body.title,
      description: body.description,
      status: body.status || 'backlog',
      assignee: body.assigneeId
        ? sampleUsers.find(u => u.id === body.assigneeId)
        : undefined,
      priority: body.priority || 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      labels: body.labels || [],
      comments: []
    }

    issues.push(newIssue)
    return newIssue
  }, {
    body: t.Object({
      title: t.String(),
      description: t.String(),
      status: t.Optional(t.String()),
      assigneeId: t.Optional(t.String()),
      priority: t.Optional(t.String()),
      labels: t.Optional(t.Array(t.String()))
    })
  })

  // Update issue
  .patch('/api/issues/:id', ({ params: { id }, body }) => {
    const issueIndex = issues.findIndex(i => i.id === id)
    if (issueIndex === -1) {
      throw new Error(`Issue ${id} not found`)
    }

    const issue = issues[issueIndex]
    issues[issueIndex] = {
      ...issue,
      ...body,
      assignee: body.assigneeId
        ? sampleUsers.find(u => u.id === body.assigneeId)
        : issue.assignee,
      updatedAt: new Date()
    }

    return issues[issueIndex]
  }, {
    body: t.Partial(t.Object({
      title: t.String(),
      description: t.String(),
      status: t.String(),
      assigneeId: t.String(),
      priority: t.String(),
      labels: t.Array(t.String())
    }))
  })

  // Delete issue
  .delete('/api/issues/:id', ({ params: { id } }) => {
    const issueIndex = issues.findIndex(i => i.id === id)
    if (issueIndex === -1) {
      throw new Error(`Issue ${id} not found`)
    }

    issues.splice(issueIndex, 1)
    return { success: true, id }
  })

  // Add comment
  .post('/api/issues/:id/comments', ({ params: { id }, body }) => {
    const issue = issues.find(i => i.id === id)
    if (!issue) {
      throw new Error(`Issue ${id} not found`)
    }

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      author: sampleUsers[0], // Default user in demo
      content: body.content,
      createdAt: new Date()
    }

    issue.comments.push(comment)
    return comment
  }, {
    body: t.Object({
      content: t.String()
    })
  })

  // Get users
  .get('/api/users', () => ({
    users: sampleUsers
  }))

  .listen(8001)

console.log(`
🚀 FatBoard API running on http://localhost:${app.server?.port}

Stack:
  Runtime: Bun ${Bun.version}
  Framework: Elysia
  Client: Eden Treaty

Try it:
  curl http://localhost:8001/api/issues
`)

export type App = typeof app
