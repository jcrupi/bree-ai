import React from 'react';
import { DocumentQA } from '@bree-ai/core/components';
import { currentBrand } from '@bree-ai/core/config';

interface KnowledgeChatProps {
  projectId?: string;
  collectionId?: string;
  title?: string;
  description?: string;
}

/**
 * AI-powered knowledge chat for The Vineyard
 *
 * Uses Ragster for document search and AgentX for intelligent responses
 * Integrated with bree-ai infrastructure
 */
export function KnowledgeChat({
  projectId,
  collectionId = 'the-vineyard-v1',
  title = 'Project Intelligence',
  description = 'Ask questions about your projects, tasks, and team knowledge.'
}: KnowledgeChatProps) {
  const initialMessages = [
    {
      role: 'assistant' as const,
      content: `Hi! I'm your Vineyard AI assistant. I can help you understand your projects, analyze tasks, and provide insights. What would you like to know?`
    }
  ];

  return (
    <div className="h-full">
      <DocumentQA
        collectionId={collectionId}
        orgSlug="the-vineyard"
        title={title}
        subtitle={currentBrand.displayName}
        description={description}
        showAdmin={true}
        brandLogo={currentBrand.logo}
        brandColor={currentBrand.colors.primary}
        initialMessages={initialMessages}
        instructionsPath="/instructions/the-vineyard.md"
      />
    </div>
  );
}
