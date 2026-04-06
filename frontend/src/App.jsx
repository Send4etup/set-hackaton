import { useState, useEffect } from 'react'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import Schedule from './components/Schedule'
import { fetchTasks, fetchLatestSchedule } from './api'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [schedule, setSchedule] = useState(null)

  useEffect(() => {
    fetchTasks().then(setTasks).catch(console.error)
    fetchLatestSchedule().then(setSchedule).catch(console.error)
  }, [])

  function onCreated(task) {
    setTasks(ts => [task, ...ts])
  }

  return (
    <div className="app">
      <h1>AI Task Scheduler</h1>
      <TaskForm onCreated={onCreated} />
      <div className="card">
        <h2>My Tasks</h2>
        <TaskList tasks={tasks} setTasks={setTasks} />
      </div>
      <Schedule schedule={schedule} setSchedule={setSchedule} />
    </div>
  )
}
