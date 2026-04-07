import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const WORK_STYLES = [
  { value: 'deep focus blocks', label: '🧠 Deep Focus Blocks', desc: 'Long uninterrupted sessions' },
  { value: 'pomodoro 25/5', label: '🍅 Pomodoro 25/5', desc: '25 min work, 5 min break' },
  { value: 'flexible flow', label: '🌊 Flexible Flow', desc: 'No strict structure' },
  { value: 'time boxing', label: '📦 Time Boxing', desc: 'Fixed time slots for everything' },
  { value: 'energy based', label: '⚡ Energy Based', desc: 'Tasks match energy level' },
]

const ONBOARDING_STEPS = [
  {
    key: 'account',
    title: 'Create your account',
    subtitle: 'Start organizing your day with AI',
  },
  {
    key: 'schedule',
    title: 'Your daily rhythm',
    subtitle: "Help AI understand your natural schedule",
  },
  {
    key: 'style',
    title: 'How do you work best?',
    subtitle: 'AI will structure your schedule around your style',
  },
  {
    key: 'goals',
    title: 'What matters to you?',
    subtitle: 'AI will prioritize what aligns with your goals',
  },
]

export default function Register() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    wake_time: '08:00', sleep_time: '23:00',
    work_style: '',
    goal: '', avoid: '', extra: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { saveAuth } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const current = ONBOARDING_STEPS[step]

  function nextStep(e) {
    e.preventDefault()
    if (step < ONBOARDING_STEPS.length - 1) {
      setError('')
      setStep(s => s + 1)
    } else {
      submit()
    }
  }

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const data = await register(form)
      saveAuth(data.access_token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.message)
      setStep(0) // back to account step on error
    } finally {
      setLoading(false)
    }
  }

  const isLast = step === ONBOARDING_STEPS.length - 1

  return (
    <div className="auth-shell">
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <button className="theme-btn" onClick={toggle}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      </div>

      <div className="auth-card onboarding-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">⚡</div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>DayFlow</span>
        </div>

        {/* Progress dots */}
        <div className="onboarding-dots">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot${i === step ? ' active' : i < step ? ' done' : ''}`}
            />
          ))}
        </div>

        <h1 className="auth-title">{current.title}</h1>
        <p className="auth-sub">{current.subtitle}</p>

        <form onSubmit={nextStep}>

          {/* Step 0: Account */}
          {step === 0 && (
            <>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          {/* Step 1: Daily rhythm */}
          {step === 1 && (
            <>
              <div className="form-grid">
                <div className="form-group">
                  <label>I usually wake up at</label>
                  <input
                    type="time"
                    value={form.wake_time}
                    onChange={e => set('wake_time', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>I usually go to sleep at</label>
                  <input
                    type="time"
                    value={form.sleep_time}
                    onChange={e => set('sleep_time', e.target.value)}
                  />
                </div>
              </div>
              <div className="onboarding-hint">
                AI will schedule tasks within your active hours and avoid overloading your evenings.
              </div>
            </>
          )}

          {/* Step 2: Work style */}
          {step === 2 && (
            <div className="style-grid">
              {WORK_STYLES.map(ws => (
                <button
                  key={ws.value}
                  type="button"
                  className={`style-card${form.work_style === ws.value ? ' selected' : ''}`}
                  onClick={() => set('work_style', ws.value)}
                >
                  <div className="style-card-label">{ws.label}</div>
                  <div className="style-card-desc">{ws.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <>
              <div className="form-group">
                <label>My main goal right now</label>
                <input
                  type="text"
                  placeholder="e.g. launch a product, lose weight, learn to code..."
                  value={form.goal}
                  onChange={e => set('goal', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>I want to avoid / reduce</label>
                <input
                  type="text"
                  placeholder="e.g. social media, late nights, procrastination..."
                  value={form.avoid}
                  onChange={e => set('avoid', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Anything else AI should know about you?</label>
                <textarea
                  placeholder="e.g. I work from home, I have kids, I prefer morning workouts..."
                  value={form.extra}
                  onChange={e => set('extra', e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <div className="onboarding-actions">
            {step > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStep(s => s - 1)}
              >
                ← Back
              </button>
            )}
            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading
                ? <span className="spinner" />
                : isLast
                  ? '🚀 Start using DayFlow'
                  : 'Continue →'
              }
            </button>
          </div>

          {step === 0 && (
            <div className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          )}

          {step > 0 && !isLast && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setStep(s => s + 1)
                }}
              >
                Skip this step
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
