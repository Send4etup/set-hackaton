const BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

function headers(extra = {}) {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function request(url, options = {}) {
  const r = await fetch(BASE + url, { ...options, headers: headers(options.headers) })
  if (r.status === 204) return null
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.detail || `Error ${r.status}`)
  return data
}

// Auth
export const register = (payload) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
export const getMe = () => request('/auth/me')
export const updateProfile = (data) =>
  request('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) })

// Tasks
export const fetchTasks = () => request('/tasks/')
export const createTask = (data) => request('/tasks/', { method: 'POST', body: JSON.stringify(data) })
export const updateTask = (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' })

// Notifications
export const fetchNotifications = () => request('/notifications/')
export const fetchUnreadCount = () => request('/notifications/unread-count')
export const markNotificationRead = (id) =>
  request(`/notifications/${id}/read`, { method: 'PATCH' })
export const markAllRead = () => request('/notifications/read-all', { method: 'PATCH' })
export const clearNotifications = () => request('/notifications/clear', { method: 'DELETE' })

// Schedule
export const generateSchedule = (data) =>
  request('/schedule/generate', { method: 'POST', body: JSON.stringify(data) })
export const refineSchedule = (schedule_id, instruction) =>
  request('/schedule/refine', { method: 'POST', body: JSON.stringify({ schedule_id, instruction }) })
export const fetchScheduleByDate = (date) => request(`/schedule/by-date/${date}`)
export const fetchLatestSchedule = () => request('/schedule/latest')
