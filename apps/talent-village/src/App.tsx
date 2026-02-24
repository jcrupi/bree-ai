import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ObserverAI } from '@bree-ai/core';
import { TalentVillageBoard } from './pages/TalentVillageBoard';
import { TalentVillageSetup } from './pages/TalentVillageSetup';
import { VinesEyeView } from './pages/VinesEyeView';

export function App() {
  return (
    <Router>
      <ObserverAI />
      <Routes>
        <Route path="/" element={<Navigate to="/setup" replace />} />
        <Route path="/setup" element={<TalentVillageSetup />} />
        <Route path="/talent-village" element={<TalentVillageBoard />} />
        <Route path="/talent-village/vines-eye" element={<VinesEyeView />} />
      </Routes>
    </Router>
  );
}
