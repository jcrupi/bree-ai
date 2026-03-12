import { useState } from 'react'
import { Organization } from '../App'

interface Props {
  orgs: Organization[]
  apiBase: string
  adminSecret: string
  onSuccess: () => void
}

export function CreateUserPanel({ orgs, apiBase, adminSecret, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    org_ids: [] as string[]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`${apiBase}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': adminSecret
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(errorData.message || 'Failed to create user')
      }

      setSuccess(true)

      // Reset form
      setFormData({
        email: '',
        name: '',
        org_ids: []
      })

      // Call parent callback after short delay
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  function handleOrgToggle(orgId: string) {
    setFormData(prev => ({
      ...prev,
      org_ids: prev.org_ids.includes(orgId)
        ? prev.org_ids.filter(id => id !== orgId)
        : [...prev.org_ids, orgId]
    }))
  }

  const availableOrgs = orgs.filter(org => org.org_id !== 'tokenhouse-super-org')

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Create User</h2>
      </div>

      <div className="form-container">
        {success && (
          <div className="success-banner">
            <h3>✅ User Created Successfully!</h3>
            <p>The user has been added to the selected organizations.</p>
          </div>
        )}

        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="e.g., user@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Name (Optional)</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., John Doe"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Organizations *</label>
            <p className="form-hint">Select one or more organizations for this user</p>

            {availableOrgs.length === 0 ? (
              <div className="empty-state">
                <p>No organizations available. Create an organization first.</p>
              </div>
            ) : (
              <div className="org-checkboxes">
                {availableOrgs.map(org => (
                  <label key={org.org_id} className="checkbox-label org-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.org_ids.includes(org.org_id)}
                      onChange={() => handleOrgToggle(org.org_id)}
                      disabled={loading}
                    />
                    <div className="org-checkbox-content">
                      <span className="org-name">{org.org_name}</span>
                      <span className={`badge ${org.billing_tier === 'enterprise' ? 'badge-enterprise' : org.billing_tier === 'pro' ? 'badge-pro' : org.billing_tier === 'starter' ? 'badge-starter' : 'badge-free'}`}>
                        {org.billing_tier}
                      </span>
                      <code className="org-id">{org.org_id}</code>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || formData.org_ids.length === 0}
            >
              {loading ? '⏳ Creating...' : '➕ Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
