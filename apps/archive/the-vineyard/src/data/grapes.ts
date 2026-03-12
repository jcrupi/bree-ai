import { Grape } from '../types';

export const MOCK_GRAPES: Grape[] = [
{
  id: 'grape-1',
  projectId: 'proj-1',
  title: 'Design System Tokens',
  status: 'ripe',
  description: 'Core color and typography tokens defined in Figma',
  agentxNoteId: 'ui-agentx-note',
  agentId: 'agent-ui-1',
  branchId: 'branch-1',
  directory: 'packages/ui-tokens',
  cliHistory: [
    { id: 'cli-1', command: 'npm run build:tokens', output: '✔ Tokens generated successfully\n✔ exported 42 color variables', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'success' }
  ],
  chatHistory: [
    { id: 'msg-1', conversationId: 'grape-1', senderId: 'agent-ui-1', senderName: 'UI Specialist', senderCategory: 'ai-special', content: 'I have updated the theme tokens to match the new branding guidelines.', timestamp: new Date(Date.now() - 7200000).toISOString() }
  ]
},
{
  id: 'grape-2',
  projectId: 'proj-1',
  title: 'API Documentation',
  status: 'growing',
  description: 'OpenAPI spec for the new endpoints',
  agentxNoteId: 'backend-agentx-note',
  agentId: 'agent-backend-1',
  branchId: 'branch-2',
  directory: 'apps/api/docs',
  cliHistory: [],
  chatHistory: []
},
{
  id: 'grape-3',
  projectId: 'proj-1',
  title: 'User Research Findings',
  status: 'harvested',
  description: 'Q1 user interview synthesis complete'
},
{
  id: 'grape-4',
  projectId: 'proj-2',
  title: 'Competitor Analysis',
  status: 'harvested',
  description: 'Review of top 3 competitors in the market'
},
{
  id: 'grape-5',
  projectId: 'proj-2',
  title: 'MVP Feature List',
  status: 'ripe',
  description: 'Prioritized list of features for launch'
},
{
  id: 'grape-6',
  projectId: 'proj-3',
  title: 'Infrastructure Audit',
  status: 'growing',
  description: 'Review of current AWS spending and resource usage'
}];