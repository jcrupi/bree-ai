'use client'

import { X } from 'lucide-react'
import { useStore } from '@/lib/store'

export function SettingsModal() {
  const { showSettings, toggleSettings, providerType } = useStore()

  if (!showSettings) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0f0f0f] border border-[#333] rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <h2 className="text-xl font-semibold text-gray-200">Settings</h2>
          <button
            onClick={toggleSettings}
            className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Choose Your Provider
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-[#333] rounded-lg cursor-pointer hover:border-[#00d9ff] transition-colors">
                <input
                  type="radio"
                  name="provider"
                  value="demo"
                  checked={providerType === 'demo'}
                  readOnly
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium text-gray-200">Demo Mode</div>
                  <div className="text-sm text-gray-500">Try it with sample data</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-[#333] rounded-lg opacity-50">
                <input
                  type="radio"
                  name="provider"
                  value="linear"
                  disabled
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium text-gray-200">Linear</div>
                  <div className="text-sm text-gray-500">Coming soon</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-[#333] rounded-lg opacity-50">
                <input
                  type="radio"
                  name="provider"
                  value="jira"
                  disabled
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium text-gray-200">Jira</div>
                  <div className="text-sm text-gray-500">Coming soon</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-[#333] rounded-lg opacity-50">
                <input
                  type="radio"
                  name="provider"
                  value="clickup"
                  disabled
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium text-gray-200">ClickUp</div>
                  <div className="text-sm text-gray-500">Coming soon</div>
                </div>
              </label>
            </div>
          </div>

          <div className="p-4 bg-[#1a1a1a] border border-[#333] rounded-lg">
            <div className="text-sm text-gray-400">
              <strong className="text-[#00d9ff]">Demo Mode Active</strong>
              <br />
              You're seeing sample data. Connect your real project management tool to see your actual issues.
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-[#333]">
          <button
            onClick={toggleSettings}
            className="px-4 py-2 bg-[#00d9ff] text-black rounded-lg hover:bg-[#00c4e6] transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
