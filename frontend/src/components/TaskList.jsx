import { deleteTask, updateTask } from '../api'

export default function TaskList({ tasks, setTasks }) {
  async function markDone(task) {
    const updated = await updateTask(task.id, { status: 'done' })
    setTasks(ts => ts.map(t => t.id === updated.id ? updated : t))
  }

  async function remove(id) {
    await deleteTask(id)
    setTasks(ts => ts.filter(t => t.id !== id))
  }

  if (!tasks.length) {
    return <p className="empty">No tasks yet. Add one above.</p>
  }

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id} className="task-item">
          <div className="task-body">
            <div className={`task-title${task.status === 'done' ? ' done' : ''}`}>
              {task.title}
            </div>
            {task.description && (
              <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: 4 }}>
                {task.description}
              </div>
            )}
            <div className="task-meta">
              <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
              {task.deadline && (
                <span>📅 {new Date(task.deadline).toLocaleString()}</span>
              )}
            </div>
          </div>
          <div className="task-actions">
            {task.status !== 'done' && (
              <button className="btn btn-success btn-sm" onClick={() => markDone(task)}>
                ✓
              </button>
            )}
            <button className="btn btn-danger btn-sm" onClick={() => remove(task.id)}>
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
