# ⚡ DayFlow — AI-Powered Daily Planner

> Add tasks → get an optimized AI schedule → track deadlines in real time

---

## About

**DayFlow** is a web application for people who struggle to organize their day. Users add tasks with deadlines and priorities, and the AI generates a structured schedule with time blocks — personalized to their daily rhythm, work style, and current mood.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, React Router, Vite |
| Backend | FastAPI, SQLAlchemy, SQLite |
| AI | Qwen (OpenAI-compatible API) |
| Scheduler | APScheduler |
| Deploy | Docker Compose + Nginx |

---

## Features

### Version 1 — Tasks + AI Schedule

- **Onboarding at registration** — 4 steps: account → daily rhythm (wake/sleep times) → work style → goals and things to avoid. All saved as a user profile and injected into every AI prompt
- **Task management** — create tasks with title, description, deadline, priority (low / medium / high) and status (pending / in progress / done)
- **AI schedule generation** — pick a day, fill in the context (day type, mood, notes) and hit Generate. The AI returns a JSON array of time blocks; Python converts it to styled HTML on the server
- **Schedule by date** — switching to a different day automatically loads its previously generated schedule
- **Tasks by date** — the schedule page shows only tasks due on the selected day; completed tasks are hidden in a collapsible section
- **Refine** — a text input below the schedule lets you ask the AI to adjust the plan (e.g. "move gym to morning")
- **Light / dark theme**

### Version 2 — Notifications

- **Background scheduler** — checks all active tasks every 30 seconds and creates notifications:
  - ⚠️ **Overdue** — deadline has passed, task not done
  - ⏰ **Due soon** — deadline within 60 minutes
  - 📅 **Due today** — morning nudge (8:00–9:00 MSK) for tasks due that day
- **Notification bell in the header** — red badge with unread count, dropdown with notification history
- **Actions** — mark one / all as read, clear read notifications
- **Auto-polling** — frontend fetches new notifications every 30 seconds
- All times in **Moscow time (UTC+3)**

---

## Getting Started

### Requirements

- Docker + Docker Compose
- Access to a Qwen API (OpenAI-compatible endpoint)

### 1. Clone the repository

```bash
git clone <repo-url>
cd hackaton
```

### 2. Configure environment variables

Default values are already set in `docker-compose.yml`. Change if needed:

```yaml
environment:
  - QWEN_BASE_URL=http://10.93.26.100:42005/v1   # Qwen API address
  - QWEN_API_KEY=1234567890                       # API key
```

### 3. Run

```bash
docker compose up -d --build
```

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:8000 |
| 📖 API Docs | http://localhost:8000/docs |

### 4. Stop

```bash
docker compose down
```

---

## How It Works

### AI Schedule Generation

```
User picks a day and fills in the day context
              ↓
POST /api/schedule/generate
              ↓
Backend assembles tasks + user profile + day context into a prompt
              ↓
Qwen returns a compact JSON array (~300 tokens, ~7–15 sec)
              ↓
Python converts JSON → HTML on the server side
              ↓
Result is saved to DB and rendered on the frontend
```

> The AI is asked to return JSON only, not HTML — this is ~10× faster and more reliable.

### Deadline Notifications

```
APScheduler (every 30 sec)
              ↓
Checks all tasks where status != done AND deadline IS NOT NULL
              ↓
Creates records in the notifications table
(same type for the same task is not repeated within 2 hours)
              ↓
Frontend polls GET /api/notifications/ every 30 sec
              ↓
Bell updates its unread count badge
```

---

## Project Structure

```
hackaton/
├── backend/
│   ├── routers/
│   │   ├── auth.py               # register, login, profile
│   │   ├── tasks.py              # task CRUD
│   │   ├── schedule.py           # generate and refine schedule
│   │   └── notifications.py      # notifications
│   ├── services/
│   │   ├── ai_scheduler.py       # Qwen prompt + JSON→HTML converter
│   │   ├── reminder_scheduler.py # background deadline checks (MSK)
│   │   └── auth_service.py       # JWT + bcrypt
│   ├── models.py                 # User, Task, Schedule, Notification
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── main.py                   # FastAPI app + APScheduler startup
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # task management
│   │   │   ├── SchedulePage.jsx  # AI schedule
│   │   │   ├── Register.jsx      # 4-step onboarding
│   │   │   └── Settings.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   └── NotificationBell.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   └── api.js                # all API calls
│   └── nginx.conf                # reverse proxy + 300s timeout
├── docker-compose.yml
├── implementationplan.md
└── README.md
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register with onboarding profile |
| `POST` | `/auth/login` | Login → JWT token |
| `GET` | `/auth/me` | Current user data |
| `PATCH` | `/auth/profile` | Update user profile |
| `GET` | `/tasks/` | List all tasks |
| `POST` | `/tasks/` | Create a task |
| `PATCH` | `/tasks/{id}` | Update a task |
| `DELETE` | `/tasks/{id}` | Delete a task |
| `POST` | `/schedule/generate` | Generate a schedule |
| `POST` | `/schedule/refine` | Refine schedule via AI |
| `GET` | `/schedule/by-date/{date}` | Get schedule for a specific date |
| `GET` | `/notifications/` | List notifications (last 50) |
| `GET` | `/notifications/unread-count` | Unread count |
| `PATCH` | `/notifications/{id}/read` | Mark one as read |
| `PATCH` | `/notifications/read-all` | Mark all as read |
| `DELETE` | `/notifications/clear` | Delete read notifications |
