/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  AgentX Component Notes Registry                        ║
 * ║                                                         ║
 * ║  Every entity in the Bree system has a "note":          ║
 * ║  - TSX pages & components                               ║
 * ║  - AI Lenses                                            ║
 * ║  - Hooks & providers                                    ║
 * ║  - API clients                                          ║
 * ║                                                         ║
 * ║  Notes define bidirectional relationships:               ║
 * ║  - Component.lensAccepts → which lenses it receives     ║
 * ║  - Component.lensIncludes → which lenses it renders     ║
 * ║  - Lens.targetComponents → which components it targets  ║
 * ║                                                         ║
 * ║  NATS subject convention:                               ║
 * ║    bree.<type>.<name>.<action>                          ║
 * ║    bree.lens.<lens-id>.<action>                         ║
 * ╚══════════════════════════════════════════════════════════╝
 */

import { AgentXNote } from '../types';

export const AGENTX_NOTES: AgentXNote[] = [
// ═══════════════════════════════════════════════════════════
// AI LENSES
// ═══════════════════════════════════════════════════════════

{
  id: 'bree.lens.urgent',
  component: 'data/aiLenses.ts#urgent-lens',
  title: 'Urgent Lens',
  description:
  'Scans all Vines, tasks, and grapes for anything urgent that needs immediate attention. Detects blockers, escalations, missed deadlines, and time-sensitive requests. Prioritizes by severity.',
  type: 'lens',
  version: '1.2.0',
  natsSubject: 'bree.lens.urgent',
  bindings: [
  {
    subject: 'bree.lens.urgent.analyze',
    verb: 'request',
    description: 'Receives analysis request with target context data'
  },
  {
    subject: 'bree.lens.urgent.result',
    verb: 'reply',
    description: 'Returns urgency scan with severity-ranked items'
  },
  {
    subject: 'bree.lens.urgent.alert',
    verb: 'publish',
    description: 'Broadcasts critical urgency alerts to all subscribers'
  },
  {
    subject: 'bree.agentx.analyze',
    verb: 'request',
    description:
    'Routes through AgentX Collective for orchestrated analysis'
  }],

  lensAccepts: [],
  lensIncludes: [],
  targetComponents: [
  'bree.pages.project-board',
  'bree.pages.dashboard',
  'bree.pages.team',
  'bree.pages.vines',
  'bree.pages.task-board',
  'bree.components.task-list',
  'bree.components.vines-panel',
  'bree.components.vines-sidebar-section'],

  agents: [
  {
    id: 'ai2',
    role: 'Urgency scoring and triage',
    permissions: ['read', 'analyze']
  },
  {
    id: 'ai3',
    role: 'Escalation detection in security context',
    permissions: ['read', 'analyze']
  }],

  dataProvides: [
  'urgencyReport',
  'severityRanking',
  'actionItems',
  'blockerList'],

  dataConsumes: ['Task[]', 'VineConversation[]', 'Grape[]', 'Project'],
  stateKeys: [],
  capabilities: [
  'blocker-detection',
  'deadline-scanning',
  'escalation-flagging',
  'severity-ranking',
  'action-item-generation'],

  specialties: ['governance', 'messaging'],
  author: 'bree-core',
  createdAt: '2024-01-15',
  updatedAt: '2024-02-06',
  tags: ['lens', 'urgency', 'triage', 'real-time', 'alerts']
},

{
  id: 'bree.lens.risk-scanner',
  component: 'data/aiLenses.ts#risk-scanner',
  title: 'Risk Scanner',
  description:
  'Identifies potential bottlenecks, delays, stale branches, and high-risk items across tasks, conversations, and code. Generates risk heatmaps and mitigation recommendations.',
  type: 'lens',
  version: '1.3.0',
  natsSubject: 'bree.lens.risk-scanner',
  bindings: [
  {
    subject: 'bree.lens.risk-scanner.analyze',
    verb: 'request',
    description: 'Receives analysis request with project data'
  },
  {
    subject: 'bree.lens.risk-scanner.result',
    verb: 'reply',
    description: 'Returns risk assessment with heatmap data'
  },
  {
    subject: 'bree.lens.risk-scanner.alert',
    verb: 'publish',
    description: 'Broadcasts high-risk alerts'
  }],

  lensAccepts: [],
  lensIncludes: [],
  targetComponents: [
  'bree.pages.project-board',
  'bree.pages.dashboard',
  'bree.pages.team',
  'bree.pages.vines',
  'bree.pages.task-board',
  'bree.pages.architecture',
  'bree.components.task-list',
  'bree.components.projects-view',
  'bree.components.vines-visual'],

  agents: [
  {
    id: 'ai2',
    role: 'Bottleneck detection and dependency analysis',
    permissions: ['read', 'analyze']
  },
  {
    id: 'ai3',
    role: 'Security risk assessment',
    permissions: ['read', 'analyze']
  }],

  dataProvides: [
  'riskHeatmap',
  'bottleneckList',
  'mitigationPlan',
  'riskScore'],

  dataConsumes: [
  'Task[]',
  'VineConversation[]',
  'Grape[]',
  'Project',
  'GitBranch[]'],

  stateKeys: [],
  capabilities: [
  'risk-heatmap',
  'bottleneck-detection',
  'stale-detection',
  'dependency-analysis',
  'mitigation-recommendations'],

  specialties: ['governance', 'backend', 'devops'],
  author: 'bree-core',
  createdAt: '2024-01-15',
  updatedAt: '2024-02-06',
  tags: ['lens', 'risk', 'heatmap', 'bottleneck', 'analysis']
},

{
  id: 'bree.lens.progress-analyst',
  component: 'data/aiLenses.ts#progress-analyst',
  title: 'Progress Analyst',
  description:
  'Summarizes completion rates, velocity trends, and forecasts delivery timelines. Generates progress charts with area-by-area breakdowns and AI-powered insights.',
  type: 'lens',
  version: '1.4.0',
  natsSubject: 'bree.lens.progress-analyst',
  bindings: [
  {
    subject: 'bree.lens.progress-analyst.analyze',
    verb: 'request',
    description: 'Receives analysis request with task/project data'
  },
  {
    subject: 'bree.lens.progress-analyst.result',
    verb: 'reply',
    description: 'Returns velocity report with charts data'
  },
  {
    subject: 'bree.lens.progress-analyst.forecast',
    verb: 'publish',
    description: 'Broadcasts updated delivery forecasts'
  }],

  lensAccepts: [],
  lensIncludes: [],
  targetComponents: [
  'bree.pages.project-board',
  'bree.pages.dashboard',
  'bree.pages.team',
  'bree.pages.task-board',
  'bree.components.task-list',
  'bree.components.projects-view',
  'bree.components.sidebar',
  'bree.components.tasks-sidebar-section',
  'bree.components.team-member-card',
  'bree.hooks.use-agent-tasks'],

  agents: [
  {
    id: 'ai2',
    role: 'Velocity calculation and trend analysis',
    permissions: ['read', 'analyze']
  }],

  dataProvides: [
  'velocityReport',
  'completionForecast',
  'areaBreakdown',
  'trendCharts'],

  dataConsumes: ['Task[]', 'VineConversation[]', 'Project'],
  stateKeys: [],
  capabilities: [
  'velocity-tracking',
  'completion-forecasting',
  'area-breakdown',
  'trend-visualization',
  'ai-insights'],

  specialties: ['governance', 'ui'],
  author: 'bree-core',
  createdAt: '2024-01-15',
  updatedAt: '2024-02-06',
  tags: ['lens', 'progress', 'velocity', 'forecast', 'charts']
},

{
  id: 'bree.lens.idea-generator',
  component: 'data/aiLenses.ts#idea-generator',
  title: 'Idea Generator',
  description:
  'Synthesizes context from tasks, conversations, and grapes to suggest new features, improvements, and creative directions. Generates idea cards with related task/vine links.',
  type: 'lens',
  version: '1.1.0',
  natsSubject: 'bree.lens.idea-generator',
  bindings: [
  {
    subject: 'bree.lens.idea-generator.analyze',
    verb: 'request',
    description: 'Receives context for creative synthesis'
  },
  {
    subject: 'bree.lens.idea-generator.result',
    verb: 'reply',
    description: 'Returns idea cards with rationale'
  },
  {
    subject: 'bree.lens.idea-generator.spark',
    verb: 'publish',
    description: 'Broadcasts spontaneous ideas based on activity patterns'
  }],

  lensAccepts: [],
  lensIncludes: [],
  targetComponents: [
  'bree.pages.project-board',
  'bree.pages.dashboard',
  'bree.pages.team',
  'bree.pages.vines',
  'bree.pages.architecture',
  'bree.components.vines-panel'],

  agents: [
  {
    id: 'ai1',
    role: 'Creative synthesis and pattern recognition',
    permissions: ['read', 'analyze']
  },
  {
    id: 'ai2',
    role: 'Feasibility assessment of generated ideas',
    permissions: ['read', 'analyze']
  }],

  dataProvides: [
  'ideaCards',
  'featureSuggestions',
  'improvementPlan',
  'relatedContext'],

  dataConsumes: ['Task[]', 'VineConversation[]', 'Grape[]', 'Project'],
  stateKeys: [],
  capabilities: [
  'creative-synthesis',
  'feature-suggestion',
  'pattern-recognition',
  'idea-cards',
  'context-linking'],

  specialties: ['ux', 'ui'],
  author: 'bree-core',
  createdAt: '2024-01-15',
  updatedAt: '2024-02-06',
  tags: ['lens', 'ideas', 'creative', 'generation', 'features']
},

{
  id: 'bree.lens.security-auditor',
  component: 'data/aiLenses.ts#security-auditor',
  title: 'Security Auditor',
  description:
  'Reviews tasks, code activity, and conversations for security implications. Generates security scores, flags vulnerabilities, and recommends governance practices.',
  type: 'lens',
  version: '1.2.0',
  natsSubject: 'bree.lens.security-auditor',
  bindings: [
  {
    subject: 'bree.lens.security-auditor.analyze',
    verb: 'request',
    description: 'Receives context for security review'
  },
  {
    subject: 'bree.lens.security-auditor.result',
    verb: 'reply',
    description: 'Returns security score and vulnerability report'
  },
  {
    subject: 'bree.lens.security-auditor.alert',
    verb: 'publish',
    description: 'Broadcasts critical security findings'
  }],

  lensAccepts: [],
  lensIncludes: [],
  targetComponents: [
  'bree.pages.project-board',
  'bree.pages.vines',
  'bree.pages.architecture',
  'bree.components.architecture-node'],

  agents: [
  {
    id: 'ai3',
    role: 'Vulnerability scanning and security posture assessment',
    permissions: ['read', 'analyze', 'execute']
  }],

  dataProvides: [
  'securityScore',
  'vulnerabilityReport',
  'complianceChecklist',
  'remediationPlan'],

  dataConsumes: ['Task[]', 'VineConversation[]', 'GitBranch[]', 'Project'],
  stateKeys: [],
  capabilities: [
  'vulnerability-scanning',
  'security-scoring',
  'compliance-checking',
  'secret-detection',
  'remediation-planning'],

  specialties: ['security', 'governance', 'devops'],
  author: 'bree-core',
  createdAt: '2024-01-15',
  updatedAt: '2024-02-06',
  tags: ['lens', 'security', 'audit', 'vulnerability', 'compliance']
},

{
  id: 'bree.lens.priority-optimizer',
  component: 'data/aiLenses.ts#priority-optimizer',
  title: 'Priority Optimizer',
  description:
  'Analyzes task dependencies, effort estimates, and impact scores to recommend optimal execution order. Generates priority timelines with unblock chains.',
  type: 'lens',
  version: '1.3.0',
  natsSubject: 'bree.lens.priority-optimizer',
  bindings: [
  {
    subject: 'bree.lens.priority-optimizer.analyze',
    verb: 'request',
    description: 'Receives task list for optimization'
  },
  {
    subject: 'bree.lens.priority-optimizer.result',
    verb: 'reply',
    description: 'Returns optimized priority order with rationale'
  },
  {
    subject: 'bree.lens.priority-optimizer.rebalance',
    verb: 'publish',
    description: 'Suggests priority changes when new tasks are added'
  }],

  lensAccepts: [],
  lensIncludes: [],
  targetComponents: [
  'bree.pages.project-board',
  'bree.pages.dashboard',
  'bree.pages.task-board',
  'bree.components.task-list',
  'bree.components.sidebar',
  'bree.hooks.use-agent-tasks'],

  agents: [
  {
    id: 'ai2',
    role: 'Dependency graph analysis and impact scoring',
    permissions: ['read', 'analyze', 'write']
  }],

  dataProvides: [
  'optimizedOrder',
  'impactScores',
  'unblockChains',
  'effortEstimates'],

  dataConsumes: ['Task[]', 'VineConversation[]', 'Project'],
  stateKeys: [],
  capabilities: [
  'dependency-analysis',
  'impact-scoring',
  'effort-estimation',
  'priority-timeline',
  'unblock-chain-mapping'],

  specialties: ['governance', 'backend'],
  author: 'bree-core',
  createdAt: '2024-01-15',
  updatedAt: '2024-02-06',
  tags: ['lens', 'priority', 'optimization', 'dependencies', 'impact']
},

// ═══════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════

{
  id: 'bree.pages.project-board',
  component: 'pages/ProjectBoardPage.tsx',
  title: 'Project Board',
  description:
  'Primary project workspace showing tasks, vines, grapes, and git in a bento grid. Supports expanded card views and is the main AI lens drop target surface.',
  type: 'page',
  version: '2.1.0',
  natsSubject: 'bree.pages.project-board',
  bindings: [
  {
    subject: 'bree.pages.project-board.render',
    verb: 'publish',
    description: 'Emitted when page renders with project context'
  },
  {
    subject: 'bree.pages.project-board.expand',
    verb: 'publish',
    description: 'Emitted when a card is expanded (tasks/vines/grapes/git)',
    schema: 'ExpandedCardType'
  },
  {
    subject: 'bree.lens.drop',
    verb: 'subscribe',
    description: 'Receives AI lens drop events on any of 4 drop zones'
  },
  {
    subject: 'bree.agentx.analyze.response',
    verb: 'subscribe',
    description: 'Receives analysis results from AgentX'
  }],

  lensAccepts: [
  'urgent-lens',
  'risk-scanner',
  'progress-analyst',
  'idea-generator',
  'security-auditor',
  'priority-optimizer'],

  lensIncludes: [],
  lensDropZoneId: 'project-{projectId}-tasks',
  agents: [
  {
    id: 'ai1',
    role: 'UI analysis and accessibility auditing',
    permissions: ['read', 'analyze']
  },
  {
    id: 'ai2',
    role: 'Task prioritization and velocity tracking',
    permissions: ['read', 'analyze', 'write']
  },
  {
    id: 'ai3',
    role: 'Security scanning of git branches and tasks',
    permissions: ['read', 'analyze']
  }],

  dataProvides: [
  'projectTasks',
  'projectVines',
  'projectGrapes',
  'gitBranches',
  'taskStats',
  'progress'],

  dataConsumes: [
  'Project',
  'Task[]',
  'VineConversation[]',
  'Grape[]',
  'TeamMember[]'],

  stateKeys: ['expandedCard', 'expandedTaskId'],
  capabilities: [
  'lens-drop-target',
  'card-expansion',
  'task-status-display',
  'vine-preview',
  'grape-tracking',
  'git-branch-view'],

  specialties: ['ui', 'ux', 'backend', 'devops'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['page', 'project', 'lens-aware', 'bento-grid', 'primary-workspace']
},

{
  id: 'bree.pages.dashboard',
  component: 'pages/Dashboard.tsx',
  title: 'Dashboard',
  description:
  'Overview dashboard with sidebar navigation, task lists, project views, and vine panels. Supports specialty filtering and agent/area/project selection.',
  type: 'page',
  version: '1.5.0',
  natsSubject: 'bree.pages.dashboard',
  bindings: [
  {
    subject: 'bree.pages.dashboard.render',
    verb: 'publish',
    description: 'Emitted on dashboard mount with full state'
  },
  {
    subject: 'bree.pages.dashboard.filter',
    verb: 'publish',
    description: 'Emitted when specialty/agent/area filters change'
  },
  {
    subject: 'bree.lens.drop',
    verb: 'subscribe',
    description: 'Receives lens drops on main content area'
  },
  {
    subject: 'bree.tasks.updated',
    verb: 'subscribe',
    description: 'Reacts to task status changes'
  }],

  lensAccepts: [
  'urgent-lens',
  'risk-scanner',
  'progress-analyst',
  'priority-optimizer'],

  lensIncludes: [],
  lensDropZoneId: 'dashboard-main',
  agents: [
  {
    id: 'ai1',
    role: 'Layout optimization suggestions',
    permissions: ['read', 'analyze']
  },
  {
    id: 'ai2',
    role: 'Task velocity analysis and forecasting',
    permissions: ['read', 'analyze']
  }],

  dataProvides: [
  'allTasks',
  'filteredTasks',
  'tasksByStatus',
  'vineConversations',
  'stats'],

  dataConsumes: [
  'Task[]',
  'Agent[]',
  'Area[]',
  'Project[]',
  'VineConversation[]',
  'SpecialtyType[]'],

  stateKeys: [
  'selectedAgentId',
  'selectedAreaId',
  'selectedProjectId',
  'selectedVineId',
  'vineConversations'],

  capabilities: [
  'lens-drop-target',
  'specialty-filtering',
  'agent-selection',
  'project-navigation',
  'vine-management'],

  specialties: ['ui', 'ux'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['page', 'dashboard', 'lens-aware', 'filterable', 'overview']
},

{
  id: 'bree.pages.team',
  component: 'pages/TeamPage.tsx',
  title: 'Team Board',
  description:
  'Displays all team members organized by category (Design, Human Agents, AI Agents) with stats, skills, and recent activity feed.',
  type: 'page',
  version: '1.2.0',
  natsSubject: 'bree.pages.team',
  bindings: [
  {
    subject: 'bree.pages.team.render',
    verb: 'publish',
    description: 'Emitted with team roster and stats'
  },
  {
    subject: 'bree.agents.status',
    verb: 'subscribe',
    description: 'Receives real-time agent status updates'
  },
  {
    subject: 'bree.lens.drop',
    verb: 'subscribe',
    description: 'Receives lens drops for team analysis'
  }],

  lensAccepts: [
  'urgent-lens',
  'risk-scanner',
  'progress-analyst',
  'idea-generator'],

  lensIncludes: [],
  lensDropZoneId: 'team-board',
  agents: [
  {
    id: 'ai1',
    role: 'Team composition analysis',
    permissions: ['read', 'analyze']
  },
  {
    id: 'ai2',
    role: 'Workload balancing recommendations',
    permissions: ['read', 'analyze', 'write']
  }],

  dataProvides: [
  'teamMembers',
  'memberStats',
  'recentActivity',
  'categoryBreakdown'],

  dataConsumes: ['TeamMember[]', 'Task[]', 'VineConversation[]', 'Agent[]'],
  stateKeys: [],
  capabilities: [
  'lens-drop-target',
  'member-categorization',
  'activity-feed',
  'stat-cards'],

  specialties: ['ui', 'ux', 'governance'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['page', 'team', 'lens-aware', 'roster', 'activity']
},

{
  id: 'bree.pages.vines',
  component: 'pages/VinesPage.tsx',
  title: 'Vines Command & Control',
  description:
  'Immersive vine visualization with node-based team member selection, conversation threading, and floating message overlays. Dark theme with organic visual language.',
  type: 'page',
  version: '1.8.0',
  natsSubject: 'bree.pages.vines',
  bindings: [
  {
    subject: 'bree.pages.vines.render',
    verb: 'publish',
    description: 'Emitted with vine network state'
  },
  {
    subject: 'bree.pages.vines.select-member',
    verb: 'publish',
    description: 'Emitted when a team node is selected',
    schema: 'TeamMember'
  },
  {
    subject: 'bree.pages.vines.select-conversation',
    verb: 'publish',
    description: 'Emitted when a conversation is opened',
    schema: 'VineConversation'
  },
  {
    subject: 'bree.lens.drop',
    verb: 'subscribe',
    description: 'Receives lens drops for vine analysis'
  },
  {
    subject: 'bree.vines.message',
    verb: 'subscribe',
    description: 'Receives new vine messages in real-time'
  }],

  lensAccepts: [
  'urgent-lens',
  'risk-scanner',
  'idea-generator',
  'security-auditor'],

  lensIncludes: [],
  lensDropZoneId: 'vines-page',
  agents: [
  {
    id: 'ai1',
    role: 'Conversation sentiment analysis',
    permissions: ['read', 'analyze']
  },
  {
    id: 'ai2',
    role: 'Urgency detection in messages',
    permissions: ['read', 'analyze']
  },
  {
    id: 'ai3',
    role: 'Security scanning of shared content',
    permissions: ['read', 'analyze']
  }],

  dataProvides: [
  'vineConversations',
  'selectedMember',
  'selectedConversation',
  'messageStream'],

  dataConsumes: ['TeamMember[]', 'VineConversation[]'],
  stateKeys: ['selectedMemberId', 'selectedConversationId'],
  capabilities: [
  'lens-drop-target',
  'node-visualization',
  'conversation-threading',
  'message-overlay',
  'member-inspection'],

  specialties: ['messaging', 'ui', 'ux'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: [
  'page',
  'vines',
  'lens-aware',
  'immersive',
  'dark-theme',
  'real-time']

},

{
  id: 'bree.pages.task-board',
  component: 'pages/TaskBoardPage.tsx',
  title: 'Task Board',
  description:
  'Single-task focused workspace with tabbed views for task overview, vine chat, and CLI terminal. Includes acceptance criteria checklist and task switching.',
  type: 'page',
  version: '1.4.0',
  natsSubject: 'bree.pages.task-board',
  bindings: [
  {
    subject: 'bree.pages.task-board.render',
    verb: 'publish',
    description: 'Emitted with active task context'
  },
  {
    subject: 'bree.pages.task-board.switch-task',
    verb: 'publish',
    description: 'Emitted when user switches between tasks'
  },
  {
    subject: 'bree.pages.task-board.tab-change',
    verb: 'publish',
    description: 'Emitted on tab switch (task/vine/cli)'
  },
  {
    subject: 'bree.lens.drop',
    verb: 'subscribe',
    description: 'Receives lens drops for task analysis'
  },
  {
    subject: 'bree.cli.command',
    verb: 'request',
    description: 'Sends CLI commands to agent for execution'
  }],

  lensAccepts: [
  'urgent-lens',
  'risk-scanner',
  'progress-analyst',
  'priority-optimizer'],

  lensIncludes: [],
  lensDropZoneId: 'task-board-{taskId}',
  agents: [
  {
    id: 'ai1',
    role: 'Code review and suggestion',
    permissions: ['read', 'analyze']
  },
  {
    id: 'ai2',
    role: 'Task decomposition and estimation',
    permissions: ['read', 'analyze', 'write']
  },
  {
    id: 'ai3',
    role: 'CLI command execution and monitoring',
    permissions: ['read', 'execute']
  }],

  dataProvides: [
  'activeTask',
  'todos',
  'cliHistory',
  'vineChat',
  'taskProgress'],

  dataConsumes: ['Task[]', 'VineConversation[]', 'TeamMember[]'],
  stateKeys: [
  'activeTaskIndex',
  'activeTab',
  'todos',
  'cliInput',
  'cliHistory',
  'vineInput'],

  capabilities: [
  'lens-drop-target',
  'task-switching',
  'checklist-management',
  'vine-chat',
  'cli-terminal'],

  specialties: ['ui', 'backend', 'devops'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: [
  'page',
  'task',
  'lens-aware',
  'tabbed',
  'terminal',
  'focused-workspace']

},

{
  id: 'bree.pages.architecture',
  component: 'pages/ArchitecturePage.tsx',
  title: 'Architecture View',
  description:
  'System architecture visualization showing frontend apps, backend services, shared core, and external services in a layered diagram with connecting lines.',
  type: 'page',
  version: '1.1.0',
  natsSubject: 'bree.pages.architecture',
  bindings: [
  {
    subject: 'bree.pages.architecture.render',
    verb: 'publish',
    description: 'Emitted with architecture graph data'
  },
  {
    subject: 'bree.lens.drop',
    verb: 'subscribe',
    description: 'Receives lens drops for architecture analysis'
  },
  {
    subject: 'bree.services.health',
    verb: 'subscribe',
    description: 'Receives health status from deployed services'
  }],

  lensAccepts: ['risk-scanner', 'security-auditor', 'idea-generator'],
  lensIncludes: [],
  lensDropZoneId: 'architecture-page',
  agents: [
  {
    id: 'ai2',
    role: 'Dependency analysis and optimization',
    permissions: ['read', 'analyze']
  },
  {
    id: 'ai3',
    role: 'Security posture assessment',
    permissions: ['read', 'analyze']
  }],

  dataProvides: ['architectureNodes', 'serviceLayers', 'connectionGraph'],
  dataConsumes: ['Task[]', 'Project[]'],
  stateKeys: [],
  capabilities: [
  'lens-drop-target',
  'layered-diagram',
  'service-nodes',
  'tech-stack-display'],

  specialties: ['backend', 'devops', 'security'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['page', 'architecture', 'lens-aware', 'diagram', 'infrastructure']
},

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

{
  id: 'bree.components.ai-lens-menu',
  component: 'components/AILensMenu.tsx',
  title: 'AI Lens Menu',
  description:
  'Fixed sidebar menu displaying all available AI lenses with custom geometric SVG icons. Supports drag-to-analyze interaction pattern. Dark glass panel aesthetic.',
  type: 'component',
  version: '2.0.0',
  natsSubject: 'bree.components.ai-lens-menu',
  bindings: [
  {
    subject: 'bree.lens.drag-start',
    verb: 'publish',
    description: 'Emitted when user begins dragging a lens',
    schema: 'AILens'
  },
  {
    subject: 'bree.lens.registry',
    verb: 'subscribe',
    description: 'Receives updated lens list from API'
  }],

  lensAccepts: [],
  lensIncludes: [
  'urgent-lens',
  'risk-scanner',
  'progress-analyst',
  'idea-generator',
  'security-auditor',
  'priority-optimizer'],

  agents: [
  {
    id: 'ai1',
    role: 'Lens recommendation based on current context',
    permissions: ['read']
  }],

  dataProvides: ['availableLenses', 'dragState'],
  dataConsumes: ['AILens[]'],
  stateKeys: [],
  capabilities: [
  'lens-drag-source',
  'custom-svg-icons',
  'tooltip-descriptions',
  'staggered-animation'],

  specialties: ['ui'],
  author: 'bree-core',
  createdAt: '2024-01-15',
  updatedAt: '2024-02-06',
  tags: ['component', 'ai-lens', 'drag-source', 'sidebar', 'dark-theme']
},

{
  id: 'bree.components.ai-lens-overlay',
  component: 'components/AILensOverlay.tsx',
  title: 'AI Lens Overlay',
  description:
  'Full-screen modal overlay that displays AI analysis results with lens-specific visualizations (risk heatmap, progress charts, idea cards, security scores, priority optimizer). Includes follow-up chat interface.',
  type: 'component',
  version: '1.6.0',
  natsSubject: 'bree.components.ai-lens-overlay',
  bindings: [
  {
    subject: 'bree.lens.overlay.open',
    verb: 'subscribe',
    description: 'Opens overlay with lens and analysis data'
  },
  {
    subject: 'bree.lens.overlay.close',
    verb: 'publish',
    description: 'Emitted when overlay is dismissed'
  },
  {
    subject: 'bree.agentx.chat',
    verb: 'request',
    description: 'Sends follow-up questions to AgentX'
  },
  {
    subject: 'bree.agentx.analyze.response',
    verb: 'subscribe',
    description: 'Receives streaming analysis results'
  }],

  lensAccepts: [
  'urgent-lens',
  'risk-scanner',
  'progress-analyst',
  'idea-generator',
  'security-auditor',
  'priority-optimizer'],

  lensIncludes: [
  'urgent-lens',
  'risk-scanner',
  'progress-analyst',
  'idea-generator',
  'security-auditor',
  'priority-optimizer'],

  agents: [
  {
    id: 'ai1',
    role: 'Visualization rendering based on lens type',
    permissions: ['read']
  },
  {
    id: 'ai2',
    role: 'Follow-up question answering',
    permissions: ['read', 'analyze']
  }],

  dataProvides: ['analysisVisualization', 'chatHistory'],
  dataConsumes: [
  'AILens',
  'Task[]',
  'VineConversation[]',
  'Grape[]',
  'Project'],

  stateKeys: ['messages', 'inputValue', 'isTyping'],
  capabilities: [
  'risk-heatmap',
  'progress-charts',
  'idea-cards',
  'security-score',
  'priority-timeline',
  'follow-up-chat'],

  specialties: ['ui', 'ux'],
  author: 'bree-core',
  createdAt: '2024-01-15',
  updatedAt: '2024-02-06',
  tags: ['component', 'ai-lens', 'overlay', 'visualization', 'chat']
},

{
  id: 'bree.components.sidebar',
  component: 'components/Sidebar.tsx',
  title: 'Sidebar Navigation',
  description:
  'Main navigation sidebar with agent list, area filters, project tree, vine conversations, and drag-to-project task management.',
  type: 'component',
  version: '1.3.0',
  natsSubject: 'bree.components.sidebar',
  bindings: [
  {
    subject: 'bree.components.sidebar.navigate',
    verb: 'publish',
    description: 'Emitted on agent/area/project selection'
  },
  {
    subject: 'bree.tasks.drop-on-project',
    verb: 'publish',
    description: 'Emitted when task is dropped on a project'
  },
  {
    subject: 'bree.projects.created',
    verb: 'subscribe',
    description: 'Receives new project creation events'
  }],

  lensAccepts: ['progress-analyst', 'priority-optimizer'],
  lensIncludes: [],
  agents: [
  {
    id: 'ai1',
    role: 'Navigation suggestions based on workflow',
    permissions: ['read']
  }],

  dataProvides: ['navigationState', 'projectTree', 'agentList'],
  dataConsumes: [
  'Agent[]',
  'Area[]',
  'Project[]',
  'Task[]',
  'VineConversation[]',
  'SpecialtyType[]'],

  stateKeys: [],
  capabilities: [
  'agent-selection',
  'area-filtering',
  'project-tree',
  'vine-sidebar',
  'task-drag-to-project'],

  specialties: ['ui', 'ux'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['component', 'navigation', 'sidebar', 'filterable']
},

{
  id: 'bree.components.specialty-bar',
  component: 'components/SpecialtyBar.tsx',
  title: 'Specialty Bar',
  description:
  'Horizontal filter bar for toggling domain specialties. Filters propagate to all child views.',
  type: 'component',
  version: '1.0.0',
  natsSubject: 'bree.components.specialty-bar',
  bindings: [
  {
    subject: 'bree.components.specialty-bar.toggle',
    verb: 'publish',
    description: 'Emitted when a specialty filter is toggled',
    schema: 'SpecialtyType'
  },
  {
    subject: 'bree.filters.specialty',
    verb: 'publish',
    description: 'Broadcasts active specialty set to all subscribers'
  }],

  lensAccepts: [],
  lensIncludes: [],
  agents: [],
  dataProvides: ['selectedSpecialties'],
  dataConsumes: ['SpecialtyType[]'],
  stateKeys: [],
  capabilities: ['specialty-filtering', 'toggle-chips', 'broadcast-filters'],
  specialties: ['ui'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['component', 'filter', 'specialty', 'horizontal-bar']
},

{
  id: 'bree.components.task-list',
  component: 'components/TaskList.tsx',
  title: 'Task List',
  description:
  'Displays tasks grouped by status with inline editing, priority badges, agent avatars, and vine/grape link indicators.',
  type: 'component',
  version: '1.4.0',
  natsSubject: 'bree.components.task-list',
  bindings: [
  {
    subject: 'bree.tasks.status-change',
    verb: 'publish',
    description: 'Emitted when task status is updated',
    schema: 'Task'
  },
  {
    subject: 'bree.tasks.created',
    verb: 'publish',
    description: 'Emitted when a new task is added'
  },
  {
    subject: 'bree.tasks.updated',
    verb: 'subscribe',
    description: 'Receives external task updates'
  }],

  lensAccepts: [
  'urgent-lens',
  'risk-scanner',
  'progress-analyst',
  'priority-optimizer'],

  lensIncludes: [],
  agents: [
  {
    id: 'ai2',
    role: 'Auto-prioritization of new tasks',
    permissions: ['read', 'write']
  }],

  dataProvides: ['tasksByStatus', 'taskActions'],
  dataConsumes: [
  'Task[]',
  'Agent[]',
  'Area[]',
  'Project[]',
  'VineConversation[]'],

  stateKeys: [],
  capabilities: [
  'status-grouping',
  'inline-editing',
  'task-creation',
  'priority-display',
  'vine-linking'],

  specialties: ['ui', 'ux'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['component', 'task', 'list', 'grouped', 'editable']
},

{
  id: 'bree.components.projects-view',
  component: 'components/ProjectsView.tsx',
  title: 'Projects View',
  description:
  'Grid view of all projects with task counts, progress indicators, and vine activity summaries.',
  type: 'component',
  version: '1.1.0',
  natsSubject: 'bree.components.projects-view',
  bindings: [
  {
    subject: 'bree.projects.select',
    verb: 'publish',
    description: 'Emitted when a project card is clicked'
  },
  {
    subject: 'bree.projects.updated',
    verb: 'subscribe',
    description: 'Receives project data updates'
  }],

  lensAccepts: ['progress-analyst', 'risk-scanner'],
  lensIncludes: [],
  agents: [
  {
    id: 'ai2',
    role: 'Project health scoring',
    permissions: ['read', 'analyze']
  }],

  dataProvides: ['projectCards', 'projectStats'],
  dataConsumes: ['Project[]', 'Task[]', 'VineConversation[]'],
  stateKeys: [],
  capabilities: [
  'project-grid',
  'progress-indicators',
  'vine-activity',
  'navigation'],

  specialties: ['ui'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['component', 'project', 'grid', 'overview']
},

{
  id: 'bree.components.vines-panel',
  component: 'components/VinesPanel.tsx',
  title: 'Vines Panel',
  description:
  'Inline conversation panel for viewing and participating in vine chats within the dashboard context.',
  type: 'component',
  version: '1.2.0',
  natsSubject: 'bree.components.vines-panel',
  bindings: [
  {
    subject: 'bree.vines.message.send',
    verb: 'publish',
    description: 'Emitted when user sends a message'
  },
  {
    subject: 'bree.vines.message',
    verb: 'subscribe',
    description: 'Receives new messages in real-time'
  }],

  lensAccepts: ['urgent-lens', 'idea-generator'],
  lensIncludes: [],
  agents: [
  {
    id: 'ai1',
    role: 'Message summarization',
    permissions: ['read', 'analyze']
  },
  { id: 'ai2', role: 'Urgency flagging', permissions: ['read', 'analyze'] }],

  dataProvides: ['conversationView', 'messageStream'],
  dataConsumes: ['VineConversation', 'TeamMember[]'],
  stateKeys: [],
  capabilities: [
  'message-display',
  'message-sending',
  'participant-avatars',
  'real-time-updates'],

  specialties: ['messaging', 'ui'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['component', 'vine', 'chat', 'panel', 'real-time']
},

{
  id: 'bree.components.vines-visual',
  component: 'components/VinesVisual.tsx',
  title: 'Vines Visual',
  description:
  'Organic node-based visualization of team members and their vine connections.',
  type: 'component',
  version: '1.5.0',
  natsSubject: 'bree.components.vines-visual',
  bindings: [
  {
    subject: 'bree.vines-visual.select-node',
    verb: 'publish',
    description: 'Emitted when a team node is clicked'
  },
  {
    subject: 'bree.vines-visual.select-edge',
    verb: 'publish',
    description: 'Emitted when a conversation edge is clicked'
  },
  {
    subject: 'bree.agents.status',
    verb: 'subscribe',
    description: 'Updates node status indicators'
  }],

  lensAccepts: ['risk-scanner'],
  lensIncludes: [],
  agents: [
  {
    id: 'ai1',
    role: 'Network topology analysis',
    permissions: ['read', 'analyze']
  }],

  dataProvides: ['networkGraph', 'selectedNode', 'selectedEdge'],
  dataConsumes: ['TeamMember[]', 'VineConversation[]'],
  stateKeys: [],
  capabilities: [
  'node-graph',
  'edge-connections',
  'animated-svg',
  'interactive-selection'],

  specialties: ['ui', 'messaging'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['component', 'visualization', 'graph', 'animated', 'organic']
},

{
  id: 'bree.components.architecture-node',
  component: 'components/ArchitectureNode.tsx',
  title: 'Architecture Node',
  description: 'Individual service/app node in the architecture diagram.',
  type: 'component',
  version: '1.0.0',
  natsSubject: 'bree.components.architecture-node',
  bindings: [
  {
    subject: 'bree.architecture.node.click',
    verb: 'publish',
    description: 'Emitted when node is clicked for details'
  },
  {
    subject: 'bree.services.health',
    verb: 'subscribe',
    description: 'Receives health status for this service'
  }],

  lensAccepts: ['security-auditor'],
  lensIncludes: [],
  agents: [
  { id: 'ai3', role: 'Service health monitoring', permissions: ['read'] }],

  dataProvides: ['nodeDetails', 'techStack'],
  dataConsumes: [],
  stateKeys: [],
  capabilities: [
  'service-display',
  'tech-badges',
  'port-indicator',
  'layer-coloring'],

  specialties: ['backend', 'devops'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['component', 'architecture', 'node', 'service']
},

{
  id: 'bree.components.team-member-card',
  component: 'components/TeamMemberCard.tsx',
  title: 'Team Member Card',
  description:
  'Individual team member display with avatar, role, status indicator, skills, and task/vine counts.',
  type: 'component',
  version: '1.0.0',
  natsSubject: 'bree.components.team-member-card',
  bindings: [
  {
    subject: 'bree.team.member.select',
    verb: 'publish',
    description: 'Emitted when member card is clicked'
  },
  {
    subject: 'bree.agents.status',
    verb: 'subscribe',
    description: 'Updates member online status'
  }],

  lensAccepts: ['progress-analyst'],
  lensIncludes: [],
  agents: [],
  dataProvides: ['memberProfile', 'memberStats'],
  dataConsumes: ['TeamMember', 'Task[]', 'VineConversation[]'],
  stateKeys: [],
  capabilities: [
  'avatar-display',
  'status-indicator',
  'skill-badges',
  'stat-counts'],

  specialties: ['ui'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['component', 'team', 'member', 'card']
},

{
  id: 'bree.components.badge',
  component: 'components/ui/Badge.tsx',
  title: 'Badge',
  description:
  'Reusable badge/chip component for status labels, priority indicators, and category tags.',
  type: 'component',
  version: '1.0.0',
  natsSubject: 'bree.components.ui.badge',
  bindings: [],
  lensAccepts: [],
  lensIncludes: [],
  agents: [],
  dataProvides: [],
  dataConsumes: [],
  stateKeys: [],
  capabilities: ['status-display', 'variant-styling'],
  specialties: ['ui'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  tags: ['component', 'ui', 'primitive', 'badge']
},

{
  id: 'bree.components.tasks-sidebar-section',
  component: 'components/TasksSidebarSection.tsx',
  title: 'Tasks Sidebar Section',
  description: 'Compact task list section within the sidebar.',
  type: 'component',
  version: '1.0.0',
  natsSubject: 'bree.components.tasks-sidebar',
  bindings: [
  {
    subject: 'bree.tasks.updated',
    verb: 'subscribe',
    description: 'Refreshes task counts on changes'
  }],

  lensAccepts: ['progress-analyst'],
  lensIncludes: [],
  agents: [],
  dataProvides: ['sidebarTaskSummary'],
  dataConsumes: ['Task[]'],
  stateKeys: [],
  capabilities: ['task-summary', 'status-counts', 'compact-list'],
  specialties: ['ui'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['component', 'sidebar', 'tasks', 'compact']
},

{
  id: 'bree.components.vines-sidebar-section',
  component: 'components/VinesSidebarSection.tsx',
  title: 'Vines Sidebar Section',
  description:
  'Compact vine conversation list in the sidebar with unread indicators.',
  type: 'component',
  version: '1.0.0',
  natsSubject: 'bree.components.vines-sidebar',
  bindings: [
  {
    subject: 'bree.vines.message',
    verb: 'subscribe',
    description: 'Updates unread counts on new messages'
  },
  {
    subject: 'bree.vines.select',
    verb: 'publish',
    description: 'Emitted when a vine is selected from sidebar'
  }],

  lensAccepts: ['urgent-lens'],
  lensIncludes: [],
  agents: [
  { id: 'ai2', role: 'Unread prioritization', permissions: ['read'] }],

  dataProvides: ['sidebarVineSummary', 'unreadCounts'],
  dataConsumes: ['VineConversation[]'],
  stateKeys: [],
  capabilities: [
  'vine-list',
  'unread-indicators',
  'message-preview',
  'vine-selection'],

  specialties: ['messaging', 'ui'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['component', 'sidebar', 'vines', 'compact', 'real-time']
},

// ═══════════════════════════════════════════════════════════
// HOOKS & PROVIDERS
// ═══════════════════════════════════════════════════════════

{
  id: 'bree.hooks.use-agent-tasks',
  component: 'hooks/useAgentTasks.ts',
  title: 'useAgentTasks Hook',
  description:
  'Primary data hook that fetches and manages tasks, agents, areas, and projects via the Bree Eden API client.',
  type: 'hook',
  version: '1.5.0',
  natsSubject: 'bree.hooks.agent-tasks',
  bindings: [
  {
    subject: 'bree.hooks.agent-tasks.sync',
    verb: 'publish',
    description: 'Emitted when data is fetched/synced from API'
  },
  {
    subject: 'bree.tasks.updated',
    verb: 'publish',
    description: 'Emitted on task status change or creation'
  },
  {
    subject: 'bree.projects.created',
    verb: 'publish',
    description: 'Emitted on new project creation'
  }],

  lensAccepts: ['progress-analyst', 'priority-optimizer'],
  lensIncludes: [],
  agents: [
  {
    id: 'ai2',
    role: 'Data integrity validation',
    permissions: ['read', 'analyze']
  }],

  dataProvides: [
  'tasks',
  'agents',
  'areas',
  'projects',
  'tasksByStatus',
  'stats',
  'selectedSpecialties'],

  dataConsumes: [],
  stateKeys: [
  'tasks',
  'agents',
  'areas',
  'projects',
  'selectedAgentId',
  'selectedAreaId',
  'selectedProjectId',
  'selectedSpecialties'],

  capabilities: [
  'api-fetching',
  'task-crud',
  'project-crud',
  'specialty-filtering',
  'computed-stats'],

  specialties: ['backend', 'database'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['hook', 'data', 'api', 'crud', 'state-management']
},

{
  id: 'bree.hooks.use-ai-lens',
  component: 'hooks/useAILens.tsx',
  title: 'useAILens Hook & Provider',
  description:
  'Global AI Lens context provider and hooks. Manages lens drag state, drop zone registration, AgentX communication, analysis history, and overlay state.',
  type: 'provider',
  version: '2.0.0',
  natsSubject: 'bree.hooks.ai-lens',
  bindings: [
  {
    subject: 'bree.lens.drag-start',
    verb: 'publish',
    description: 'Emitted when lens drag begins'
  },
  {
    subject: 'bree.lens.drop',
    verb: 'publish',
    description: 'Emitted when lens is dropped on a zone'
  },
  {
    subject: 'bree.agentx.analyze',
    verb: 'request',
    description: 'Sends analysis request to AgentX Collective'
  },
  {
    subject: 'bree.agentx.analyze.response',
    verb: 'subscribe',
    description: 'Receives analysis results'
  },
  {
    subject: 'bree.lens.zones.register',
    verb: 'subscribe',
    description: 'Receives drop zone registrations from components'
  }],

  lensAccepts: [],
  lensIncludes: [
  'urgent-lens',
  'risk-scanner',
  'progress-analyst',
  'idea-generator',
  'security-auditor',
  'priority-optimizer'],

  agents: [
  {
    id: 'ai1',
    role: 'Lens recommendation engine',
    permissions: ['read', 'analyze']
  },
  {
    id: 'ai2',
    role: 'Analysis orchestration',
    permissions: ['read', 'analyze', 'execute']
  },
  { id: 'ai3', role: 'Security context injection', permissions: ['read'] }],

  dataProvides: [
  'isDragging',
  'activeLens',
  'analysisResult',
  'agentXStatus',
  'analysisHistory',
  'dropZones'],

  dataConsumes: ['AILens[]', 'AgentXResponse'],
  stateKeys: [
  'isDragging',
  'draggingLensId',
  'dragOverZoneId',
  'isOverlayOpen',
  'activeLens',
  'activeZone',
  'analysisResult',
  'lastAgentXResponse',
  'analysisHistory',
  'agentXStatus'],

  capabilities: [
  'lens-drag-management',
  'drop-zone-registry',
  'agentx-communication',
  'analysis-history',
  'overlay-control'],

  specialties: ['ui', 'backend'],
  author: 'bree-core',
  createdAt: '2024-01-15',
  updatedAt: '2024-02-06',
  tags: ['hook', 'provider', 'ai-lens', 'agentx', 'context', 'drag-drop']
},

// ═══════════════════════════════════════════════════════════
// API & DATA
// ═══════════════════════════════════════════════════════════

{
  id: 'bree.api.client',
  component: 'api/client.ts',
  title: 'Bree Eden API Client',
  description:
  'Eden Treaty-style API client for all Bree services. Provides typed endpoints for tasks, agents, areas, projects, AI lenses, and AgentX communication.',
  type: 'api',
  version: '2.0.0',
  natsSubject: 'bree.api.client',
  bindings: [
  {
    subject: 'bree.api.request',
    verb: 'publish',
    description: 'Emitted on every API call for logging/tracing'
  },
  {
    subject: 'bree.api.response',
    verb: 'publish',
    description: 'Emitted with response data for caching'
  },
  {
    subject: 'bree.agentx.analyze',
    verb: 'request',
    description: 'Routes analysis requests to AgentX Collective'
  },
  {
    subject: 'bree.agentx.health',
    verb: 'request',
    description: 'Health check for AgentX orchestration'
  }],

  lensAccepts: [],
  lensIncludes: [],
  agents: [
  {
    id: 'ai2',
    role: 'API performance monitoring',
    permissions: ['read', 'analyze']
  },
  {
    id: 'ai3',
    role: 'Request security validation',
    permissions: ['read', 'analyze']
  }],

  dataProvides: [
  'tasks',
  'agents',
  'areas',
  'projects',
  'lenses',
  'analyses',
  'agentxResponses'],

  dataConsumes: [],
  stateKeys: [],
  capabilities: [
  'eden-treaty-pattern',
  'mock-mode',
  'real-api-mode',
  'typed-endpoints',
  'lens-crud',
  'agentx-communication'],

  specialties: ['backend', 'security'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['api', 'client', 'eden', 'typed', 'mock', 'agentx']
},

{
  id: 'bree.app',
  component: 'App.tsx',
  title: 'App Root',
  description:
  'Root application component. Wraps all routes in AILensProvider and renders global AI Lens UI (menu + overlay).',
  type: 'provider',
  version: '2.0.0',
  natsSubject: 'bree.app',
  bindings: [
  {
    subject: 'bree.app.mount',
    verb: 'publish',
    description: 'Emitted when application mounts'
  },
  {
    subject: 'bree.app.route-change',
    verb: 'publish',
    description: 'Emitted on route navigation'
  }],

  lensAccepts: [],
  lensIncludes: [
  'urgent-lens',
  'risk-scanner',
  'progress-analyst',
  'idea-generator',
  'security-auditor',
  'priority-optimizer'],

  agents: [],
  dataProvides: ['routeContext', 'lensProviderContext'],
  dataConsumes: [],
  stateKeys: [],
  capabilities: ['routing', 'lens-provider', 'global-lens-ui'],
  specialties: ['ui'],
  author: 'bree-core',
  createdAt: '2024-01-01',
  updatedAt: '2024-02-06',
  tags: ['app', 'root', 'router', 'provider']
}];


// ─── Lookup Helpers ─────────────────────────────────────────

export function getNoteById(id: string): AgentXNote | undefined {
  return AGENTX_NOTES.find((n) => n.id === id);
}

export function getNoteByComponent(
componentPath: string)
: AgentXNote | undefined {
  return AGENTX_NOTES.find((n) => n.component === componentPath);
}

export function getNotesByType(type: AgentXNote['type']): AgentXNote[] {
  return AGENTX_NOTES.filter((n) => n.type === type);
}

export function getLensNotes(): AgentXNote[] {
  return AGENTX_NOTES.filter((n) => n.type === 'lens');
}

export function getComponentsAcceptingLens(lensId: string): AgentXNote[] {
  return AGENTX_NOTES.filter((n) => n.lensAccepts.includes(lensId));
}

export function getComponentsIncludingLens(lensId: string): AgentXNote[] {
  return AGENTX_NOTES.filter((n) => n.lensIncludes.includes(lensId));
}

export function getLensTargetComponents(lensNoteId: string): AgentXNote[] {
  const lensNote = getNoteById(lensNoteId);
  if (!lensNote?.targetComponents) return [];
  return lensNote.targetComponents.
  map((id) => getNoteById(id)).
  filter((n): n is AgentXNote => n !== undefined);
}

export function getNotesByLensTarget(lensId: string): AgentXNote[] {
  return AGENTX_NOTES.filter((n) => n.lensAccepts.includes(lensId));
}

export function getNotesByAgent(agentId: string): AgentXNote[] {
  return AGENTX_NOTES.filter((n) => n.agents.some((a) => a.id === agentId));
}

export function getNotesByNatsSubject(subject: string): AgentXNote[] {
  return AGENTX_NOTES.filter(
    (n) =>
    n.natsSubject === subject ||
    n.bindings.some((b) => b.subject === subject)
  );
}

export function getNotesByTag(tag: string): AgentXNote[] {
  return AGENTX_NOTES.filter((n) => n.tags.includes(tag));
}

export function getNotesBySpecialty(specialty: string): AgentXNote[] {
  return AGENTX_NOTES.filter((n) => n.specialties.includes(specialty as any));
}