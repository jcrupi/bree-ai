/**
 * OpenAI Chat Utilities
 * Provides chat completion functionality
 */

import { API_URL } from './api-client';

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  systemPrompt?: string;
}

export async function generateChatResponse(
  query: string,
  context: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bree_jwt') : null;

  const response = await fetch(`${API_URL}/api/openai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      query,
      context,
      options
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`OpenAI API error: ${error.error || response.statusText}`);
  }

  const result = await response.json();
  return result.response;
}
