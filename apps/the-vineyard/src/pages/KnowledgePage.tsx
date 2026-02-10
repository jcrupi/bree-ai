import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { KnowledgeChat } from '../components/KnowledgeChat';

export function KnowledgePage() {
  const { projectId } = useParams<{ projectId?: string }>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <div className="max-w-[1600px] mx-auto w-full px-6 py-4 border-b border-slate-200 flex items-center gap-4 bg-white/80 backdrop-blur-sm">
        <Link
          to={projectId ? `/project/${projectId}` : '/'}
          className="p-2 text-slate-500 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">
          {projectId ? 'Project Intelligence' : 'Vineyard Intelligence'}
        </h1>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-medium">
            AI Powered
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KnowledgeChat
          projectId={projectId}
          title={projectId ? 'Project Intelligence' : 'Vineyard Intelligence'}
          description="Ask questions about your projects, tasks, team members, and documentation. I can help you understand what's happening and provide insights."
        />
      </div>
    </div>
  );
}
