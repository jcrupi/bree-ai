import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Cpu, Shield, Search, MessageSquare, Layers, BoxIcon, Brain, Zap, Radio, Lock, Star, X, ChevronRight } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useAgentTasks } from '../hooks/useAgentTasks';
import { useLensDropZone } from '../hooks/useAILens';

// ─── Types ────────────────────────────────────────────────────────────────────
type LayoutId = 'layered' | 'radial' | 'horizontal' | 'grid';
interface Route { method: string; path: string; desc: string; auth?: boolean; }
interface NodeDef {
  id: string; label: string; sublabel: string; icon: React.ElementType;
  color: string; bgColor: string; borderColor: string; tech: string[];
  description: string; routes: Route[];
}
interface Edge { from: string; to: string; dashed?: boolean; color?: string; }

// ─── Node Data ────────────────────────────────────────────────────────────────
const NODES: NodeDef[] = [
  { id: 'kat-ai', label: 'KAT.ai', sublabel: 'Knowledge AI', icon: MessageSquare, color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#bfdbfe', tech: ['React', 'Vite', 'Eden'],
    description: 'Document Q&A with RAG search. Users chat with their documents; all answers grounded in uploaded content.',
    routes: [
      { method: 'GET', path: '/', desc: 'Chat interface + login gate' },
      { method: 'GET', path: '/admin', desc: 'Admin settings panel' },
    ]},
  { id: 'habitaware', label: 'HabitAware', sublabel: 'Behavioral AI', icon: Brain, color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#ddd6fe', tech: ['React', 'Vite'],
    description: 'Habit-change coaching powered by Keen2 bracelet data and AI awareness tools.',
    routes: [{ method: 'GET', path: '/', desc: 'Coaching chat interface' }]},
  { id: 'vineyard', label: 'The Vineyard', sublabel: 'Project Hub', icon: Star, color: '#06b6d4', bgColor: '#ecfeff', borderColor: '#a5f3fc', tech: ['React', 'Vite'],
    description: 'Project and task management with AI lenses, Village Vine real-time chat, and grape agent monitoring.',
    routes: [
      { method: 'GET', path: '/', desc: 'Dashboard' },
      { method: 'GET', path: '/projects', desc: 'Project board' },
      { method: 'GET', path: '/architecture', desc: 'Service topology (this page)' },
      { method: 'GET', path: '/village-vine', desc: 'Real-time team chat' },
      { method: 'GET', path: '/fast-feat', desc: 'Feature board' },
    ]},
  { id: 'talent', label: 'Talent Village', sublabel: 'Recruitment AI', icon: Layers, color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fde68a', tech: ['React', 'Vite'],
    description: 'AI-powered recruitment platform for managing candidates, interviews, and AI-generated questions.',
    routes: [
      { method: 'GET', path: '/talent-village', desc: 'Talent board' },
      { method: 'GET', path: '/talent-village/setup', desc: 'Session setup' },
      { method: 'GET', path: '/talent-village/vines-eye', desc: "Recruiter's eye view" },
    ]},
  { id: 'bree-api', label: 'bree-api', sublabel: 'REST Gateway', icon: Server, color: '#10b981', bgColor: '#ecfdf5', borderColor: '#a7f3d0', tech: ['Bun', 'Elysia', 'JWT'],
    description: 'Central Elysia REST gateway. All frontend API calls route here. Handles auth, knowledge, collective chat, config, vineyard resources, and AI lenses.',
    routes: [
      { method: 'POST', path: '/api/auth/login',              desc: 'Authenticate → JWT',                  auth: false },
      { method: 'POST', path: '/api/auth/register',           desc: 'Register user',                       auth: false },
      { method: 'GET',  path: '/api/identity/instructions',   desc: 'Get persisted AI instructions',       auth: true },
      { method: 'POST', path: '/api/identity/instructions',   desc: 'Save AI instructions',                auth: true },
      { method: 'POST', path: '/api/knowledge/search',        desc: 'Semantic RAG search',                 auth: true },
      { method: 'GET',  path: '/api/knowledge/collections',   desc: 'List Ragster collections',            auth: true },
      { method: 'POST', path: '/api/knowledge/collections',   desc: 'Create collection',                   auth: true },
      { method: 'GET',  path: '/api/knowledge/resources',     desc: 'List uploaded documents',             auth: true },
      { method: 'POST', path: '/api/knowledge/upload',        desc: 'Upload document to collection',       auth: true },
      { method: 'POST', path: '/api/collective/chat',         desc: 'Streaming AI chat via AgentX (SSE)', auth: true },
      { method: 'GET',  path: '/api/projects',                desc: 'List projects',                       auth: true },
      { method: 'POST', path: '/api/projects',                desc: 'Create project',                      auth: true },
      { method: 'GET',  path: '/api/tasks',                   desc: 'List tasks (filter by projectId)',    auth: true },
      { method: 'POST', path: '/api/tasks',                   desc: 'Create task',                         auth: true },
      { method: 'PATCH',path: '/api/tasks/:id',               desc: 'Update task',                         auth: true },
      { method: 'GET',  path: '/api/lenses',                  desc: 'List AI lenses',                      auth: true },
      { method: 'POST', path: '/api/lenses/:id/analyze',      desc: 'Run AI lens analysis',                auth: true },
      { method: 'GET',  path: '/api/config/:brandId',         desc: 'Get app config for brand',            auth: true },
      { method: 'POST', path: '/api/config/:brandId',         desc: 'Save app config',                     auth: true },
      { method: 'GET',  path: '/api/bubbles/:brandId',        desc: 'Get chat suggestion bubbles',         auth: true },
    ]},
  { id: 'bree-realtime', label: 'bree-api-realtime', sublabel: 'SSE / WebSocket', icon: Radio, color: '#f97316', bgColor: '#fff7ed', borderColor: '#fed7aa', tech: ['Bun', 'NATS', 'WS'],
    description: 'Real-time gateway powered by NATS JetStream. Handles SSE token streaming for AI, WebSocket for Village Vines, and live agent monitoring.',
    routes: [
      { method: 'POST', path: '/api/ai/stream',            desc: 'Start SSE AI stream session',        auth: true },
      { method: 'GET',  path: '/api/ai/stream/:streamId',  desc: 'SSE — subscribe to token stream',   auth: true },
      { method: 'WS',   path: '/api/village/:vineId/ws',   desc: 'WebSocket — Village Vine session',  auth: false },
      { method: 'GET',  path: '/api/agents',               desc: 'List live NATS grape agents',       auth: true },
      { method: 'WS',   path: '/api/agents/:id/ws',        desc: 'WebSocket — agent terminal logs',  auth: true },
      { method: 'GET',  path: '/health',                   desc: 'Health check',                      auth: false },
    ]},
  { id: 'agentx', label: 'AgentX', sublabel: 'AI Orchestration', icon: Cpu, color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#ddd6fe', tech: ['NATS', 'OpenAI'],
    description: 'Multi-agent AI orchestration hub. Routes requests to specialized grape agents via NATS pub/sub, handles collective chat and streaming.',
    routes: [
      { method: 'POST', path: '/chat',             desc: 'Multi-agent chat (sync)',          auth: true },
      { method: 'POST', path: '/stream',           desc: 'Streaming chat → NATS topic',     auth: true },
      { method: 'GET',  path: '/agents',           desc: 'List agents + capabilities',      auth: false },
      { method: 'GET',  path: '/agents/:id',       desc: 'Agent details and status',        auth: false },
      { method: 'POST', path: '/agents/:id/msg',   desc: 'Send direct agent message',       auth: true },
      { method: 'GET',  path: '/capabilities',     desc: 'Aggregate capability discovery',  auth: false },
    ]},
  { id: 'ragster', label: 'Ragster', sublabel: 'RAG / Search', icon: Search, color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#bfdbfe', tech: ['Vectors', 'LLM', 'pgvector'],
    description: 'RAG service for document ingestion, embedding generation, vector search, and context-augmented generation.',
    routes: [
      { method: 'POST',   path: '/search',                          desc: 'Semantic search with filters',     auth: true },
      { method: 'POST',   path: '/embed',                           desc: 'Generate text embeddings',         auth: true },
      { method: 'GET',    path: '/collections',                     desc: 'List collections',                 auth: true },
      { method: 'POST',   path: '/collections',                     desc: 'Create collection',                auth: true },
      { method: 'POST',   path: '/collections/:id/upload',          desc: 'Upload + embed document',          auth: true },
      { method: 'DELETE', path: '/collections/:id/documents/:docId',desc: 'Delete document',                  auth: true },
      { method: 'POST',   path: '/chat',                            desc: 'RAG-augmented generation',         auth: true },
    ]},
  { id: 'nats', label: 'NATS', sublabel: 'Message Bus', icon: Zap, color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fde68a', tech: ['JetStream', 'Pub/Sub'],
    description: 'JetStream message bus connecting all BREE services. Enables real-time fan-out for Village Vines, AI token streaming, and agent discovery.',
    routes: [
      { method: 'SUB', path: 'vine.{vineId}.message',  desc: 'Village Vine chat messages' },
      { method: 'PUB', path: 'vine.{vineId}.message',  desc: 'Publish to Village Vine' },
      { method: 'SUB', path: 'agent.{id}.status',      desc: 'Agent heartbeat & status' },
      { method: 'SUB', path: 'ai.stream.{streamId}',   desc: 'AI response token stream' },
      { method: 'PUB', path: 'ai.stream.{streamId}',   desc: 'Publish token chunks' },
      { method: 'SUB', path: '*.discover',              desc: 'Agent capability discovery' },
    ]},
  { id: 'identity', label: 'Identity Zero', sublabel: 'Auth / JWT', icon: Lock, color: '#ef4444', bgColor: '#fef2f2', borderColor: '#fecaca', tech: ['JWT', 'RBAC'],
    description: 'JWT auth service issuing and validating bearer tokens. Manages user sessions, org membership, and role-based access control.',
    routes: [
      { method: 'POST',  path: '/auth/login',     desc: 'Login → JWT bearer token',   auth: false },
      { method: 'POST',  path: '/auth/register',  desc: 'Register → org user',        auth: false },
      { method: 'POST',  path: '/auth/refresh',   desc: 'Refresh JWT token',          auth: true },
      { method: 'GET',   path: '/auth/me',        desc: 'Current user profile',       auth: true },
      { method: 'GET',   path: '/auth/verify',    desc: 'Validate bearer token',      auth: true },
      { method: 'GET',   path: '/org/:slug',      desc: 'Get org by slug',            auth: true },
      { method: 'PATCH', path: '/org/:slug',      desc: 'Update org settings',        auth: true },
    ]},
  { id: 'antimatter', label: 'AntiMatterDB', sublabel: 'Identity Store', icon: Shield, color: '#6366f1', bgColor: '#eef2ff', borderColor: '#c7d2fe', tech: ['Org', 'Users', 'RBAC'],
    description: 'Persistent identity store backing Identity Zero. Stores users, organizations, roles, and access policies.',
    routes: [
      { method: 'GET',    path: '/users',       desc: 'List org users',       auth: true },
      { method: 'POST',   path: '/users',       desc: 'Create user',          auth: true },
      { method: 'PATCH',  path: '/users/:id',   desc: 'Update user',          auth: true },
      { method: 'DELETE', path: '/users/:id',   desc: 'Delete user',          auth: true },
      { method: 'GET',    path: '/orgs',        desc: 'List organizations',   auth: true },
      { method: 'POST',   path: '/orgs',        desc: 'Create organization',  auth: true },
    ]},
  { id: 'openai', label: 'OpenAI', sublabel: 'GPT-4o / TTS', icon: Brain, color: '#10b981', bgColor: '#ecfdf5', borderColor: '#a7f3d0', tech: ['GPT-4o', 'TTS', 'Whisper'],
    description: 'OpenAI integration powering GPT-4o completions, embeddings, voice synthesis (TTS), and Whisper speech-to-text.',
    routes: [
      { method: 'POST', path: '/v1/chat/completions',    desc: 'GPT-4o streaming completions' },
      { method: 'POST', path: '/v1/embeddings',          desc: 'text-embedding-3 vectors' },
      { method: 'POST', path: '/v1/audio/speech',        desc: 'TTS voice synthesis' },
      { method: 'POST', path: '/v1/audio/transcriptions',desc: 'Whisper speech-to-text' },
    ]},
  { id: 'vectordb', label: 'Vector DB', sublabel: 'Embeddings', icon: BoxIcon, color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#ddd6fe', tech: ['pgvector', 'Postgres'],
    description: 'pgvector Postgres database storing document chunk embeddings for cosine similarity search. Managed by Ragster.',
    routes: [
      { method: 'SQL', path: 'SELECT … <=> query_vec', desc: 'Cosine similarity search' },
      { method: 'SQL', path: 'INSERT INTO embeddings',  desc: 'Store chunk embeddings' },
      { method: 'SQL', path: 'DELETE FROM documents',   desc: 'Remove document + vectors' },
    ]},
];

const EDGES: Edge[] = [
  { from: 'kat-ai',         to: 'bree-api',       color: '#3b82f6' },
  { from: 'kat-ai',         to: 'bree-realtime',  color: '#3b82f6', dashed: true },
  { from: 'habitaware',     to: 'bree-api',       color: '#8b5cf6' },
  { from: 'vineyard',       to: 'bree-api',       color: '#06b6d4' },
  { from: 'vineyard',       to: 'bree-realtime',  color: '#06b6d4', dashed: true },
  { from: 'talent',         to: 'bree-api',       color: '#f59e0b' },
  { from: 'talent',         to: 'bree-realtime',  color: '#f59e0b', dashed: true },
  { from: 'bree-api',       to: 'agentx',         color: '#10b981' },
  { from: 'bree-api',       to: 'ragster',        color: '#10b981' },
  { from: 'bree-api',       to: 'identity',       color: '#10b981' },
  { from: 'bree-realtime',  to: 'nats',           color: '#f97316' },
  { from: 'bree-realtime',  to: 'agentx',         color: '#f97316', dashed: true },
  { from: 'agentx',         to: 'openai',         color: '#8b5cf6' },
  { from: 'agentx',         to: 'nats',           color: '#8b5cf6', dashed: true },
  { from: 'ragster',        to: 'vectordb',       color: '#3b82f6' },
  { from: 'ragster',        to: 'openai',         color: '#3b82f6', dashed: true },
  { from: 'identity',       to: 'antimatter',     color: '#ef4444' },
  { from: 'nats',           to: 'openai',         color: '#f59e0b', dashed: true },
];

// ─── Layout position maps ─────────────────────────────────────────────────────
const NW = 130; // node width
const NH = 80;  // node height
const CW = 760; // canvas width

const LAYOUTS: Record<LayoutId, { positions: Record<string, { x: number; y: number }>; height: number }> = {
  layered: {
    height: 580,
    positions: {
      'kat-ai':        { x: 20,  y: 30  }, 'habitaware':    { x: 200, y: 30  },
      'vineyard':      { x: 380, y: 30  }, 'talent':        { x: 555, y: 30  },
      'bree-api':      { x: 200, y: 195 }, 'bree-realtime': { x: 400, y: 195 },
      'agentx':        { x: 20,  y: 355 }, 'ragster':       { x: 200, y: 355 },
      'nats':          { x: 380, y: 355 }, 'identity':      { x: 555, y: 355 },
      'antimatter':    { x: 105, y: 490 }, 'openai':        { x: 310, y: 490 },
      'vectordb':      { x: 510, y: 490 },
    },
  },
  radial: {
    height: 680,
    positions: {
      'bree-api':      { x: 205, y: 275 }, 'bree-realtime': { x: 400, y: 275 },
      'kat-ai':        { x: 20,  y: 70  }, 'habitaware':    { x: 205, y: 20  },
      'vineyard':      { x: 395, y: 20  }, 'talent':        { x: 575, y: 70  },
      'agentx':        { x: 20,  y: 450 }, 'ragster':       { x: 205, y: 505 },
      'nats':          { x: 395, y: 505 }, 'identity':      { x: 565, y: 450 },
      'antimatter':    { x: 100, y: 580 }, 'openai':        { x: 310, y: 590 },
      'vectordb':      { x: 530, y: 580 },
    },
  },
  horizontal: {
    height: 520,
    positions: {
      'kat-ai':        { x: 10,  y: 20  }, 'habitaware':    { x: 10,  y: 135 },
      'vineyard':      { x: 10,  y: 250 }, 'talent':        { x: 10,  y: 365 },
      'bree-api':      { x: 200, y: 145 }, 'bree-realtime': { x: 200, y: 290 },
      'agentx':        { x: 415, y: 40  }, 'ragster':       { x: 415, y: 165 },
      'nats':          { x: 415, y: 290 }, 'identity':      { x: 415, y: 415 },
      'antimatter':    { x: 610, y: 100 }, 'openai':        { x: 610, y: 265 },
      'vectordb':      { x: 610, y: 415 },
    },
  },
  grid: {
    height: 530,
    positions: {
      'kat-ai':        { x: 15,  y: 20  }, 'habitaware':    { x: 200, y: 20  },
      'vineyard':      { x: 380, y: 20  }, 'talent':        { x: 560, y: 20  },
      'bree-api':      { x: 15,  y: 170 }, 'bree-realtime': { x: 200, y: 170 },
      'agentx':        { x: 380, y: 170 }, 'ragster':       { x: 560, y: 170 },
      'nats':          { x: 15,  y: 320 }, 'identity':      { x: 200, y: 320 },
      'antimatter':    { x: 380, y: 320 }, 'openai':        { x: 560, y: 320 },
      'vectordb':      { x: 200, y: 460 },
    },
  },
};

const LAYOUT_OPTIONS: { id: LayoutId; label: string; icon: string }[] = [
  { id: 'layered',     label: 'Layered',     icon: '⬇' },
  { id: 'radial',      label: 'Radial',      icon: '◎' },
  { id: 'horizontal',  label: 'Horizontal',  icon: '➡' },
  { id: 'grid',        label: 'Grid',        icon: '⊞' },
];

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET:    { bg: '#dcfce7', text: '#15803d' },
  POST:   { bg: '#dbeafe', text: '#1d4ed8' },
  PATCH:  { bg: '#fef9c3', text: '#a16207' },
  DELETE: { bg: '#fee2e2', text: '#dc2626' },
  WS:     { bg: '#f3e8ff', text: '#7e22ce' },
  SUB:    { bg: '#ffedd5', text: '#c2410c' },
  PUB:    { bg: '#fef3c7', text: '#b45309' },
  SQL:    { bg: '#e0e7ff', text: '#4338ca' },
};

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function ArchitecturePage() {
  const { agents, areas, projects, selectedAgentId, selectedAreaId, selectedProjectId,
    setSelectedAgentId, setSelectedAreaId, setSelectedProjectId,
    addProject, updateTaskProject, stats, allTasks, selectedSpecialties, toggleSpecialty } = useAgentTasks();

  const archZone = useLensDropZone({
    id: 'architecture-page', label: 'Architecture', pageId: 'architecture', dataType: 'git',
    getData: () => ({ tasks: allTasks, vines: [], grapes: [], project: null }),
    getSummary: () => `BREE architecture — ${NODES.length} services, ${EDGES.length} connections`,
  });

  const [layout, setLayout] = useState<LayoutId>('layered');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeDef | null>(null);

  const { positions, height: canvasHeight } = LAYOUTS[layout];
  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));

  return (
    <div className="flex h-screen bg-[#f8f6ff] text-slate-900 overflow-hidden font-sans">
      <Sidebar agents={agents} areas={areas} projects={projects} tasks={allTasks}
        selectedAgentId={selectedAgentId} selectedAreaId={selectedAreaId} selectedProjectId={selectedProjectId}
        selectedSpecialties={selectedSpecialties} onSelectAgent={setSelectedAgentId}
        onSelectArea={setSelectedAreaId} onSelectProject={setSelectedProjectId}
        onToggleSpecialty={toggleSpecialty} onAddProject={addProject}
        onDropTaskOnProject={updateTaskProject} stats={stats} />

      <main className={`flex-1 overflow-y-auto custom-scrollbar ${archZone.dropClassName}`} {...archZone.dropProps}>
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-violet-50 border border-violet-100 mb-3 shadow-sm">
              <Layers className="w-7 h-7 text-violet-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">BREE Architecture</h1>
            <p className="text-sm text-slate-500">{NODES.length} services · {EDGES.length} connections · click any node to see its APIs</p>
          </div>

          {/* Layout Switcher */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {LAYOUT_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setLayout(opt.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  layout === opt.id
                    ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                }`}>
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>

          {/* Network Canvas */}
          <div className="relative bg-white rounded-3xl border border-violet-100 shadow-lg overflow-hidden transition-all duration-500"
            style={{ height: canvasHeight + 40 }}>

            {/* Dot grid bg */}
            <div className="absolute inset-0 opacity-25"
              style={{ backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

            {/* SVG edges */}
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%"
              viewBox={`0 0 ${CW} ${canvasHeight}`} preserveAspectRatio="none">
              <defs>
                {NODES.map(n => (
                  <marker key={n.id} id={`arr-${n.id}`} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                    <path d="M0,0 L5,2.5 L0,5 Z" fill={n.color} opacity="0.5" />
                  </marker>
                ))}
              </defs>
              {EDGES.map((e, i) => {
                const fn = nodeMap[e.from]; const tn = nodeMap[e.to];
                if (!fn || !tn) return null;
                const fp = positions[e.from]; const tp = positions[e.to];
                if (!fp || !tp) return null;
                const x1 = fp.x + NW / 2, y1 = fp.y + NH / 2;
                const x2 = tp.x + NW / 2, y2 = tp.y + NH / 2;
                const active = hoveredId === e.from || hoveredId === e.to;
                return (
                  <path key={i} d={bezierPath(x1, y1, x2, y2)} fill="none"
                    stroke={e.color || '#94a3b8'}
                    strokeWidth={active ? 2 : 1} strokeOpacity={active ? 0.75 : 0.22}
                    strokeDasharray={e.dashed ? '5,4' : undefined}
                    markerEnd={`url(#arr-${e.to})`}
                    style={{ transition: 'stroke-opacity 0.2s, stroke-width 0.2s' }} />
                );
              })}
            </svg>

            {/* Nodes */}
            {NODES.map((node, i) => {
              const pos = positions[node.id] || { x: 0, y: 0 };
              const Icon = node.icon;
              const active = hoveredId === node.id;
              const selected = selectedNode?.id === node.id;
              return (
                <motion.div key={node.id}
                  animate={{ x: pos.x, y: pos.y, scale: active || selected ? 1.05 : 1 }}
                  initial={false}
                  transition={{ type: 'spring', stiffness: 260, damping: 26, delay: i * 0.015 }}
                  className="absolute cursor-pointer select-none"
                  style={{ width: NW, zIndex: active || selected ? 20 : 10 }}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedNode(selected ? null : node)}>
                  <div className="rounded-2xl border px-3 py-2.5 transition-all duration-150"
                    style={{
                      backgroundColor: node.bgColor,
                      borderColor: active || selected ? node.color : node.borderColor,
                      boxShadow: active || selected
                        ? `0 0 0 2px ${node.color}30, 0 6px 20px ${node.color}20`
                        : '0 1px 4px rgba(0,0,0,0.05)',
                    }}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${node.color}18` }}>
                        <Icon size={11} style={{ color: node.color }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 truncate leading-tight">{node.label}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 pl-6 mb-1.5 leading-tight">{node.sublabel}</p>
                    <div className="flex flex-wrap gap-1 pl-6">
                      {node.tech.slice(0, 2).map(t => (
                        <span key={t} className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${node.color}15`, color: node.color }}>{t}</span>
                      ))}
                    </div>
                    {(active || selected) && (
                      <div className="mt-1.5 pt-1 border-t border-slate-200 pl-6 flex items-center gap-1">
                        <span className="text-[8px] text-slate-400">
                          {node.routes.length} endpoint{node.routes.length !== 1 ? 's' : ''}
                        </span>
                        <ChevronRight size={8} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-5 justify-center text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5"><div className="w-6 h-px bg-slate-300 opacity-70" /><span>Direct call</span></div>
            <div className="flex items-center gap-1.5"><div className="w-6 h-px border-t border-dashed border-slate-300" /><span>Async / stream</span></div>
            <span>· Click node for API details</span>
          </div>
        </div>
      </main>

      {/* API Detail Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            key="api-panel"
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-[360px] flex-shrink-0 border-l border-slate-200 bg-white overflow-y-auto z-30 shadow-xl flex flex-col"
            style={{ position: 'fixed', right: 0, top: 0, bottom: 0 }}>

            {/* Panel header */}
            <div className="sticky top-0 z-10 px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3"
              style={{ backgroundColor: selectedNode.bgColor }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${selectedNode.color}20` }}>
                  <selectedNode.icon size={16} style={{ color: selectedNode.color }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">{selectedNode.label}</h2>
                  <p className="text-[10px] font-medium" style={{ color: selectedNode.color }}>{selectedNode.sublabel}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors mt-0.5 flex-shrink-0">
                <X size={14} />
              </button>
            </div>

            {/* Description */}
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs text-slate-600 leading-relaxed">{selectedNode.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedNode.tech.map(t => (
                  <span key={t} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${selectedNode.color}15`, color: selectedNode.color }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Routes */}
            <div className="flex-1 px-5 py-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Endpoints / Subjects ({selectedNode.routes.length})
              </h3>
              <div className="space-y-2">
                {selectedNode.routes.map((r, i) => {
                  const mc = METHOD_COLORS[r.method] || { bg: '#f1f5f9', text: '#64748b' };
                  return (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
                          style={{ backgroundColor: mc.bg, color: mc.text }}>{r.method}</span>
                        {r.auth !== undefined && (
                          <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                            r.auth ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                          }`}>{r.auth ? '🔒 auth' : 'public'}</span>
                        )}
                      </div>
                      <code className="block text-[10px] font-mono text-slate-700 mb-1 break-all">{r.path}</code>
                      <p className="text-[10px] text-slate-500 leading-snug">{r.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}