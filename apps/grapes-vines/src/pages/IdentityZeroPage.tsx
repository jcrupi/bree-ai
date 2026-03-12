import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { IdentityZeroConsole } from '@bree-ai/core';
import { useAgentTasks } from '../hooks/useAgentTasks';

export function IdentityZeroPage() {
  const {
    agents, areas, projects, selectedAgentId, selectedAreaId, selectedProjectId,
    setSelectedAgentId, setSelectedAreaId, setSelectedProjectId, addProject,
    updateTaskProject, stats, allTasks, selectedSpecialties, toggleSpecialty
  } = useAgentTasks();

  return (
    <div className="flex bg-[#F5F7FA]">
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
      <div className="flex-1 ml-64 min-h-screen">
        <div className="max-w-[1600px] mx-auto p-8">
          <IdentityZeroConsole />
        </div>
      </div>
    </div>
  );
}
