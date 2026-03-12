import React, { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Server, Cpu, Shield, Search, MessageSquare, Layers, Database, Brain, Zap, Radio, Lock, Star, X, Code2, GripHorizontal, RotateCcw } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useAgentTasks } from '../hooks/useAgentTasks';
import { useLensDropZone } from '../hooks/useAILens';

type LayoutId = 'layered' | 'radial' | 'horizontal' | 'grid';
interface Route { method: string; path: string; desc: string; auth?: boolean; }
interface NodeDef { id: string; label: string; sublabel: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string; tech: string[]; description: string; routes: Route[]; }
interface Edge { from: string; to: string; dashed?: boolean; color?: string; }

const NW = 136, NH = 82, CW = 800;

const NODES: NodeDef[] = [
  { id: 'kat-ai', label: 'KAT.ai', sublabel: 'Knowledge AI', icon: MessageSquare, color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#bfdbfe', tech: ['React', 'Vite', 'Eden'],
    description: 'Document Q&A with RAG search. Users chat with their documents; all answers grounded in uploaded content via Ragster.',
    routes: [{ method: 'GET', path: '/', desc: 'Chat interface + JWT login gate' }, { method: 'GET', path: '/admin', desc: 'Admin settings panel' }] },
  { id: 'habitaware', label: 'HabitAware', sublabel: 'Behavioral AI', icon: Brain, color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#ddd6fe', tech: ['React', 'Vite'],
    description: 'Habit-change coaching powered by Keen2 bracelet data and AI awareness tools.',
    routes: [{ method: 'GET', path: '/', desc: 'Habit coaching chat interface' }] },
  { id: 'vineyard', label: 'The Vineyard', sublabel: 'Project Hub', icon: Star, color: '#06b6d4', bgColor: '#ecfeff', borderColor: '#a5f3fc', tech: ['React', 'Vite'],
    description: 'Project and task management with AI lenses, Village Vine real-time chat, and grape agent monitoring.',
    routes: [{ method: 'GET', path: '/', desc: 'Dashboard' }, { method: 'GET', path: '/projects', desc: 'Project board' }, { method: 'GET', path: '/architecture', desc: 'This page' }, { method: 'GET', path: '/village-vine', desc: 'Team chat' }, { method: 'GET', path: '/fast-feat', desc: 'Feature board' }] },
  { id: 'talent', label: 'Talent Village', sublabel: 'Recruitment AI', icon: Layers, color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fde68a', tech: ['React', 'Vite'],
    description: 'AI-powered recruitment: candidate management, interview scheduling, AI-generated questions and answers.',
    routes: [{ method: 'GET', path: '/talent-village', desc: 'Talent board' }, { method: 'GET', path: '/talent-village/setup', desc: 'Session setup' }, { method: 'GET', path: '/talent-village/vines-eye', desc: "Recruiter view" }] },
  { id: 'bree-api', label: 'bree-api', sublabel: 'REST Gateway', icon: Server, color: '#10b981', bgColor: '#ecfdf5', borderColor: '#a7f3d0', tech: ['Bun', 'Elysia', 'JWT'],
    description: 'Central Elysia REST gateway. All frontend API calls route here. Handles auth, knowledge, collective chat, config, vineyard resources, and AI lenses.',
    routes: [
      { method: 'POST', path: '/api/auth/login', desc: 'Authenticate → JWT', auth: false },
      { method: 'POST', path: '/api/auth/register', desc: 'Register user', auth: false },
      { method: 'GET',  path: '/api/identity/instructions', desc: 'Get AI instructions', auth: true },
      { method: 'POST', path: '/api/identity/instructions', desc: 'Save AI instructions', auth: true },
      { method: 'POST', path: '/api/knowledge/search', desc: 'Semantic RAG search', auth: true },
      { method: 'GET',  path: '/api/knowledge/collections', desc: 'List collections', auth: true },
      { method: 'POST', path: '/api/knowledge/collections', desc: 'Create collection', auth: true },
      { method: 'GET',  path: '/api/knowledge/resources', desc: 'List documents', auth: true },
      { method: 'POST', path: '/api/knowledge/upload', desc: 'Upload document', auth: true },
      { method: 'POST', path: '/api/collective/chat', desc: 'Streaming AI chat via AgentX (SSE)', auth: true },
      { method: 'GET',  path: '/api/projects', desc: 'List projects', auth: true },
      { method: 'POST', path: '/api/projects', desc: 'Create project', auth: true },
      { method: 'GET',  path: '/api/tasks', desc: 'List tasks', auth: true },
      { method: 'POST', path: '/api/tasks', desc: 'Create task', auth: true },
      { method: 'PATCH',path: '/api/tasks/:id', desc: 'Update task', auth: true },
      { method: 'GET',  path: '/api/lenses', desc: 'List AI lenses', auth: true },
      { method: 'POST', path: '/api/lenses/:id/analyze', desc: 'Run AI lens', auth: true },
      { method: 'GET',  path: '/api/config/:brandId', desc: 'Get app config', auth: true },
      { method: 'POST', path: '/api/config/:brandId', desc: 'Save app config', auth: true },
      { method: 'GET',  path: '/api/bubbles/:brandId', desc: 'Chat suggestion bubbles', auth: true },
    ] },
  { id: 'bree-realtime', label: 'bree-api-realtime', sublabel: 'SSE / WebSocket', icon: Radio, color: '#f97316', bgColor: '#fff7ed', borderColor: '#fed7aa', tech: ['Bun', 'NATS', 'WS'],
    description: 'Real-time gateway powered by NATS JetStream. SSE token streaming for AI responses, WebSocket for Village Vines and live agent monitoring.',
    routes: [
      { method: 'POST', path: '/api/ai/stream', desc: 'Start SSE AI stream session', auth: true },
      { method: 'GET',  path: '/api/ai/stream/:streamId', desc: 'SSE — subscribe to token stream', auth: true },
      { method: 'WS',   path: '/api/village/:vineId/ws', desc: 'WebSocket — Village Vine', auth: false },
      { method: 'GET',  path: '/api/agents', desc: 'List live NATS grape agents', auth: true },
      { method: 'WS',   path: '/api/agents/:id/ws', desc: 'WebSocket — agent terminal logs', auth: true },
      { method: 'GET',  path: '/health', desc: 'Health check', auth: false },
    ] },
  { id: 'agentx', label: 'AgentX', sublabel: 'AI Orchestration', icon: Cpu, color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#ddd6fe', tech: ['NATS', 'OpenAI'],
    description: 'Multi-agent orchestration hub. Routes requests to specialized grape agents via NATS, handles collective streaming chat.',
    routes: [
      { method: 'POST', path: '/chat', desc: 'Multi-agent chat (sync)', auth: true },
      { method: 'POST', path: '/stream', desc: 'Streaming chat → NATS topic', auth: true },
      { method: 'GET',  path: '/agents', desc: 'List agents + capabilities', auth: false },
      { method: 'GET',  path: '/agents/:id', desc: 'Agent details', auth: false },
      { method: 'POST', path: '/agents/:id/msg', desc: 'Direct agent message', auth: true },
      { method: 'GET',  path: '/capabilities', desc: 'Aggregate capabilities', auth: false },
    ] },
  { id: 'ragster', label: 'Ragster', sublabel: 'RAG / Search', icon: Search, color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#bfdbfe', tech: ['Vectors', 'LLM', 'pgvector'],
    description: 'RAG service: document ingestion, embedding generation, vector search, and context-augmented generation.',
    routes: [
      { method: 'POST',   path: '/search', desc: 'Semantic search with filters', auth: true },
      { method: 'POST',   path: '/embed', desc: 'Generate text embeddings', auth: true },
      { method: 'GET',    path: '/collections', desc: 'List collections', auth: true },
      { method: 'POST',   path: '/collections', desc: 'Create collection', auth: true },
      { method: 'POST',   path: '/collections/:id/upload', desc: 'Upload + embed document', auth: true },
      { method: 'DELETE', path: '/collections/:id/documents/:docId', desc: 'Delete document', auth: true },
      { method: 'POST',   path: '/chat', desc: 'RAG-augmented generation', auth: true },
    ] },
  { id: 'nats', label: 'NATS', sublabel: 'Message Bus', icon: Zap, color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fde68a', tech: ['JetStream', 'Pub/Sub'],
    description: 'JetStream message bus connecting all BREE services — Village Vine fan-out, AI token streaming, agent discovery.',
    routes: [
      { method: 'SUB', path: 'vine.{vineId}.message', desc: 'Receive Village Vine messages' },
      { method: 'PUB', path: 'vine.{vineId}.message', desc: 'Publish to Village Vine' },
      { method: 'SUB', path: 'agent.{id}.status', desc: 'Agent heartbeat' },
      { method: 'SUB', path: 'ai.stream.{streamId}', desc: 'AI token stream' },
      { method: 'PUB', path: 'ai.stream.{streamId}', desc: 'Publish token chunks' },
      { method: 'SUB', path: '*.discover', desc: 'Agent capability discovery' },
    ] },
  { id: 'identity', label: 'Identity Zero', sublabel: 'Auth / JWT', icon: Lock, color: '#ef4444', bgColor: '#fef2f2', borderColor: '#fecaca', tech: ['JWT', 'RBAC'],
    description: 'JWT auth service issuing and validating bearer tokens. Manages user sessions, org membership, and role-based access.',
    routes: [
      { method: 'POST',  path: '/auth/login', desc: 'Login → JWT bearer token', auth: false },
      { method: 'POST',  path: '/auth/register', desc: 'Register → org user', auth: false },
      { method: 'POST',  path: '/auth/refresh', desc: 'Refresh JWT', auth: true },
      { method: 'GET',   path: '/auth/me', desc: 'Current user profile', auth: true },
      { method: 'GET',   path: '/auth/verify', desc: 'Validate bearer token', auth: true },
      { method: 'GET',   path: '/org/:slug', desc: 'Get org by slug', auth: true },
      { method: 'PATCH', path: '/org/:slug', desc: 'Update org settings', auth: true },
    ] },
  { id: 'antimatter', label: 'AntiMatterDB', sublabel: 'Identity Store', icon: Shield, color: '#6366f1', bgColor: '#eef2ff', borderColor: '#c7d2fe', tech: ['Org', 'Users'],
    description: 'Persistent identity store backing Identity Zero. Stores users, organizations, roles, and access policies.',
    routes: [
      { method: 'GET',    path: '/users', desc: 'List org users', auth: true },
      { method: 'POST',   path: '/users', desc: 'Create user', auth: true },
      { method: 'PATCH',  path: '/users/:id', desc: 'Update user', auth: true },
      { method: 'DELETE', path: '/users/:id', desc: 'Delete user', auth: true },
      { method: 'GET',    path: '/orgs', desc: 'List organizations', auth: true },
      { method: 'POST',   path: '/orgs', desc: 'Create org', auth: true },
    ] },
  { id: 'openai', label: 'OpenAI', sublabel: 'GPT-4o / TTS', icon: Brain, color: '#10b981', bgColor: '#ecfdf5', borderColor: '#a7f3d0', tech: ['GPT-4o', 'TTS', 'Whisper'],
    description: 'OpenAI powers GPT-4o completions, text-embedding vectors, TTS voice synthesis, and Whisper speech-to-text.',
    routes: [
      { method: 'POST', path: '/v1/chat/completions', desc: 'GPT-4o streaming completions' },
      { method: 'POST', path: '/v1/embeddings', desc: 'text-embedding-3 vectors' },
      { method: 'POST', path: '/v1/audio/speech', desc: 'TTS voice synthesis' },
      { method: 'POST', path: '/v1/audio/transcriptions', desc: 'Whisper speech-to-text' },
    ] },
  { id: 'vectordb', label: 'Vector DB', sublabel: 'Embeddings', icon: Database, color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#ddd6fe', tech: ['pgvector', 'Postgres'],
    description: 'pgvector Postgres database storing document chunk embeddings for cosine similarity search, managed by Ragster.',
    routes: [
      { method: 'SQL', path: 'SELECT … <=> query_vec', desc: 'Cosine similarity search' },
      { method: 'SQL', path: 'INSERT INTO embeddings', desc: 'Store chunk embeddings' },
      { method: 'SQL', path: 'DELETE FROM documents', desc: 'Remove document + vectors' },
    ] },
];

const EDGES: Edge[] = [
  { from: 'kat-ai',        to: 'bree-api',       color: '#3b82f6' },
  { from: 'kat-ai',        to: 'bree-realtime',  color: '#3b82f6', dashed: true },
  { from: 'habitaware',    to: 'bree-api',       color: '#8b5cf6' },
  { from: 'vineyard',      to: 'bree-api',       color: '#06b6d4' },
  { from: 'vineyard',      to: 'bree-realtime',  color: '#06b6d4', dashed: true },
  { from: 'talent',        to: 'bree-api',       color: '#f59e0b' },
  { from: 'talent',        to: 'bree-realtime',  color: '#f59e0b', dashed: true },
  { from: 'bree-api',      to: 'agentx',         color: '#10b981' },
  { from: 'bree-api',      to: 'ragster',        color: '#10b981' },
  { from: 'bree-api',      to: 'identity',       color: '#10b981' },
  { from: 'bree-realtime', to: 'nats',           color: '#f97316' },
  { from: 'bree-realtime', to: 'agentx',         color: '#f97316', dashed: true },
  { from: 'agentx',        to: 'openai',         color: '#8b5cf6' },
  { from: 'agentx',        to: 'nats',           color: '#8b5cf6', dashed: true },
  { from: 'ragster',       to: 'vectordb',       color: '#3b82f6' },
  { from: 'ragster',       to: 'openai',         color: '#3b82f6', dashed: true },
  { from: 'identity',      to: 'antimatter',     color: '#ef4444' },
  { from: 'nats',          to: 'openai',         color: '#f59e0b', dashed: true },
];

const LAYOUTS: Record<LayoutId, { positions: Record<string, { x: number; y: number }>; height: number }> = {
  layered: { height: 590,
    positions: {
      'kat-ai': {x:20,y:30}, 'habitaware': {x:212,y:30}, 'vineyard': {x:400,y:30}, 'talent': {x:590,y:30},
      'bree-api': {x:212,y:198}, 'bree-realtime': {x:420,y:198},
      'agentx': {x:20,y:362}, 'ragster': {x:212,y:362}, 'nats': {x:400,y:362}, 'identity': {x:590,y:362},
      'antimatter': {x:105,y:498}, 'openai': {x:315,y:498}, 'vectordb': {x:530,y:498},
    }},
  radial: { height: 700,
    positions: {
      'bree-api': {x:220,y:288}, 'bree-realtime': {x:428,y:288},
      'kat-ai': {x:20,y:80}, 'habitaware': {x:212,y:22}, 'vineyard': {x:410,y:22}, 'talent': {x:590,y:80},
      'agentx': {x:20,y:460}, 'ragster': {x:212,y:524}, 'nats': {x:412,y:524}, 'identity': {x:580,y:460},
      'antimatter': {x:100,y:598}, 'openai': {x:318,y:608}, 'vectordb': {x:538,y:598},
    }},
  horizontal: { height: 530,
    positions: {
      'kat-ai': {x:10,y:20}, 'habitaware': {x:10,y:140}, 'vineyard': {x:10,y:260}, 'talent': {x:10,y:378},
      'bree-api': {x:210,y:155}, 'bree-realtime': {x:210,y:305},
      'agentx': {x:430,y:42}, 'ragster': {x:430,y:168}, 'nats': {x:430,y:292}, 'identity': {x:430,y:416},
      'antimatter': {x:622,y:100}, 'openai': {x:622,y:268}, 'vectordb': {x:622,y:420},
    }},
  grid: { height: 560,
    positions: {
      'kat-ai': {x:14,y:20}, 'habitaware': {x:206,y:20}, 'vineyard': {x:396,y:20}, 'talent': {x:588,y:20},
      'bree-api': {x:14,y:178}, 'bree-realtime': {x:206,y:178}, 'agentx': {x:396,y:178}, 'ragster': {x:588,y:178},
      'nats': {x:14,y:336}, 'identity': {x:206,y:336}, 'antimatter': {x:396,y:336}, 'openai': {x:588,y:336},
      'vectordb': {x:206,y:468},
    }},
};

const LAYOUT_OPTS: {id: LayoutId; label: string; icon: string}[] = [
  {id:'layered', label:'Layered', icon:'⬇'}, {id:'radial', label:'Radial', icon:'◎'},
  {id:'horizontal', label:'Horizontal', icon:'➡'}, {id:'grid', label:'Grid', icon:'⊞'},
];

const METHOD_COLORS: Record<string, {bg: string; text: string}> = {
  GET: {bg:'#dcfce7',text:'#15803d'}, POST: {bg:'#dbeafe',text:'#1d4ed8'},
  PATCH: {bg:'#fef9c3',text:'#a16207'}, DELETE: {bg:'#fee2e2',text:'#dc2626'},
  WS:  {bg:'#f3e8ff',text:'#7e22ce'}, SUB: {bg:'#ffedd5',text:'#c2410c'},
  PUB: {bg:'#fef3c7',text:'#b45309'}, SQL: {bg:'#e0e7ff',text:'#4338ca'},
};

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
}

export function ArchitecturePage() {
  const { agents, areas, projects, selectedAgentId, selectedAreaId, selectedProjectId,
    setSelectedAgentId, setSelectedAreaId, setSelectedProjectId,
    addProject, updateTaskProject, stats, allTasks, selectedSpecialties, toggleSpecialty } = useAgentTasks();

  const archZone = useLensDropZone({
    id: 'architecture-page', label: 'Architecture', pageId: 'architecture', dataType: 'git',
    getData: () => ({tasks: allTasks, vines: [], grapes: [], project: null}),
    getSummary: () => `BREE — ${NODES.length} services, ${EDGES.length} connections`,
  });

  const [layout, setLayout] = useState<LayoutId>('layered');
  const [nodePos, setNodePos] = useState<Record<string, {x:number;y:number}>>(() => ({...LAYOUTS.layered.positions}));
  const [transitioning, setTransitioning] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [apiNode, setApiNode] = useState<NodeDef | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOffset = useRef({x:0, y:0});
  const didDrag = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const changeLayout = (id: LayoutId) => {
    setLayout(id);
    setFocusedId(null);
    setTransitioning(true);
    setNodePos({...LAYOUTS[id].positions});
    setTimeout(() => setTransitioning(false), 600);
  };

  const resetPos = () => {
    setTransitioning(true);
    setNodePos({...LAYOUTS[layout].positions});
    setTimeout(() => setTransitioning(false), 600);
  };

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if ((e.target as HTMLElement).closest('[data-nodrag]')) return;
    e.preventDefault(); e.stopPropagation(); didDrag.current = false;
    const rect = containerRef.current?.getBoundingClientRect() ?? {left:0, top:0};
    const p = nodePos[id] ?? {x:0, y:0};
    dragOffset.current = {x: e.clientX - rect.left - p.x, y: e.clientY - rect.top - p.y};
    setDragging(id);
  };

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    didDrag.current = true;
    const rect = containerRef.current?.getBoundingClientRect() ?? {left:0, top:0};
    setNodePos(prev => ({...prev, [dragging]: {
      x: Math.max(0, e.clientX - rect.left - dragOffset.current.x),
      y: Math.max(0, e.clientY - rect.top - dragOffset.current.y),
    }}));
  }, [dragging]);

  const onPointerUp = () => setDragging(null);

  const canvasHeight = LAYOUTS[layout].height;

  // Build focus set: selected node + all direct neighbors
  const focusSet = focusedId ? new Set([
    focusedId,
    ...EDGES.filter(e => e.from === focusedId || e.to === focusedId).flatMap(e => [e.from, e.to]),
  ]) : null;

  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));
  const selectedNodeDef = focusedId ? nodeMap[focusedId] : null;

  return (
    <div className="flex h-screen bg-[#f8f6ff] overflow-hidden font-sans">
      <Sidebar agents={agents} areas={areas} projects={projects} tasks={allTasks}
        selectedAgentId={selectedAgentId} selectedAreaId={selectedAreaId} selectedProjectId={selectedProjectId}
        selectedSpecialties={selectedSpecialties} onSelectAgent={setSelectedAgentId}
        onSelectArea={setSelectedAreaId} onSelectProject={setSelectedProjectId}
        onToggleSpecialty={toggleSpecialty} onAddProject={addProject}
        onDropTaskOnProject={updateTaskProject} stats={stats} />

      <main className={`flex-1 overflow-y-auto custom-scrollbar ${archZone.dropClassName}`} {...archZone.dropProps}>
        <div className="px-6 py-8">
          {/* Header */}
          <div className="mb-5 text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-violet-50 border border-violet-100 mb-3 shadow-sm">
              <Layers className="w-7 h-7 text-violet-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">BREE Architecture</h1>
            <p className="text-sm text-slate-400">{NODES.length} services · {EDGES.length} connections · drag nodes · click to focus · <Code2 size={11} className="inline" /> for APIs</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
            {LAYOUT_OPTS.map(o => (
              <button key={o.id} onClick={() => changeLayout(o.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  layout === o.id ? 'bg-violet-600 text-white border-violet-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                }`}>{o.icon} {o.label}</button>
            ))}
            <button onClick={resetPos} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-all">
              <RotateCcw size={10} /> Reset
            </button>
          </div>

          {/* Canvas — fixed pixel width: SVG and nodes share same coordinate space */}
          <div className="overflow-x-auto pb-2">
            <div ref={containerRef} className="relative bg-white rounded-3xl border border-violet-100 shadow-lg select-none"
              style={{ width: CW, height: canvasHeight, transition: 'height 0.5s ease' }}
              onPointerMove={onPointerMove} onPointerUp={onPointerUp}
              onClick={(e) => { if (e.target === containerRef.current) { setFocusedId(null); setApiNode(null); } }}>

              {/* Dot grid */}
              <div className="absolute inset-0 rounded-3xl opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

              {/* SVG — same pixel dimensions as container, no viewBox = 1:1 coordinates */}
              <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible' }}
                width={CW} height={canvasHeight}>
                <defs>
                  {NODES.map(n => (
                    <marker key={n.id} id={`a-${n.id}`} markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto">
                      <path d="M0,0 L5,2.5 L0,5 Z" fill={n.color} opacity="0.6" />
                    </marker>
                  ))}
                </defs>
                {EDGES.map((e, i) => {
                  const fp = nodePos[e.from], tp = nodePos[e.to];
                  if (!fp || !tp) return null;
                  const x1 = fp.x + NW / 2, y1 = fp.y + NH / 2;
                  const x2 = tp.x + NW / 2, y2 = tp.y + NH / 2;
                  // In focus mode: only edges that touch the focused node are visible
                  const edgeActive = !focusSet || (focusSet.has(e.from) && focusSet.has(e.to));
                  const hoverActive = hoveredId === e.from || hoveredId === e.to;
                  return (
                    <path key={i} d={bezier(x1, y1, x2, y2)} fill="none"
                      stroke={e.color ?? '#94a3b8'}
                      strokeWidth={hoverActive || (focusSet && edgeActive) ? 2 : 1}
                      strokeOpacity={edgeActive ? (hoverActive || focusSet ? 0.8 : 0.25) : 0}
                      strokeDasharray={e.dashed ? '5,4' : undefined}
                      markerEnd={`url(#a-${e.to})`}
                      style={{ transition: 'stroke-opacity 0.25s, stroke-width 0.2s' }} />
                  );
                })}
              </svg>

              {/* Nodes */}
              {NODES.map(node => {
                const p = nodePos[node.id] ?? {x: 0, y: 0};
                const Icon = node.icon;
                const inFocus = !focusSet || focusSet.has(node.id);
                const isSelected = focusedId === node.id;
                const isHovered = hoveredId === node.id;
                const isDragging = dragging === node.id;
                return (
                  <div key={node.id}
                    onPointerDown={(e) => onPointerDown(e, node.id)}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (didDrag.current) return;
                      setFocusedId(prev => prev === node.id ? null : node.id);
                      if (apiNode?.id !== node.id) setApiNode(null);
                    }}
                    style={{
                      position: 'absolute', left: p.x, top: p.y, width: NW,
                      opacity: inFocus ? 1 : 0.07,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      zIndex: isDragging ? 50 : isSelected ? 30 : 10,
                      transition: transitioning && !isDragging
                        ? 'left 0.55s cubic-bezier(0.34,1.56,0.64,1), top 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s'
                        : 'opacity 0.3s',
                    }}>
                    <div className="rounded-2xl border p-3 transition-all duration-150 relative"
                      style={{
                        backgroundColor: node.bgColor,
                        borderColor: isSelected || isHovered ? node.color : node.borderColor,
                        boxShadow: isSelected ? `0 0 0 2px ${node.color}40, 0 8px 24px ${node.color}22` : isHovered ? `0 4px 12px ${node.color}18` : '0 1px 4px rgba(0,0,0,0.05)',
                        transform: isSelected || isDragging ? 'scale(1.04)' : 'scale(1)',
                      }}>
                      {/* Drag grip indicator */}
                      <div className="absolute top-1.5 right-1.5 opacity-20"><GripHorizontal size={9} /></div>

                      <div className="flex items-center gap-1.5 mb-0.5 pr-4">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{backgroundColor: `${node.color}20`}}>
                          <Icon size={11} style={{color: node.color}} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 truncate leading-tight">{node.label}</span>
                        {/* API button */}
                        {(isHovered || isSelected) && (
                          <button data-nodrag onClick={(e) => { e.stopPropagation(); setApiNode(prev => prev?.id === node.id ? null : node); }}
                            title="View APIs"
                            className="ml-auto flex-shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
                            style={{color: node.color}}>
                            <Code2 size={10} />
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-500 pl-6 mb-1.5 leading-tight">{node.sublabel}</p>
                      <div className="flex flex-wrap gap-1 pl-6">
                        {node.tech.slice(0, 2).map(t => (
                          <span key={t} className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{backgroundColor: `${node.color}15`, color: node.color}}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Focus info bar */}
              <AnimatePresence>
                {selectedNodeDef && !apiNode && (
                  <motion.div key="infobar" initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 8}}
                    className="absolute bottom-3 left-3 right-3 rounded-2xl p-3 flex items-start gap-3 pointer-events-none"
                    style={{backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)'}}>
                    <selectedNodeDef.icon size={14} style={{color: selectedNodeDef.color, flexShrink: 0, marginTop: 1}} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[11px] font-semibold mb-0.5">{selectedNodeDef.label}</p>
                      <p className="text-slate-300 text-[10px] leading-snug">{selectedNodeDef.description}</p>
                      <p className="text-slate-500 text-[9px] mt-1">
                        {focusSet ? focusSet.size - 1 : 0} dependencies · {selectedNodeDef.routes.length} endpoints · click <Code2 size={8} className="inline text-slate-400" /> on node for API details
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-5 justify-center text-[10px] text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="block w-6 h-px bg-slate-300" />Direct call</span>
            <span className="flex items-center gap-1.5"><span className="block w-6 h-px border-t border-dashed border-slate-300" />Async / stream</span>
            <span>· Click node to focus flow · Drag to rearrange · <Code2 size={9} className="inline" /> for API details</span>
          </div>
        </div>
      </main>

      {/* API Panel */}
      <AnimatePresence>
        {apiNode && (
          <motion.div key="api-panel" initial={{x: 370, opacity: 0}} animate={{x: 0, opacity: 1}} exit={{x: 370, opacity: 0}}
            transition={{type: 'spring', stiffness: 300, damping: 30}}
            className="w-[350px] flex-shrink-0 border-l border-slate-200 bg-white overflow-y-auto shadow-2xl"
            style={{position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 100}}>
            {/* Header */}
            <div className="sticky top-0 px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-2" style={{backgroundColor: apiNode.bgColor}}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{backgroundColor: `${apiNode.color}20`}}>
                  <apiNode.icon size={16} style={{color: apiNode.color}} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{apiNode.label}</h2>
                  <p className="text-[10px] font-medium" style={{color: apiNode.color}}>{apiNode.sublabel}</p>
                </div>
              </div>
              <button onClick={() => setApiNode(null)} className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors mt-0.5">
                <X size={14} />
              </button>
            </div>
            {/* Description + tech */}
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs text-slate-600 leading-relaxed">{apiNode.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {apiNode.tech.map(t => (
                  <span key={t} className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{backgroundColor: `${apiNode.color}15`, color: apiNode.color}}>{t}</span>
                ))}
              </div>
            </div>
            {/* Routes */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Endpoints / Subjects ({apiNode.routes.length})
              </p>
              <div className="space-y-2">
                {apiNode.routes.map((r, i) => {
                  const mc = METHOD_COLORS[r.method] ?? {bg:'#f1f5f9',text:'#64748b'};
                  return (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{backgroundColor: mc.bg, color: mc.text}}>{r.method}</span>
                        {r.auth !== undefined && (
                          <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${r.auth ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                            {r.auth ? '🔒 auth' : 'public'}
                          </span>
                        )}
                      </div>
                      <code className="block text-[10px] font-mono text-slate-700 mb-1 break-all leading-snug">{r.path}</code>
                      <p className="text-[10px] text-slate-500">{r.desc}</p>
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