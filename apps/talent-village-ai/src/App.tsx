import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ObserverAI } from '@bree-ai/core';
import { LeadDashboard } from './pages/LeadDashboard';
import { TalentVillageBoard } from './pages/TalentVillageBoard';
import { TalentVillageSetup } from './pages/TalentVillageSetup';
import { VinesEyeView } from './pages/VinesEyeView';
import { CandidateSchedulePage } from './pages/CandidateSchedulePage';

export function App() {
  return (
    <Router>
      <ObserverAI />
      <Routes>
        <Route path="/" element={<LeadDashboard />} />
        <Route path="/setup" element={<TalentVillageSetup />} />
        <Route path="/talent-village" element={<TalentVillageBoard />} />
        <Route path="/talent-village/vines-eye" element={<VinesEyeView />} />
        <Route path="/schedule" element={<CandidateSchedulePage />} />
      </Routes>
    </Router>
  );
}
