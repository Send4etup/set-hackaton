import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      {/* Profile */}
      <div className="settings-section">
        <div className="settings-label">Profile</div>
        <div className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="avatar" style={{ width: 44, height: 44, fontSize: '1rem' }}>{initials}</div>
            <div className="settings-row-info">
              <div className="settings-row-title">{user?.name || 'No name'}</div>
              <div className="settings-row-desc">{user?.email}</div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
          </span>
        </div>
      </div>

      {/* Appearance */}
      <div className="settings-section">
        <div className="settings-label">Appearance</div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-title">{theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</div>
            <div className="settings-row-desc">Toggle between dark and light theme</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={theme === 'dark'} onChange={toggle} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* AI Config */}
      <div className="settings-section">
        <div className="settings-label">AI Integration</div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-title">Qwen AI Model</div>
            <div className="settings-row-desc">coder-model via Qwen Code API</div>
          </div>
          <span className="badge badge-done">Active</span>
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-title">Schedule Generation</div>
            <div className="settings-row-desc">AI optimizes tasks by deadline and priority</div>
          </div>
          <span className="badge badge-done">Enabled</span>
        </div>
      </div>

      {/* Account */}
      <div className="settings-section">
        <div className="settings-label">Account</div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-title">Sign Out</div>
            <div className="settings-row-desc">Log out from your account</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>Sign Out</button>
        </div>
      </div>
    </div>
  )
}
