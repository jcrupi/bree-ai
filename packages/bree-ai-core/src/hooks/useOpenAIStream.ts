/**
 * useOpenAIStream
 * ───────────────
 * React hook for progressive NATS-backed OpenAI streaming.
 * Used by KAT.ai, HabitAware, Talent Village, and The Vineyard.
 *
 * Usage:
 *   const { ask, response, isStreaming, reset } = useOpenAIStream();
 *
 *   // Render tokens as they arrive:
 *   await ask('What is machine learning?', context);
 *
 *   // Or with a callback:
 *   await ask(query, context, { systemPrompt: '...' }, {
 *     onToken: (tok, full) => console.log(tok),
 *     onDone: (full) => saveToDb(full),
 *   });
 */

import { useState, useCallback, useRef } from 'react';
import { generateChatResponseStream, type ChatCompletionOptions } from '../utils/openai-chat';

export interface UseOpenAIStreamOptions {
  onToken?: (token: string, accumulated: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (err: Error) => void;
}

export interface UseOpenAIStreamResult {
  /** Progressive response text — updates with each token as it arrives */
  response: string;
  /** True while the stream is open */
  isStreaming: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Submit a query — resolves (or throws) when the stream completes */
  ask: (
    query: string,
    context?: string,
    modelOptions?: ChatCompletionOptions,
    callbacks?: UseOpenAIStreamOptions
  ) => Promise<string>;
  /** Clear response and error state */
  reset: () => void;
  /** Abort the current stream (closes SSE connection, resolves ask) */
  abort: () => void;
}

export function useOpenAIStream(
  defaultOptions: ChatCompletionOptions = {},
  defaultCallbacks: UseOpenAIStreamOptions = {}
): UseOpenAIStreamResult {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<boolean>(false);

  const reset = useCallback(() => {
    setResponse('');
    setError(null);
    setIsStreaming(false);
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
  }, []);

  const ask = useCallback(async (
    query: string,
    context = '',
    modelOptions: ChatCompletionOptions = {},
    callbacks: UseOpenAIStreamOptions = {}
  ): Promise<string> => {
    abortRef.current = false;
    setIsStreaming(true);
    setError(null);
    setResponse('');

    const mergedOptions: ChatCompletionOptions = { ...defaultOptions, ...modelOptions };
    const onToken = callbacks.onToken ?? defaultCallbacks.onToken;
    const onDone = callbacks.onDone ?? defaultCallbacks.onDone;
    const onError = callbacks.onError ?? defaultCallbacks.onError;

    try {
      const result = await generateChatResponseStream(
        query,
        context,
        mergedOptions,
        (tok, accumulated) => {
          if (abortRef.current) return;
          setResponse(accumulated);
          onToken?.(tok, accumulated);
        },
        (fullText) => {
          if (abortRef.current) return;
          setResponse(fullText);
          onDone?.(fullText);
        }
      );

      if (!abortRef.current) {
        setIsStreaming(false);
        setResponse(result);
      }
      return result;
    } catch (err: any) {
      const e = err instanceof Error ? err : new Error(String(err));
      if (!abortRef.current) {
        setError(e);
        setIsStreaming(false);
      }
      onError?.(e);
      throw e;
    }
  }, [defaultOptions, defaultCallbacks]);

  return { response, isStreaming, error, ask, reset, abort };
}

export default useOpenAIStream;
