import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { TeamPage } from './pages/TeamPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { VinesPage } from './pages/VinesPage';
import { TaskBoardPage } from './pages/TaskBoardPage';
import { ProjectBoardPage } from './pages/ProjectBoardPage';
import { FastTrackDashboard } from './pages/FastTrackDashboard';
import { KnowledgePage } from './pages/KnowledgePage';
import { AILensProvider, useAILens } from './hooks/useAILens';
import { AILensMenu } from './components/AILensMenu';
import { AILensOverlay } from './components/AILensOverlay';
function AILensGlobalUI() {
  const {
    handleDragStart,
    isOverlayOpen,
    closeOverlay,
    activeLens,
    activeZone,
    analysisResult
  } = useAILens();
  return (
    <>
      <AILensMenu onDragStart={handleDragStart} />
      <AILensOverlay
        isOpen={isOverlayOpen}
        onClose={closeOverlay}
        lens={activeLens}
        targetCard={activeZone?.label || activeZone?.dataType || null}
        initialAnalysis={analysisResult}
        data={{
          tasks: activeZone?.getData()?.tasks || [],
          vines: activeZone?.getData()?.vines || [],
          grapes: activeZone?.getData()?.grapes || [],
          project: activeZone?.getData()?.project || null
        }} />

    </>);

}
export function App() {
  return (
    <Router>
      <AILensProvider>
        <AILensGlobalUI />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/fast-track" element={<FastTrackDashboard />} />
          <Route path="/projects" element={<ProjectBoardPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/vines" element={<VinesPage />} />
          <Route path="/task" element={<TaskBoardPage />} />
          <Route path="/task/:taskId" element={<TaskBoardPage />} />
          <Route path="/project/:projectId" element={<ProjectBoardPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/project/:projectId/knowledge" element={<KnowledgePage />} />
        </Routes>
      </AILensProvider>
    </Router>);

}