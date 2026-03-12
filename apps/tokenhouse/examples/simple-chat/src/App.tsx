import { TokenHouseProvider, useChat, useTokenHouse } from '@tokenhouse/react'
import { useState } from 'react'

function ChatInterface() {
  const { messages, isLoading, usage, error, sendMessage } = useChat()
  const { isAuthenticated } = useTokenHouse()
  const [input, setInput] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')

  const handleSend = async () => {
    if (!input.trim()) return
    await sendMessage(input, model)
    setInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Authenticating with TokenHouse...</p>
      </div>
    )
  }

  return (
    <div className="chat-container">
      <div className="header">
        <h1>🏦 TokenHouse Chat</h1>
        <div className="stats">
          <div className="stat">
            <span className="label">Tokens:</span>
            <span className="value">{usage.tokens.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="label">Cost:</span>
            <span className="value">${usage.cost.toFixed(6)}</span>
          </div>
        </div>
        <div className="model-selector">
          <label htmlFor="model">Model:</label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={isLoading}
          >
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
            <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
          </select>
        </div>
      </div>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>👋 Welcome to TokenHouse Chat!</p>
            <p>Start a conversation with AI models through the TokenHouse Gateway.</p>
            <p className="note">All requests are proxied and usage is tracked per org.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-role">{msg.role === 'user' ? '👤' : '🤖'} {msg.role}</div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-role">🤖 assistant</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="error-message">
            ⚠️ Error: {error.message}
          </div>
        )}
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
          rows={3}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="send-button"
        >
          {isLoading ? '⏳' : '📤'} Send
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <TokenHouseProvider
      config={{
        orgId: 'org_demo123',
        orgSecret: 'ths_demo_secret_xyz789',
        baseUrl: 'http://localhost:8187'
      }}
    >
      <ChatInterface />
    </TokenHouseProvider>
  )
}
