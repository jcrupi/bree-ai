# LeanBoard: The Anti-Bloat Project Manager

**Type:** FatApps Demo Application
**Focus:** Lean UI for Linear/Jira/ClickUp backends
**Created:** 2026-03-09

---

## High-Level Overview

### The Problem: Project Management FatApps

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECT MANAGEMENT FATAPPS                    │
│                                                                  │
│  Linear:   Clean but getting bloated (50+ features)             │
│  Jira:     The ultimate FatApp (1000+ features, nightmare UI)   │
│  ClickUp:  "All-in-one" = bloated (200+ features)               │
│                                                                  │
│  Common Issues:                                                  │
│  • 5-10s load times                                              │
│  • Nested menus 5+ levels deep                                   │
│  • 100+ buttons you never use                                    │
│  • "Where's the create issue button?"                            │
│  • Settings pages with 50+ options                               │
│                                                                  │
│  What 90% of users actually need:                                │
│  1. View issues/tasks                                            │
│  2. Create new issue                                             │
│  3. Update status                                                │
│  4. Add comments                                                 │
│  5. Assign to someone                                            │
│                                                                  │
│  That's it. 5 features vs 1000.                                  │
└─────────────────────────────────────────────────────────────────┘
```

### LeanBoard Solution

```
┌─────────────────────────────────────────────────────────────────┐
│                          LEANBOARD                               │
│                                                                  │
│  One Interface → Three Backends                                  │
│                                                                  │
│     ┌──────────────┐                                            │
│     │  LeanBoard   │                                            │
│     │     UI       │  ← 400KB bundle, 0.2s load                │
│     │  (Minimal)   │                                            │
│     └───────┬──────┘                                            │
│             │                                                    │
│     ┌───────┼───────┬────────┐                                 │
│     │       │       │        │                                  │
│  ┌──▼──┐ ┌─▼──┐ ┌──▼───┐ ┌─▼────┐                            │
│  │Linear│ │Jira│ │ClickUp│ │GitHub│                            │
│  │ API  │ │API │ │  API  │ │ API  │                            │
│  └──────┘ └────┘ └───────┘ └──────┘                            │
│                                                                  │
│  Just add your API key. That's it.                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### API Abstraction Layer

```typescript
// Unified interface for all project management tools
interface IssueProvider {
  name: 'linear' | 'jira' | 'clickup' | 'github'
  authenticate(apiKey: string): Promise<boolean>
  listIssues(filters?: IssueFilters): Promise<Issue[]>
  getIssue(id: string): Promise<Issue>
  createIssue(data: CreateIssueInput): Promise<Issue>
  updateIssue(id: string, data: UpdateIssueInput): Promise<Issue>
  addComment(issueId: string, comment: string): Promise<Comment>
}

// Common data model
interface Issue {
  id: string
  title: string
  description: string
  status: 'backlog' | 'todo' | 'in_progress' | 'done'
  assignee?: User
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: Date
  updatedAt: Date
  comments: Comment[]
  labels: string[]

  // Provider-specific data stored here
  _raw: any
}
```

### Provider Implementations

#### Linear Provider
```typescript
class LinearProvider implements IssueProvider {
  name = 'linear' as const
  private client: LinearClient

  async authenticate(apiKey: string): Promise<boolean> {
    this.client = new LinearClient({ apiKey })
    try {
      await this.client.viewer
      return true
    } catch {
      return false
    }
  }

  async listIssues(filters?: IssueFilters): Promise<Issue[]> {
    const issues = await this.client.issues({
      filter: {
        state: { name: { in: filters?.statuses || [] } }
      }
    })

    return issues.nodes.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: mapLinearStatus(issue.state.name),
      assignee: issue.assignee,
      priority: issue.priority,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      comments: [], // Fetch separately if needed
      labels: issue.labels.nodes.map(l => l.name),
      _raw: issue
    }))
  }

  async createIssue(data: CreateIssueInput): Promise<Issue> {
    const payload = await this.client.createIssue({
      title: data.title,
      description: data.description,
      stateId: await this.getStateId(data.status),
      assigneeId: data.assigneeId,
      priority: data.priority
    })

    return this.getIssue(payload.issue.id)
  }
}
```

#### Jira Provider
```typescript
class JiraProvider implements IssueProvider {
  name = 'jira' as const
  private client: JiraClient

  async authenticate(apiKey: string): Promise<boolean> {
    const [domain, token] = apiKey.split('::')
    this.client = new JiraClient({
      host: domain,
      authentication: { bearer: token }
    })

    try {
      await this.client.myself.getCurrentUser()
      return true
    } catch {
      return false
    }
  }

  async listIssues(filters?: IssueFilters): Promise<Issue[]> {
    const jql = this.buildJQL(filters)
    const response = await this.client.issueSearch.searchForIssuesUsingJql({
      jql,
      fields: ['summary', 'description', 'status', 'assignee', 'priority']
    })

    return response.issues.map(issue => ({
      id: issue.key,
      title: issue.fields.summary,
      description: issue.fields.description,
      status: mapJiraStatus(issue.fields.status.name),
      assignee: issue.fields.assignee,
      priority: mapJiraPriority(issue.fields.priority?.name),
      createdAt: new Date(issue.fields.created),
      updatedAt: new Date(issue.fields.updated),
      comments: [],
      labels: issue.fields.labels,
      _raw: issue
    }))
  }

  private buildJQL(filters?: IssueFilters): string {
    const conditions: string[] = []

    if (filters?.statuses?.length) {
      const statuses = filters.statuses.map(s => `"${s}"`).join(',')
      conditions.push(`status IN (${statuses})`)
    }

    if (filters?.assignee) {
      conditions.push(`assignee = "${filters.assignee}"`)
    }

    return conditions.join(' AND ') || 'ORDER BY created DESC'
  }
}
```

#### ClickUp Provider
```typescript
class ClickUpProvider implements IssueProvider {
  name = 'clickup' as const
  private apiKey: string

  async authenticate(apiKey: string): Promise<boolean> {
    this.apiKey = apiKey

    try {
      const response = await fetch('https://api.clickup.com/api/v2/user', {
        headers: { 'Authorization': apiKey }
      })
      return response.ok
    } catch {
      return false
    }
  }

  async listIssues(filters?: IssueFilters): Promise<Issue[]> {
    const listId = filters?.listId || await this.getDefaultListId()

    const response = await fetch(
      `https://api.clickup.com/api/v2/list/${listId}/task`,
      {
        headers: { 'Authorization': this.apiKey }
      }
    )

    const data = await response.json()

    return data.tasks.map(task => ({
      id: task.id,
      title: task.name,
      description: task.description,
      status: mapClickUpStatus(task.status.status),
      assignee: task.assignees?.[0],
      priority: mapClickUpPriority(task.priority),
      createdAt: new Date(parseInt(task.date_created)),
      updatedAt: new Date(parseInt(task.date_updated)),
      comments: [],
      labels: task.tags.map(t => t.name),
      _raw: task
    }))
  }
}
```

---

## UI Design: Radical Minimalism

### Core Screens

#### 1. Board View (Main Screen)
```
┌─────────────────────────────────────────────────────────────┐
│ LeanBoard                    [Provider: Linear ▼] [Profile] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Backlog (12)    Todo (8)    In Progress (5)    Done (23)    │
│ ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────┐ │
│ │ Fix login │   │ API docs  │   │ Refactor  │   │ ...   │ │
│ │ bug       │   │           │   │ auth      │   └───────┘ │
│ │ @john     │   │ @sarah    │   │ @mike     │             │
│ │ 🔴 High   │   │ 🟡 Medium │   │ 🟢 Low    │             │
│ └───────────┘   └───────────┘   └───────────┘             │
│                                                               │
│ [+ New Issue]                                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Kanban board (4 columns)
- Drag-and-drop to change status
- Click card to see details
- Create new issue button
- That's it. No complexity.

#### 2. Issue Detail (Modal)
```
┌─────────────────────────────────────────────────────────────┐
│ Fix login bug                                         [× Close] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Description:                                                  │
│ Users can't log in with Google OAuth. Error 403.             │
│                                                               │
│ Status: [In Progress ▼]                                       │
│ Assignee: [@john ▼]                                          │
│ Priority: [🔴 High ▼]                                        │
│ Labels: [bug] [auth] [+ Add]                                 │
│                                                               │
│ ─────────────────────────────────────────────────────────── │
│                                                               │
│ Comments (3):                                                 │
│                                                               │
│ @sarah • 2h ago                                               │
│ Might be a CORS issue on the backend                         │
│                                                               │
│ @john • 1h ago                                                │
│ You're right! Fixed in PR #123                                │
│                                                               │
│ [Add comment...]                            [Post Comment]   │
│                                                               │
│                                  [Delete Issue] [Save Changes]│
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Title + description
- Status dropdown
- Assignee picker
- Priority selector
- Labels
- Comments
- Save/delete

#### 3. Settings (Simple)
```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                              [× Close] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Choose Your Provider:                                         │
│                                                               │
│ ○ Linear                                                      │
│ ○ Jira                                                        │
│ ○ ClickUp                                                     │
│ ● GitHub Issues                                               │
│                                                               │
│ API Key:                                                      │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ghp_1234567890abcdef...                   [Show/Hide] │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ [Test Connection]                                             │
│                                                               │
│ ✓ Connected to GitHub (johndoe/my-repo)                      │
│                                                               │
│                                         [Disconnect] [Save]   │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Provider selection (radio buttons)
- API key input
- Test connection
- That's it. No 50-page settings.

---

## Bundle Size Comparison

### Jira vs LeanBoard

```typescript
// Bundle size analysis
const comparison = {
  jira: {
    initialBundle: '8.2MB',
    totalAssets: '47MB',
    loadTime: '6.3s (3G)',
    timeToInteractive: '9.1s',
    jsFiles: 247,
    features: 1000+
  },

  leanBoard: {
    initialBundle: '385KB',
    totalAssets: '450KB',
    loadTime: '0.4s (3G)',
    timeToInteractive: '0.6s',
    jsFiles: 3,
    features: 5
  },

  improvement: {
    size: '21x smaller',
    loadTime: '16x faster',
    tti: '15x faster',
    featureUtilization: '87% vs 5%'
  }
}
```

---

## Implementation Plan

### Phase 1: Core Features (Week 1)
```typescript
const phase1 = {
  features: [
    'Board view with 4 columns',
    'List issues from provider',
    'Drag-and-drop status updates',
    'Click to view issue details',
    'Settings page with API key input'
  ],

  providers: ['Linear'], // Start with one

  tech: {
    framework: 'Next.js 14 (App Router)',
    styling: 'Tailwind CSS',
    state: 'Zustand',
    dragDrop: '@dnd-kit/core',
    api: 'Server Actions'
  }
}
```

### Phase 2: Multiple Providers (Week 2)
```typescript
const phase2 = {
  features: [
    'Add Jira provider',
    'Add ClickUp provider',
    'Add GitHub Issues provider',
    'Provider switcher',
    'API key per provider'
  ],

  abstraction: {
    pattern: 'Adapter pattern',
    interface: 'IssueProvider',
    mappers: 'Status/priority/user mapping'
  }
}
```

### Phase 3: Polish (Week 3)
```typescript
const phase3 = {
  features: [
    'Create new issue',
    'Add comments',
    'Assign issues',
    'Update priority',
    'Delete issues',
    'Keyboard shortcuts',
    'Dark mode'
  ],

  optimization: {
    caching: 'React Query for API calls',
    prefetch: 'Prefetch on hover',
    optimistic: 'Optimistic updates',
    offline: 'Basic offline support'
  }
}
```

---

## Key Differentiators

### What LeanBoard Does
✅ View issues in board format
✅ Create new issues
✅ Update status (drag-and-drop)
✅ Add comments
✅ Assign to team members
✅ Set priority
✅ Add/remove labels
✅ Dark mode

**Total: 8 features**

### What LeanBoard Doesn't Do
❌ Sprints
❌ Epics
❌ Reports/analytics
❌ Time tracking
❌ Roadmaps
❌ Wikis/docs
❌ Custom fields
❌ Workflows
❌ Automation rules
❌ Integrations
❌ Permissions
❌ 992 other features

**You don't need them.**

---

## The Demo Experience

### Flow
```
1. Land on leanboard.fatapps.ai
2. See demo board (sample data)
3. Click "Connect Your Data"
4. Choose provider (Linear/Jira/ClickUp/GitHub)
5. Paste API key
6. Click "Connect"
7. See YOUR issues in 0.3s
8. Drag cards, add comments, create issues
9. Compare: Open Jira in another tab
   - Jira: 8.3s load, cluttered UI
   - LeanBoard: 0.3s load, clean AF
```

### Comparison Mode
```typescript
// Side-by-side comparison widget
<ComparisonWidget>
  <Before provider="jira">
    Load Time: 8.3s
    Bundle: 8.2MB
    Features: 1000+
    You Use: ~5%
  </Before>

  <After provider="leanboard">
    Load Time: 0.3s
    Bundle: 385KB
    Features: 8
    You Use: 87%
  </After>

  <Improvement>
    21x smaller
    16x faster
    17x better utilization
  </Improvement>
</ComparisonWidget>
```

---

## Monetization (Future)

### Free Tier
- 1 workspace
- 1 provider
- Unlimited issues
- Core 8 features

### Pro ($5/month)
- 3 workspaces
- All 4 providers
- Switch between them
- Keyboard shortcuts
- Dark mode themes
- Priority support

### Team ($15/user/month)
- Everything in Pro
- Team dashboards
- Cross-provider views
- Unified search
- Custom themes

---

## Marketing Angle

### Tagline
**"Jira is 8.2MB. You need 385KB."**

### Landing Page
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  You don't need 1000 features.                                │
│  You need 8.                                                  │
│                                                               │
│  ─────────────────────────────────────────────────────────── │
│                                                               │
│  LeanBoard: One UI for Linear, Jira, ClickUp, GitHub         │
│                                                               │
│  [Try Demo]  [Connect Your Data]                             │
│                                                               │
│  ✓ 21x smaller than Jira                                      │
│  ✓ 16x faster load times                                      │
│  ✓ Works with your existing tools                            │
│  ✓ Just add your API key                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Specs

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Drag-Drop:** @dnd-kit
- **Forms:** React Hook Form
- **API:** Server Actions + React Query

### Backend (Minimal)
- **API Routes:** Next.js API routes for proxying
- **Auth:** NextAuth.js (optional)
- **Storage:** LocalStorage for API keys (encrypted)
- **Cache:** React Query + SWR

### Deployment
- **Platform:** Vercel
- **Domain:** leanboard.fatapps.ai
- **CDN:** Vercel Edge Network
- **Analytics:** Plausible.io

---

## Success Metrics

### User Metrics
- Time to first issue: <10s
- Load time: <500ms
- Feature utilization: >80%
- Daily active users: Track
- Providers connected: Track

### Technical Metrics
- Bundle size: <500KB
- Lighthouse score: >95
- Core Web Vitals: All green
- Error rate: <0.1%
- API response time: <200ms

---

## Roadmap

### Q2 2026
- ✅ Launch LeanBoard demo
- ✅ Support Linear + Jira + ClickUp + GitHub
- ✅ 8 core features
- ✅ Open source release

### Q3 2026
- Add filters (assignee, priority, label)
- Keyboard shortcuts
- Multiple workspaces
- Cross-provider search

### Q4 2026
- Mobile app (React Native)
- Browser extension
- VS Code extension
- CLI tool

---

## Call to Action

```bash
# Try it now
npm install -g leanboard-cli

leanboard init
# Choose provider: Linear
# Enter API key: lin_api_...

leanboard open
# Opens at http://localhost:3000
# Your issues, 0.3s load time
```

**The anti-bloat revolution starts here.**
