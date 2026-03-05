import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { connectNats, ensureChatterboxStream } from './store.js';
import { startWorkers } from './worker.js';
import { routes } from './routes.js';

const PORT = parseInt(process.env.PORT || '3002', 10);

// ── Elysia App ────────────────────────────────────────────────────────────────

const app = new Elysia()
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title:       'Chatterbox — Secure Conversational Store',
        version:     '1.0.0',
        description: 'Privacy-first append-only conversational store built on NATS JetStream. No plaintext stored — only BLAKE2b-256 hashes.',
      },
    },
  }))
  .use(routes)
  .get('/', () => ({
    service:     'chatterbox',
    version:     '1.0.0',
    description: 'Secure conversational store — ehash only, no plaintext',
    docs:        '/swagger',
  }));

// ── Boot ──────────────────────────────────────────────────────────────────────

async function boot() {
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
  let natsAvailable = true;

  // Attempt NATS connection (non-fatal if unavailable locally)
  try {
    await connectNats();
    await ensureChatterboxStream();
    await startWorkers();
    console.log('🍇 [chatterbox] NATS workers running');
  } catch (err: any) {
    natsAvailable = false;
    console.warn(`⚠️  [chatterbox] NATS unavailable at ${natsUrl} — running in REST-only mode`);
    console.warn('   Error:', err?.message ?? err);
    console.warn('   Start NATS with: docker compose up nats');
  }

  app.listen(PORT, () => {
    console.log(`\n🍇 chatterbox running on http://localhost:${PORT}`);
    console.log(`   swagger  → http://localhost:${PORT}/swagger`);
    console.log(`   health   → http://localhost:${PORT}/health`);
    console.log(`   turns    → http://localhost:${PORT}/api/turns`);
    if (!natsAvailable) {
      console.log('\n   ⚠️  NATS offline — REST endpoints active, NATS pub/sub disabled\n');
    }
  });
}

boot().catch((err) => {
  console.error('💥 [chatterbox] Fatal boot error:', err);
  process.exit(1);
});
