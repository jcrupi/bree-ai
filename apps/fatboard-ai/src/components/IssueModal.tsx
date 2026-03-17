'use client'

import { X, MessageCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useState } from 'react'

export function IssueModal() {
  const { selectedIssue, showIssueModal, selectIssue, addComment } = useStore()
  const [newComment, setNewComment] = useState('')

  if (!showIssueModal || !selectedIssue) return null

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    await addComment(selectedIssue.id, newComment)
    setNewComment('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0f0f0f] border border-[#333] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#333] sticky top-0 bg-[#0f0f0f]">
          <h2 className="text-xl font-semibold text-gray-200">
            {selectedIssue.title}
          </h2>
          <button
            onClick={() => selectIssue(null)}
            className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <p className="text-gray-300">{selectedIssue.description}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Status
              </label>
              <div className="px-3 py-2 bg-[#1a1a1a] rounded-lg text-gray-300">
                {selectedIssue.status.replace('_', ' ')}
              </div>
            </div>

            {selectedIssue.priority && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Priority
                </label>
                <div className="px-3 py-2 bg-[#1a1a1a] rounded-lg text-gray-300">
                  {selectedIssue.priority}
                </div>
              </div>
            )}
          </div>

          {selectedIssue.assignee && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Assignee
              </label>
              <div className="flex items-center gap-2 text-gray-300">
                <span>{selectedIssue.assignee.avatar}</span>
                <span>{selectedIssue.assignee.name}</span>
              </div>
            </div>
          )}

          {selectedIssue.labels.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedIssue.labels.map(label => (
                  <span
                    key={label}
                    className="px-3 py-1 bg-[#1a1a1a] text-gray-300 rounded-lg text-sm"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-[#333] pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-4 h-4 text-gray-400" />
              <label className="text-sm font-medium text-gray-400">
                Comments ({selectedIssue.comments.length})
              </label>
            </div>

            <div className="space-y-4 mb-4">
              {selectedIssue.comments.map(comment => (
                <div key={comment.id} className="bg-[#1a1a1a] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      {comment.author.avatar} {comment.author.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{comment.content}</p>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <div className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#00d9ff] resize-none"
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-[#00d9ff] text-black rounded-lg hover:bg-[#00c4e6] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
