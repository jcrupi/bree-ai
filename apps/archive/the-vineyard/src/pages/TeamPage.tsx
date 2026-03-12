import React, { Component } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Bot,
  Sparkles,
  Brain,
  Code,
  Palette,
  CheckSquare,
  Leaf,
  MessageCircle } from
'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useAgentTasks } from '../hooks/useAgentTasks';
import { useLensDropZone } from '../hooks/useAILens';
import { TEAM_MEMBERS } from '../data/teamMembers';
import { TeamMember } from '../types';
export function TeamPage() {
  const {
    agents,
    areas,
    projects,
    selectedAgentId,
    selectedAreaId,
    selectedProjectId,
    selectedSpecialties,
    setSelectedAgentId,
    setSelectedAreaId,
    setSelectedProjectId,
    toggleSpecialty,
    addProject,
    updateTaskProject,
    stats,
    allTasks
  } = useAgentTasks();
  // Import vines directly for counts
  const { VINE_CONVERSATIONS } = require('../data/vineConversations');
  // AI Lens drop zone
  const teamZone = useLensDropZone({
    id: 'team-board',
    label: 'Team Board',
    pageId: 'team',
    dataType: 'tasks',
    getData: () => ({
      tasks: allTasks,
      vines: VINE_CONVERSATIONS,
      grapes: [],
      project: null
    }),
    getSummary: () =>
    `${TEAM_MEMBERS.length} team members, ${allTasks.length} tasks assigned`
  });
  const humanDesignMembers = TEAM_MEMBERS.filter(
    (m) => m.category === 'human-design'
  );
  const humanAIMembers = TEAM_MEMBERS.filter((m) => m.category === 'human-ai');
  const aiSpecialMembers = TEAM_MEMBERS.filter(
    (m) => m.category === 'ai-special'
  );
  // Calculate recent activity
  const allMessages = VINE_CONVERSATIONS.flatMap((vine: any) =>
  vine.messages.map((msg: any) => ({
    ...msg,
    topic: vine.topic,
    vineId: vine.id
  }))
  ).
  sort(
    (a: any, b: any) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).
  slice(0, 5);
  // Helper to get counts
  const getMemberStats = (memberId: string) => {
    const tasks = allTasks.filter((t) => t.assigneeId === memberId).length;
    const vines = VINE_CONVERSATIONS.filter((v: any) =>
    v.participants.includes(memberId)
    ).length;
    return {
      tasks,
      vines
    };
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
        stats={stats} />


      <main
        className={`flex-1 overflow-y-auto custom-scrollbar ${teamZone.dropClassName} transition-all duration-200`}
        {...teamZone.dropProps}>

        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* Page Header */}
          <motion.div
            initial={{
              opacity: 0,
              y: -20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.5
            }}
            className="mb-8">

            <h1 className="text-3xl font-display font-bold text-slate-900 mb-1 tracking-tight">
              Team Board
            </h1>
            <p className="text-slate-500">Your hybrid human-AI team</p>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.1,
              duration: 0.5
            }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">

            <StatCard
              label="Total Members"
              value={TEAM_MEMBERS.length}
              icon={<Users className="text-blue-500" />} />

            <StatCard
              label="Online Now"
              value={
              TEAM_MEMBERS.filter(
                (m) => m.status === 'online' || m.status === 'active'
              ).length
              }
              icon={<Sparkles className="text-emerald-500" />} />

            <StatCard
              label="Tasks Assigned"
              value={allTasks.filter((t) => t.assigneeId).length}
              icon={<CheckSquare className="text-violet-500" />} />

            <StatCard
              label="Active Vines"
              value={VINE_CONVERSATIONS.length}
              icon={<Leaf className="text-emerald-500" />} />

          </motion.div>

          {/* Team Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Design Team Card */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: 0.2
              }}
              className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden flex flex-col h-full">

              <div className="p-5 border-b border-orange-50 bg-orange-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <Palette size={18} />
                  </div>
                  <h2 className="font-bold text-slate-900">Design Team</h2>
                </div>
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {humanDesignMembers.length}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {humanDesignMembers.map((member) =>
                <MemberRow
                  key={member.id}
                  member={member}
                  stats={getMemberStats(member.id)}
                  theme="orange" />

                )}
              </div>
            </motion.div>

            {/* Human Agents Card */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: 0.3
              }}
              className="bg-white rounded-2xl border border-cyan-100 shadow-sm overflow-hidden flex flex-col h-full">

              <div className="p-5 border-b border-cyan-50 bg-cyan-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
                    <Code size={18} />
                  </div>
                  <h2 className="font-bold text-slate-900">Human Agents</h2>
                </div>
                <span className="bg-cyan-100 text-cyan-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {humanAIMembers.length}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {humanAIMembers.map((member) =>
                <MemberRow
                  key={member.id}
                  member={member}
                  stats={getMemberStats(member.id)}
                  theme="cyan" />

                )}
              </div>
            </motion.div>

            {/* AI Agents Card */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: 0.4
              }}
              className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden flex flex-col h-full">

              <div className="p-5 border-b border-violet-50 bg-violet-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                    <Brain size={18} />
                  </div>
                  <h2 className="font-bold text-slate-900">AI Agents</h2>
                </div>
                <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {aiSpecialMembers.length}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {aiSpecialMembers.map((member) =>
                <MemberRow
                  key={member.id}
                  member={member}
                  stats={getMemberStats(member.id)}
                  theme="violet" />

                )}
              </div>
            </motion.div>
          </div>

          {/* Activity Summary */}
          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.5
            }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

            <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
              <MessageCircle size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {allMessages.map((msg: any, i: number) => {
                const member = TEAM_MEMBERS.find((m) => m.id === msg.senderId);
                return (
                  <div
                    key={`${msg.id}-${i}`}
                    className="p-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${member?.category === 'human-design' ? 'bg-orange-500' : member?.category === 'human-ai' ? 'bg-cyan-500' : 'bg-violet-500'}`}>

                      {member?.isAI ? <Bot size={14} /> : member?.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold text-slate-900">
                          {member?.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">
                        in{' '}
                        <span className="font-medium text-slate-700">
                          {msg.topic}
                        </span>
                      </p>
                      <p className="text-sm text-slate-600 line-clamp-1">
                        {msg.content}
                      </p>
                    </div>
                  </div>);

              })}
            </div>
          </motion.div>
        </div>
      </main>
    </div>);

}
// Helper Components
function StatCard({
  label,
  value,
  icon




}: {label: string;value: string | number;icon: React.ReactNode;}) {
  return (
    <div className="bg-white border border-violet-100 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      <div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
          {label}
        </div>
      </div>
    </div>);

}
function MemberRow({
  member,
  stats,
  theme







}: {member: TeamMember;stats: {tasks: number;vines: number;};theme: 'orange' | 'cyan' | 'violet';}) {
  const statusColors = {
    online: 'bg-emerald-500',
    busy: 'bg-amber-500',
    idle: 'bg-slate-400',
    active: 'bg-violet-500 animate-pulse'
  };
  const themeColors = {
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-100'
    },
    cyan: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-600',
      border: 'border-cyan-100'
    },
    violet: {
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      border: 'border-violet-100'
    }
  };
  const colors = themeColors[theme];
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-white group">
      <div className="relative flex-shrink-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${member.category === 'human-design' ? 'bg-orange-500' : member.category === 'human-ai' ? 'bg-cyan-500' : 'bg-violet-500'}`}>

          {member.isAI ? <Bot size={16} /> : member.avatar}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusColors[member.status]}`} />

      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 truncate">
            {member.name}
          </h3>
          {member.isAI &&
          <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-500 uppercase">
              AI
            </span>
          }
        </div>
        <p className="text-xs text-slate-400 truncate">{member.role}</p>
      </div>

      <div className="flex flex-col gap-1 items-end">
        <div className="flex items-center gap-1">
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${colors.bg} ${colors.text}`}>

            {stats.tasks} tasks
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600">
            {stats.vines} vines
          </span>
        </div>
      </div>
    </div>);

}