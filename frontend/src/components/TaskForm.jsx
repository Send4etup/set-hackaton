import { useState } from 'react'
import { createTask } from '../api'

const empty = { title: '', description: '', deadline: '', priority: 'medium', status: 'pending' }

export default function TaskForm({ onCreated }) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      }
      const task = await createTask(payload)
      onCreated(task)
      setForm(empty)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Add Task</h2>
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="full">
            <label>Title *</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>
          <div className="full">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Optional details..."
            />
          </div>
          <div>
            <label>Deadline</label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={e => set('deadline', e.target.value)}
            />
          </div>
          <div>
            <label>Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Adding...' : '+ Add Task'}
          </button>
        </div>
      </form>
    </div>
  )
}
