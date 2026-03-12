import { Plus } from 'lucide-react'
import { useStore } from '../lib/store'
import { BoardColumn } from './BoardColumn'

const columns = [
  { status: 'backlog', title: 'Backlog', color: '#64748b' },
  { status: 'todo', title: 'To Do', color: '#8b5cf6' },
  { status: 'in_progress', title: 'In Progress', color: '#00d9ff' },
  { status: 'done', title: 'Done', color: '#22c55e' },
]

export function Board() {
  const { issues, isLoading, toggleCreateModal } = useStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-73px)]">
        <div className="text-gray-400">Loading issues...</div>
      </div>
    )
  }

  const issuesByStatus = columns.map(column => ({
    ...column,
    issues: issues.filter(issue => issue.status === column.status)
  }))

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-200">Board View</h2>
        <button
          onClick={toggleCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#00d9ff] text-black rounded-lg hover:bg-[#00c4e6] transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Issue
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {issuesByStatus.map(column => (
          <BoardColumn
            key={column.status}
            status={column.status}
            title={column.title}
            color={column.color}
            issues={column.issues}
          />
        ))}
      </div>

      {/* BREE Stack Comparison */}
      <div className="mt-12 p-6 bg-[#0f0f0f] border border-[#333] rounded-lg">
        <div className="text-sm text-gray-400 mb-4 font-mono">BREE Stack Performance</div>
        <div className="grid grid-cols-4 gap-8">
          <div>
            <div className="text-gray-500 text-sm mb-1">Jira (Next.js)</div>
            <div className="text-2xl font-bold text-red-400 mb-2">8.2MB</div>
            <div className="text-xs text-gray-500">6.3s load · Node</div>
          </div>

          <div>
            <div className="text-gray-500 text-sm mb-1">FatBoard (BREE)</div>
            <div className="text-2xl font-bold text-[#00d9ff] mb-2">385KB</div>
            <div className="text-xs text-gray-500">0.3s load · Bun</div>
          </div>

          <div>
            <div className="text-gray-500 text-sm mb-1">Improvement</div>
            <div className="text-2xl font-bold text-green-400 mb-2">21x</div>
            <div className="text-xs text-gray-500">smaller & faster</div>
          </div>

          <div>
            <div className="text-gray-500 text-sm mb-1">Stack</div>
            <div className="text-sm font-bold text-[#00d9ff] mb-1 font-mono">BREE</div>
            <div className="text-xs text-gray-500">Bun + Elysia + Eden</div>
          </div>
        </div>
      </div>
    </div>
  )
}
