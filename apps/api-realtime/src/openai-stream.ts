/**
 * Multi-Provider NATS-Backed Streaming
 * ──────────────────────────────────────
 * Supports three AI providers through the same NATS/SSE pipeline:
 *
 *   provider: 'openai-chat'      → OpenAI Chat Completions API (stream: true)
 *   provider: 'openai-responses' → OpenAI Responses API (newer, stateful threads)
 *   provider: 'claude'           → Anthropic Claude (stream_mode: SSE)
 *
 * Architecture (same for all providers):
 *
 *  POST /api/ai/stream  → { streamId }        (< 1ms, provider-agnostic)
 *       ↓ NATS: ai.jobs
 *  Bun Worker (per-provider handler)
 *       ↓ NATS: ai.stream.{id}.token / .done / .error
 *  SSE GET /api/ai/stream/:id → browser tokens
 *
 * NATS subjects
 * ─────────────
 *   ai.jobs                       ← job queue (all providers)
 *   ai.stream.{id}.token          ← { token, streamId }
 *   ai.stream.{id}.done           ← { streamId, provider, usage? }
 *   ai.stream.{id}.error          ← { error, code? }
 */

import { Elysia, t } from 'elysia';
import { getNatsService } from '../../api/src/nats';

const OPENAI_API_KEY  = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ── Types ─────────────────────────────────────────────────────────────

type Provider = 'openai-chat' | 'openai-responses' | 'claude';

interface BaseJob {
  streamId: string;
  provider: Provider;
  model: string;
  temperature: number;
  max_tokens: number;
  systemPrompt: string;
}

interface OpenAIChatJob extends BaseJob {
  provider: 'openai-chat';
  messages: Array<{ role: string; content: string }>;
}

interface OpenAIResponsesJob extends BaseJob {
  provider: 'openai-responses';
  /** Full thread of messages for the Responses API */
  input: Array<{ role: string; content: string }>;
  /** Optional previous_response_id for threading */
  previous_response_id?: string;
}

interface ClaudeJob extends BaseJob {
  provider: 'claude';
  messages: Array<{ role: string; content: string }>;
}

type StreamJob = OpenAIChatJob | OpenAIResponsesJob | ClaudeJob;

// ── Provider Handlers ─────────────────────────────────────────────────

async function* streamOpenAIChat(job: OpenAIChatJob): AsyncGenerator<string> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: job.model,
      messages: job.messages,
      temperature: job.temperature,
      max_tokens: job.max_tokens,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);

  yield* parseOpenAISSEStream(res.body, delta => delta.choices?.[0]?.delta?.content);
}

async function* streamOpenAIResponses(job: OpenAIResponsesJob): AsyncGenerator<string> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

  const body: Record<string, any> = {
    model: job.model,
    input: job.input,
    stream: true,
    temperature: job.temperature,
    max_output_tokens: job.max_tokens,
  };

  if (job.systemPrompt) {
    body.instructions = job.systemPrompt;
  }

  if (job.previous_response_id) {
    body.previous_response_id = job.previous_response_id;
  }

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) throw new Error(`OpenAI Responses error ${res.status}: ${await res.text()}`);

  // Responses API emits events like:
  //   event: response.output_text.delta  data: { delta: "...", ... }
  //   event: response.completed          data: { response: { ... } }
  yield* parseOpenAISSEStream(res.body, parsed => {
    // Handle Responses API delta event shape
    if (parsed.type === 'response.output_text.delta') return parsed.delta;
    if (parsed.delta) return parsed.delta; // fallback
    return undefined;
  });
}

async function* streamClaude(job: ClaudeJob): AsyncGenerator<string> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: job.model,
      max_tokens: job.max_tokens,
      system: job.systemPrompt || undefined,
      messages: job.messages,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) throw new Error(`Claude error ${res.status}: ${await res.text()}`);

  // Claude SSE events:
  //   event: content_block_delta  data: { delta: { type: 'text_delta', text: '...' } }
  //   event: message_stop         data: {}
  yield* parseOpenAISSEStream(res.body, parsed => {
    if (parsed.type === 'content_block_delta') return parsed.delta?.text ?? '';
    return undefined;
  });
}

/**
 * Shared SSE reader — handles the `data: {...}` line format
 * used by OpenAI, Claude, and OpenAI Responses.
 *
 * @param body     - ReadableStream<Uint8Array> from fetch response
 * @param extract  - function to pull the text token from the parsed JSON
 */
async function* parseOpenAISSEStream(
  body: ReadableStream<Uint8Array>,
  extract: (parsed: any) => string | undefined | null
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        const token = extract(parsed);
        if (token !== undefined && token !== null) yield token;
      } catch {
        // skip malformed lines
      }
    }
  }
}

// ── Worker ────────────────────────────────────────────────────────────

async function processStreamJob(job: StreamJob): Promise<void> {
  const nats = await getNatsService();
  const subject = `ai.stream.${job.streamId}`;

  try {
    let gen: AsyncGenerator<string>;
    switch (job.provider) {
      case 'openai-chat':      gen = streamOpenAIChat(job); break;
      case 'openai-responses': gen = streamOpenAIResponses(job); break;
      case 'claude':           gen = streamClaude(job); break;
      default:
        throw new Error(`Unknown provider: ${(job as any).provider}`);
    }

    for await (const token of gen) {
      await nats.publish(`${subject}.token`, { token, streamId: job.streamId });
    }

    await nats.publish(`${subject}.done`, { streamId: job.streamId, provider: job.provider });

  } catch (err: any) {
    console.error(`❌ Stream error [${job.provider}] ${job.streamId}:`, err);
    try {
      const n = await getNatsService();
      await n.publish(`${subject}.error`, { error: err.message, provider: job.provider });
    } catch { /* NATS may be gone */ }
  }
}

export async function startAIWorker(): Promise<void> {
  const nats = await getNatsService();
  console.log('🤖 AI NATS worker listening on ai.jobs (openai-chat, openai-responses, claude)...');

  await nats.subscribe('ai.jobs', async (job: StreamJob) => {
    processStreamJob(job).catch(err =>
      console.error(`Worker job ${job?.streamId} failed:`, err)
    );
  });
}

// ── Legacy OpenAI worker alias (keeps backward-compat) ────────────────
/** @deprecated Use startAIWorker */
export const startOpenAIWorker = startAIWorker;

// ── Helper: build a StreamJob ─────────────────────────────────────────

function buildJob(
  body: Record<string, any>,
  streamId: string
): StreamJob {
  const {
    provider = 'openai-chat',
    messages,
    query,
    context,
    input,
    previous_response_id,
    options = {},
  } = body;

  const {
    model,
    temperature = 0.7,
    max_tokens = 2000,
    systemPrompt = 'You are a helpful AI assistant.',
  } = options;

  // Resolve default model per provider
  const defaultModel: Record<Provider, string> = {
    'openai-chat':      'gpt-4o',
    'openai-responses': 'gpt-4o',
    'claude':           'claude-opus-4-5',
  };
  const resolvedModel = model ?? defaultModel[provider as Provider] ?? 'gpt-4o';

  const base = { streamId, provider, model: resolvedModel, temperature, max_tokens, systemPrompt };

  if (provider === 'openai-responses') {
    const resolvedInput = input ?? [
      { role: 'user', content: context ? `Context:\n\n${context}\n\nQuestion: ${query}` : query },
    ];
    return { ...base, provider: 'openai-responses', input: resolvedInput, previous_response_id };
  }

  // openai-chat and claude both use messages[]
  const resolvedMessages = messages ?? [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: context ? `Context:\n\n${context}\n\nQuestion: ${query}` : (query ?? '') },
  ];

  return { ...base, provider: provider as 'openai-chat' | 'claude', messages: resolvedMessages };
}

// ── Elysia Plugin ─────────────────────────────────────────────────────

/**
 * Routes mounted at /api/ai
 *
 * POST /api/ai/stream          — submit job (all providers)
 * GET  /api/ai/stream/:id      — SSE token stream
 *
 * Legacy aliases (backward compat):
 * POST /api/openai/chat/stream → POST /api/ai/stream?provider=openai-chat
 * GET  /api/openai/chat/stream/:id → GET /api/ai/stream/:id
 * POST /api/openai/chat        → blocking (unchanged, see below)
 */
export const aiStreamRoutes = new Elysia()

  // ── New unified endpoint ──────────────────────────────────────────
  .post('/api/ai/stream', async ({ body, set }) => {
    const { provider = 'openai-chat' } = body as any;

    if (provider === 'claude' && !ANTHROPIC_API_KEY) {
      set.status = 500;
      return { error: 'ANTHROPIC_API_KEY not configured on server' };
    }
    if (provider !== 'claude' && !OPENAI_API_KEY) {
      set.status = 500;
      return { error: 'OPENAI_API_KEY not configured on server' };
    }

    const streamId = crypto.randomUUID();
    const job = buildJob(body as any, streamId);

    const nats = await getNatsService();
    await nats.publish('ai.jobs', job);

    return {
      streamId,
      provider: job.provider,
      model: job.model,
      hint: `Stream at /api/ai/stream/${streamId}`,
    };
  }, {
    body: t.Object({
      provider:             t.Optional(t.Union([t.Literal('openai-chat'), t.Literal('openai-responses'), t.Literal('claude')])),
      messages:             t.Optional(t.Array(t.Object({ role: t.String(), content: t.String() }))),
      input:                t.Optional(t.Array(t.Object({ role: t.String(), content: t.String() }))),
      query:                t.Optional(t.String()),
      context:              t.Optional(t.String()),
      previous_response_id: t.Optional(t.String()),
      options: t.Optional(t.Object({
        model:        t.Optional(t.String()),
        temperature:  t.Optional(t.Number()),
        max_tokens:   t.Optional(t.Number()),
        systemPrompt: t.Optional(t.String()),
      })),
    }),
  })

  // ── SSE stream endpoint (provider-agnostic) ───────────────────────
  .get('/api/ai/stream/:streamId', async ({ params: { streamId }, set }) => {
    set.headers['Content-Type']      = 'text/event-stream';
    set.headers['Cache-Control']     = 'no-cache';
    set.headers['Connection']        = 'keep-alive';
    set.headers['X-Accel-Buffering'] = 'no';

    let unsubscribe: (() => void) | null = null;
    let controllerClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        const nats = await getNatsService();

        const send = (event: string, data: object) => {
          if (controllerClosed) return;
          try {
            controller.enqueue(
              new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch { controllerClosed = true; }
        };

        unsubscribe = await nats.subscribeWildcard(
          `ai.stream.${streamId}.*`,
          (msg: any, subject: string) => {
            if (controllerClosed) return;
            const event = subject.split('.').pop() ?? 'token';
            switch (event) {
              case 'token':
                send('token', msg);
                break;
              case 'done':
                send('done', msg);
                setTimeout(() => {
                  if (!controllerClosed) { controllerClosed = true; try { controller.close(); } catch {} }
                }, 50);
                break;
              case 'error':
                send('error', msg);
                controllerClosed = true;
                try { controller.close(); } catch {}
                break;
            }
          }
        );

        send('connected', { streamId });
      },
      cancel() {
        controllerClosed = true;
        if (unsubscribe) { unsubscribe(); unsubscribe = null; }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  })

  // ── Legacy OpenAI aliases (backward compat) ───────────────────────
  .post('/api/openai/chat/stream', async ({ body, set }) => {
    if (!OPENAI_API_KEY) { set.status = 500; return { error: 'OPENAI_API_KEY not configured' }; }
    const streamId = crypto.randomUUID();
    const job = buildJob({ ...(body as any), provider: 'openai-chat' }, streamId);
    const nats = await getNatsService();
    await nats.publish('ai.jobs', job);
    return { streamId, model: job.model, hint: `Stream at /api/openai/chat/stream/${streamId}` };
  }, { body: t.Any() })

  .get('/api/openai/chat/stream/:streamId', ({ params: { streamId }, redirect }) => {
    // Forward to the canonical endpoint
    return redirect(`/api/ai/stream/${streamId}`, 301);
  })

  // Legacy blocking chat (kept for backward compat)
  .post('/api/openai/chat', async ({ body, set }) => {
    if (!OPENAI_API_KEY) { set.status = 500; return { error: 'OPENAI_API_KEY not configured' }; }
    const { query = '', context = '', options = {} } = body as any;
    const { model = 'gpt-4o', temperature = 0.7, max_tokens = 2000, systemPrompt = 'You are a helpful AI assistant.' } = options;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model, temperature, max_tokens, stream: false,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: context ? `Context:\n\n${context}\n\nQuestion: ${query}` : query }],
      }),
    });
    if (!res.ok) { set.status = res.status; return { error: (await res.json() as any)?.error?.message ?? res.statusText }; }
    const result = await res.json() as any;
    return { response: result.choices?.[0]?.message?.content ?? '' };
  }, { body: t.Any() });

// Re-export for index.ts
export const openAIStreamRoutes = aiStreamRoutes;
