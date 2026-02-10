/**
 * AI Lenses — Data & Mock Analysis
 *
 * The AILens type is now defined in types/index.ts as a first-class Bree component.
 * The canonical lens data lives in api/client.ts (mockLenses).
 * This file re-exports the type and provides the static list + mock analysis for
 * components that import from here (backward compat).
 *
 * ── TO MIGRATE ──────────────────────────────────────────
 * Replace usages of AI_LENSES with:
 *   const { data } = await client.api.lenses.get()
 *
 * Replace usages of getMockAnalysis with:
 *   const { data } = await client.api.agentx.analyze({ ... })
 * ─────────────────────────────────────────────────────────
 */

import { TaskStatus, GrapeStatus } from '../types';

// Re-export the canonical type from types/index.ts
export type { AILens } from '../types';

// Static lens list (mirrors api/client.ts mockLenses for sync access)
export const AI_LENSES: AILens[] = [
{
  id: 'urgent-lens',
  name: 'Urgent Lens',
  icon: '🚨',
  color: 'text-orange-600 bg-orange-100',
  description:
  'Scans all Vines for anything urgent that needs immediate attention.',
  systemPrompt:
  'Scan all active Vine conversations for anything urgent. Look for: blockers mentioned by team members, unresolved decisions that are holding up work, time-sensitive requests, escalations, missed deadlines, or any message indicating something needs immediate action. Prioritize by severity.',
  category: 'analysis',
  isActive: true,
  createdAt: '2024-01-01',
  lastUsed: '2024-02-06',
  usageCount: 47
},
{
  id: 'risk-scanner',
  name: 'Risk Scanner',
  icon: '🔍',
  color: 'text-rose-600 bg-rose-100',
  description:
  'Identifies potential bottlenecks, delays, and high-risk items.',
  systemPrompt:
  'Analyze the following project data for risks. Highlight any overdue tasks, high-priority items without assignees, or stalled conversations.',
  category: 'analysis',
  isActive: true,
  createdAt: '2024-01-01',
  lastUsed: '2024-02-05',
  usageCount: 83
},
{
  id: 'progress-analyst',
  name: 'Progress Analyst',
  icon: '📊',
  color: 'text-blue-600 bg-blue-100',
  description: 'Summarizes completion rates and velocity trends.',
  systemPrompt:
  'Provide a progress report based on the task completion status and recent activity. Estimate completion time if possible.',
  category: 'analysis',
  isActive: true,
  createdAt: '2024-01-01',
  lastUsed: '2024-02-06',
  usageCount: 112
},
{
  id: 'idea-generator',
  name: 'Idea Generator',
  icon: '💡',
  color: 'text-amber-600 bg-amber-100',
  description:
  'Suggests new features or improvements based on current context.',
  systemPrompt:
  'Based on the current tasks and conversations, suggest 3 creative ideas or features that could improve the project.',
  category: 'generation',
  isActive: true,
  createdAt: '2024-01-01',
  lastUsed: '2024-02-04',
  usageCount: 56
},
{
  id: 'security-auditor',
  name: 'Security Auditor',
  icon: '🛡️',
  color: 'text-emerald-600 bg-emerald-100',
  description: 'Checks for security-related tasks and vulnerabilities.',
  systemPrompt:
  'Review the tasks and code activity for security implications. Flag any missing security practices or potential vulnerabilities.',
  category: 'audit',
  isActive: true,
  createdAt: '2024-01-01',
  lastUsed: '2024-02-03',
  usageCount: 34
},
{
  id: 'priority-optimizer',
  name: 'Priority Optimizer',
  icon: '⚡',
  color: 'text-violet-600 bg-violet-100',
  description: 'Recommends task re-prioritization for maximum impact.',
  systemPrompt:
  'Analyze the task list and suggest an optimized order of execution to maximize impact and unblock other work.',
  category: 'optimization',
  isActive: true,
  createdAt: '2024-01-01',
  lastUsed: '2024-02-06',
  usageCount: 91
}];


export const getMockAnalysis = (
lensId: string,
cardType: string,
summary: string) =>
{
  const lens = AI_LENSES.find((l) => l.id === lensId);
  if (!lens) return 'Analysis unavailable.';

  const analyses: Record<string, Record<string, string>> = {
    'urgent-lens': {
      tasks: `**🚨 Urgency Scan — Tasks:**\n\nScanning ${summary} for urgent items...\n\n🔴 **IMMEDIATE:** "Implement user authentication API" is marked urgent with no progress in 3 days.\n🔴 **BLOCKER:** "Set up database migrations" is blocking 3 downstream tasks.\n🟡 **TIME-SENSITIVE:** "Build task list component" has a Friday deadline approaching.\n\n*Action Required:* The auth API and database migration need same-day attention.`,
      vines: `**🚨 Urgency Scan — Vines:**\n\nScanning ${summary} for urgent signals...\n\n🔴 **ESCALATION:** In "API Rate Limiting" — Alex flagged external service rate limits are being hit NOW. This is a production issue.\n🔴 **BLOCKER:** In "Database Schema Review" — John is waiting on a decision about JSONB vs relational. This has been unresolved for 2 days and blocks implementation.\n🟡 **STALE:** "Mobile Navigation" — Sara reported touch target issues 24h ago with no follow-up from design.\n\n*Immediate Actions:*\n1. Deploy rate limiting fix (production impact)\n2. Make schema decision in next 2 hours\n3. Ping Mary on mobile nav touch targets`,
      grapes: `**🚨 Urgency Scan — Grapes:**\n\nScanning ${summary} for urgent items...\n\n🔴 **OVERDUE:** "API Documentation" is still 'growing' but the API is already being consumed by the frontend team. Missing docs are causing integration errors NOW.\n🟡 **ATTENTION:** "Design System Tokens" is 'ripe' but not yet harvested — the frontend team is blocked waiting for these tokens.\n\n*Action:* Harvest the design tokens today and fast-track API docs.`,
      git: `**🚨 Urgency Scan — Repository:**\n\nScanning ${summary} for urgent items...\n\n🔴 **CONFLICT RISK:** 'feature/hero-animation' and 'feature/mobile-nav' are diverging from main — merge conflicts are imminent.\n🟡 **STALE BRANCH:** 'fix/accessibility' has been ready for merge for 3 days with no review.\n\n*Action:* Merge the accessibility fix immediately and rebase feature branches.`
    },
    'risk-scanner': {
      tasks: `**Risk Analysis for Tasks:**\n\nBased on the ${summary}, I've identified 2 high-risk items:\n1. **Database Migration**: This is a critical path item with no recent updates.\n2. **API Rate Limiting**: High priority but currently blocked.\n\n*Recommendation:* Assign a senior engineer to the migration task immediately.`,
      vines: `**Conversation Risk Assessment:**\n\nScanning ${summary}...\n- The "Mobile Navigation" thread indicates potential scope creep.\n- "API Rate Limiting" discussion suggests unresolved architectural decisions.\n\n*Action:* Schedule a sync to finalize the rate limiting strategy.`,
      grapes: `**Grape Health Check:**\n\nAnalyzing ${summary}...\n- "API Documentation" is still 'growing' but linked tasks are nearing completion. This documentation lag creates integration risk.\n\n*Suggestion:* Prioritize documentation updates before the next release cycle.`,
      git: `**Codebase Risk Scan:**\n\nReviewing ${summary}...\n- The 'feature/auth-v2' branch has been stale for 5 days.\n- Multiple merges to 'main' without corresponding task updates.\n\n*Alert:* Ensure all code changes are linked to active tasks.`
    },
    'progress-analyst': {
      tasks: `**Progress Report:**\n\nCurrent velocity indicates a 15% increase week-over-week. With ${summary}, we are on track for the Q1 milestone.\n\n- **Completed:** 35%\n- **In Progress:** 45%\n- **To Do:** 20%\n\n*Forecast:* At this rate, all high-priority tasks will be cleared by Friday.`,
      vines: `**Communication Velocity:**\n\nActivity in ${summary} shows strong collaboration. Response times average < 2 hours.\n\n- Most active topic: "Homepage Hero Animation"\n- Least active: "Database Schema" (needs attention)`,
      grapes: `**Milestone Tracking:**\n\n${summary} shows solid progress on foundational items. "Design System Tokens" being 'ripe' is a great enabler for the frontend team.`,
      git: `**Commit Velocity:**\n\n${summary} shows healthy commit frequency. The 'main' branch is seeing 4-5 merges per day, indicating a continuous integration workflow is working well.`
    },
    'idea-generator': {
      tasks: `**Creative Suggestions:**\n\nLooking at ${summary}, here are 3 ideas:\n1. **Automated Testing**: Add a task to implement E2E tests for the new auth flow.\n2. **Dark Mode**: Since UI work is heavy, consider adding dark mode support now.\n3. **Performance Budget**: Add a task to establish baseline performance metrics.`,
      vines: `**Conversation Sparks:**\n\nThe discussion in ${summary} about "Mobile Nav" could be expanded to include gesture-based navigation. Have we considered a swipe-to-back interaction?`,
      grapes: `**Future Grapes:**\n\nBased on ${summary}, consider planting these new grapes:\n- "Performance Optimization Strategy"\n- "Accessibility Audit"\n- "Developer Experience Survey"`,
      git: `**Code Innovations:**\n\nReviewing ${summary}...\n- Consider adding a pre-commit hook for linting.\n- The 'feature/hero-animation' branch could benefit from a physics-based animation library trial.`
    },
    'security-auditor': {
      tasks: `**Security Review:**\n\nScanning ${summary}...\n- **Critical**: "Implement user authentication API" needs a security review before merge.\n- **Warning**: No tasks found for "Dependency Auditing".\n\n*Recommendation:* Add a recurring task for npm audit checks.`,
      vines: `**Security in Chat:**\n\nIn ${summary}, I noticed credentials might have been shared in "Database Schema Review". Please verify and rotate keys if necessary.\n\n*Reminder:* Never share secrets in chat.`,
      grapes: `**Governance Check:**\n\n${summary} indicates "API Documentation" is in progress. Ensure it includes a security section detailing auth scopes and rate limits.`,
      git: `**Repo Security Scan:**\n\nAnalyzing ${summary}...\n- Branch protection rules should be verified for 'main'.\n- Ensure no .env files are committed in recent history.`
    },
    'priority-optimizer': {
      tasks: `**Optimization Plan:**\n\nTo maximize impact based on ${summary}:\n1. Move "Optimize database queries" to **Urgent** (blocks API work).\n2. Downgrade "Create icon set" to **Low** (can use library placeholders).\n3. "Set up analytics" should be prioritized to establish baselines.`,
      vines: `**Focus Areas:**\n\nBased on ${summary}, the team is spending too much time on "Color Palette". Recommend time-boxing this discussion to focus on "API Rate Limiting".`,
      grapes: `**Harvest Strategy:**\n\nFocus on harvesting "MVP Feature List" first. It unblocks the most downstream work in ${summary}.`,
      git: `**Merge Priority:**\n\nPrioritize merging 'fix/accessibility' in ${summary} as it affects the most users. 'feature/mobile-nav' can wait until the next sprint.`
    }
  };

  const defaultAnalysis = `**Analysis for ${lens.name}:**\n\nI've analyzed the ${cardType} data (${summary}).\n\nEverything looks nominal. No specific anomalies detected for this lens category.`;

  return analyses[lensId]?.[cardType] || defaultAnalysis;
};