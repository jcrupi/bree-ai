import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Database, Shield, Zap, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import { PageShell, StatCard, Card, Button, Badge, Spinner } from '../components/ui';
import { getHealth, queryTurns, type HealthResponse } from '../api';
import type { ConvoTurn, QueryResult } from '../types';

// ── Vine seed convos (example data) ─────────────────────────────────────

const VINE_EXAMPLES = [
  { convoId: 'convo-1', topic: 'Homepage Hero Animation', turns: 3,  app: 'the-vineyard', org: 'the-vineyard' },
  { convoId: 'convo-2', topic: 'Database Schema Review',   turns: 2,  app: 'the-vineyard', org: 'the-vineyard' },
  { convoId: 'convo-3', topic: 'Mobile Navigation',        turns: 2,  app: 'the-vineyard', org: 'the-vineyard' },
  { convoId: 'convo-4', topic: 'API Rate Limiting',         turns: 2,  app: 'the-vineyard', org: 'the-vineyard' },
  { convoId: 'convo-5', topic: 'Color Palette Accessibility',turns: 2, app: 'the-vineyard', org: 'the-vineyard' },
];

function TurnRow({ turn }: { turn: ConvoTurn }) {
  const q = `${turn.questionEhash.slice(0, 8)}…${turn.questionEhash.slice(-4)}`;
  const a = `${turn.answerEhash.slice(0, 8)}…${turn.answerEhash.slice(-4)}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 120px 100px 1fr 90px',
        gap: 12,
        padding: '11px 20px',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center',
        fontSize: 12,
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
        {turn.turnId.slice(0, 20)}
      </span>
      <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{turn.convoId}</span>
      <span style={{ color: 'var(--text-secondary)' }}>{turn.userId}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--accent)', background: 'rgba(59,130,246,0.08)', borderRadius: 3, padding: '1px 5px', width: 'fit-content' }}>
          Q: {q}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#a78bfa', background: 'rgba(167,139,250,0.08)', borderRadius: 3, padding: '1px 5px', width: 'fit-content' }}>
          A: {a}
        </span>
      </div>
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
        {new Date(turn.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </motion.div>
  );
}

export function DashboardPage() {
  const [health,  setHealth]  = useState<HealthResponse | null>(null);
  const [turnsResult,  setTurnsResult]  = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, r] = await Promise.all([getHealth(), queryTurns({ limit: 10 })]);
      setHealth(h);
      setTurnsResult(r);
    } catch (err: any) {
      setError(err.message || 'Cannot reach chatterbox backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const actions = (
    <Button variant="ghost" size="sm" onClick={refresh} loading={loading} icon={<RefreshCw size={13} />}>
      Refresh
    </Button>
  );

  return (
    <PageShell
      title="Chatterbox Dashboard"
      subtitle="Privacy-first conversational intelligence store"
      actions={actions}
    >
      {/* Health Banner */}
      {error ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 10, marginBottom: 24,
            background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--red)', fontSize: 13,
          }}
        >
          <AlertCircle size={16} />
          <strong>Backend offline:</strong>&nbsp;{error}&nbsp;
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            — Start: <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>cd apps/chatterbox &amp;&amp; bun run dev</code>
          </span>
        </motion.div>
      ) : health ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderRadius: 10, marginBottom: 24,
            background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.25)',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--green)' }}>
            Backend healthy · <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{health.timestamp}</span>
          </span>
        </motion.div>
      ) : loading ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, color: 'var(--text-muted)', fontSize: 13 }}>
          <Spinner size={14} /> Connecting to chatterbox…
        </div>
      ) : null}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Total Turns"
          value={health?.turns ?? '—'}
          sub="all-time stored"
          accent="var(--accent)"
          icon={<Database size={16} />}
        />
        <StatCard
          label="Total Convos"
          value={health?.convos ?? '—'}
          sub="active threads"
          accent="var(--green)"
          icon={<MessageSquare size={16} />}
        />
        <StatCard
          label="Hash Algorithm"
          value="BLAKE2b"
          sub="256-bit salted"
          accent="#a78bfa"
          icon={<Shield size={16} />}
        />
        <StatCard
          label="Plaintext Stored"
          value="0"
          sub="by design — ehash only"
          accent="var(--amber)"
          icon={<Zap size={16} />}
        />
      </div>

      {/* Two-column: Convo index + recent turns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 16 }}>

        {/* Example convos */}
        <Card title="Example Vine Convos">
          {VINE_EXAMPLES.map((c, i) => (
            <motion.div
              key={c.convoId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: i < VINE_EXAMPLES.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.topic}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{c.convoId}</span> · {c.app}
                </div>
              </div>
              <Badge label={`${c.turns} turns`} color="var(--accent)" bg="var(--accent-glow)" />
            </motion.div>
          ))}
        </Card>

        {/* Recent turns */}
        <Card title="Recent Turns" actions={
          <Badge label={`${turnsResult?.total ?? 0} total`} color="var(--text-muted)" bg="var(--bg-raised)" />
        }>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
              <Spinner />
            </div>
          ) : turnsResult && turnsResult.turns.length > 0 ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '180px 120px 100px 1fr 90px',
                gap: 12,
                padding: '8px 20px',
                borderBottom: '1px solid var(--border)',
              }}>
                {['Turn ID', 'Convo', 'User', 'Hashes', 'Time'].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>
              {turnsResult.turns.map(t => <TurnRow key={t.turnId} turn={t} />)}
            </>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <Database size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
              No turns stored yet.
              <br />
              <span style={{ fontSize: 12 }}>Run tests or use the Store tab to add turns.</span>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
