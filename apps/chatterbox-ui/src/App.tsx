import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { TurnsPage } from './pages/TurnsPage';
import { StorePage } from './pages/StorePage';
import { DesignPage } from './pages/DesignPage';

export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-void)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <Routes>
          <Route path="/"        element={<DashboardPage />} />
          <Route path="/turns"   element={<TurnsPage />} />
          <Route path="/store"   element={<StorePage />} />
          <Route path="/design"  element={<DesignPage />} />
        </Routes>
      </main>
    </div>
  );
}
