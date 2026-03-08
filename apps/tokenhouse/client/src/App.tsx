import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { authClient } from './lib/auth'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import { Spinner } from './components/ui'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={24} />
      </div>
    )
  }

  if (!session?.user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
