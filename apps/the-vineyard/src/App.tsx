import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { TeamPage } from './pages/TeamPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { VinesPage } from './pages/VinesPage';
import { TaskBoardPage } from './pages/TaskBoardPage';
import { ProjectBoardPage } from './pages/ProjectBoardPage';
import { VillageVinesPage } from './pages/VillageVinesPage';
import { FastFeatDashboard } from './pages/FastFeatDashboard';
import { KnowledgePage } from './pages/KnowledgePage';
import { TalentVillageBoard } from './pages/TalentVillageBoard';
import { VinesEyeView } from './pages/VinesEyeView';
import { TalentVillageSetup } from './pages/TalentVillageSetup';
import { EmailJSTestPage } from './pages/EmailJSTestPage';
import { IdentityZeroPage } from './pages/IdentityZeroPage';
import { AILensProvider, useAILens } from './hooks/useAILens';
import { AILensMenu } from './components/AILensMenu';
import { AILensOverlay } from './components/AILensOverlay';
import { useLocation } from 'react-router-dom';
import { ObserverAI } from '@bree-ai/core';

function AILensGlobalUI() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isCandidate = location.pathname === '/talent-village' && searchParams.get('role') === 'candidate';
  const {
    handleDragStart,
    isOverlayOpen,
    closeOverlay,
    activeLens,
    activeZone,
    analysisResult
  } = useAILens();
  if (isCandidate) return null;

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
        <ObserverAI />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/fast-feat" element={<FastFeatDashboard />} />
          <Route path="/projects" element={<ProjectBoardPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/vines" element={<VinesPage />} />
          <Route path="/village-vine" element={<VillageVinesPage />} />
          <Route path="/task" element={<TaskBoardPage />} />
          <Route path="/task/:taskId" element={<TaskBoardPage />} />
          <Route path="/project/:projectId" element={<ProjectBoardPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/project/:projectId/knowledge" element={<KnowledgePage />} />
          <Route path="/talent-village" element={<TalentVillageBoard />} />
          <Route path="/talent-village/setup" element={<TalentVillageSetup />} />
          <Route path="/talent-village/vines-eye" element={<VinesEyeView />} />
          <Route path="/emailjs-test" element={<EmailJSTestPage />} />
          <Route path="/identity-zero" element={<IdentityZeroPage />} />
        </Routes>
      </AILensProvider>
    </Router>);

}