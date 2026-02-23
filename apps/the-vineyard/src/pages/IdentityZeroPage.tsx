import React from 'react';
import { IdentityZeroConsole } from '@bree-ai/core/components';
import { Sidebar } from '../components/Sidebar';
import { useAgentTasks } from '../hooks/useAgentTasks';

export function IdentityZeroPage() {
  const {
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
    addProject,
    updateTaskProject,
    stats,
    selectedSpecialties,
    toggleSpecialty
  } = useAgentTasks();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        agents={agents}
        areas={areas}
        projects={projects}
        tasks={allTasks}
        selectedAgentId={selectedAgentId}
        selectedAreaId={selectedAreaId}
        selectedProjectId={selectedProjectId}
        selectedVineId={null}
        selectedGrapeId={selectedGrapeId}
        selectedSpecialties={selectedSpecialties}
        vineConversations={[]}
        onSelectAgent={setSelectedAgentId}
        onSelectArea={setSelectedAreaId}
        onSelectProject={setSelectedProjectId}
        onSelectVine={() => {}}
        onSelectGrape={setSelectedGrapeId}
        onToggleSpecialty={toggleSpecialty}
        onAddProject={addProject}
        onAddVine={() => {}}
        onDropTaskOnProject={updateTaskProject}
        stats={stats}
      />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <IdentityZeroConsole />
        </div>
      </main>
    </div>
  );
}
