import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Hash, Server, Zap } from 'lucide-react';
import { PageShell, Card } from '../components/ui';

const NATS_SUBJECTS = [
  { subject: 'chatterbox.turns.store',         pattern: 'pub/sub',        dir: 'in',  desc: 'Publish a turn to persist'           },
  { subject: 'chatterbox.turns.ack.{turnId}',  pattern: 'pub/sub',        dir: 'out', desc: 'Ack emitted on successful store'      },
  { subject: 'chatterbox.query.app.{appId}',   pattern: 'request/reply',  dir: 'in',  desc: 'All turns for an appId'              },
  { subject: 'chatterbox.query.org.{orgId}',   pattern: 'request/reply',  dir: 'in',  desc: 'All turns for an orgId'              },
  { subject: 'chatterbox.query.user.{userId}', pattern: 'request/reply',  dir: 'in',  desc: 'All turns for a userId'              },
  { subject: 'chatterbox.query.turn.{turnId}', pattern: 'request/reply',  dir: 'in',  desc: 'Single turn by ULID'                 },
  { subject: 'chatterbox.query.ehash.{hash}',  pattern: 'request/reply',  dir: 'in',  desc: 'Turns matching a question/answer hash'},
];

const DESIGN_PRINCIPLES = [
  {
    icon:  <Lock size={20} />,
    title: 'No plaintext stored',
    desc:  'Question and answer text is never persisted. Only a salted BLAKE2b-256 hash fingerprint is stored — allowing deduplication and correlation without content exposure.',
    accent:'var(--accent)',
  },
  {
    icon:  <Eye size={20} />,
    title: 'Tenant isolation',
    desc:  'The hash salt is orgId + userId, so the same question from two different orgs produces a completely different hash value. Tenants cannot cross-correlate.',
    accent:'var(--green)',
  },
  {
    icon:  <Hash size={20} />,
    title: 'BLAKE2b-256 algorithm',
    desc:  'Second-generation cryptographic hash function. Built into Bun\'s native crypto module — no extra dependency, no attack surface. 256-bit output = 64 hex characters.',
    accent:'#a78bfa',
  },
  {
    icon:  <Server size={20} />,
    title: 'NATS JetStream durable store',
    desc:  'All turns are published to the CHATTERBOX_STORE stream (file-backed, 90-day retention). An in-memory index mirrors them for O(n) query without re-reading JetStream.',
    accent:'var(--amber)',
  },
  {
    icon:  <Zap size={20} />,
    title: 'Fire-and-forget pub/sub',
    desc:  'Any bree-ai service publishes to chatterbox.turns.store and immediately continues. Chatterbox acks via chatterbox.turns.ack.{turnId} asynchronously.',
    accent:'var(--accent)',
  },
  {
    icon:  <Shield size={20} />,
    title: 'Opaque resourceIds and claims',
    desc:  'Resource IDs are stored as-is (no validation). JWT claims snapshot is stored as received — chatterbox does no claims processing, keeping it a dumb store.',
    accent:'var(--green)',
  },
];

type Color = 'accent' | 'purple' | 'amber';

function SubjectRow({ subject, pattern, dir, desc, i }: { subject: string; pattern: string; dir: string; desc: string; i: number }) {
  const dirColor = dir === 'in' ? 'var(--accent)' : 'var(--green)';
  const dirBg    = dir === 'in' ? 'var(--accent-glow)' : 'var(--green-dim)';
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.04 }}
      style={{
        display:      'grid',
        gridTemplateColumns: '2fr 130px 60px 1fr',
        gap:          12,
        padding:      '12px 20px',
        borderBottom: '1px solid var(--border)',
        alignItems:   'center',
      }}
    >
      <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent)' }}>
        {subject}
      </code>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pattern}</span>
      <span style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
        color: dirColor, background: dirBg, borderRadius: 4, padding: '2px 7px', width: 'fit-content',
      }}>
        {dir}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</span>
    </motion.div>
  );
}

export function DesignPage() {
  return (
    <PageShell
      title="Architecture & Design"
      subtitle="How Chatterbox stores conversation turns with zero plaintext exposure"
    >
      {/* Core design */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {DESIGN_PRINCIPLES.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              background:   'var(--bg-surface)',
              border:       '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding:      '20px',
              position:     'relative',
              overflow:     'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${p.accent}, transparent)`, opacity: 0.5 }} />
            <div style={{ color: p.accent, marginBottom: 12 }}>{p.icon}</div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{p.title}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{p.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Data flow diagram */}
      <Card title="ehash Data Flow" style={{ marginBottom: 20 }}>
        <div style={{ padding: '24px 28px', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {[
            { label: 'question text',     color: 'var(--text-muted)',  bg: 'var(--bg-raised)' },
            { label: 'BLAKE2b-256(\norgId:userId:text)',  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', arrow: true },
            { label: 'questionEhash\n64-char hex',        color: 'var(--accent)', bg: 'var(--accent-glow)', arrow: true },
            { label: 'JetStream\nCHATTERBOX_STORE',       color: 'var(--green)',  bg: 'var(--green-dim)',  arrow: true },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {step.arrow && (
                <div style={{ color: 'var(--text-muted)', fontSize: 20, padding: '0 12px', flexShrink: 0 }}>→</div>
              )}
              <div style={{
                background:   step.bg,
                border:       `1px solid ${step.color}30`,
                borderRadius: 10,
                padding:      '14px 18px',
                minWidth:     140,
                textAlign:    'center',
              }}>
                <pre style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize:   11,
                  color:      step.color,
                  margin:     0,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                }}>
                  {step.label}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* NATS subjects */}
      <Card title="NATS Subject Taxonomy">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 130px 60px 1fr',
          gap: 12,
          padding: '8px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          {['Subject', 'Pattern', 'Dir', 'Description'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>
        {NATS_SUBJECTS.map((s, i) => (
          <SubjectRow key={s.subject} {...s} i={i} />
        ))}
      </Card>
    </PageShell>
  );
}
