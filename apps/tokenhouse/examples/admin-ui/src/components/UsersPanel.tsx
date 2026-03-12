import { User, Organization } from '../App'

interface Props {
  users: User[]
  orgs: Organization[]
  onRefresh: () => void
  apiBase: string
  adminSecret: string
}

export function UsersPanel({ users, orgs, onRefresh }: Props) {
  function getOrgName(orgId: string) {
    const org = orgs.find(o => o.org_id === orgId)
    return org ? org.org_name : orgId
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Users</h2>
        <button className="refresh-button" onClick={onRefresh}>
          🔄 Refresh
        </button>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <p>No users found</p>
          <p className="empty-hint">Create your first user to get started</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Organizations</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.email}>
                  <td>
                    <code>{user.email}</code>
                  </td>
                  <td>{user.name || '-'}</td>
                  <td>
                    <div className="org-badges">
                      {user.org_ids.map(orgId => (
                        <span key={orgId} className="badge badge-org">
                          {getOrgName(orgId)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="date-cell">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
