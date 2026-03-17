'use client'

import type { Issue, IssueStatus } from '@/types'
import { IssueCard } from './IssueCard'

interface BoardColumnProps {
  status: IssueStatus
  title: string
  color: string
  issues: Issue[]
}

export function BoardColumn({ status, title, color, issues }: BoardColumnProps) {
  return (
    <div className="flex flex-col">
      <div
        className="flex items-center gap-2 mb-4 pb-2 border-b"
        style={{ borderColor: color }}
      >
        <h3 className="font-semibold text-gray-200">{title}</h3>
        <span className="text-sm text-gray-500">({issues.length})</span>
      </div>

      <div className="space-y-3 min-h-[400px]">
        {issues.map(issue => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  )
}
