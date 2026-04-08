import { useState, useEffect, useRef } from 'react'
import {
  fetchNotifications, markNotificationRead,
  markAllRead, clearNotifications,
} from '../api'

const TYPE_ICON = {
  deadline_soon: '⏰',
  deadline_today: '📅',
  overdue: '⚠️',
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const dropRef = useRef(null)

  // Poll every 60 seconds
  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function load() {
    try {
      const data = await fetchNotifications()
      setNotifications(data)
    } catch { /* silent if not authed yet */ }
  }

  async function handleRead(n) {
    if (n.read) return
    await markNotificationRead(n.id)
    setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))
  }

  async function handleMarkAll() {
    await markAllRead()
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
  }

  async function handleClear() {
    await clearNotifications()
    setNotifications(ns => ns.filter(n => !n.read))
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <div className="notif-wrap" ref={dropRef}>
      <button
        className={`notif-bell${unread > 0 ? ' has-unread' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Notifications"
      >
        🔔
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-header-title">Notifications</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {unread > 0 && (
                <button className="notif-action-btn" onClick={handleMarkAll}>
                  Mark all read
                </button>
              )}
              {notifications.some(n => n.read) && (
                <button className="notif-action-btn" onClick={handleClear}>
                  Clear read
                </button>
              )}
            </div>
          </div>

          <div className="notif-list">
            {notifications.length === 0 && (
              <div className="notif-empty">No notifications yet</div>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                className={`notif-item${n.read ? ' read' : ''}`}
                onClick={() => handleRead(n)}
              >
                <span className="notif-icon">{TYPE_ICON[n.type] || '🔔'}</span>
                <div className="notif-body">
                  <div className="notif-msg">{n.message}</div>
                  <div className="notif-time">{timeAgo(n.created_at)}</div>
                </div>
                {!n.read && <span className="notif-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
