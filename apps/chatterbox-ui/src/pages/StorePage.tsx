import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, CheckCircle, XCircle, Send } from 'lucide-react';
import { PageShell, Card, Button, Input, HashChip, Spinner, Badge } from '../components/ui';
import { storeTurn, type StoreTurnPayload } from '../api';
import type { ConvoTurn } from '../types';

// Inline BLAKE2b-256 approximation using subtle crypto (SHA-256 as demo)
// The real ehash is produced by the backend server-side
async function ehashPreview(orgId: string, userId: string, content: string): Promise<string> {
  const text = `${orgId}:${userId}:${content}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Seed from vine convos
const VINE_SEEDS = [
  {
    label:    'Convo 1 · Hero Animation',
    appId:    'the-vineyard',
    orgId:    'the-vineyard',
    userId:   'h2',
    convoId:  'convo_01JHG',
    question: 'Hey Marcus, I was thinking about the hero section animation. Can we make it more subtle?',
    answer:   'Sure Mary! I can adjust the easing curve. Did you have a specific reference in mind?',
    resourceIds: ['vine-1', 'proj-1'],
    metadata: { topic: 'Homepage Hero Animation', model: 'none', vineId: 'vine-1' },
  },
  {
    label:    'Convo 2 · DB Schema',
    appId:    'the-vineyard',
    orgId:    'the-vineyard',
    userId:   'h1',
    convoId:  'convo_02KJH',
    question: 'Alex, are we using a relational model for the user preferences?',
    answer:   'I was planning on JSONB for flexibility, since the preferences schema changes often.',
    resourceIds: ['vine-2', 'proj-1'],
    metadata: { topic: 'Database Schema Review', vineId: 'vine-2' },
  },
  {
    label:    'Convo 3 · Mobile Nav',
    appId:    'the-vineyard',
    orgId:    'the-vineyard',
    userId:   'ha1',
    convoId:  'convo_03MLP',
    question: 'Mary, the mobile menu touch targets feel a bit small on iOS.',
    answer:   'Oh? They should be 44px minimum. Let me check the Figma file.',
    resourceIds: ['vine-3', 'proj-1'],
    metadata: { topic: 'Mobile Navigation', vineId: 'vine-3' },
  },
];

export function StorePage() {
  const [appId,    setAppId]   = useState('the-vineyard');
  const [orgId,    setOrgId]   = useState('the-vineyard');
  const [userId,   setUserId]  = useState('usr_test');
  const [convoId,  setConvoId] = useState('convo_test');
  const [question, setQuestion]= useState('');
  const [answer,   setAnswer]  = useState('');
  const [resources,setResources]=useState('');

  const [qHash, setQHash] = useState('');
  const [aHash, setAHash] = useState('');
  const [hashing, setHashing] = useState(false);
  const [stored,  setStored]  = useState<ConvoTurn | null>(null);
  const [storing, setStoring] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const computeHashes = async () => {
    if (!question.trim() || !answer.trim()) return;
    setHashing(true);
    const [q, a] = await Promise.all([
      ehashPreview(orgId, userId, question),
      ehashPreview(orgId, userId, answer),
    ]);
    setQHash(q);
    setAHash(a);
    setHashing(false);
  };

  const loadSeed = async (seed: typeof VINE_SEEDS[0]) => {
    setAppId(seed.appId);
    setOrgId(seed.orgId);
    setUserId(seed.userId);
    setConvoId(seed.convoId);
    setQuestion(seed.question);
    setAnswer(seed.answer);
    setResources(seed.resourceIds.join(', '));
    setStored(null);
    setError(null);
    setQHash('');
    setAHash('');
  };

  const handleStore = async () => {
    if (!qHash || !aHash) { setError('Compute hashes first'); return; }
    setStoring(true);
    setError(null);
    try {
      const payload: StoreTurnPayload = {
        convoId,
        appId, orgId, userId,
        questionEhash: qHash,
        answerEhash:   aHash,
        resourceIds:   resources.split(',').map(s => s.trim()).filter(Boolean),
        metadata:      { source: 'chatterbox-ui' },
      };
      const res = await storeTurn(payload);
      setStored(res.turn);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStoring(false);
    }
  };

  return (
    <PageShell
      title="Store a Turn"
      subtitle="Enter question + answer text — only the BLAKE2b-256 eHash is sent to the backend"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Left: form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Seeds */}
          <Card title="Load from Example Convo">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 20px' }}>
              {VINE_SEEDS.map(seed => (
                <Button key={seed.label} variant="ghost" size="sm" onClick={() => loadSeed(seed)}>
                  {seed.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Identity */}
          <Card title="Convo Identity">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 20px' }}>
              <Input label="Convo ID" value={convoId} onChange={e => setConvoId(e.target.value)} />
              <Input label="App ID"   value={appId}   onChange={e => setAppId(e.target.value)} />
              <Input label="Org ID"   value={orgId}   onChange={e => setOrgId(e.target.value)} />
              <Input label="User ID"  value={userId}  onChange={e => setUserId(e.target.value)} />
            </div>
          </Card>

          {/* Content */}
          <Card title="Convo Content (never sent to server)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Question</label>
                <textarea
                  rows={3}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="The question / user message…"
                  style={{
                    background: 'var(--bg-raised)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)',
                    fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Answer</label>
                <textarea
                  rows={3}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="The AI or human response…"
                  style={{
                    background: 'var(--bg-raised)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-primary)',
                    fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                  }}
                />
              </div>
              <Input
                label="Resource IDs (comma-separated)"
                value={resources}
                onChange={e => setResources(e.target.value)}
                placeholder="resource-1, proj-1, job_123"
              />
            </div>
          </Card>

          {/* Hash + submit */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="ghost"
              onClick={computeHashes}
              loading={hashing}
              icon={<Hash size={13} />}
              style={{ flex: 1 }}
              disabled={!question.trim() || !answer.trim()}
            >
              Compute eHashes
            </Button>
            <Button
              onClick={handleStore}
              loading={storing}
              icon={<Send size={13} />}
              style={{ flex: 1 }}
              disabled={!qHash || !aHash}
            >
              Store Turn
            </Button>
          </div>
        </div>

        {/* Right: preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Hash preview */}
          <Card title="eHash Preview" style={{ flex: 'none' }}>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Question eHash
                </div>
                {hashing ? <Spinner size={16} /> : qHash ? (
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                    color: 'var(--accent)', wordBreak: 'break-all', lineHeight: 1.8,
                  }}>{qHash}</span>
                ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Answer eHash
                </div>
                {hashing ? <Spinner size={16} /> : aHash ? (
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                    color: '#a78bfa', wordBreak: 'break-all', lineHeight: 1.8,
                  }}>{aHash}</span>
                ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--bg-raised)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                🔒 Note: The text above is hashed in the browser using <strong>SHA-256</strong> (preview).
                The production server uses <strong>BLAKE2b-256</strong> for eHash generation.
              </div>
            </div>
          </Card>

          {/* Result */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '14px 16px', borderRadius: 10,
                  background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)',
                  color: 'var(--red)', fontSize: 13,
                }}
              >
                <XCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </motion.div>
            )}
            {stored && (
              <motion.div
                key="stored"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              >
                <Card title="✅ Convo Turn Stored">
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={16} color="var(--green)" />
                      <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                        Successfully stored
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Turn ID</div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-primary)' }}>
                        {stored.turnId}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Convo ID</div>
                      <Badge label={stored.convoId} color="var(--amber)" bg="var(--amber-dim)" />
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <HashChip hash={stored.questionEhash} label="Q" />
                      <HashChip hash={stored.answerEhash}   label="A" />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {stored.ts}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}
