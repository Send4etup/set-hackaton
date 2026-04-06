import { useState, useEffect } from 'react'
import { fetchTasks, createTask, updateTask, deleteTask } from '../api'

const EMPTY_FORM = { title: '', description: '', deadline: '', priority: 'medium', status: 'pending' }

const FILTERS = ['all', 'pending', 'in_progress', 'done']

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchTasks().then(setTasks).catch(console.error) }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true); setError('')
    try {
      const task = await createTask({
        ...form,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      })
      setTasks(ts => [task, ...ts])
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function toggleDone(task) {
    const next = task.status === 'done' ? 'pending' : 'done'
    const updated = await updateTask(task.id, { status: next })
    setTasks(ts => ts.map(t => t.id === updated.id ? updated : t))
  }

  async function remove(id) {
    await deleteTask(id)
    setTasks(ts => ts.filter(t => t.id !== id))
  }

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter)
  const counts = { total: tasks.length, done: tasks.filter(t => t.status === 'done').length, pending: tasks.filter(t => t.status === 'pending').length }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Tasks</h1>
          <p>Manage your daily tasks and priorities</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancel' : '+ Add Task'}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{counts.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{counts.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{counts.done}</div>
          <div className="stat-label">Done</div>
        </div>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="card">
          <div className="card-title">
            <div className="icon" style={{ background: 'var(--primary-bg)' }}>✦</div>
            New Task
          </div>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="full">
                <label>Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs to be done?" required autoFocus />
              </div>
              <div className="full">
                <label>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional details..." />
              </div>
              <div>
                <label>Deadline</label>
                <input type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
              </div>
              <div>
                <label>Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : '+ Add Task'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="filter-bar">
        {FILTERS.map(f => (
          <button key={f} className={`filter-chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="card" style={{ padding: '12px' }}>
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No tasks here</div>
            <div className="empty-desc">
              {filter === 'all' ? 'Add your first task above' : `No ${filter} tasks`}
            </div>
          </div>
        ) : (
          filtered.map(task => (
            <div key={task.id} className={`task-item${task.status === 'done' ? ' done' : ''}`}>
              <div
                className={`priority-dot dot-${task.priority}`}
                style={{ marginTop: 4 }}
              />
              <div
                className={`task-checkbox${task.status === 'done' ? ' checked' : ''}`}
                onClick={() => toggleDone(task)}
              />
              <div className="task-body">
                <div className={`task-title${task.status === 'done' ? ' done' : ''}`}>{task.title}</div>
                {task.description && <div className="task-desc">{task.description}</div>}
                <div className="task-meta">
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                  {task.deadline && (
                    <span className="task-deadline">📅 {new Date(task.deadline).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="task-actions">
                <button className="btn btn-danger btn-sm" onClick={() => remove(task.id)}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
