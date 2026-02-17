import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DocumentQA } from '@bree-ai/core/components';

export default function JobChat() {
  const { id } = useParams<{ id: string }>();

  // In a real app, we would fetch the job details and get the collectionId associated with it.
  // For now, we'll use a placeholder or a default collection.
  const collectionId = id === '1' ? 'senior-devops-collection' : 'default-jobs-collection';

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <div className="max-w-[1600px] mx-auto w-full px-6 py-4 border-b border-dark-800 flex items-center gap-4">
        <Link 
          to={`/dashboard/jobs/${id}`} 
          className="p-2 text-dark-400 hover:text-dark-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold text-dark-100">Job Intelligence Chat</h1>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <DocumentQA 
          collectionId={collectionId}
          orgSlug="talent.ai"
          title="Job Intelligence Chat"
          subtitle="Genius Talent.ai"
          description="Ask anything about this job, requirements, or company culture."
          showAdmin={true}
          initialMessages={[
            { 
              role: 'assistant', 
              content: `Hi! I'm your AI Job Assistant. I've analyzed the documents for this role. What would you like to know?` 
            }
          ]}
        />
      </div>
    </div>
  );
}
