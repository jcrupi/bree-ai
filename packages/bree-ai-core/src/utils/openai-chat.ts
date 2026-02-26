/**
 * OpenAI Streaming Chat Utilities
 * ─────────────────────────────────
 * All apps (KAT.ai, HabitAware, Talent Village, The Vineyard) share this.
 *
 * Uses the NATS-backed streaming pipeline in bree-api-realtime:
 *   1. POST  /api/openai/chat/stream  → { streamId }  (immediate, <1ms)
 *   2. GET   /api/openai/chat/stream/:streamId  (SSE, tokens arrive in real-time)
 *
 * Falls back to legacy blocking /api/openai/chat if REALTIME_URL is missing.
 */

import { API_URL, REALTIME_URL } from './api-client';

export type AIProvider = 'openai-chat' | 'openai-responses' | 'claude';

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  systemPrompt?: string;
  /** Which AI provider to use. Defaults to 'openai-chat'. */
  provider?: AIProvider;
  /** OpenAI Responses API: thread ID for multi-turn continuity */
  previous_response_id?: string;
}

/**
 * Full streaming chat — calls the callback with each token as it arrives.
 * Returns the complete assembled response string when done.
 *
 * @param query       User question
 * @param context     RAG context / document excerpts
 * @param options     Model config
 * @param onToken     Called with each streaming token (for progressive rendering)
 * @param onDone      Called with the final complete text
 * @returns           Full assembled response
 */
export async function generateChatResponseStream(
  query: string,
  context: string,
  options: ChatCompletionOptions = {},
  onToken?: (token: string, accumulated: string) => void,
  onDone?: (fullText: string) => void
): Promise<string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bree_jwt') : null;

  // Step 1: Submit the job — returns immediately with a streamId
  const submitRes = await fetch(`${REALTIME_URL}/api/ai/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query,
      context,
      options: {
        ...options,
        provider: options.provider ?? 'openai-chat',
      },
      ...(options.previous_response_id ? { previous_response_id: options.previous_response_id } : {}),
    }),
  });

  if (!submitRes.ok) {
    throw new Error(`Stream submit failed: ${submitRes.statusText}`);
  }

  const { streamId } = await submitRes.json() as { streamId: string };

  // Step 2: Open SSE connection — tokens flow through NATS in real-time
  return new Promise<string>((resolve, reject) => {
    const es = new EventSource(`${REALTIME_URL}/api/ai/stream/${streamId}`);
    let accumulated = '';

    es.addEventListener('token', (e) => {
      try {
        const { token: tok } = JSON.parse(e.data) as { token: string };
        accumulated += tok;
        onToken?.(tok, accumulated);
      } catch { /* skip malformed */ }
    });

    es.addEventListener('done', () => {
      es.close();
      onDone?.(accumulated);
      resolve(accumulated);
    });

    es.addEventListener('error', (e) => {
      es.close();
      try {
        const { error } = JSON.parse((e as any).data ?? '{}');
        reject(new Error(error || 'Stream error'));
      } catch {
        reject(new Error('Stream connection error'));
      }
    });

    // Safety: close and reject if the SSE connection itself errors out
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        // Already handled above — resolve with what we have
        resolve(accumulated);
      }
    };
  });
}

/**
 * Legacy blocking response — kept for backward compat but prefer the stream version.
 * @deprecated Use generateChatResponseStream instead
 */
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
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, context, options }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`OpenAI API error: ${(error as any).error || response.statusText}`);
  }

  const result = await response.json() as any;
  return result.response;
}
