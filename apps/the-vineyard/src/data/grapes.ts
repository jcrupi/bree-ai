import { Grape } from '../types';

export const MOCK_GRAPES: Grape[] = [
// Project 1 Grapes
{
  id: 'grape-1',
  projectId: 'proj-1',
  title: 'Design System Tokens',
  status: 'ripe',
  description: 'Core color and typography tokens defined in Figma'
},
{
  id: 'grape-2',
  projectId: 'proj-1',
  title: 'API Documentation',
  status: 'growing',
  description: 'OpenAPI spec for the new endpoints'
},
{
  id: 'grape-3',
  projectId: 'proj-1',
  title: 'User Research Findings',
  status: 'harvested',
  description: 'Q1 user interview synthesis complete'
},

// Project 2 Grapes
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

// Project 3 Grapes
{
  id: 'grape-6',
  projectId: 'proj-3',
  title: 'Infrastructure Audit',
  status: 'growing',
  description: 'Review of current AWS spending and resource usage'
}];