import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Database,
  Globe,
  Cpu,
  Shield,
  Search,
  MessageSquare,
  Layers,
  BoxIcon,
  Brain,
  Zap,
  Radio,
  Lock,
  Users,
  Star
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useAgentTasks } from '../hooks/useAgentTasks';
import { useLensDropZone } from '../hooks/useAILens';

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  tech: string[];
  layer: 'frontend' | 'gateway' | 'services' | 'data';
}

interface NetworkEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  color?: string;
}

const NODES: NetworkNode[] = [
  // Frontend layer
  { id: 'kat-ai',      x: 80,  y: 60,  label: 'KAT.ai',           sublabel: 'Knowledge AI',      icon: MessageSquare, color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#bfdbfe', tech: ['React', 'Vite'], layer: 'frontend' },
  { id: 'habitaware',  x: 260, y: 60,  label: 'HabitAware',        sublabel: 'Behavioral AI',      icon: Brain,         color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#ddd6fe', tech: ['React', 'Vite'], layer: 'frontend' },
  { id: 'vineyard',   x: 440, y: 60,  label: 'The Vineyard',      sublabel: 'Project Hub',        icon: Star,          color: '#06b6d4', bgColor: '#ecfeff', borderColor: '#a5f3fc', tech: ['React', 'Vite'], layer: 'frontend' },
  { id: 'talent',     x: 620, y: 60,  label: 'Talent Village',     sublabel: 'Recruitment AI',     icon: Users,         color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fde68a', tech: ['React', 'Vite'], layer: 'frontend' },

  // Gateway layer
  { id: 'bree-api',        x: 260, y: 220, label: 'bree-api',           sublabel: 'REST Gateway',       icon: Server,   color: '#10b981', bgColor: '#ecfdf5', borderColor: '#a7f3d0', tech: ['Bun', 'Elysia'], layer: 'gateway' },
  { id: 'bree-realtime',   x: 440, y: 220, label: 'bree-api-realtime',  sublabel: 'SSE / WebSocket',    icon: Radio,    color: '#f97316', bgColor: '#fff7ed', borderColor: '#fed7aa', tech: ['Bun', 'NATS'],   layer: 'gateway' },

  // Services layer
  { id: 'agentx',   x: 120, y: 380, label: 'AgentX',        sublabel: 'AI Orchestration',  icon: Cpu,    color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#ddd6fe', tech: ['Collective'], layer: 'services' },
  { id: 'ragster',  x: 300, y: 380, label: 'Ragster',        sublabel: 'RAG / Search',       icon: Search, color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#bfdbfe', tech: ['Vectors', 'LLM'], layer: 'services' },
  { id: 'nats',     x: 480, y: 380, label: 'NATS',           sublabel: 'Message Bus',        icon: Zap,    color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fde68a', tech: ['JetStream'], layer: 'services' },
  { id: 'identity', x: 650, y: 380, label: 'Identity Zero',  sublabel: 'Auth / JWT',         icon: Lock,   color: '#ef4444', bgColor: '#fef2f2', borderColor: '#fecaca', tech: ['JWT', 'RBAC'], layer: 'services' },

  // Data layer
  { id: 'antimatter', x: 200, y: 530, label: 'AntiMatterDB',  sublabel: 'Identity Store',     icon: Shield,   color: '#6366f1', bgColor: '#eef2ff', borderColor: '#c7d2fe', tech: ['Org', 'Users'], layer: 'data' },
  { id: 'openai',     x: 440, y: 530, label: 'OpenAI',        sublabel: 'GPT-4o / Realtime',  icon: Brain,    color: '#10b981', bgColor: '#ecfdf5', borderColor: '#a7f3d0', tech: ['GPT-4o', 'TTS'], layer: 'data' },
  { id: 'vectordb',   x: 650, y: 530, label: 'Vector DB',     sublabel: 'Embeddings',          icon: Database, color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#ddd6fe', tech: ['pgvector'], layer: 'data' },
];

const EDGES: NetworkEdge[] = [
  // Frontends → gateways
  { from: 'kat-ai',     to: 'bree-api',      color: '#3b82f6' },
  { from: 'kat-ai',     to: 'bree-realtime', color: '#3b82f6', dashed: true },
  { from: 'habitaware', to: 'bree-api',      color: '#8b5cf6' },
  { from: 'vineyard',   to: 'bree-api',      color: '#06b6d4' },
  { from: 'vineyard',   to: 'bree-realtime', color: '#06b6d4', dashed: true },
  { from: 'talent',     to: 'bree-api',      color: '#f59e0b' },
  { from: 'talent',     to: 'bree-realtime', color: '#f59e0b', dashed: true },

  // Gateways → services
  { from: 'bree-api',      to: 'agentx',   color: '#10b981' },
  { from: 'bree-api',      to: 'ragster',  color: '#10b981' },
  { from: 'bree-api',      to: 'identity', color: '#10b981' },
  { from: 'bree-realtime', to: 'nats',     color: '#f97316' },
  { from: 'bree-realtime', to: 'agentx',  color: '#f97316', dashed: true },

  // Services → data
  { from: 'agentx',   to: 'openai',     color: '#8b5cf6' },
  { from: 'agentx',   to: 'nats',       color: '#8b5cf6', dashed: true },
  { from: 'ragster',  to: 'vectordb',   color: '#3b82f6' },
  { from: 'ragster',  to: 'openai',     color: '#3b82f6', dashed: true },
  { from: 'identity', to: 'antimatter', color: '#ef4444' },
  { from: 'nats',     to: 'openai',     color: '#f59e0b', dashed: true },
];

const NODE_W = 130;
const NODE_H = 76;
const CANVAS_W = 800;
const CANVAS_H = 640;

function getNodeCenter(node: NetworkNode) {
  return { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 };
}

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cy = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;
}

export function ArchitecturePage() {
  const {
    agents, areas, projects, selectedAgentId, selectedAreaId, selectedProjectId,
    setSelectedAgentId, setSelectedAreaId, setSelectedProjectId,
    addProject, updateTaskProject, stats, allTasks, selectedSpecialties, toggleSpecialty
  } = useAgentTasks();

  const archZone = useLensDropZone({
    id: 'architecture-page',
    label: 'Architecture',
    pageId: 'architecture',
    dataType: 'git',
    getData: () => ({ tasks: allTasks, vines: [], grapes: [], project: null }),
    getSummary: () => `BREE architecture with ${NODES.length} services`,
  });

  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const layerLabel: Record<string, string> = {
    frontend: 'Frontend Applications',
    gateway:  'API Gateway Layer',
    services: 'Core Services',
    data:     'Data & AI Layer',
  };

  return (
    <div className="flex h-screen bg-[#f8f6ff] text-slate-900 overflow-hidden font-sans">
      <Sidebar
        agents={agents}
        areas={areas}
        projects={projects}
        tasks={allTasks}
        selectedAgentId={selectedAgentId}
        selectedAreaId={selectedAreaId}
        selectedProjectId={selectedProjectId}
        selectedSpecialties={selectedSpecialties}
        onSelectAgent={setSelectedAgentId}
        onSelectArea={setSelectedAreaId}
        onSelectProject={setSelectedProjectId}
        onToggleSpecialty={toggleSpecialty}
        onAddProject={addProject}
        onDropTaskOnProject={updateTaskProject}
        stats={stats}
      />

      <main
        className={`flex-1 overflow-y-auto custom-scrollbar ${archZone.dropClassName} transition-all duration-200`}
        {...archZone.dropProps}
      >
        <div className="max-w-5xl mx-auto px-8 py-10">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-violet-50 border border-violet-100 mb-4 shadow-sm">
              <Layers className="w-8 h-8 text-violet-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">BREE Architecture</h1>
            <p className="text-base text-slate-500 max-w-xl mx-auto">
              Live service topology — {NODES.length} services, {EDGES.length} connections
            </p>
          </motion.div>

          {/* Network Canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative bg-white rounded-3xl border border-violet-100 shadow-lg overflow-hidden"
            style={{ height: CANVAS_H + 40 }}
          >
            {/* Subtle dot grid */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle, #c4b5fd 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Layer labels */}
            {['frontend', 'gateway', 'services', 'data'].map((layer, i) => {
              const ys = [60, 220, 380, 530];
              return (
                <div
                  key={layer}
                  className="absolute left-4 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  style={{ top: ys[i] + 28 }}
                >
                  {layerLabel[layer]}
                </div>
              );
            })}

            {/* SVG Edges */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width="100%"
              height="100%"
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              preserveAspectRatio="none"
            >
              <defs>
                {NODES.map(n => (
                  <marker
                    key={`arrow-${n.id}`}
                    id={`arrow-${n.id}`}
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill={n.color} opacity="0.5" />
                  </marker>
                ))}
              </defs>
              {EDGES.map((edge, i) => {
                const fromNode = nodeMap[edge.from];
                const toNode = nodeMap[edge.to];
                if (!fromNode || !toNode) return null;
                const f = getNodeCenter(fromNode);
                const t = getNodeCenter(toNode);
                const isHovered = hoveredNode === edge.from || hoveredNode === edge.to;
                return (
                  <path
                    key={i}
                    d={cubicBezier(f.x, f.y, t.x, t.y)}
                    fill="none"
                    stroke={edge.color || '#94a3b8'}
                    strokeWidth={isHovered ? 2 : 1.2}
                    strokeOpacity={isHovered ? 0.8 : 0.3}
                    strokeDasharray={edge.dashed ? '5,4' : undefined}
                    markerEnd={`url(#arrow-${edge.to})`}
                    style={{ transition: 'stroke-opacity 0.2s, stroke-width 0.2s' }}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {NODES.map((node, i) => {
              const Icon = node.icon;
              const isHovered = hoveredNode === node.id;
              // Find connected nodes
              const connectedIds = new Set([
                ...EDGES.filter(e => e.from === node.id).map(e => e.to),
                ...EDGES.filter(e => e.to === node.id).map(e => e.from),
              ]);
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="absolute cursor-pointer select-none"
                  style={{
                    left: node.x,
                    top: node.y,
                    width: NODE_W,
                    zIndex: isHovered ? 20 : 10,
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <div
                    className="rounded-2xl border px-3 py-2.5 transition-all duration-200"
                    style={{
                      backgroundColor: node.bgColor,
                      borderColor: isHovered ? node.color : node.borderColor,
                      boxShadow: isHovered
                        ? `0 0 0 3px ${node.color}22, 0 8px 24px ${node.color}22`
                        : '0 1px 4px rgba(0,0,0,0.06)',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${node.color}18` }}
                      >
                        <Icon size={12} style={{ color: node.color }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 leading-tight truncate">{node.label}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-tight mb-1.5 pl-8">{node.sublabel}</p>
                    <div className="flex flex-wrap gap-1 pl-8">
                      {node.tech.map(t => (
                        <span
                          key={t}
                          className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${node.color}15`, color: node.color }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    {isHovered && connectedIds.size > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200 pl-8">
                        <span className="text-[8px] text-slate-400">{connectedIds.size} connection{connectedIds.size !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-6 justify-center text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-px bg-slate-400 opacity-60" />
              <span>Direct call</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-px border-t border-dashed border-slate-400 opacity-60" />
              <span>Async / streaming</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-violet-100 border border-violet-200" />
              <span>Hover a node to highlight connections</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}