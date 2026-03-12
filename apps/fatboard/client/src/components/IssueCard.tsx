import { MessageCircle } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Issue } from '../../../server/src/types'

const priorityColors = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f43f5e',
  urgent: '#dc2626'
}

const priorityEmoji = {
  low: '🟢',
  medium: '🟡',
  high: '🔴',
  urgent: '🚨'
}

export function IssueCard({ issue }: { issue: Issue }) {
  const selectIssue = useStore(state => state.selectIssue)

  return (
    <button
      onClick={() => selectIssue(issue)}
      className="w-full text-left p-4 bg-[#0f0f0f] border border-[#333] rounded-lg hover:border-[#00d9ff] transition-colors cursor-pointer"
    >
      <h4 className="font-medium text-gray-200 mb-2 line-clamp-2">
        {issue.title}
      </h4>

      {issue.assignee && (
        <div className="text-sm text-gray-400 mb-2">
          {issue.assignee.avatar} {issue.assignee.name}
        </div>
      )}

      <div className="flex items-center justify-between">
        {issue.priority && (
          <div
            className="text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: `${priorityColors[issue.priority]}20`,
              color: priorityColors[issue.priority]
            }}
          >
            {priorityEmoji[issue.priority]} {issue.priority}
          </div>
        )}

        {issue.comments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MessageCircle className="w-3 h-3" />
            {issue.comments.length}
          </div>
        )}
      </div>

      {issue.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {issue.labels.slice(0, 3).map(label => (
            <span
              key={label}
              className="text-xs px-2 py-0.5 bg-[#1a1a1a] text-gray-400 rounded"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
