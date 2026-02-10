import { TeamMember } from '../types';
export const TEAM_MEMBERS: TeamMember[] = [
// Design Team Humans
{
  id: 'h1',
  name: 'John',
  role: 'Chief Technology Officer',
  category: 'human-design',
  status: 'online',
  skills: ['Architecture', 'Strategy', 'Tech Leadership'],
  avatar: 'JO',
  isAI: false
}, {
  id: 'h2',
  name: 'Mary',
  role: 'UX Design Lead',
  category: 'human-design',
  status: 'online',
  skills: ['User Research', 'Prototyping', 'Design Systems'],
  avatar: 'MA',
  isAI: false
}, {
  id: 'h3',
  name: 'Ingrid',
  role: 'Business Strategist',
  category: 'human-design',
  status: 'online',
  skills: ['Market Analysis', 'Growth', 'Partnerships'],
  avatar: 'IN',
  isAI: false
},
// Human AI Agents
{
  id: 'ha1',
  name: 'Sara',
  role: 'UX Specialist',
  category: 'human-ai',
  status: 'online',
  skills: ['User Research', 'Wireframing', 'Usability Testing'],
  avatar: 'SA',
  isAI: false
}, {
  id: 'ha2',
  name: 'Marcus',
  role: 'UI Specialist',
  category: 'human-ai',
  status: 'online',
  skills: ['React', 'Design Implementation', 'Component Systems'],
  avatar: 'MA',
  isAI: false
}, {
  id: 'ha3',
  name: 'Alex',
  role: 'Backend Specialist',
  category: 'human-ai',
  status: 'online',
  skills: ['APIs', 'Databases', 'System Architecture'],
  avatar: 'AL',
  isAI: false
},
// AI Special Agents
{
  id: 'ai1',
  name: 'ARIA',
  role: 'UI Agent',
  category: 'ai-special',
  status: 'active',
  skills: ['Component Gen', 'Style Optimization', 'A11y Audits'],
  isAI: true
}, {
  id: 'ai2',
  name: 'NEXUS',
  role: 'Backend Agent',
  category: 'ai-special',
  status: 'active',
  skills: ['API Design', 'Data Modeling', 'Performance Tuning'],
  isAI: true
}, {
  id: 'ai3',
  name: 'SENTINEL',
  role: 'Security Agent',
  category: 'ai-special',
  status: 'active',
  skills: ['Threat Detection', 'Auth Patterns', 'Vulnerability Scanning'],
  isAI: true
}];