import { Organization } from '../App'

interface Props {
  orgs: Organization[]
  onRefresh: () => void
  apiBase: string
  adminSecret: string
}

export function OrganizationsPanel({ orgs, onRefresh }: Props) {
  const superOrg = orgs.find(o => o.org_id === 'tokenhouse-super-org')
  const groups = orgs.filter(o => o.org_id.startsWith('tokenhouse-') && o.org_id !== 'tokenhouse-super-org')
  const companies = orgs.filter(o => !o.org_id.startsWith('tokenhouse-') && o.org_id !== 'org_demo123')
  const demo = orgs.find(o => o.org_id === 'org_demo123')

  function getTierBadge(tier: string) {
    const colors: Record<string, string> = {
      enterprise: 'badge-enterprise',
      pro: 'badge-pro',
      starter: 'badge-starter',
      free: 'badge-free'
    }
    return colors[tier] || 'badge-default'
  }

  function OrgCard({ org, title }: { org: Organization; title?: string }) {
    return (
      <div className="org-card">
        <div className="org-card-header">
          <h3>{title || org.org_name}</h3>
          <span className={`badge ${getTierBadge(org.billing_tier)}`}>
            {org.billing_tier}
          </span>
        </div>
        <div className="org-card-body">
          <div className="org-field">
            <span className="field-label">Org ID:</span>
            <code className="field-value">{org.org_id}</code>
          </div>
          <div className="org-field">
            <span className="field-label">Members:</span>
            <span className="field-value">{org.users.length || 'None'}</span>
          </div>
          <div className="org-field">
            <span className="field-label">Models:</span>
            <span className="field-value">{org.allowed_models.length}</span>
          </div>
          <div className="org-field">
            <span className="field-label">Limits:</span>
            <span className="field-value">
              {org.rate_limits.requests_per_minute} req/min,
              {' '}{(org.rate_limits.tokens_per_day / 1_000_000).toFixed(1)}M tokens/day
            </span>
          </div>
        </div>
        <div className="org-card-footer">
          <details>
            <summary>Models</summary>
            <ul className="model-list">
              {org.allowed_models.map(model => (
                <li key={model}><code>{model}</code></li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Organizations</h2>
        <button className="refresh-button" onClick={onRefresh}>
          🔄 Refresh
        </button>
      </div>

      {superOrg && (
        <section className="org-section">
          <h3 className="section-title">🏦 Platform Owner</h3>
          <div className="org-grid">
            <OrgCard org={superOrg} title="TokenHouse (Super Org)" />
          </div>
        </section>
      )}

      {groups.length > 0 && (
        <section className="org-section">
          <h3 className="section-title">👥 Groups</h3>
          <div className="org-grid">
            {groups.map(org => (
              <OrgCard key={org.org_id} org={org} />
            ))}
          </div>
        </section>
      )}

      {companies.length > 0 && (
        <section className="org-section">
          <h3 className="section-title">🏢 Organizations</h3>
          <div className="org-grid">
            {companies.map(org => (
              <OrgCard key={org.org_id} org={org} />
            ))}
          </div>
        </section>
      )}

      {demo && (
        <section className="org-section">
          <h3 className="section-title">🧪 Demo</h3>
          <div className="org-grid">
            <OrgCard org={demo} />
          </div>
        </section>
      )}
    </div>
  )
}
