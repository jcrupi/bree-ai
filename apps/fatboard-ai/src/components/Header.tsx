'use client'

import { Settings } from 'lucide-react'
import { useStore } from '@/lib/store'

export function Header() {
  const { providerType, isConnected, toggleSettings } = useStore()

  return (
    <header className="border-b border-[#333] bg-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[#00d9ff]">LeanBoard</h1>
          <div className="text-sm text-gray-400">
            {isConnected ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Connected to {providerType}
              </span>
            ) : (
              <span className="text-gray-500">Not connected</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="text-sm text-gray-400">
              <span className="text-[#00d9ff]">Demo Mode</span>
              {' · '}
              <span>8 core features</span>
              {' · '}
              <span className="text-green-400">0.3s load</span>
            </div>
          )}

          <button
            onClick={toggleSettings}
            className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  )
}
