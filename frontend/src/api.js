const BASE = '/tasks'
const SCHED = '/schedule'

export async function fetchTasks() {
  const r = await fetch(BASE + '/')
  if (!r.ok) throw new Error('Failed to fetch tasks')
  return r.json()
}

export async function createTask(data) {
  const r = await fetch(BASE + '/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error('Failed to create task')
  return r.json()
}

export async function updateTask(id, data) {
  const r = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error('Failed to update task')
  return r.json()
}

export async function deleteTask(id) {
  const r = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error('Failed to delete task')
}

export async function generateSchedule() {
  const r = await fetch(SCHED + '/generate', { method: 'POST' })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to generate schedule')
  }
  return r.json()
}

export async function fetchLatestSchedule() {
  const r = await fetch(SCHED + '/latest')
  if (r.status === 404) return null
  if (!r.ok) throw new Error('Failed to fetch schedule')
  return r.json()
}
