/**
 * LiveModeWarning — acceptance dialog shown when user tries to switch to Live mode.
 * Must explicitly accept before the switch completes.
 */
import React from 'react';
import { AlertTriangle, Shield, Wifi, Database, X, CheckCircle } from 'lucide-react';

interface Props {
  onAccept: () => void;
  onCancel: () => void;
}

export function LiveModeWarning({ onAccept, onCancel }: Props) {
  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-900 border border-amber-700/60 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Amber top accent stripe */}
        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-amber-900/60 border border-amber-700/50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Switch to Live Mode</h2>
            <p className="text-sm text-amber-400 font-medium mt-0.5">Real data · Real APIs · Real consequences</p>
          </div>
          <button
            onClick={onCancel}
            className="ml-auto shrink-0 text-gray-600 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning body */}
        <div className="px-6 pb-4 space-y-3">
          <p className="text-sm text-gray-300">
            You are switching from <span className="font-semibold text-indigo-400">Mock Mode</span> to{' '}
            <span className="font-semibold text-amber-400">Live Mode</span>. In this mode:
          </p>

          <div className="space-y-2">
            {[
              { icon: <Wifi className="w-4 h-4 text-amber-400" />,    text: 'All API calls reach your real Relativity environment over HTTPS' },
              { icon: <Database className="w-4 h-4 text-red-400" />,  text: 'Authentication uses your real OAuth2 client credentials' },
              { icon: <Shield className="w-4 h-4 text-orange-400" />, text: 'Actions (archive jobs, workspace creation) will affect real data' },
              { icon: <Wifi className="w-4 h-4 text-blue-400" />,     text: 'You are connecting directly from your local machine — not through production systems' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5">
                <span className="shrink-0 mt-0.5">{item.icon}</span>
                <span className="text-xs text-gray-300">{item.text}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 italic mt-1">
            Mock Mode is always available to safely explore the API structure without touching real data.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 text-sm font-semibold text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            Stay in Mock Mode
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-900/40"
          >
            <CheckCircle className="w-4 h-4" />
            I Understand — Go Live
          </button>
        </div>
      </div>
    </div>
  );
}
