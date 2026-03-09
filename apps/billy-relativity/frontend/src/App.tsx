/**
 * Main App Component — Relativity Workspace API Explorer
 * BREE Stack: Bun + React + Elysia + Eden
 */

import React, { useState } from 'react';
import { APIExplorer } from './components/APIExplorer';
import { ClientDomainView } from './components/ClientDomainView';
import { RelativityConnect } from './components/RelativityConnect';
import { LiveModeWarning } from './components/LiveModeWarning';
import Observer from './components/Observer';
import { AppModeProvider, useAppMode, isLocalhost } from './context/AppModeContext';
import {
  Database, Code, Zap, FlaskConical,
  Building2, Telescope, Wifi, WifiOff, AlertTriangle,
} from 'lucide-react';

type ActiveTab = 'explorer' | 'domain' | 'observer';

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'explorer', label: 'API Explorer',   icon: <FlaskConical className="w-4 h-4" /> },
  { id: 'domain',   label: 'Client Domains', icon: <Building2 className="w-4 h-4" /> },
  { id: 'observer', label: 'Observer',    icon: <Telescope className="w-4 h-4" /> },
];

/** Mode toggle button + warning modal — lives inside the provider */
function ModeToggle() {
  const { mode, setMode, isLive } = useAppMode();
  const [showWarning, setShowWarning] = useState(false);

  const handleToggle = () => {
    if (mode === 'mock') {
      // Switching to Live — require acceptance
      setShowWarning(true);
    } else {
      // Switching back to Mock — immediate, no confirmation needed
      setMode('mock');
    }
  };

  const handleAccept = () => {
    setShowWarning(false);
    setMode('live');
  };

  return (
    <>
      {/* Toggle pill */}
      <button
        id="mode-toggle"
        onClick={handleToggle}
        title={isLive ? 'Switch to Mock Mode' : 'Switch to Live Mode'}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all duration-300 shadow-sm ${
          isLive
            ? 'bg-amber-500 border-amber-400 text-white shadow-amber-900/30 hover:bg-amber-400'
            : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
        }`}
      >
        {isLive
          ? <><Wifi className="w-3.5 h-3.5" /> LIVE</>
          : <><WifiOff className="w-3.5 h-3.5" /> MOCK</>
        }
      </button>

      {/* Warning modal */}
      {showWarning && (
        <LiveModeWarning
          onAccept={handleAccept}
          onCancel={() => setShowWarning(false)}
        />
      )}
    </>
  );
}

/** Live mode banner shown below the tab nav */
function LiveModeBanner() {
  const { isLive, setMode, auth } = useAppMode();
  if (!isLive) return null;
  const authenticated = !!auth?.accessToken;
  if (!isLocalhost) {
    return (
      <div className="bg-red-600 text-white text-xs font-semibold flex items-center justify-center gap-2 px-4 py-1.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        LIVE MODE — Auth unavailable from {window.location.hostname} (CORS). Run Docker locally on your VPN machine and open http://localhost:8080.
        <button onClick={() => setMode('mock')} className="ml-3 underline underline-offset-2 hover:no-underline">Switch to Mock</button>
      </div>
    );
  }
  return (
    <div className={`text-white text-xs font-semibold flex items-center justify-center gap-2 px-4 py-1.5 ${authenticated ? 'bg-emerald-600' : 'bg-amber-500'}`}>
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      {authenticated
        ? `LIVE MODE — Authenticated to ${auth!.instanceUrl} · Get Workspaces uses real Relativity data`
        : 'LIVE MODE — Running locally. Authenticate above to connect to real Relativity data.'
      }
      <button onClick={() => setMode('mock')} className="ml-3 underline underline-offset-2 hover:no-underline">Switch to Mock</button>
    </div>
  );
}

function AppInner() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('domain');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* ── Relativity Connection Bar (top of page) ───────────────────── */}
      <RelativityConnect />

      {/* ── App Header ───────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-2.5 rounded-xl">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Relativity Workspace API Explorer</h1>
                <p className="text-xs text-gray-500 mt-0.5">Interactive API testing · Client Domain View · Compliance Automation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Mock/Live toggle */}
              <ModeToggle />
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Zap className="w-3.5 h-3.5 text-yellow-500" /> BREE Stack
              </div>
              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg">
                <Code className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-800">Bun · React · Elysia · Eden</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 py-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge && (
                  <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Live mode banner ─────────────────────────────────────────── */}
      <LiveModeBanner />

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'explorer' && <APIExplorer />}
        {activeTab === 'domain'   && <ClientDomainView />}
        {activeTab === 'observer' && <Observer panelMode />}
      </main>

      {/* ── Observer FAB — visible on all non-observer tabs ───────── */}
      {activeTab !== 'observer' && <Observer />}

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>BREE Stack (Bun + React + Elysia + Eden)</span>
              <span>·</span>
              <span>Relativity eDiscovery APIs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>System Online</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AppModeProvider>
      <AppInner />
    </AppModeProvider>
  );
}

export default App;
