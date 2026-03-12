import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Activity, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Terminal,
  ChevronRight,
  RefreshCw,
  Cpu
} from 'lucide-react';

interface FlyDeploymentPanelProps {
  appName?: string;
  region?: string;
  currentBranch?: string;
  onClose?: () => void;
  isExpanded?: boolean;
  variant?: 'full' | 'mini';
}

export function FlyDeploymentPanel({ 
  appName = 'the-vineyard', 
  region = 'ord',
  currentBranch = 'main',
  onClose,
  isExpanded = false,
  variant = 'full'
}: FlyDeploymentPanelProps) {
  const [status, setStatus] = useState<'healthy' | 'deploying' | 'failed' | 'pending'>('healthy');
  const [deployProgress, setDeployProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);

  const mockLogs = [
    '==> Verifying app config',
    '--> Validating fly.toml',
    '==> Building image',
    '--> [1/3] Copying files...',
    '--> [2/3] Running bun install...',
    '--> [3/3] Building frontend...',
    '==> Pushing image to registry',
    '==> Deploying machines',
    '--> Machine 9185720b6e9a83 [app] started',
    '==> Monitoring health checks',
    '--> Health check for machine 9185720b6e9a83 passed',
    '==> v47 deployed successfully'
  ];

  const handleDeploy = () => {
    if (isDeploying) return;
    
    setIsDeploying(true);
    setStatus('deploying');
    setDeployProgress(0);
    setLogs(['==> Starting deployment of branch: ' + currentBranch]);

    let step = 0;
    const interval = setInterval(() => {
      if (step < mockLogs.length) {
        setLogs(prev => [...prev, mockLogs[step]]);
        setDeployProgress(prev => Math.min(prev + (100 / mockLogs.length), 100));
        step++;
      } else {
        clearInterval(interval);
        setStatus('healthy');
        setIsDeploying(false);
        setDeployProgress(100);
      }
    }, 800);
  };

  if (variant === 'mini') {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : status === 'deploying' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-700 truncate">{appName}</div>
            <div className="text-[9px] font-mono text-slate-400 truncate">{currentBranch}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDeploying ? (
            <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] font-mono text-indigo-600">{Math.round(deployProgress)}%</span>
              <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${deployProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button 
              onClick={handleDeploy}
              className="p-1 px-2 bg-indigo-600 text-white text-[9px] font-bold rounded hover:bg-indigo-700 transition-colors flex items-center gap-1"
            >
              <Rocket size={10} />
              Deploy
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white rounded-xl ${!isExpanded ? 'overflow-hidden' : ''}`}>
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : status === 'deploying' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {status === 'healthy' ? 'Active' : status === 'deploying' ? 'Deploying...' : 'Failed'}
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
          v47 • {region}
        </div>
      </div>

      {/* App Info */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Rocket size={14} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-tight">{appName}</h3>
              <p className="text-[10px] text-slate-400 font-medium">the-vineyard.fly.dev</p>
            </div>
          </div>
          <a 
            href={`https://${appName}.fly.dev`} 
            target="_blank" 
            rel="noreferrer"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          >
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase mb-1">
              <Activity size={10} />
              Resources
            </div>
            <div className="text-[11px] font-semibold text-slate-700">1x Shared CPU</div>
            <div className="text-[11px] font-medium text-slate-500">1024MB RAM</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase mb-1">
              <RefreshCw size={10} />
              Branch
            </div>
            <div className="text-[11px] font-mono font-semibold text-slate-700 truncate">{currentBranch}</div>
            <div className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
              <CheckCircle2 size={10} /> Synced
            </div>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {!isDeploying && status === 'healthy' ? (
          <button
            onClick={handleDeploy}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 mb-4"
          >
            <Rocket size={16} />
            Deploy Now
          </button>
        ) : (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600">Deploying Update</span>
              <span className="text-[11px] font-mono text-indigo-600">{Math.round(deployProgress)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${deployProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Logs Preview */}
        <div className="flex-1 bg-slate-900 rounded-xl p-3 font-mono text-[10px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2 text-slate-500 pb-1 border-b border-slate-800">
            <div className="flex items-center gap-1.5 ">
              <Terminal size={10} />
              <span>FLY LOGS</span>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-slate-800" />
              <div className="w-2 h-2 rounded-full bg-slate-800" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
            {logs.length > 0 ? logs.map((log, i) => (
              <div key={i} className={`${log.startsWith('==>') ? 'text-indigo-400' : log.startsWith('-->') ? 'text-slate-300' : 'text-slate-500'}`}>
                {log}
              </div>
            )) : (
              <div className="text-slate-600 italic">No recent logs</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
