import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Hash,
  Lock,
  MessageCircle,
  Users,
  Send,
  Search,
  Circle,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  AtSign,
  Smile,
  Phone,
  Video,
  Info,
  Bell,
  Settings,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────────────────────

type Platform = 'slack' | 'teams' | 'imessage';

interface SlackerChannel {
  id: string;
  platform: Platform;
  name: string;
  type: 'channel' | 'dm' | 'group';
  members?: string[];
  unread: number;
  lastMessage?: string;
  lastMessageTime?: string;
  isPrivate?: boolean;
  topic?: string;
}

interface SlackerMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  platform: Platform;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_CHANNELS: SlackerChannel[] = [
  // Slack
  { id: 'sl-general', platform: 'slack', name: 'general', type: 'channel', unread: 3, lastMessage: "anyone seen the new figma update?", lastMessageTime: '2:14 PM', topic: 'Company-wide announcements and work-based matters' },
  { id: 'sl-design', platform: 'slack', name: 'design', type: 'channel', unread: 1, lastMessage: "shipped the component library ✅", lastMessageTime: '1:30 PM', topic: 'Design system, mockups, and creative feedback' },
  { id: 'sl-dev', platform: 'slack', name: 'dev', type: 'channel', unread: 0, lastMessage: "PR looks good, merging", lastMessageTime: '12:05 PM', topic: 'Engineering discussions, deployments, and code reviews', isPrivate: true },
  { id: 'sl-bree-ai', platform: 'slack', name: 'bree-ai', type: 'channel', unread: 7, lastMessage: "new vine patterns are 🔥", lastMessageTime: '3:55 PM', topic: 'All things Bree AI' },
  { id: 'sl-dm-alex', platform: 'slack', name: 'Alex Chen', type: 'dm', unread: 2, lastMessage: "can you review the brief?", lastMessageTime: '11:47 AM' },
  { id: 'sl-dm-maria', platform: 'slack', name: 'Maria Santos', type: 'dm', unread: 0, lastMessage: "meeting pushed to 4pm", lastMessageTime: 'Yesterday' },
  // Teams
  { id: 'tm-general', platform: 'teams', name: 'General', type: 'channel', unread: 5, lastMessage: "Sprint planning is tomorrow at 10am", lastMessageTime: '3:02 PM', topic: 'General team communication' },
  { id: 'tm-product', platform: 'teams', name: 'Product Team', type: 'channel', unread: 0, lastMessage: "roadmap v2 updated", lastMessageTime: '10:15 AM', topic: 'Product roadmap, planning, and strategy' },
  { id: 'tm-engineering', platform: 'teams', name: 'Engineering', type: 'channel', unread: 1, lastMessage: "deploy pipeline fixed 🚀", lastMessageTime: 'Yesterday', topic: 'Engineering velocity and architecture', isPrivate: true },
  { id: 'tm-dm-jordan', platform: 'teams', name: 'Jordan Lee', type: 'dm', unread: 0, lastMessage: "great catch on that bug", lastMessageTime: 'Yesterday' },
  { id: 'tm-dm-pat', platform: 'teams', name: 'Pat Williams', type: 'dm', unread: 3, lastMessage: "quick sync?", lastMessageTime: '4:01 PM' },
  // iMessage
  { id: 'im-sarah', platform: 'imessage', name: 'Sarah K.', type: 'dm', unread: 1, lastMessage: "omw, 5 mins", lastMessageTime: '3:45 PM' },
  { id: 'im-family', platform: 'imessage', name: 'Family', type: 'group', members: ['Mom', 'Dad', 'Sibling'], unread: 4, lastMessage: "dinner at 7?", lastMessageTime: '1:22 PM' },
  { id: 'im-design-crew', platform: 'imessage', name: 'Design Crew', type: 'group', members: ['Alex', 'Kim', 'Pat'], unread: 0, lastMessage: "see you there!", lastMessageTime: 'Yesterday' },
  { id: 'im-mike', platform: 'imessage', name: 'Mike T.', type: 'dm', unread: 0, lastMessage: "lmk when you're free", lastMessageTime: 'Monday' },
];

const SEED_MESSAGES: Record<string, SlackerMessage[]> = {
  'sl-general': [
    { id: 'm1', channelId: 'sl-general', senderId: 'alex', senderName: 'Alex Chen', senderInitials: 'AC', content: 'Morning everyone 👋', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), isMe: false, platform: 'slack' },
    { id: 'm2', channelId: 'sl-general', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'Hey! How\'s everyone doing?', timestamp: new Date(Date.now() - 3600000 * 2.8).toISOString(), isMe: true, platform: 'slack' },
    { id: 'm3', channelId: 'sl-general', senderId: 'maria', senderName: 'Maria Santos', senderInitials: 'MS', content: 'Good! Just finished the weekly report 📊', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), isMe: false, platform: 'slack' },
    { id: 'm4', channelId: 'sl-general', senderId: 'alex', senderName: 'Alex Chen', senderInitials: 'AC', content: 'anyone seen the new figma update? the variables feature is absolutely 🔥', timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), isMe: false, platform: 'slack' },
  ],
  'sl-design': [
    { id: 'm1', channelId: 'sl-design', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'Design system v2 is looking really clean — great work team', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), isMe: true, platform: 'slack' },
    { id: 'm2', channelId: 'sl-design', senderId: 'kim', senderName: 'Kim Park', senderInitials: 'KP', content: 'Agreed! The spacing token system especially makes things so much faster', timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(), isMe: false, platform: 'slack' },
    { id: 'm3', channelId: 'sl-design', senderId: 'alex', senderName: 'Alex Chen', senderInitials: 'AC', content: 'Just finished the button variants. Pushing to the shared library now', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), isMe: false, platform: 'slack' },
    { id: 'm4', channelId: 'sl-design', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'Shipped the component library ✅', timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString(), isMe: true, platform: 'slack' },
  ],
  'sl-dev': [
    { id: 'm1', channelId: 'sl-dev', senderId: 'jordan', senderName: 'Jordan Lee', senderInitials: 'JL', content: 'Opened PR #142 — bun build pipeline improvements', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), isMe: false, platform: 'slack' },
    { id: 'm2', channelId: 'sl-dev', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'Reviewing now, looks solid. Left a couple inline comments', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), isMe: true, platform: 'slack' },
    { id: 'm3', channelId: 'sl-dev', senderId: 'jordan', senderName: 'Jordan Lee', senderInitials: 'JL', content: 'PR looks good, merging 🚀', timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), isMe: false, platform: 'slack' },
  ],
  'sl-bree-ai': [
    { id: 'm1', channelId: 'sl-bree-ai', senderId: 'pat', senderName: 'Pat Williams', senderInitials: 'PW', content: 'The new vine conversation UI is incredible. The overlapping bubbles are such a nice touch', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), isMe: false, platform: 'slack' },
    { id: 'm2', channelId: 'sl-bree-ai', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'Thanks! We\'re adding Slack + Teams + iMessage support now through TeamSlacker 🎉', timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(), isMe: true, platform: 'slack' },
    { id: 'm3', channelId: 'sl-bree-ai', senderId: 'alex', senderName: 'Alex Chen', senderInitials: 'AC', content: 'new vine patterns are 🔥 love the unified inbox concept', timestamp: new Date(Date.now() - 3600000 * 0.2).toISOString(), isMe: false, platform: 'slack' },
  ],
  'sl-dm-alex': [
    { id: 'm1', channelId: 'sl-dm-alex', senderId: 'alex', senderName: 'Alex Chen', senderInitials: 'AC', content: 'Hey, quick question about the mockups from last week', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), isMe: false, platform: 'slack' },
    { id: 'm2', channelId: 'sl-dm-alex', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'Sure, what\'s up?', timestamp: new Date(Date.now() - 3600000 * 4.9).toISOString(), isMe: true, platform: 'slack' },
    { id: 'm3', channelId: 'sl-dm-alex', senderId: 'alex', senderName: 'Alex Chen', senderInitials: 'AC', content: 'Can you review the brief? I want your thoughts before the client call tomorrow', timestamp: new Date(Date.now() - 3600000 * 0.3).toISOString(), isMe: false, platform: 'slack' },
  ],
  'sl-dm-maria': [
    { id: 'm1', channelId: 'sl-dm-maria', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'Are we still on for 3pm?', timestamp: new Date(Date.now() - 86400000).toISOString(), isMe: true, platform: 'slack' },
    { id: 'm2', channelId: 'sl-dm-maria', senderId: 'maria', senderName: 'Maria Santos', senderInitials: 'MS', content: 'Meeting pushed to 4pm — something came up on my end. Sorry!', timestamp: new Date(Date.now() - 86400000 + 3600000).toISOString(), isMe: false, platform: 'slack' },
  ],
  'tm-general': [
    { id: 'm1', channelId: 'tm-general', senderId: 'pat', senderName: 'Pat Williams', senderInitials: 'PW', content: 'Good morning team! Reminder that Q2 OKR reviews are this Friday', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), isMe: false, platform: 'teams' },
    { id: 'm2', channelId: 'tm-general', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'Confirmed, I\'ll have the velocity charts ready', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), isMe: true, platform: 'teams' },
    { id: 'm3', channelId: 'tm-general', senderId: 'jordan', senderName: 'Jordan Lee', senderInitials: 'JL', content: 'Sprint planning is tomorrow at 10am — don\'t forget!', timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), isMe: false, platform: 'teams' },
    { id: 'm4', channelId: 'tm-general', senderId: 'pat', senderName: 'Pat Williams', senderInitials: 'PW', content: 'Same, adding 3 stories from the backlog', timestamp: new Date(Date.now() - 3600000 * 0.2).toISOString(), isMe: false, platform: 'teams' },
  ],
  'tm-product': [
    { id: 'm1', channelId: 'tm-product', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'Updated the roadmap with the TeamSlacker integration milestone', timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), isMe: true, platform: 'teams' },
    { id: 'm2', channelId: 'tm-product', senderId: 'jordan', senderName: 'Jordan Lee', senderInitials: 'JL', content: 'Looks great! The Q3 timeline seems achievable', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), isMe: false, platform: 'teams' },
    { id: 'm3', channelId: 'tm-product', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'roadmap v2 updated — added capacity planning section', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), isMe: true, platform: 'teams' },
  ],
  'tm-dm-jordan': [
    { id: 'm1', channelId: 'tm-dm-jordan', senderId: 'jordan', senderName: 'Jordan Lee', senderInitials: 'JL', content: 'The fix for the null pointer in the vine hook is really elegant', timestamp: new Date(Date.now() - 86400000).toISOString(), isMe: false, platform: 'teams' },
    { id: 'm2', channelId: 'tm-dm-jordan', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'Thanks! Took a while to track that one down', timestamp: new Date(Date.now() - 86400000 + 1800000).toISOString(), isMe: true, platform: 'teams' },
    { id: 'm3', channelId: 'tm-dm-jordan', senderId: 'jordan', senderName: 'Jordan Lee', senderInitials: 'JL', content: 'Great catch on that bug', timestamp: new Date(Date.now() - 86400000 + 3600000).toISOString(), isMe: false, platform: 'teams' },
  ],
  'tm-dm-pat': [
    { id: 'm1', channelId: 'tm-dm-pat', senderId: 'pat', senderName: 'Pat Williams', senderInitials: 'PW', content: 'quick sync?', timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), isMe: false, platform: 'teams' },
  ],
  'im-sarah': [
    { id: 'm1', channelId: 'im-sarah', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'Heading to the coffee shop, you coming?', timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), isMe: true, platform: 'imessage' },
    { id: 'm2', channelId: 'im-sarah', senderId: 'sarah', senderName: 'Sarah K.', senderInitials: 'SK', content: 'omw, 5 mins', timestamp: new Date(Date.now() - 3600000 * 0.1).toISOString(), isMe: false, platform: 'imessage' },
  ],
  'im-family': [
    { id: 'm1', channelId: 'im-family', senderId: 'mom', senderName: 'Mom', senderInitials: 'M', content: 'Who\'s free for dinner this week? 🍝', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), isMe: false, platform: 'imessage' },
    { id: 'm2', channelId: 'im-family', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'Thursday works for me!', timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(), isMe: true, platform: 'imessage' },
    { id: 'm3', channelId: 'im-family', senderId: 'dad', senderName: 'Dad', senderInitials: 'D', content: 'Dinner at 7?', timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), isMe: false, platform: 'imessage' },
  ],
  'im-design-crew': [
    { id: 'm1', channelId: 'im-design-crew', senderId: 'alex', senderName: 'Alex', senderInitials: 'A', content: 'Who\'s going to the Dribbble meetup tonight?', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), isMe: false, platform: 'imessage' },
    { id: 'm2', channelId: 'im-design-crew', senderId: 'me', senderName: 'You', senderInitials: 'ME', content: 'I\'ll be there!', timestamp: new Date(Date.now() - 86400000 * 1.4).toISOString(), isMe: true, platform: 'imessage' },
    { id: 'm3', channelId: 'im-design-crew', senderId: 'kim', senderName: 'Kim', senderInitials: 'K', content: 'see you there!', timestamp: new Date(Date.now() - 86400000 * 1.3).toISOString(), isMe: false, platform: 'imessage' },
  ],
  'im-mike': [
    { id: 'm1', channelId: 'im-mike', senderId: 'mike', senderName: 'Mike T.', senderInitials: 'MT', content: 'lmk when you\'re free to grab lunch', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), isMe: false, platform: 'imessage' },
  ],
};

// ─── Platform Config ─────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<Platform, {
  label: string;
  color: string;
  bgDark: string;
  bgMid: string;
  border: string;
  bubble: { me: string; them: string };
  avatar: { me: string; them: string };
  accentGradient: string;
  icon: React.ReactNode;
}> = {
  slack: {
    label: 'Slack',
    color: '#E01E5A',
    bgDark: '#1a0a1c',
    bgMid: '#2a1630',
    border: '#4A154B',
    bubble: {
      me: 'rgba(74, 21, 75, 0.18)',
      them: 'rgba(255,255,255,0.04)',
    },
    avatar: { me: '#4A154B', them: '#E01E5A' },
    accentGradient: 'linear-gradient(135deg, #4A154B 0%, #E01E5A 100%)',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
      </svg>
    ),
  },
  teams: {
    label: 'Teams',
    color: '#6264A7',
    bgDark: '#0d0d1a',
    bgMid: '#1a1a2e',
    border: '#6264A7',
    bubble: {
      me: 'rgba(98, 100, 167, 0.22)',
      them: 'rgba(255,255,255,0.04)',
    },
    avatar: { me: '#6264A7', them: '#464775' },
    accentGradient: 'linear-gradient(135deg, #464775 0%, #6264A7 100%)',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M20.625 7.5h-3.75V6a.375.375 0 0 0-.375-.375H14.25A.375.375 0 0 0 13.875 6v1.5H10.5A.375.375 0 0 0 10.125 7.875v9.75A.375.375 0 0 0 10.5 18h10.125a.375.375 0 0 0 .375-.375V7.875A.375.375 0 0 0 20.625 7.5zM14.625 6.375h1.5v1.125h-1.5V6.375zm5.625 11.25H10.875V8.25h9.375v9.375zM8.25 9H3.375A.375.375 0 0 0 3 9.375v8.25A.375.375 0 0 0 3.375 18H8.25A.375.375 0 0 0 8.625 17.625V9.375A.375.375 0 0 0 8.25 9zm-.375 8.25H3.75V9.75h4.125v7.5zM6 7.5A1.875 1.875 0 1 0 6 3.75 1.875 1.875 0 0 0 6 7.5zm0-3a1.125 1.125 0 1 1 0 2.25A1.125 1.125 0 0 1 6 4.5z" />
      </svg>
    ),
  },
  imessage: {
    label: 'iMessage',
    color: '#34C759',
    bgDark: '#0a1a0f',
    bgMid: '#122018',
    border: '#1c3a28',
    bubble: {
      me: 'rgba(52, 199, 89, 0.15)',
      them: 'rgba(255,255,255,0.04)',
    },
    avatar: { me: '#34C759', them: '#2d9e48' },
    accentGradient: 'linear-gradient(135deg, #1c8e3a 0%, #34C759 100%)',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21l4.144-.839A9.958 9.958 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.952 7.952 0 0 1-4.073-1.116l-.291-.174-3.013.61.622-2.939-.19-.304A7.967 7.967 0 0 1 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" />
      </svg>
    ),
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 24) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function totalUnread(platform: Platform): number {
  return MOCK_CHANNELS.filter(c => c.platform === platform).reduce((s, c) => s + c.unread, 0);
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function PlatformTab({ platform, active, onClick }: {
  platform: Platform;
  active: boolean;
  onClick: () => void;
}) {
  const cfg = PLATFORM_CONFIG[platform];
  const unread = totalUnread(platform);
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active ? 'text-white' : 'text-white/40 hover:text-white/70'
      }`}
      style={active ? {
        background: cfg.accentGradient,
        boxShadow: `0 2px 12px ${cfg.color}40`,
      } : undefined}
    >
      <span style={{ color: active ? 'white' : cfg.color }}>
        {cfg.icon}
      </span>
      <span>{cfg.label}</span>
      {unread > 0 && (
        <span
          className="min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
          style={{ background: active ? 'rgba(255,255,255,0.25)' : cfg.color, color: 'white' }}
        >
          {unread}
        </span>
      )}
    </button>
  );
}

function ChannelItem({ channel, active, onClick }: {
  channel: SlackerChannel;
  active: boolean;
  onClick: () => void;
}) {
  const cfg = PLATFORM_CONFIG[channel.platform];
  const isDM = channel.type === 'dm' || channel.type === 'group';
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 group ${
        active ? 'text-white' : 'text-white/50 hover:text-white/80'
      }`}
      style={active ? {
        background: `${cfg.color}20`,
        border: `1px solid ${cfg.color}30`,
      } : { border: '1px solid transparent' }}
    >
      <span className={`flex-shrink-0 text-xs ${active ? '' : 'opacity-60'}`} style={{ color: cfg.color }}>
        {isDM ? (
          channel.type === 'group' ? <Users size={13} /> : <AtSign size={13} />
        ) : (
          channel.isPrivate ? <Lock size={13} /> : <Hash size={13} />
        )}
      </span>
      <span className={`flex-1 truncate text-sm ${active ? 'font-semibold' : 'font-normal'}`}>
        {channel.name}
      </span>
      {channel.unread > 0 && (
        <span
          className="min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0"
          style={{ background: cfg.color, color: 'white' }}
        >
          {channel.unread}
        </span>
      )}
    </button>
  );
}

interface MessageBubbleProps {
  msg: SlackerMessage;
  idx: number;
  cfg: typeof PLATFORM_CONFIG[Platform];
}

function MessageBubble({ msg, idx, cfg }: MessageBubbleProps) {
  const isMe = msg.isMe;
  const marginTop = idx === 0 ? 0 : -20;

  return (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.07, 0.5), duration: 0.4, ease: 'easeOut' }}
      style={{ marginTop }}
      className={`flex w-full gap-3 ${isMe ? 'justify-end flex-row-reverse pl-[15%]' : 'justify-start pr-[15%]'}`}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm z-20 mt-1 flex-shrink-0"
        style={{
          background: isMe ? cfg.accentGradient : `${cfg.color}55`,
          boxShadow: `0 3px 12px ${cfg.color}30`,
        }}
      >
        {msg.senderInitials}
      </div>

      {/* Body */}
      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-0 flex-1 z-10`}>
        {/* Meta */}
        <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>
            {msg.senderName}
          </span>
          <span className="text-[10px] text-white/25">
            {formatTime(msg.timestamp)}
          </span>
        </div>

        {/* Bubble */}
        <div
          className="relative p-3.5 text-sm leading-relaxed text-white/85 transition-all hover:brightness-110"
          style={{
            background: isMe ? cfg.bubble.me : cfg.bubble.them,
            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            border: isMe
              ? `1.5px solid ${cfg.color}35`
              : '1.5px solid rgba(255,255,255,0.06)',
            boxShadow: isMe
              ? `0 2px 14px ${cfg.color}20`
              : '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {/* Side accent */}
          {isMe ? (
            <div
              className="absolute top-0 right-0 w-[3px] h-full rounded-r-[4px]"
              style={{ background: cfg.accentGradient, opacity: 0.5 }}
            />
          ) : (
            <div
              className="absolute top-0 left-0 w-[3px] h-full rounded-l-[4px]"
              style={{ background: `${cfg.color}80`, opacity: 0.6 }}
            />
          )}
          {msg.content}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TeamSlackerPage() {
  const [activePlatform, setActivePlatform] = useState<Platform>('slack');
  const [activeChannelId, setActiveChannelId] = useState<string>('sl-general');
  const [messages, setMessages] = useState<Record<string, SlackerMessage[]>>(SEED_MESSAGES);
  const [input, setInput] = useState('');
  const [channelUnreads, setChannelUnreads] = useState<Record<string, number>>(
    () => Object.fromEntries(MOCK_CHANNELS.map(c => [c.id, c.unread]))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfo, setShowInfo] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    channels: true, dms: true,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cfg = PLATFORM_CONFIG[activePlatform];
  const platformChannels = MOCK_CHANNELS.filter(c => {
    if (c.platform !== activePlatform) return false;
    if (!searchQuery) return true;
    return c.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const publicChannels = platformChannels.filter(c => c.type === 'channel');
  const dmChannels = platformChannels.filter(c => c.type === 'dm' || c.type === 'group');
  const activeChannel = MOCK_CHANNELS.find(c => c.id === activeChannelId);
  const activeMessages = messages[activeChannelId] || [];

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChannelId, messages]);

  // Clear unread when channel opened
  const handleSelectChannel = useCallback((id: string) => {
    setActiveChannelId(id);
    setChannelUnreads(prev => ({ ...prev, [id]: 0 }));
  }, []);

  // Switch platform → auto-select first channel
  const handlePlatformSwitch = useCallback((p: Platform) => {
    setActivePlatform(p);
    const first = MOCK_CHANNELS.find(c => c.platform === p);
    if (first) {
      setActiveChannelId(first.id);
      setChannelUnreads(prev => ({ ...prev, [first.id]: 0 }));
    }
    setSearchQuery('');
  }, []);

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || !activeChannelId) return;
    const newMsg: SlackerMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channelId: activeChannelId,
      senderId: 'me',
      senderName: 'You',
      senderInitials: 'ME',
      content,
      timestamp: new Date().toISOString(),
      isMe: true,
      platform: activePlatform,
    };
    setMessages(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newMsg],
    }));
    setInput('');
    inputRef.current?.focus();
  }, [input, activeChannelId, activePlatform]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getChannelUnread = (id: string) => channelUnreads[id] ?? 0;

  return (
    <div
      className="min-h-screen flex flex-col text-white overflow-hidden"
      style={{ background: cfg.bgDark }}
    >
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 20% 0%, ${cfg.color}12 0%, transparent 60%),
                       radial-gradient(ellipse at 80% 100%, ${cfg.color}08 0%, transparent 50%)`,
        }}
      />

      {/* Vine SVG spine (background decoration) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex justify-center opacity-10">
        <svg width="100%" height="100%">
          <path
            d="M50%,0 Q52%,200 50%,400 Q48%,600 50%,800 Q52%,1000 50%,1200"
            fill="none"
            stroke={cfg.color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Top Nav */}
      <nav
        className="relative z-20 flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${cfg.color}25`, background: `${cfg.bgDark}e0`, backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: `${cfg.color}cc` }}
          >
            <ArrowLeft size={18} />
            <span>Vineyard</span>
          </Link>

          <div className="w-px h-5 opacity-20" style={{ background: cfg.color }} />

          {/* Platform Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['slack', 'teams', 'imessage'] as Platform[]).map(p => (
              <PlatformTab
                key={p}
                platform={p}
                active={activePlatform === p}
                onClick={() => handlePlatformSwitch(p)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Vine status indicator */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`, color: cfg.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
            Vine Active
          </div>
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/70">
            <Bell size={16} />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/70">
            <Settings size={16} />
          </button>
        </div>
      </nav>

      {/* Main layout */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ── Left: Channel Sidebar ─────────────────────────────────── */}
        <div
          className="w-64 flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            borderRight: `1px solid ${cfg.color}20`,
            background: `${cfg.bgMid}cc`,
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Workspace header */}
          <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${cfg.color}15` }}>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.accentGradient }}
              >
                <span style={{ color: 'white' }}>{cfg.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">Bree AI</p>
                <p className="text-[10px]" style={{ color: cfg.color }}>
                  {cfg.label} Workspace
                </p>
              </div>
              <ChevronDown size={14} className="ml-auto text-white/30 flex-shrink-0" />
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-3 flex-shrink-0">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Search size={13} className="text-white/30 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search channels…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white/70 placeholder-white/25 outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-white/30 hover:text-white/60">
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Channel List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4 space-y-4">
            {/* Channels Section */}
            {publicChannels.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('channels')}
                  className="flex items-center gap-1 w-full px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-white/30 hover:text-white/50 transition-colors"
                >
                  <ChevronRight
                    size={10}
                    className={`transition-transform ${expandedSections.channels ? 'rotate-90' : ''}`}
                  />
                  Channels
                </button>
                <AnimatePresence initial={false}>
                  {expandedSections.channels && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-1 space-y-0.5"
                    >
                      {publicChannels.map(ch => (
                        <ChannelItem
                          key={ch.id}
                          channel={{ ...ch, unread: getChannelUnread(ch.id) }}
                          active={activeChannelId === ch.id}
                          onClick={() => handleSelectChannel(ch.id)}
                        />
                      ))}
                      <button
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-white/25 hover:text-white/50 transition-colors rounded-lg hover:bg-white/4"
                      >
                        <Plus size={11} />
                        Add channel
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* DMs Section */}
            {dmChannels.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('dms')}
                  className="flex items-center gap-1 w-full px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-white/30 hover:text-white/50 transition-colors"
                >
                  <ChevronRight
                    size={10}
                    className={`transition-transform ${expandedSections.dms ? 'rotate-90' : ''}`}
                  />
                  Direct Messages
                </button>
                <AnimatePresence initial={false}>
                  {expandedSections.dms && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-1 space-y-0.5"
                    >
                      {dmChannels.map(ch => (
                        <ChannelItem
                          key={ch.id}
                          channel={{ ...ch, unread: getChannelUnread(ch.id) }}
                          active={activeChannelId === ch.id}
                          onClick={() => handleSelectChannel(ch.id)}
                        />
                      ))}
                      <button
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-white/25 hover:text-white/50 transition-colors rounded-lg"
                      >
                        <Plus size={11} />
                        New message
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {searchQuery && publicChannels.length === 0 && dmChannels.length === 0 && (
              <p className="text-center text-xs text-white/25 py-8">No results for "{searchQuery}"</p>
            )}
          </div>
        </div>

        {/* ── Center: Vine Conversation ─────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {activeChannel ? (
            <>
              {/* Channel Header */}
              <div
                className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
                style={{
                  borderBottom: `1px solid ${cfg.color}20`,
                  background: `${cfg.bgMid}80`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span style={{ color: cfg.color }}>
                    {activeChannel.type === 'channel' ? (
                      activeChannel.isPrivate ? <Lock size={16} /> : <Hash size={16} />
                    ) : activeChannel.type === 'group' ? (
                      <Users size={16} />
                    ) : (
                      <AtSign size={16} />
                    )}
                  </span>
                  <h2 className="font-bold text-white text-base truncate">
                    {activeChannel.name}
                  </h2>
                  {activeChannel.topic && (
                    <>
                      <span className="text-white/20">·</span>
                      <p className="text-xs text-white/35 truncate hidden sm:block">
                        {activeChannel.topic}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {activeChannel.type !== 'imessage' && (
                    <>
                      <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-white/60">
                        <Phone size={15} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-white/60">
                        <Video size={15} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowInfo(v => !v)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    style={{ color: showInfo ? cfg.color : 'rgba(255,255,255,0.3)' }}
                  >
                    <Info size={15} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar relative px-6 py-6"
              >
                {/* Vine spine background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center opacity-20">
                  <svg width="100%" height="100%">
                    <path
                      d="M50%,0 Q53%,150 50%,300 Q47%,450 50%,600 Q53%,750 50%,900 Q47%,1050 50%,1200"
                      fill="none"
                      stroke={cfg.color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {activeMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: `${cfg.color}20` }}
                    >
                      <MessageCircle size={26} style={{ color: cfg.color }} />
                    </div>
                    <p className="text-white/40 text-sm">No messages yet</p>
                    <p className="text-white/20 text-xs mt-1">
                      Start the conversation in #{activeChannel.name}
                    </p>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col max-w-3xl mx-auto pb-4">
                    <AnimatePresence initial={false}>
                      {activeMessages.map((msg, idx) => (
                        <MessageBubble
                          key={msg.id}
                          msg={msg}
                          idx={idx}
                          cfg={cfg}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <div
                className="px-6 py-4 flex-shrink-0"
                style={{ borderTop: `1px solid ${cfg.color}15`, background: `${cfg.bgMid}90` }}
              >
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    border: `1.5px solid ${cfg.color}30`,
                    background: 'rgba(255,255,255,0.04)',
                    boxShadow: `0 2px 20px ${cfg.color}10`,
                  }}
                >
                  <button className="text-white/25 hover:text-white/50 transition-colors flex-shrink-0">
                    <Plus size={18} />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeChannel.type === 'channel' ? '#' : ''}${activeChannel.name}…`}
                    className="flex-1 bg-transparent text-sm text-white/85 placeholder-white/20 outline-none"
                  />
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/25 hover:text-white/50">
                      <Smile size={16} />
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:scale-105 active:scale-95"
                      style={{
                        background: input.trim() ? cfg.accentGradient : 'rgba(255,255,255,0.08)',
                        boxShadow: input.trim() ? `0 4px 14px ${cfg.color}40` : 'none',
                      }}
                    >
                      <Send size={15} color="white" className="ml-0.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-center mt-2" style={{ color: `${cfg.color}60` }}>
                  TeamSlacker Vine ·{' '}
                  <span style={{ color: cfg.color }}>
                    {cfg.label} Connected
                  </span>
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/20 text-sm">Select a channel to begin</p>
            </div>
          )}
        </div>

        {/* ── Right: Channel Info Panel ─────────────────────────────── */}
        <AnimatePresence>
          {showInfo && activeChannel && (
            <motion.div
              key="info-panel"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="w-64 flex-shrink-0 overflow-y-auto custom-scrollbar"
              style={{
                borderLeft: `1px solid ${cfg.color}20`,
                background: `${cfg.bgMid}cc`,
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Panel Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${cfg.color}15` }}
              >
                <span className="text-sm font-bold text-white/80">Details</span>
                <button
                  onClick={() => setShowInfo(false)}
                  className="text-white/25 hover:text-white/60 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Channel identity */}
              <div className="px-5 py-5" style={{ borderBottom: `1px solid ${cfg.color}15` }}>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-white"
                  style={{ background: cfg.accentGradient, boxShadow: `0 4px 16px ${cfg.color}40` }}
                >
                  {activeChannel.type === 'channel'
                    ? (activeChannel.isPrivate ? <Lock size={20} /> : <Hash size={20} />)
                    : activeChannel.type === 'group'
                    ? <Users size={20} />
                    : <AtSign size={20} />}
                </div>
                <h3 className="font-bold text-white text-base">{activeChannel.name}</h3>
                {activeChannel.topic && (
                  <p className="text-xs text-white/35 mt-1 leading-relaxed">{activeChannel.topic}</p>
                )}
              </div>

              {/* Platform badge */}
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${cfg.color}15` }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">Platform</p>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}30`, color: cfg.color }}
                >
                  {cfg.icon}
                  {cfg.label}
                </div>
              </div>

              {/* Members (group/channel) */}
              {(activeChannel.type === 'channel' || activeChannel.type === 'group') && (
                <div className="px-5 py-4" style={{ borderBottom: `1px solid ${cfg.color}15` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">
                    Members
                    {activeChannel.members && ` · ${activeChannel.members.length}`}
                  </p>
                  {activeChannel.members ? (
                    <div className="space-y-2">
                      {activeChannel.members.map(m => (
                        <div key={m} className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: `${cfg.color}60` }}
                          >
                            {m[0]}
                          </div>
                          <span className="text-xs text-white/55">{m}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Users size={13} style={{ color: cfg.color }} />
                      <span className="text-xs text-white/35">Team channel</span>
                    </div>
                  )}
                </div>
              )}

              {/* Message count */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Vine Stats</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Messages</span>
                    <span className="text-xs font-bold" style={{ color: cfg.color }}>
                      {activeMessages.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Type</span>
                    <span className="text-xs text-white/55 capitalize">{activeChannel.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Access</span>
                    <span className="text-xs text-white/55">
                      {activeChannel.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
