import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import NotificationBell from './NotificationBell'

export default function Header() {
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
    <header className="header">
      <NavLink to="/" className="header-logo">
        <div className="header-logo-icon">⚡</div>
        <span>DayFlow</span>
      </NavLink>

      <nav className="header-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          ✦ Tasks
        </NavLink>
        <NavLink to="/schedule" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          📅 Schedule
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          ⚙ Settings
        </NavLink>
      </nav>

      <div className="header-actions">
        <NotificationBell />
        <button className="theme-btn" onClick={toggle} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user && (
          <div className="user-chip" onClick={handleLogout} title="Click to logout">
            <div className="avatar">{initials}</div>
            <span>{user.name || user.email.split('@')[0]}</span>
          </div>
        )}
      </div>
    </header>
  )
}
