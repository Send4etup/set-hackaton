import { useState, useEffect, useRef } from 'react'
import {
  generateSchedule, fetchScheduleByDate, fetchTasks,
  updateTask, refineSchedule,
} from '../api'

/* ── helpers ──────────────────────────────────────────────── */
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
function taskIsForDate(task, dateStr) {
  if (!task.deadline) return false
  return task.deadline.split('T')[0] === dateStr
}

/**
 * Parse schedule HTML into structured blocks we can render as React.
 * Works with both the old HTML format and the new _json_to_html output.
 */
function parseScheduleBlocks(html) {
  if (!html) return null
  const trimmed = html.trim()
  if (!trimmed.startsWith('<')) return { type: 'text', content: trimmed }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(trimmed, 'text/html')

    const title = doc.querySelector('.ai-sched-title')?.textContent || ''
    const subtitle = doc.querySelector('.ai-sched-subtitle')?.textContent || ''
    const blockEls = doc.querySelectorAll('.ai-sched-block')

    const blocks = Array.from(blockEls).map(el => ({
      taskId: el.getAttribute('data-task-id') || '',
      prio: Array.from(el.classList).find(c => c.startsWith('ai-prio-')) || 'ai-prio-medium',
      time: el.querySelector('.ai-sched-time')?.textContent || '',
      name: el.querySelector('.ai-sched-name')?.textContent || '',
      desc: el.querySelector('.ai-sched-desc')?.textContent || '',
      badge: el.querySelector('.ai-sched-badge')?.textContent || '',
    }))

    return { type: 'structured', title, subtitle, blocks }
  } catch {
    return { type: 'text', content: trimmed }
  }
}

/* ── ScheduleBlock component ──────────────────────────────── */
function ScheduleBlock({ block, task, onToggle }) {
  const [toggling, setToggling] = useState(false)
  const isBreak = block.prio === 'ai-prio-break'
  const isDone = task?.status === 'done'

  async function handleToggle() {
    if (isBreak || toggling) return
    setToggling(true)
    try { await onToggle(task) }
    finally { setToggling(false) }
  }

  return (
    <div className={`ai-sched-block ${block.prio}${isDone ? ' sched-block-done' : ''}`}>
      {!isBreak && (
        <button
          className={`sched-check-btn${isDone ? ' done' : ''}`}
          onClick={handleToggle}
          disabled={toggling}
          title={isDone ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
        >
          {toggling
            ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
            : '✓'}
        </button>
      )}
      <div className="ai-sched-time">{block.time}</div>
      <div className="ai-sched-info">
        <div className="ai-sched-name">{block.name}</div>
        {block.desc && <div className="ai-sched-desc">{block.desc}</div>}
      </div>
      <span className="ai-sched-badge">{block.badge}</span>
    </div>
  )
}

/* ── main page ────────────────────────────────────────────── */
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

  useEffect(() => {
    fetchTasks().then(setAllTasks).catch(() => {})
    loadForDate(fmt(days[0]))
  }, [])

  async function loadForDate(date) {
    setLoadingDate(true)
    setSchedule(null)
    setError('')
    try { setSchedule(await fetchScheduleByDate(date)) }
    catch { /* 404 — no schedule yet */ }
    finally { setLoadingDate(false) }
  }

  function handleDateChange(date) {
    setSelected(date)
    loadForDate(date)
  }

  async function generate() {
    setLoading(true); setError('')
    try {
      setSchedule(await generateSchedule({
        target_date: selected,
        user_notes: userNotes || null,
        day_type: dayType || null,
        mood: mood || null,
      }))
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleRefine(e) {
    e.preventDefault()
    if (!refineText.trim() || !schedule) return
    setRefining(true); setError('')
    try {
      setSchedule(await refineSchedule(schedule.id, refineText.trim()))
      setRefineText('')
    } catch (err) { setError(err.message) }
    finally { setRefining(false) }
  }

  async function handleToggleTask(task) {
    if (!task) return
    const updated = await updateTask(task.id, {
      status: task.status === 'done' ? 'pending' : 'done',
    })
    setAllTasks(ts => ts.map(t => t.id === updated.id ? updated : t))
  }

  // Find task for a schedule block: by ID first, then by name match
  function findTaskForBlock(block) {
    if (block.taskId) {
      const byId = allTasks.find(t => String(t.id) === String(block.taskId))
      if (byId) return byId
    }
    // fallback: match by title (case-insensitive, trimmed)
    const name = block.name.toLowerCase().trim()
    return allTasks.find(t => t.title.toLowerCase().trim() === name) || null
  }

  async function toggleTask(task) {
    const updated = await updateTask(task.id, {
      status: task.status === 'done' ? 'pending' : 'done',
    })
    setAllTasks(ts => ts.map(t => t.id === updated.id ? updated : t))
  }

  const tasksForDate = allTasks.filter(t => taskIsForDate(t, selected))
  const activeTasks = tasksForDate.filter(t => t.status !== 'done')
  const doneTasks   = tasksForDate.filter(t => t.status === 'done')

  const parsed = schedule ? parseScheduleBlocks(schedule.content) : null

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className="page-content">

      {/* Header */}
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
            >{dayLabel(d, i)}</button>
          ))}
          <input
            type="date" value={selected}
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
              placeholder="E.g. finish the report, go to the gym, call mom..."
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

          {activeTasks.length > 0 && (
            <div style={{ marginBottom: doneTasks.length ? 10 : 0 }}>
              {activeTasks.map(t => (
                <div key={t.id} className="task-item">
                  <div className={`priority-dot dot-${t.priority}`} />
                  <div className="task-checkbox" onClick={() => toggleTask(t)} />
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
              <div className="empty-title" style={{ color: 'var(--success)' }}>All tasks done! 🎉</div>
            </div>
          )}

          {doneTasks.length > 0 && (
            <div className="done-tasks-section">
              <button className="done-toggle" onClick={() => setDoneExpanded(e => !e)}>
                <span className="done-toggle-icon">{doneExpanded ? '▾' : '▸'}</span>
                Completed ({doneTasks.length})
              </button>
              {doneExpanded && (
                <div className="done-tasks-list">
                  {doneTasks.map(t => (
                    <div key={t.id} className="task-item done">
                      <div className={`priority-dot dot-${t.priority}`} style={{ opacity: 0.4 }} />
                      <div className="task-checkbox checked" onClick={() => toggleTask(t)} />
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
            <div className="empty-title">{loading ? 'AI is building your schedule...' : 'Loading...'}</div>
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

        {/* Structured render with React checkboxes */}
        {!loading && !loadingDate && parsed?.type === 'structured' && (
          <div className="ai-schedule">
            <div className="ai-sched-header">
              <div className="ai-sched-title">{parsed.title}</div>
              <div className="ai-sched-subtitle">{parsed.subtitle}</div>
            </div>
            <div className="ai-sched-timeline">
              {parsed.blocks.map((block, i) => (
                <ScheduleBlock
                  key={i}
                  block={block}
                  task={findTaskForBlock(block)}
                  onToggle={handleToggleTask}
                />
              ))}
            </div>
          </div>
        )}

        {/* Fallback for old plain-text schedules */}
        {!loading && !loadingDate && parsed?.type === 'text' && (
          <pre className="schedule-content">{parsed.content}</pre>
        )}

        {/* Refine bar */}
        {!loading && !loadingDate && schedule && (
          <form className="refine-bar" onSubmit={handleRefine}>
            <input
              className="refine-input"
              value={refineText}
              onChange={e => setRefineText(e.target.value)}
              placeholder="Ask AI to adjust... e.g. 'Move gym to morning', 'Add reading before bed'"
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
