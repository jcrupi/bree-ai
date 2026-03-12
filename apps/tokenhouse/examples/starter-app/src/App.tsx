import { useState } from 'react'
import { AuthProvider, AuthCard, UserButton, useSession } from '@daveyplate/better-auth-ui'
import './App.css'

const API_BASE = 'http://localhost:8187'

function App() {
  return (
    <AuthProvider
      auth={{
        baseURL: API_BASE,
        basePath: '/auth'
      }}
    >
      <div className="app">
        <Header />
        <Main />
      </div>
    </AuthProvider>
  )
}

function Header() {
  const { data: session } = useSession()

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>🏠 TokenHouse Starter</h1>
          <p className="subtitle">Powered by Better-Auth</p>
        </div>

        {session && (
          <div className="user-section">
            <UserButton />
          </div>
        )}
      </div>
    </header>
  )
}

function Main() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <main className="main">
        <div className="loading">Loading...</div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="main">
        <div className="auth-container">
          <AuthCard
            onSuccess={(session) => {
              console.log('Signed in!', session)
            }}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="main">
      <Dashboard session={session} />
    </main>
  )
}

function Dashboard({ session }: { session: any }) {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChat = async () => {
    if (!message.trim()) return

    setLoading(true)
    setResponse('')

    try {
      const res = await fetch(`${API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: message }
          ]
        })
      })

      const data = await res.json()

      if (data.error) {
        setResponse(`Error: ${data.error}`)
      } else {
        setResponse(data.choices[0].message.content)
      }
    } catch (error: any) {
      setResponse(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      {/* Organization Info from JWT Claims */}
      <div className="org-card">
        <h2>Organization Info</h2>
        <div className="org-info">
          <div className="info-row">
            <span className="label">Org ID:</span>
            <span className="value">{session.org_id || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Org Name:</span>
            <span className="value">{session.org_name || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Role:</span>
            <span className="value role-badge">{session.org_role || 'member'}</span>
          </div>
          <div className="info-row">
            <span className="label">Billing Tier:</span>
            <span className={`value tier-badge tier-${session.billing_tier}`}>
              {session.billing_tier || 'free'}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{session.user?.email}</span>
          </div>
        </div>
      </div>

      {/* Rate Limits from JWT Claims */}
      {session.rate_limits && (
        <div className="limits-card">
          <h2>Rate Limits</h2>
          <div className="limits-info">
            <div className="limit-item">
              <span className="limit-label">Requests/min</span>
              <span className="limit-value">{session.rate_limits.requests_per_minute.toLocaleString()}</span>
            </div>
            <div className="limit-item">
              <span className="limit-label">Tokens/day</span>
              <span className="limit-value">{session.rate_limits.tokens_per_day.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Allowed Models from JWT Claims */}
      {session.allowed_models && (
        <div className="models-card">
          <h2>Allowed Models</h2>
          <div className="models-list">
            {session.allowed_models.map((model: string) => (
              <span key={model} className="model-badge">
                {model}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chat Demo */}
      <div className="chat-card">
        <h2>Chat Demo</h2>
        <p className="chat-description">
          Test the chat API using your JWT token with custom claims
        </p>

        <div className="chat-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleChat()}
            placeholder="Type a message..."
            disabled={loading}
          />
          <button
            onClick={handleChat}
            disabled={loading || !message.trim()}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        {response && (
          <div className="chat-response">
            <strong>Response:</strong>
            <p>{response}</p>
          </div>
        )}
      </div>

      {/* JWT Token Display (for debugging) */}
      <details className="token-details">
        <summary>View JWT Token</summary>
        <pre className="token-preview">
          {session.token}
        </pre>
      </details>
    </div>
  )
}

export default App
