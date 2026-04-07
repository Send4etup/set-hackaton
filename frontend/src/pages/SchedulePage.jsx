import { useState, useEffect } from 'react'
import { generateSchedule, fetchScheduleByDate, fetchTasks } from '../api'

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

function renderSchedule(content) {
  if (!content) return null
  // If AI returned plain text instead of HTML, wrap it
  const trimmed = content.trim()
  if (!trimmed.startsWith('<')) {
    return <pre className="schedule-content">{trimmed}</pre>
  }
  return (
    <div
      className="ai-schedule-render"
      dangerouslySetInnerHTML={{ __html: trimmed }}
    />
  )
}

export default function SchedulePage() {
  const days = getNextDays(7)
  const [selected, setSelected] = useState(fmt(days[0]))
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingDate, setLoadingDate] = useState(false)
  const [error, setError] = useState('')
  const [tasks, setTasks] = useState([])
  const [userNotes, setUserNotes] = useState('')
  const [dayType, setDayType] = useState('')
  const [mood, setMood] = useState('')

  useEffect(() => {
    fetchTasks().then(setTasks).catch(() => {})
    loadForDate(fmt(days[0]))
  }, [])

  async function loadForDate(date) {
    setLoadingDate(true)
    setSchedule(null)
    setError('')
    try {
      const s = await fetchScheduleByDate(date)
      setSchedule(s)
    } catch {
      // 404 = no schedule for this date yet, that's fine
    } finally {
      setLoadingDate(false)
    }
  }

  function handleDateChange(date) {
    setSelected(date)
    loadForDate(date)
  }

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const s = await generateSchedule({
        target_date: selected,
        user_notes: userNotes || null,
        day_type: dayType || null,
        mood: mood || null,
      })
      setSchedule(s)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>AI Schedule</h1>
          <p>Generate an optimized plan for any day</p>
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={loading || loadingDate}>
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
              onClick={() => handleDateChange(fmt(d))}
            >
              {dayLabel(d, i)}
            </button>
          ))}
          <input
            type="date"
            value={selected}
            onChange={e => handleDateChange(e.target.value)}
            style={{ width: 'auto', padding: '5px 10px', fontSize: '0.8rem' }}
          />
        </div>
      </div>

      {/* Context form */}
      <div className="card">
        <div className="card-title">
          <div className="icon" style={{ background: 'var(--success-bg)' }}>✍️</div>
          Day Context
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>
            AI will use this to personalise the schedule
          </span>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Day Type</label>
            <select value={dayType} onChange={e => setDayType(e.target.value)}>
              <option value="">Not specified</option>
              <option value="work day">💼 Work Day</option>
              <option value="rest day">🏖️ Rest Day</option>
              <option value="study day">📚 Study Day</option>
              <option value="mixed day">🔀 Mixed</option>
              <option value="creative day">🎨 Creative Day</option>
              <option value="errands day">🛒 Errands Day</option>
            </select>
          </div>
          <div className="form-group">
            <label>How are you feeling?</label>
            <select value={mood} onChange={e => setMood(e.target.value)}>
              <option value="">Not specified</option>
              <option value="energized">⚡ Energized</option>
              <option value="tired">😴 Tired</option>
              <option value="focused">🎯 Focused</option>
              <option value="stressed">😰 Stressed</option>
              <option value="calm">😌 Calm</option>
              <option value="motivated">🚀 Motivated</option>
              <option value="distracted">🌀 Distracted</option>
            </select>
          </div>
          <div className="form-group full">
            <label>What do you want to do today?</label>
            <textarea
              value={userNotes}
              onChange={e => setUserNotes(e.target.value)}
              placeholder="E.g. finish the report, go to the gym, call mom, have a relaxed evening..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Active Tasks */}
      {tasks.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="icon" style={{ background: 'var(--warning-bg)' }}>📋</div>
            Active Tasks ({tasks.length})
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>
              Included in schedule generation
            </span>
          </div>
          <div>
            {tasks.map(t => (
              <div key={t.id} className="task-item">
                <div className={`priority-dot dot-${t.priority}`} />
                <div className="task-body">
                  <div className="task-title">{t.title}</div>
                  {t.description && <div className="task-desc">{t.description}</div>}
                  <div className="task-meta">
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                    {t.deadline && (
                      <span className="task-deadline">
                        Due {new Date(t.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Output */}
      <div className="card">
        <div className="card-title">
          <div className="icon" style={{ background: 'var(--warning-bg)' }}>🗓</div>
          {schedule ? `Schedule for ${schedule.target_date || 'today'}` : `Schedule for ${selected}`}
          {schedule && (
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>
              Generated {new Date(schedule.created_at).toLocaleString()}
            </span>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {(loading || loadingDate) && (
          <div className="empty">
            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
            <div className="empty-title">
              {loading ? 'AI is building your schedule...' : 'Loading...'}
            </div>
            {loading && <div className="empty-desc">This may take a few seconds</div>}
          </div>
        )}

        {!loading && !loadingDate && !schedule && (
          <div className="empty">
            <div className="empty-icon">⚡</div>
            <div className="empty-title">No schedule for this day</div>
            <div className="empty-desc">Fill in the context above and click Generate</div>
          </div>
        )}

        {!loading && !loadingDate && schedule && renderSchedule(schedule.content)}
      </div>
    </div>
  )
}
