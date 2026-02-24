import { Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { FatAppDetail } from './pages/FatAppDetail'
import { ProcessDiagram } from './pages/ProcessDiagram'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/create" element={<ProcessDiagram />} />
      <Route path="/diagram" element={<ProcessDiagram />} />
      <Route path="/app/:slug" element={<FatAppDetail />} />
    </Routes>
  )
}
