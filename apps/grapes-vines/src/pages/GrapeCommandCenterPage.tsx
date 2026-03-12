import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, CheckCircle2, Server, Activity, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAgentx } from '../hooks/useAgentx';

const DASHBOARDS = [
  { id: 'bree-core-prd', name: 'Bree Core (Production)', env: 'prod' },
  { id: 'talent-village-stg', name: 'Talent Village (Staging)', env: 'staging' },
  { id: 'expert-vine-dev', name: 'Expert Vine (Dev)', env: 'dev' },
  { id: 'cc-alpha-01', name: 'Alpha Control Center', env: 'experimental' },
  { id: 'ripcodeai', name: 'RipCodeAI Agent', env: 'agent' },
  { id: 'ragster', name: 'Ragster Agent', env: 'agent' }
];

export function GrapeCommandCenterPage() {
  const [selectedDashboard, setSelectedDashboard] = useState(DASHBOARDS[0].id);
  const [copied, setCopied] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Use the new NATS-backed WebSocket hook
  const { isConnected, logs, sendCommand, disconnect, reconnect, clearLogs } = useAgentx({
    agentId: selectedDashboard,
  });

  const command = `bun x @bree-ai/grape run --dashboard ${selectedDashboard} --connect local`;

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startConnection = () => {
    clearLogs();
    reconnect();
  };

  const stopConnection = () => {
    disconnect();
  };

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex-1 overflow-auto bg-slate-50 relative p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <Terminal className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
            Grape Command Center
          </h1>
        </div>
        <p className="text-slate-500 text-lg">
          Connect your local repository directly to the grapes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
        {/* Left Column: configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Server size={18} className="text-violet-500" />
              Target Dashboard
            </h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 block">
                Select Control Center ID
              </label>
              <div className="relative">
                <select 
                  value={selectedDashboard}
                  onChange={(e) => setSelectedDashboard(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                  disabled={isConnected}
                >
                  {DASHBOARDS.map(db => (
                    <option key={db.id} value={db.id}>
                      {db.name} ({db.id})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Environment</h3>
              <div className="flex flex-wrap gap-2">
                {['Production', 'Staging', 'Local'].map(env => (
                  <span key={env} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                    {env}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-violet-600 rounded-2xl p-6 shadow-lg shadow-violet-200 text-white">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-violet-200" />
              Quick Command
            </h2>
            <p className="text-violet-200 text-sm mb-4">
              Run this Claude CLI command in your local repository to connect:
            </p>
            
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={command}
                className="w-full bg-violet-900/50 border border-violet-500/30 rounded-lg py-3 pl-4 pr-12 text-violet-50 text-sm font-mono focus:outline-none"
              />
              <button 
                onClick={handleCopy}
                className="absolute right-2 p-2 hover:bg-violet-500/30 rounded-md transition-colors text-violet-300 hover:text-white"
                title="Copy Command"
              >
                {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Terminal */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800 h-[600px] flex flex-col">
            {/* Terminal Header */}
            <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                </div>
                <span className="ml-4 text-xs font-medium text-slate-500 font-mono">
                  grape-direct-connect
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {isConnected && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    CONNECTED
                  </span>
                )}
                {!isConnected ? (
                  <button 
                    onClick={startConnection}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold rounded transition-colors"
                  >
                    <Activity size={14} />
                    Run Grape
                  </button>
                ) : (
                  <button 
                    onClick={stopConnection}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-bold rounded transition-colors border border-slate-700"
                  >
                    Terminate
                  </button>
                )}
              </div>
            </div>

            {/* Terminal Body */}
            <div 
              ref={terminalRef}
              className="flex-1 p-6 font-mono text-sm overflow-y-auto custom-scrollbar"
            >
              {logs.length === 0 ? (
                <div className="text-slate-600 flex flex-col items-center justify-center h-full gap-3">
                  <Terminal size={32} className="opacity-50" />
                  <p>Ready to connect to the grapes.</p>
                  <p className="text-xs">Click 'Run Grape' or run the command locally.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-slate-500 mb-4">
                    Bree AI Grape Connector v2.4.1
                    <br />
                    Type <span className="text-violet-400">'help'</span> for a list of valid commands.
                  </div>
                  {logs.map((log, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx}
                      className={
                        log.level === 'cmd' ? 'text-emerald-400 font-bold ml-4' :
                        log.level === 'system' ? 'text-slate-300 ml-2' :
                        log.level === 'error' ? 'text-red-400 mt-4' :
                        'text-violet-300 font-bold mt-2'
                      }
                    >
                      {log.message}
                    </motion.div>
                  ))}
                  {isConnected && (
                    <motion.div 
                      animate={{ opacity: [1, 0, 1] }} 
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="inline-block w-2.5 h-4 bg-slate-400 mt-2 align-middle"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
