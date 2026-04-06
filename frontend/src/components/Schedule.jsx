import { useState } from 'react'
import { generateSchedule } from '../api'

export default function Schedule({ schedule, setSchedule }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const s = await generateSchedule()
      setSchedule(s)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="generate-bar">
        <h2 style={{ margin: 0 }}>AI Schedule</h2>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading ? 'Generating...' : '⚡ Generate Schedule'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {schedule ? (
        <>
          <div style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: 10 }}>
            Generated: {new Date(schedule.created_at).toLocaleString()}
          </div>
          <pre className="schedule-content">{schedule.content}</pre>
        </>
      ) : (
        <p className="empty">
          {loading ? 'Claude is building your schedule...' : 'No schedule yet. Click Generate.'}
        </p>
      )}
    </div>
  )
}
