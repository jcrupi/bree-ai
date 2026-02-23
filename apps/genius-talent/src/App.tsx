import { Routes, Route } from 'react-router-dom'
import { DashboardLayout } from './components/layout'
import {
  Landing,
  Dashboard,
  Jobs,
  JobDetail,
  JobConfig,
  Candidates,
  CandidateAssessment,
  Analytics,
  JobChat,
  Settings,
} from './pages'
import { ObserverAI } from '@bree-ai/core'

export default function App() {
  return (
    <>
      <ObserverAI />
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/demo" element={<Landing />} />
      <Route path="/for-recruiters" element={<Landing />} />

      {/* Candidate Assessment Flow */}
      <Route path="/assess/:jobId" element={<CandidateAssessment />} />

      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/new" element={<JobConfig />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="jobs/:id/edit" element={<JobConfig />} />
        <Route path="jobs/:id/chat" element={<JobChat />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
    </>
  )
}
