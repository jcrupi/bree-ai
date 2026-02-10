import React, { Component } from 'react';
import { motion } from 'framer-motion';
import {
  Layout,
  Server,
  Database,
  Globe,
  Cpu,
  Shield,
  Search,
  MessageSquare,
  Layers,
  ArrowDown,
  BoxIcon,
  Brain } from
'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useAgentTasks } from '../hooks/useAgentTasks';
import { ArchitectureNode } from '../components/ArchitectureNode';
import { useLensDropZone } from '../hooks/useAILens';
export function ArchitecturePage() {
  const {
    agents,
    areas,
    projects,
    selectedAgentId,
    selectedAreaId,
    selectedProjectId,
    setSelectedAgentId,
    setSelectedAreaId,
    setSelectedProjectId,
    addProject,
    updateTaskProject,
    stats,
    allTasks,
    selectedSpecialties,
    toggleSpecialty
  } = useAgentTasks();
  // AI Lens drop zone
  const archZone = useLensDropZone({
    id: 'architecture-page',
    label: 'Architecture',
    pageId: 'architecture',
    dataType: 'git',
    getData: () => ({
      tasks: allTasks,
      vines: [],
      grapes: [],
      project: null
    }),
    getSummary: () =>
    `System architecture with ${allTasks.length} tasks across services`
  });
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
        stats={stats} />


      <main
        className={`flex-1 overflow-y-auto custom-scrollbar ${archZone.dropClassName} transition-all duration-200`}
        {...archZone.dropProps}>

        <div className="max-w-6xl mx-auto px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{
              opacity: 0,
              y: -20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="mb-12 text-center">

            <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-violet-50 border border-violet-100 mb-5 shadow-sm">
              <Layers className="w-10 h-10 text-violet-600" />
            </div>
            <h1 className="text-5xl font-display font-bold text-slate-900 mb-4 tracking-tight">
              Grapes & Vines Architecture
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              A modern, type-safe monorepo architecture powered by Bun,
              ElysiaJS, and React 19.
            </p>
          </motion.div>

          <div className="space-y-12 relative">
            {/* Connecting Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-violet-200/0 via-violet-200 to-violet-200/0 -translate-x-1/2 pointer-events-none" />

            {/* FRONTEND LAYER */}
            <section className="relative">
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider border border-blue-100 shadow-sm">
                  Frontend Applications
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ArchitectureNode
                  title="KAT.ai"
                  subtitle="Knowledge Assistant"
                  description="Document Q&A, RAG search, and admin settings interface."
                  icon={MessageSquare}
                  tech={['React 19', 'Vite', 'Eden']}
                  port="8769"
                  color="blue"
                  delay={0.1} />


                <ArchitectureNode
                  title="Genius Talent"
                  subtitle="Recruitment AI"
                  description="Talent management dashboard and candidate search."
                  icon={Users}
                  tech={['React 19', 'Vite', 'Eden']}
                  port="5173"
                  color="blue"
                  delay={0.2} />


                <ArchitectureNode
                  title="HabitAware AI"
                  subtitle="Behavioral AI"
                  description="Habit change coaching and awareness tools."
                  icon={Brain}
                  tech={['React 19', 'Vite', 'Eden']}
                  port="8770"
                  color="blue"
                  delay={0.3} />


                <ArchitectureNode
                  title="Keen.ai"
                  subtitle="Knowledge Base"
                  description="Specialized knowledge interface and document management."
                  icon={Globe}
                  tech={['React 19', 'Vite', 'Eden']}
                  color="blue"
                  delay={0.4} />

              </div>
            </section>

            {/* Arrow Down */}
            <div className="flex justify-center py-2">
              <ArrowDown className="text-violet-300 animate-bounce" size={24} />
            </div>

            {/* BACKEND LAYER */}
            <section className="relative">
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wider border border-emerald-100 shadow-sm">
                  Local API Backend
                </span>
              </div>

              <div className="max-w-2xl mx-auto">
                <ArchitectureNode
                  title="ElysiaJS Server"
                  subtitle="Type-Safe API"
                  description="High-performance Bun server with end-to-end type safety via Eden Treaty. Auto-generates Swagger docs."
                  icon={Server}
                  tech={['Bun', 'ElysiaJS', 'Eden Treaty', 'Swagger']}
                  port="3000"
                  color="green"
                  delay={0.5} />

              </div>
            </section>

            {/* Arrow Down */}
            <div className="flex justify-center py-2">
              <ArrowDown className="text-violet-300 animate-bounce" size={24} />
            </div>

            {/* CORE LAYER */}
            <section className="relative">
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold uppercase tracking-wider border border-amber-100 shadow-sm">
                  Shared Core Package
                </span>
              </div>

              <div className="max-w-2xl mx-auto">
                <ArchitectureNode
                  title="@bree-ai/core"
                  subtitle="Shared Library"
                  description="Centralized UI components, API client utilities, type definitions, and configuration shared across all apps."
                  icon={BoxIcon}
                  tech={['Components', 'Utils', 'Types', 'Config']}
                  color="amber"
                  delay={0.6} />

              </div>
            </section>

            {/* Arrow Down */}
            <div className="flex justify-center py-2">
              <ArrowDown className="text-violet-300 animate-bounce" size={24} />
            </div>

            {/* EXTERNAL SERVICES LAYER */}
            <section className="relative">
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 text-xs font-bold uppercase tracking-wider border border-violet-100 shadow-sm">
                  External Services (fly.io)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ArchitectureNode
                  title="Ragster"
                  subtitle="RAG Service"
                  description="Document search, embedding, indexing, and chat generation."
                  icon={Search}
                  tech={['Vector DB', 'LLM', 'Embeddings']}
                  color="violet"
                  delay={0.7} />


                <ArchitectureNode
                  title="AgentX Collective"
                  subtitle="Orchestration"
                  description="Multi-agent coordination hub and collective chat interface."
                  icon={Cpu}
                  tech={['Agents', 'Orchestration']}
                  color="violet"
                  delay={0.8} />


                <ArchitectureNode
                  title="AntiMatterDB"
                  subtitle="Identity & Org"
                  description="Centralized identity management and organization structure."
                  icon={Shield}
                  tech={['Identity', 'Auth', 'RBAC']}
                  color="violet"
                  delay={0.9} />

              </div>
            </section>
          </div>
        </div>
      </main>
    </div>);

}
function Users({ size, className }: {size?: number;className?: string;}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}>

      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>);

}