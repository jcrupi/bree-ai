import { VineConversation, VineMessage } from '../types';

export const VINE_CONVERSATIONS: VineConversation[] = [
{
  id: 'vine-1',
  projectId: 'proj-1',
  topic: 'Homepage Hero Animation',
  participants: ['h2', 'ha2'],
  lastActivity: '2024-02-06T14:30:00Z',
  unreadCount: 2,
  specialties: ['ui', 'ux'],
  taskIds: ['task-5', 'task-6'],
  messages: [
  {
    id: 'm1',
    conversationId: 'vine-1',
    senderId: 'h2',
    senderName: 'Mary',
    senderCategory: 'human-design',
    content:
    'Hey Marcus, I was thinking about the hero section animation. Can we make it more subtle?',
    timestamp: '2024-02-06T14:15:00Z'
  },
  {
    id: 'm2',
    conversationId: 'vine-1',
    senderId: 'ha2',
    senderName: 'Marcus',
    senderCategory: 'human-ai',
    content:
    'Sure Mary! I can adjust the easing curve. Did you have a specific reference in mind?',
    timestamp: '2024-02-06T14:20:00Z'
  },
  {
    id: 'm3',
    conversationId: 'vine-1',
    senderId: 'h2',
    senderName: 'Mary',
    senderCategory: 'human-design',
    content: 'Think "floating feather" rather than "bouncing ball".',
    timestamp: '2024-02-06T14:22:00Z'
  },
  {
    id: 'm4',
    conversationId: 'vine-1',
    senderId: 'ha2',
    senderName: 'Marcus',
    senderCategory: 'human-ai',
    content:
    'Got it. I will switch to a spring physics model with high damping. Give me 10 mins.',
    timestamp: '2024-02-06T14:30:00Z'
  }]

},
{
  id: 'vine-2',
  projectId: 'proj-1',
  topic: 'Database Schema Review',
  participants: ['h1', 'ha3'],
  lastActivity: '2024-02-06T11:00:00Z',
  unreadCount: 0,
  specialties: ['database', 'backend'],
  taskIds: ['task-2', 'task-4'],
  messages: [
  {
    id: 'm1',
    conversationId: 'vine-2',
    senderId: 'h1',
    senderName: 'John',
    senderCategory: 'human-design',
    content:
    'Alex, are we using a relational model for the user preferences?',
    timestamp: '2024-02-06T10:45:00Z'
  },
  {
    id: 'm2',
    conversationId: 'vine-2',
    senderId: 'ha3',
    senderName: 'Alex',
    senderCategory: 'human-ai',
    content:
    'I was planning on JSONB for flexibility, since the preferences schema changes often.',
    timestamp: '2024-02-06T10:50:00Z'
  },
  {
    id: 'm3',
    conversationId: 'vine-2',
    senderId: 'h1',
    senderName: 'John',
    senderCategory: 'human-design',
    content: 'Good call. Just make sure we index the frequent query paths.',
    timestamp: '2024-02-06T11:00:00Z'
  }]

},
{
  id: 'vine-3',
  projectId: 'proj-1',
  topic: 'Mobile Navigation',
  participants: ['h2', 'ha1'],
  lastActivity: '2024-02-05T16:45:00Z',
  unreadCount: 1,
  specialties: ['ux', 'ui'],
  taskIds: ['task-14', 'task-15'],
  messages: [
  {
    id: 'm1',
    conversationId: 'vine-3',
    senderId: 'ha1',
    senderName: 'Sara',
    senderCategory: 'human-ai',
    content: 'Mary, the mobile menu touch targets feel a bit small on iOS.',
    timestamp: '2024-02-05T16:30:00Z'
  },
  {
    id: 'm2',
    conversationId: 'vine-3',
    senderId: 'h2',
    senderName: 'Mary',
    senderCategory: 'human-design',
    content:
    'Oh? They should be 44px minimum. Let me check the Figma file.',
    timestamp: '2024-02-05T16:35:00Z'
  },
  {
    id: 'm3',
    conversationId: 'vine-3',
    senderId: 'ha1',
    senderName: 'Sara',
    senderCategory: 'human-ai',
    content:
    'The implementation rendered at 38px due to padding. I will bump the padding.',
    timestamp: '2024-02-05T16:45:00Z'
  }]

},
{
  id: 'vine-4',
  projectId: 'proj-1',
  topic: 'API Rate Limiting',
  participants: ['h1', 'ha3'],
  lastActivity: '2024-02-04T09:15:00Z',
  unreadCount: 0,
  specialties: ['backend', 'devops', 'security'],
  taskIds: ['task-1', 'task-3', 'task-13'],
  messages: [
  {
    id: 'm1',
    conversationId: 'vine-4',
    senderId: 'ha3',
    senderName: 'Alex',
    senderCategory: 'human-ai',
    content: 'We are hitting rate limits on the external image service.',
    timestamp: '2024-02-04T09:00:00Z'
  },
  {
    id: 'm2',
    conversationId: 'vine-4',
    senderId: 'h1',
    senderName: 'John',
    senderCategory: 'human-design',
    content: 'Implement a caching layer? Redis should handle it.',
    timestamp: '2024-02-04T09:05:00Z'
  },
  {
    id: 'm3',
    conversationId: 'vine-4',
    senderId: 'ha3',
    senderName: 'Alex',
    senderCategory: 'human-ai',
    content: 'On it. Will set TTL to 1 hour.',
    timestamp: '2024-02-04T09:15:00Z'
  }]

},
{
  id: 'vine-5',
  projectId: 'proj-1',
  topic: 'Color Palette Accessibility',
  participants: ['h2', 'ha2'],
  lastActivity: '2024-02-03T13:20:00Z',
  unreadCount: 0,
  specialties: ['ui', 'governance'],
  taskIds: ['task-14', 'task-7'],
  messages: [
  {
    id: 'm1',
    conversationId: 'vine-5',
    senderId: 'h2',
    senderName: 'Mary',
    senderCategory: 'human-design',
    content: 'The secondary blue text on gray background fails WCAG AA.',
    timestamp: '2024-02-03T13:00:00Z'
  },
  {
    id: 'm2',
    conversationId: 'vine-5',
    senderId: 'ha2',
    senderName: 'Marcus',
    senderCategory: 'human-ai',
    content: 'I see it. Contrast ratio is 3.8:1. Needs to be 4.5:1.',
    timestamp: '2024-02-03T13:10:00Z'
  },
  {
    id: 'm3',
    conversationId: 'vine-5',
    senderId: 'ha2',
    senderName: 'Marcus',
    senderCategory: 'human-ai',
    content: 'Darkening the blue to #2563EB fixes it.',
    timestamp: '2024-02-03T13:20:00Z'
  }]

}];