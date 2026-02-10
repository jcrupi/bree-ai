import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentTasks } from '../hooks/useAgentTasks';
import { Sidebar } from '../components/Sidebar';
import { TaskList } from '../components/TaskList';
import { ProjectsView } from '../components/ProjectsView';
import { VinesPanel } from '../components/VinesPanel';
import { VINE_CONVERSATIONS } from '../data/vineConversations';
import { SpecialtyBar } from '../components/SpecialtyBar';
import { SpecialtyType } from '../data/specialties';
import { VineConversation } from '../types';
import { useLensDropZone } from '../hooks/useAILens';
import { MOCK_GRAPES } from '../data/grapes';
import { TEAM_MEMBERS } from '../data/teamMembers';
export function Dashboard() {
  const {
    tasks,
    allTasks,
    agents,
    areas,
    projects,
    selectedAgentId,
    setSelectedAgentId,
    selectedAreaId,
    setSelectedAreaId,
    selectedProjectId,
    setSelectedProjectId,
    selectedGrapeId,
    setSelectedGrapeId,
    tasksByStatus,
    getAgent,
    getArea,
    getProject,
    updateTaskStatus,
    updateTaskProject,
    addProject,
    addTask,
    stats,
    selectedSpecialties,
    toggleSpecialty
  } = useAgentTasks();
  // Lifted state for vines
  const [vineConversations, setVineConversations] =
  useState<VineConversation[]>(VINE_CONVERSATIONS);
  const [selectedVineId, setSelectedVineId] = useState<string | null>(null);
  // AI Lens drop zones
  const dashboardZone = useLensDropZone({
    id: 'dashboard-main',
    label: 'Dashboard',
    pageId: 'dashboard',
    dataType: 'tasks',
    getData: () => ({
      tasks: allTasks,
      vines: vineConversations,
      grapes: [],
      project: null
    }),
    getSummary: () =>
    `${allTasks.length} tasks across ${projects.length} projects`
  });
  // Handler to add a new vine
  const handleAddVine = (vine: {
    topic: string;
    projectId: string;
    participants: string[];
    specialties?: SpecialtyType[];
  }) => {
    const newVine: VineConversation = {
      id: `vine-${Date.now()}`,
      projectId: vine.projectId,
      topic: vine.topic,
      participants: vine.participants,
      messages: [],
      lastActivity: new Date().toISOString(),
      unreadCount: 0,
      specialties: vine.specialties || []
    };
    setVineConversations((prev) => [newVine, ...prev]);
    // Optionally select the new vine immediately
    setSelectedVineId(newVine.id);
  };
  // Filter vines based on selected specialties
  const filteredVines =
  selectedSpecialties.size > 0 ?
  vineConversations.filter((v) =>
  v.specialties?.some((s) => selectedSpecialties.has(s))
  ) :
  vineConversations;
  // Determine title based on selection
  const getTitle = () => {
    if (selectedSpecialties.size > 0) {
      return `Tasks (${selectedSpecialties.size} specialties selected)`;
    }
    if (selectedProjectId) {
      const project = getProject(selectedProjectId);
      return project?.name || 'Project Tasks';
    }
    if (selectedGrapeId) {
      const grape = MOCK_GRAPES.find((g) => g.id === selectedGrapeId);
      return grape?.title || 'Grape Tasks';
    }
    if (selectedAgentId) {
      const agent = getAgent(selectedAgentId);
      // Also check TEAM_MEMBERS for richer info
      const member = TEAM_MEMBERS.find((m) => m.id === selectedAgentId);
      return member?.name || agent?.name || 'Agent Tasks';
    }
    if (selectedAreaId) {
      const area = getArea(selectedAreaId);
      return area?.name || 'Area Tasks';
    }
    return 'All Tasks';
  };
  const getSubtitle = () => {
    if (selectedProjectId) {
      const project = getProject(selectedProjectId);
      return project?.description || `${tasks.length} tasks in this project`;
    }
    if (selectedGrapeId) {
      const grape = MOCK_GRAPES.find((g) => g.id === selectedGrapeId);
      return (
        grape?.description || `${tasks.length} tasks assigned to this grape`);

    }
    if (selectedAgentId) {
      const member = TEAM_MEMBERS.find((m) => m.id === selectedAgentId);
      if (member) {
        const categoryLabel =
        member.category === 'human-design' ?
        'Design Team' :
        member.category === 'human-ai' ?
        'Human Agent' :
        'AI Agent';
        return `${categoryLabel} · ${member.role} · ${tasks.length} tasks`;
      }
      const agent = getAgent(selectedAgentId);
      return agent?.type === 'ai' ? 'AI Agent' : 'Human Agent';
    }
    if (selectedAreaId) {
      return `${tasks.length} tasks in this area`;
    }
    return `${tasks.length} tasks across all agents`;
  };
  const selectedVine = vineConversations.find((v) => v.id === selectedVineId);
  return (
    <div className="flex flex-col h-screen bg-[#f8f6ff] overflow-hidden font-sans relative">
      {/* Top Specialty Bar */}
      <SpecialtyBar
        selectedSpecialties={selectedSpecialties}
        onToggleSpecialty={toggleSpecialty} />


      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          agents={agents}
          areas={areas}
          projects={projects}
          tasks={allTasks}
          selectedAgentId={selectedAgentId}
          selectedAreaId={selectedAreaId}
          selectedProjectId={selectedProjectId}
          selectedGrapeId={selectedGrapeId}
          selectedSpecialties={selectedSpecialties}
          onSelectAgent={setSelectedAgentId}
          onSelectArea={setSelectedAreaId}
          onSelectProject={setSelectedProjectId}
          onSelectGrape={setSelectedGrapeId}
          onToggleSpecialty={toggleSpecialty}
          onAddProject={addProject}
          onDropTaskOnProject={updateTaskProject}
          stats={stats}
          // Vines props - pass filtered vines
          vineConversations={filteredVines}
          selectedVineId={selectedVineId}
          onSelectVine={setSelectedVineId}
          onAddVine={handleAddVine} />


        {/* Main Content */}
        <main
          className={`flex-1 flex flex-col min-w-0 overflow-hidden relative ${dashboardZone.dropClassName} transition-all duration-200`}
          {...dashboardZone.dropProps}>

          {!selectedProjectId &&
          !selectedAgentId &&
          !selectedAreaId &&
          !selectedGrapeId &&
          selectedSpecialties.size === 0 ?
          <ProjectsView
            projects={projects}
            tasks={allTasks}
            onSelectProject={setSelectedProjectId}
            vineConversations={vineConversations} /> :


          <TaskList
            tasks={tasks}
            tasksByStatus={tasksByStatus}
            getAgent={getAgent}
            getArea={getArea}
            onUpdateStatus={updateTaskStatus}
            onAddTask={addTask}
            title={getTitle()}
            subtitle={getSubtitle()}
            projects={projects}
            areas={areas}
            agents={agents}
            selectedProjectId={selectedProjectId}
            // Pass vines props - pass filtered vines
            vineConversations={filteredVines}
            onSelectVine={setSelectedVineId}
            onAddVine={handleAddVine} />

          }
        </main>
      </div>
    </div>);

}