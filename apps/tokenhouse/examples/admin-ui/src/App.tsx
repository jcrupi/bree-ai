import { useState, useEffect } from 'react'
import { OrganizationsPanel } from './components/OrganizationsPanel'
import { UsersPanel } from './components/UsersPanel'
import { CreateOrgPanel } from './components/CreateOrgPanel'
import { CreateUserPanel } from './components/CreateUserPanel'

const ADMIN_SECRET = 'admin-secret-change-me'
const API_BASE = 'http://localhost:8187'

export interface Organization {
  org_id: string
  org_name: string
  billing_tier: string
  users: string[]
  allowed_models: string[]
  rate_limits: {
    requests_per_minute: number
    tokens_per_day: number
  }
  created_at: string
}

export interface User {
  email: string
  name?: string
  org_ids: string[]
  created_at: string
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'orgs' | 'users' | 'create-org' | 'create-user'>('orgs')
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrgs()
    loadUsers()
  }, [])

  async function loadOrgs() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/admin/orgs`, {
        headers: { 'X-Admin-Secret': ADMIN_SECRET }
      })

      if (!response.ok) {
        throw new Error(`Failed to load orgs: ${response.statusText}`)
      }

      const data = await response.json()
      setOrgs(data.orgs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load organizations')
      console.error('Error loading orgs:', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'X-Admin-Secret': ADMIN_SECRET }
      })

      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.statusText}`)
      }

      const data = await response.json()
      setUsers(data.users)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
      console.error('Error loading users:', e)
    } finally {
      setLoading(false)
    }
  }

  function handleOrgCreated() {
    loadOrgs()
    setActiveTab('orgs')
  }

  function handleUserCreated() {
    loadUsers()
    setActiveTab('users')
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-content">
          <h1>🏦 TokenHouse Admin</h1>
          <div className="header-info">
            <span className="badge">Super Org</span>
            <span className="user-email">johnny@tokenhouse.ai</span>
          </div>
        </div>
      </header>

      <div className="admin-nav">
        <button
          className={`nav-button ${activeTab === 'orgs' ? 'active' : ''}`}
          onClick={() => setActiveTab('orgs')}
        >
          🏢 Organizations ({orgs.length})
        </button>
        <button
          className={`nav-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({users.length})
        </button>
        <button
          className={`nav-button ${activeTab === 'create-org' ? 'active' : ''}`}
          onClick={() => setActiveTab('create-org')}
        >
          ➕ Create Org
        </button>
        <button
          className={`nav-button ${activeTab === 'create-user' ? 'active' : ''}`}
          onClick={() => setActiveTab('create-user')}
        >
          ➕ Create User
        </button>
      </div>

      <main className="admin-main">
        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {loading && <div className="loading-overlay">Loading...</div>}

        {activeTab === 'orgs' && (
          <OrganizationsPanel
            orgs={orgs}
            onRefresh={loadOrgs}
            apiBase={API_BASE}
            adminSecret={ADMIN_SECRET}
          />
        )}

        {activeTab === 'users' && (
          <UsersPanel
            users={users}
            orgs={orgs}
            onRefresh={loadUsers}
            apiBase={API_BASE}
            adminSecret={ADMIN_SECRET}
          />
        )}

        {activeTab === 'create-org' && (
          <CreateOrgPanel
            apiBase={API_BASE}
            adminSecret={ADMIN_SECRET}
            onSuccess={handleOrgCreated}
          />
        )}

        {activeTab === 'create-user' && (
          <CreateUserPanel
            orgs={orgs}
            apiBase={API_BASE}
            adminSecret={ADMIN_SECRET}
            onSuccess={handleUserCreated}
          />
        )}
      </main>
    </div>
  )
}
