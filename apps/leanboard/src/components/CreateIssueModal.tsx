'use client'

import { X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useState } from 'react'

export function CreateIssueModal() {
  const { showCreateModal, toggleCreateModal, createIssue } = useStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  if (!showCreateModal) return null

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return

    await createIssue(title, description)
    setTitle('')
    setDescription('')
  }

  const handleCancel = () => {
    toggleCreateModal()
    setTitle('')
    setDescription('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0f0f0f] border border-[#333] rounded-lg w-full max-w-xl">
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <h2 className="text-xl font-semibold text-gray-200">Create New Issue</h2>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter issue title..."
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#00d9ff]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#00d9ff] resize-none"
              rows={6}
            />
          </div>

          <div className="p-4 bg-[#1a1a1a] border border-[#333] rounded-lg">
            <div className="text-sm text-gray-400">
              New issues are created in the <strong className="text-[#00d9ff]">Backlog</strong> column.
              You can drag them to other columns after creation.
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-[#333]">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-[#333] rounded-lg hover:bg-[#1a1a1a] transition-colors text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || !description.trim()}
            className="px-4 py-2 bg-[#00d9ff] text-black rounded-lg hover:bg-[#00c4e6] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Issue
          </button>
        </div>
      </div>
    </div>
  )
}
