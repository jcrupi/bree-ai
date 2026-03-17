import { connect, JSONCodec } from "nats";
import { generateText, tool } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { $ } from 'bun';

// ── Configuration ───────────────────────────────────────────────────────────

const NATS_URL = process.env.NATS_URL || "nats://nats.fly.dev:4222";
const AGENT_ID = "figler-agent-01";
const jc = JSONCodec();

const anthropic = createAnthropic({ 
    apiKey: process.env.ANTHROPIC_API_KEY 
});

// ── Tools (The Essential Five) ───────────────────────────────────────────────

const tools = {
  list_files: tool({
    description: 'List files recursively.',
    parameters: z.object({ path: z.string().describe('The path to list files from').default('.') }),
    execute: async ({ path }) => {
      console.log(`🛠️ Mapping files in: ${path}`);
      const files: string[] = [];
      for await (const f of new Bun.Glob('**/*').scan({ cwd: path })) {
        files.push(f.toString());
      }
      return { files };
    },
  }),
  read_file: tool({
    description: 'Read file content from disk.',
    parameters: z.object({ path: z.string().describe('The absolute path to the file') }),
    execute: async ({ path }) => {
      console.log(`🛠️ Reading file: ${path}`);
      const content = await Bun.file(path).text();
      return { content };
    },
  }),
  write_file: tool({
    description: 'Write code or content to a file.',
    parameters: z.object({ 
      path: z.string().describe('The absolute path to write to'), 
      code: z.string().describe('The content to write') 
    }),
    execute: async ({ path, code }) => {
      console.log(`🛠️ Writing file: ${path}`);
      await Bun.write(path, code);
      return { status: 'success' };
    },
  }),
  run_command: tool({
    description: 'Run a shell command on the local machine.',
    parameters: z.object({ command: z.string().describe('The shell command to execute') }),
    execute: async ({ command }) => {
      console.log(`🛠️ Running command: ${command}`);
      const output = await $`sh -c ${command}`.text();
      return { output };
    },
  })
};

// ── Execution Logic ──────────────────────────────────────────────────────────

async function startAgent() {
  console.log(`🌿 Starting Figler Agent: ${AGENT_ID}`);
  
  const nc = await connect({ servers: NATS_URL });
  console.log(`Connected to NATS at ${NATS_URL}`);

  // 1. Subscribe to Refactor Requests
  const sub = nc.subscribe("agent.refactor.request");
  console.log(`Listening on "agent.refactor.request"...`);

  for await (const msg of sub) {
    const request = jc.decode(msg.data) as any;
    console.log(`📥 Received Refactor Request: ${request.prompt}`);

    try {
      const { text } = await generateText({
        model: anthropic('claude-3-5-sonnet-20240620'),
        tools,
        maxSteps: 10,
        system: "You are a refactoring agent. Use tools to transform code.",
        prompt: request.prompt,
      });

      console.log(`✅ Refactor Complete: ${text}`);
      
      // Respond back to NATS (if reply subject exists)
      if (msg.reply) {
        msg.respond(jc.encode({ success: true, report: text }));
      }
    } catch (error: any) {
      console.error(`❌ Refactor Failed: ${error.message}`);
      if (msg.reply) {
        msg.respond(jc.encode({ success: false, error: error.message }));
      }
    }
  }
}

startAgent().catch(console.error);
