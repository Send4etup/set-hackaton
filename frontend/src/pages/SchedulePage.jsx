import { useState, useEffect } from 'react'
import { generateSchedule, fetchLatestSchedule } from '../api'

function getNextDays(n = 7) {
  const days = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    days.push(d)
  }
  return days
}

function fmt(date) { return date.toISOString().split('T')[0] }
function dayLabel(date, i) {
  if (i === 0) return 'Today'
  if (i === 1) return 'Tomorrow'
  return date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function SchedulePage() {
  const days = getNextDays(7)
  const [selected, setSelected] = useState(fmt(days[0]))
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLatestSchedule().then(setSchedule).catch(() => {})
  }, [])

  async function generate() {
    setLoading(true); setError('')
    try {
      const s = await generateSchedule(selected)
      setSchedule(s)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>AI Schedule</h1>
          <p>Generate an optimized plan for any day</p>
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading ? <><span className="spinner" /> Generating...</> : '⚡ Generate'}
        </button>
      </div>

      {/* Day picker */}
      <div className="card">
        <div className="card-title">
          <div className="icon" style={{ background: 'var(--primary-bg)' }}>📅</div>
          Select Day
        </div>
        <div className="date-picker-bar">
          {days.map((d, i) => (
            <button
              key={fmt(d)}
              className={`day-chip${selected === fmt(d) ? ' active' : ''}`}
              onClick={() => setSelected(fmt(d))}
            >
              {dayLabel(d, i)}
            </button>
          ))}
          <input
            type="date"
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{ width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
          />
        </div>
      </div>

      {/* Schedule Output */}
      <div className="card">
        <div className="card-title">
          <div className="icon" style={{ background: 'var(--warning-bg)' }}>🗓</div>
          {schedule ? `Schedule for ${schedule.target_date || 'today'}` : 'No schedule yet'}
          {schedule && (
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>
              Generated {new Date(schedule.created_at).toLocaleString()}
            </span>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading && (
          <div className="empty">
            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
            <div className="empty-title">AI is building your schedule...</div>
            <div className="empty-desc">This may take a few seconds</div>
          </div>
        )}

        {!loading && !schedule && (
          <div className="empty">
            <div className="empty-icon">⚡</div>
            <div className="empty-title">No schedule yet</div>
            <div className="empty-desc">Select a day and click Generate</div>
          </div>
        )}

        {!loading && schedule && (
          <pre className="schedule-content">{schedule.content}</pre>
        )}
      </div>
    </div>
  )
}
