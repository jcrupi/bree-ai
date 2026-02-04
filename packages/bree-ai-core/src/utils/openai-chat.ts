/**
 * OpenAI Chat Utilities
 * Provides chat completion functionality
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

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
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Provide VITE_OPENAI_API_KEY to use AI features.');
  }

  const {
    model = 'gpt-4o',
    temperature = 0.7,
    max_tokens = 2000,
    systemPrompt = 'You are KAT.ai, a helpful document assistant.'
  } = options;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Context information from documents:\n\n${context}\n\nQuestion: ${query}\n\nPlease answer the question based on the provided context and follow your system instructions.` 
        }
      ],
      temperature,
      max_tokens
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}
