import { useState } from 'react'

interface Props {
  apiBase: string
  adminSecret: string
  onSuccess: () => void
}

export function CreateOrgPanel({ apiBase, adminSecret, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    org_name: '',
    initial_user_email: '',
    billing_tier: 'starter' as 'free' | 'starter' | 'pro' | 'enterprise',
    allowed_models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022']
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ org_id: string; org_secret: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`${apiBase}/admin/orgs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(errorData.message || 'Failed to create organization')
      }

      const data = await response.json()
      setSuccess({
        org_id: data.org_id,
        org_secret: data.org_secret
      })

      // Reset form
      setFormData({
        org_name: '',
        initial_user_email: '',
        billing_tier: 'starter',
        allowed_models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022']
      })

      // Call parent callback after short delay
      setTimeout(() => {
        onSuccess()
      }, 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  function handleModelToggle(model: string) {
    setFormData(prev => ({
      ...prev,
      allowed_models: prev.allowed_models.includes(model)
        ? prev.allowed_models.filter(m => m !== model)
        : [...prev.allowed_models, model]
    }))
  }

  const availableModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'o1',
    'o1-mini',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022'
  ]

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Create Organization</h2>
      </div>

      <div className="form-container">
        {success && (
          <div className="success-banner">
            <h3>✅ Organization Created Successfully!</h3>
            <div className="credential-display">
              <div className="credential-field">
                <label>Organization ID:</label>
                <code className="credential-value">{success.org_id}</code>
              </div>
              <div className="credential-field">
                <label>Organization Secret:</label>
                <code className="credential-value">{success.org_secret}</code>
              </div>
              <p className="credential-warning">
                ⚠️ Save the secret now - it will not be shown again!
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label htmlFor="org_name">Organization Name *</label>
            <input
              type="text"
              id="org_name"
              value={formData.org_name}
              onChange={e => setFormData(prev => ({ ...prev, org_name: e.target.value }))}
              placeholder="e.g., Acme Corporation"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="initial_user_email">Initial User Email *</label>
            <input
              type="email"
              id="initial_user_email"
              value={formData.initial_user_email}
              onChange={e => setFormData(prev => ({ ...prev, initial_user_email: e.target.value }))}
              placeholder="e.g., admin@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="billing_tier">Billing Tier *</label>
            <select
              id="billing_tier"
              value={formData.billing_tier}
              onChange={e => setFormData(prev => ({ ...prev, billing_tier: e.target.value as any }))}
              disabled={loading}
            >
              <option value="free">Free (60 req/min, 500K tokens/day)</option>
              <option value="starter">Starter (150 req/min, 3M tokens/day)</option>
              <option value="pro">Pro (200 req/min, 5M tokens/day)</option>
              <option value="enterprise">Enterprise (300 req/min, 10M tokens/day)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Allowed Models *</label>
            <div className="model-checkboxes">
              {availableModels.map(model => (
                <label key={model} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.allowed_models.includes(model)}
                    onChange={() => handleModelToggle(model)}
                    disabled={loading}
                  />
                  <span>{model}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '⏳ Creating...' : '➕ Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
