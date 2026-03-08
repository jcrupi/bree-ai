import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth'
import { useWallet } from '../hooks/useWallet'
import { useJwtToken } from '../hooks/useJwtToken'
import { Card, Badge, Button, TokenBalance, Spinner } from '../components/ui'
import {
  Zap, LogOut, Send, Bot, User, TrendingUp,
  CreditCard, Activity, ChevronDown, Copy, Check
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const MODELS = [
  { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', provider: 'anthropic', tier: 'free' },
  { id: 'gpt-4o-mini',               label: 'GPT-4o Mini',       provider: 'openai',    tier: 'free' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic', tier: 'pro' },
  { id: 'gpt-4o',                     label: 'GPT-4o',            provider: 'openai',    tier: 'pro' },
]

interface Message {
  role: 'user' | 'assistant'
  content: string
  model?: string
  tokensCharged?: number
  latencyMs?: number
}

interface UsageEntry {
  id: string
  model: string
  provider: string
  totalTokens: number
  tokensCharged: number
  latencyMs: number
  status: string
  createdAt: string
}

type Tab = 'playground' | 'usage' | 'credits'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const { wallet, loading: walletLoading, purchaseCredits } = useWallet()
  const { token } = useJwtToken()

  const [tab, setTab] = useState<Tab>('playground')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id)
  const [sending, setSending] = useState(false)
  const [usage, setUsage] = useState<UsageEntry[]>([])
  const [usageLoading, setUsageLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (tab === 'usage' && token) loadUsage()
  }, [tab, token])

  const loadUsage = async () => {
    if (!token) return
    setUsageLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/wallet/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setUsage(data.usage ?? [])
    } finally {
      setUsageLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !token || sending) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      const res = await fetch(`${API_URL}/api/gateway/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error ?? 'Request failed'}`,
        }])
        return
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.choices?.[0]?.message?.content ?? '',
        model: data.model,
        tokensCharged: data.tokenhouse?.tokensCharged,
        latencyMs: data.tokenhouse?.latencyMs,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error — is the server running?',
      }])
    } finally {
      setSending(false)
    }
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate('/')
  }

  const copyApiExample = () => {
    const example = `curl -X POST ${API_URL}/api/gateway/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`
    navigator.clipboard.writeText(example)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedModelInfo = MODELS.find(m => m.id === selectedModel)

  const PACKAGES = [
    { id: 'starter',    label: '$10',  tokens: '10M tokens',   popular: false },
    { id: 'growth',     label: '$25',  tokens: '27.5M tokens', popular: true  },
    { id: 'pro',        label: '$50',  tokens: '60M tokens',   popular: false },
    { id: 'enterprise', label: '$100', tokens: '130M tokens',  popular: false },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>

      {/* Header */}
      <header className="glass border-b border-th-border px-6 py-3 flex items-center justify-between sticky top-0 z-10"
        style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #00d4aa)' }}>
            <Zap size={14} fill="white" color="white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Token House</span>
        </div>

        <div className="flex items-center gap-4">
          {walletLoading ? (
            <Spinner size={14} />
          ) : (
            <div className="flex items-center gap-2">
              <TokenBalance balance={wallet?.balance ?? 0} size="sm" />
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-th-text-secondary">
            <div className="w-6 h-6 rounded-full bg-th-accent/20 flex items-center justify-center text-xs text-th-accent font-bold">
              {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="hidden sm:inline">{session?.user?.email}</span>
          </div>

          <button onClick={handleSignOut} className="th-btn th-btn-ghost px-2 py-1.5">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-th-border px-6">
        <div className="flex gap-0">
          {(['playground', 'usage', 'credits'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors relative ${
                tab === t
                  ? 'text-th-accent'
                  : 'text-th-text-secondary hover:text-th-text-primary'
              }`}
            >
              {t}
              {tab === t && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">

        {/* ── Playground ──────────────────────────────────────────────────── */}
        {tab === 'playground' && (
          <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Playground</h1>
                <p className="text-sm text-th-text-secondary mt-0.5">
                  Test models through the Token House gateway
                </p>
              </div>

              {/* Model selector */}
              <div className="relative">
                <button
                  onClick={() => setModelOpen(!modelOpen)}
                  className="glass-elevated flex items-center gap-2 px-3 py-2 text-sm hover:border-th-accent transition-colors"
                >
                  <Bot size={14} className="text-th-accent" />
                  <span>{selectedModelInfo?.label}</span>
                  <Badge variant={selectedModelInfo?.tier === 'free' ? 'default' : 'accent'}>
                    {selectedModelInfo?.provider}
                  </Badge>
                  <ChevronDown size={12} className="text-th-text-muted" />
                </button>

                {modelOpen && (
                  <div className="absolute right-0 top-full mt-1 glass-elevated w-64 z-20 py-1">
                    {MODELS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedModel(m.id); setModelOpen(false) }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${
                          selectedModel === m.id ? 'text-th-accent' : 'text-th-text-primary'
                        }`}
                      >
                        <span>{m.label}</span>
                        <div className="flex gap-1">
                          <Badge variant={m.provider === 'anthropic' ? 'accent' : 'success'}>
                            {m.provider}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="glass flex-1 min-h-[400px] max-h-[500px] overflow-y-auto flex flex-col gap-3 p-4">
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-th-text-muted text-sm">
                  <div className="text-center">
                    <Bot size={32} className="mx-auto mb-3 opacity-30" />
                    <p>Send a message to start chatting</p>
                    <p className="text-xs mt-1">Your request routes through Token House to {selectedModelInfo?.label}</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`rounded-lg p-3 ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {msg.role === 'user'
                      ? <User size={12} className="text-th-text-muted" />
                      : <Bot size={12} className="text-th-accent" />
                    }
                    <span className="text-xs text-th-text-muted font-mono">
                      {msg.role === 'user' ? 'You' : msg.model ?? 'Assistant'}
                    </span>
                    {msg.tokensCharged !== undefined && (
                      <span className="ml-auto text-xs font-mono text-th-text-muted">
                        {msg.tokensCharged} tokens · {msg.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}

              {sending && (
                <div className="message-assistant rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Bot size={12} className="text-th-accent" />
                    <span className="text-xs text-th-text-muted font-mono">{selectedModelInfo?.label}</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-th-accent animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="glass-elevated flex gap-2 p-2">
              <input
                className="th-input flex-1"
                style={{ background: 'transparent', border: 'none', padding: '8px 12px' }}
                placeholder="Send a message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={sending}
              />
              <Button onClick={sendMessage} disabled={!input.trim() || sending || !token} size="sm">
                <Send size={14} />
              </Button>
            </div>

            {/* API example */}
            <Card className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-th-text-secondary font-mono uppercase tracking-wider">
                  OpenAI-compatible endpoint
                </span>
                <button onClick={copyApiExample} className="th-btn th-btn-ghost px-2 py-1 text-xs flex items-center gap-1">
                  {copied ? <Check size={12} className="text-th-secondary" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs font-mono text-th-text-secondary overflow-x-auto">
{`POST ${API_URL}/api/gateway/v1/chat/completions
Authorization: Bearer <your-jwt-token>

{ "model": "claude-3-5-haiku-20241022",
  "messages": [{"role": "user", "content": "Hello!"}] }`}
              </pre>
            </Card>
          </div>
        )}

        {/* ── Usage ───────────────────────────────────────────────────────── */}
        {tab === 'usage' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold">Usage History</h1>
              <p className="text-sm text-th-text-secondary mt-0.5">Recent API calls and token consumption</p>
            </div>

            {usageLoading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : usage.length === 0 ? (
              <Card className="py-12 text-center">
                <Activity size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-th-text-muted text-sm">No usage yet — send a message in the playground</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {usage.map(entry => (
                  <Card key={entry.id} className="flex items-center gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-th-text-primary truncate">{entry.model}</span>
                        <Badge variant={entry.provider === 'anthropic' ? 'accent' : 'success'}>
                          {entry.provider}
                        </Badge>
                        <Badge variant={entry.status === 'completed' ? 'success' : 'warn'}>
                          {entry.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-th-text-muted mt-0.5 font-mono">
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-mono text-th-accent">{entry.tokensCharged.toLocaleString()} charged</div>
                      <div className="text-xs text-th-text-muted font-mono">{entry.totalTokens.toLocaleString()} total · {entry.latencyMs}ms</div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Credits ─────────────────────────────────────────────────────── */}
        {tab === 'credits' && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-xl font-bold">Credits</h1>
              <p className="text-sm text-th-text-secondary mt-0.5">Purchase Token House credits to use with any model</p>
            </div>

            {/* Current balance */}
            <Card elevated>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-th-text-muted uppercase tracking-wider mb-2">Current Balance</div>
                  <TokenBalance balance={wallet?.balance ?? 0} size="lg" />
                </div>
                <div className="text-right">
                  <Badge variant={wallet?.planTier === 'free' ? 'default' : wallet?.planTier === 'pro' ? 'accent' : 'gold'}>
                    {wallet?.planTier ?? 'free'} plan
                  </Badge>
                  <div className="text-xs text-th-text-muted mt-2">
                    $1 = 10,000 tokens
                  </div>
                </div>
              </div>
            </Card>

            {/* Packages */}
            <div>
              <div className="text-xs text-th-text-muted uppercase tracking-wider mb-3">Purchase Packages</div>
              <div className="grid grid-cols-2 gap-3">
                {PACKAGES.map(pkg => (
                  <Card
                    key={pkg.id}
                    elevated={pkg.popular}
                    className={`relative transition-all hover:border-th-accent cursor-pointer ${
                      pkg.popular ? 'border-th-accent/30' : ''
                    }`}
                    onClick={() => purchaseCredits(pkg.id)}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2.5 left-4">
                        <Badge variant="accent">Most popular</Badge>
                      </div>
                    )}
                    <div className="text-2xl font-bold text-gradient mb-1">{pkg.label}</div>
                    <div className="text-sm text-th-text-secondary font-mono">{pkg.tokens}</div>
                    <div className="mt-3">
                      <Button variant={pkg.popular ? 'primary' : 'secondary'} size="sm" className="w-full">
                        <CreditCard size={12} className="mr-1.5" />
                        Purchase
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Plan info */}
            <Card>
              <div className="text-xs text-th-text-muted uppercase tracking-wider mb-3">Allowed Models</div>
              <div className="flex flex-wrap gap-2">
                {(wallet?.allowedModels ?? []).map(m => (
                  <Badge key={m} variant="default">
                    <span className="font-mono">{m}</span>
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
