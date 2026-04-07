import { useState, useEffect, useRef, useCallback } from 'react'
import {
  generateSchedule, fetchScheduleByDate, fetchTasks,
  updateTask, refineSchedule,
} from '../api'

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

// Returns true if task's deadline date matches the selected date string YYYY-MM-DD
function taskIsForDate(task, dateStr) {
  if (!task.deadline) return false
  return task.deadline.split('T')[0] === dateStr
}

export default function SchedulePage() {
  const days = getNextDays(7)
  const [selected, setSelected] = useState(fmt(days[0]))
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingDate, setLoadingDate] = useState(false)
  const [refining, setRefining] = useState(false)
  const [error, setError] = useState('')
  const [allTasks, setAllTasks] = useState([])
  const [userNotes, setUserNotes] = useState('')
  const [dayType, setDayType] = useState('')
  const [mood, setMood] = useState('')
  const [doneExpanded, setDoneExpanded] = useState(false)
  const [refineText, setRefineText] = useState('')
  const scheduleRef = useRef(null)

  useEffect(() => {
    fetchTasks().then(setAllTasks).catch(() => {})
    loadForDate(fmt(days[0]))
  }, [])

  // Inject checkboxes into AI schedule HTML blocks after render
  useEffect(() => {
    if (!schedule || !scheduleRef.current) return
    const container = scheduleRef.current
    const blocks = container.querySelectorAll('.ai-sched-block[data-task-id]')
    blocks.forEach(block => {
      const taskId = block.getAttribute('data-task-id')
      if (!taskId) return
      if (block.querySelector('.sched-check-btn')) return // already injected

      const btn = document.createElement('button')
      btn.className = 'sched-check-btn'
      btn.setAttribute('data-tid', taskId)
      btn.title = 'Mark as done'
      btn.innerHTML = '✓'

      const task = allTasks.find(t => String(t.id) === taskId)
      if (task?.status === 'done') {
        btn.classList.add('done')
        block.classList.add('sched-block-done')
      }

      btn.addEventListener('click', () => handleCheckTask(taskId, btn, block))
      block.insertBefore(btn, block.firstChild)
    })
  }, [schedule, allTasks])

  async function handleCheckTask(taskId, btn, block) {
    const task = allTasks.find(t => String(t.id) === taskId)
    if (!task) return
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    try {
      const updated = await updateTask(task.id, { status: newStatus })
      setAllTasks(ts => ts.map(t => t.id === updated.id ? updated : t))
      if (newStatus === 'done') {
        btn.classList.add('done')
        block.classList.add('sched-block-done')
      } else {
        btn.classList.remove('done')
        block.classList.remove('sched-block-done')
      }
    } catch { /* silent */ }
  }

  async function loadForDate(date) {
    setLoadingDate(true)
    setSchedule(null)
    setError('')
    try {
      const s = await fetchScheduleByDate(date)
      setSchedule(s)
    } catch {
      // 404 = no schedule for this date yet
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

  async function handleRefine(e) {
    e.preventDefault()
    if (!refineText.trim() || !schedule) return
    setRefining(true)
    setError('')
    try {
      const s = await refineSchedule(schedule.id, refineText.trim())
      setSchedule(s)
      setRefineText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setRefining(false)
    }
  }

  // Tasks split by date and status
  const tasksForDate = allTasks.filter(t => taskIsForDate(t, selected))
  const activeTasks = tasksForDate.filter(t => t.status !== 'done')
  const doneTasks = tasksForDate.filter(t => t.status === 'done')

  function renderSchedule(content) {
    if (!content) return null
    const trimmed = content.trim()
    if (!trimmed.startsWith('<')) {
      return <pre className="schedule-content">{trimmed}</pre>
    }
    return (
      <div
        ref={scheduleRef}
        className="ai-schedule-render"
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    )
  }

  async function toggleTask(task) {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    const updated = await updateTask(task.id, { status: newStatus })
    setAllTasks(ts => ts.map(t => t.id === updated.id ? updated : t))
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
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Tasks for selected date */}
      {(activeTasks.length > 0 || doneTasks.length > 0) && (
        <div className="card">
          <div className="card-title">
            <div className="icon" style={{ background: 'var(--warning-bg)' }}>📋</div>
            Tasks for {selected}
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>
              {activeTasks.length} active{doneTasks.length > 0 ? `, ${doneTasks.length} done` : ''}
            </span>
          </div>

          {/* Active tasks */}
          {activeTasks.length > 0 && (
            <div style={{ marginBottom: doneTasks.length ? 10 : 0 }}>
              {activeTasks.map(t => (
                <div key={t.id} className="task-item">
                  <div className={`priority-dot dot-${t.priority}`} />
                  <div
                    className="task-checkbox"
                    onClick={() => toggleTask(t)}
                  />
                  <div className="task-body">
                    <div className="task-title">{t.title}</div>
                    {t.description && <div className="task-desc">{t.description}</div>}
                    <div className="task-meta">
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                      <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTasks.length === 0 && doneTasks.length > 0 && (
            <div className="empty" style={{ padding: '12px 0' }}>
              <div className="empty-title" style={{ color: 'var(--success)' }}>All tasks done for this day! 🎉</div>
            </div>
          )}

          {/* Done tasks collapsible */}
          {doneTasks.length > 0 && (
            <div className="done-tasks-section">
              <button
                className="done-toggle"
                onClick={() => setDoneExpanded(e => !e)}
              >
                <span className="done-toggle-icon">{doneExpanded ? '▾' : '▸'}</span>
                Completed ({doneTasks.length})
              </button>
              {doneExpanded && (
                <div className="done-tasks-list">
                  {doneTasks.map(t => (
                    <div key={t.id} className="task-item done">
                      <div className={`priority-dot dot-${t.priority}`} style={{ opacity: 0.4 }} />
                      <div
                        className="task-checkbox checked"
                        onClick={() => toggleTask(t)}
                      />
                      <div className="task-body">
                        <div className="task-title done">{t.title}</div>
                        <div className="task-meta">
                          <span className="badge badge-done">done</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

        {/* Refine input */}
        {!loading && !loadingDate && schedule && (
          <form className="refine-bar" onSubmit={handleRefine}>
            <input
              className="refine-input"
              value={refineText}
              onChange={e => setRefineText(e.target.value)}
              placeholder="Ask AI to adjust... e.g. 'Move gym to morning', 'Add 30min reading before bed'"
              disabled={refining}
            />
            <button
              className="btn btn-primary btn-sm refine-send"
              type="submit"
              disabled={refining || !refineText.trim()}
            >
              {refining ? <span className="spinner" /> : '✦ Refine'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
