Project Idea

End-user: People who struggle to organize their daily tasks and priorities.

Problem: Many users have difficulty deciding which tasks to focus on each day and how to structure their time effectively.

Product idea: A web application where users add tasks and an AI system generates an optimized daily schedule with suggested time blocks, personalized to the user's rhythm and preferences.



Version 1 — Task input + AI schedule  ✅ DONE

Core feature: the user adds tasks and the AI generates a structured daily plan.

Backend: FastAPI + SQLite, CRUD for tasks and schedules, JWT authentication, LLM call via OpenAI-compatible Qwen proxy.

Database: users (with profile JSON for onboarding preferences), tasks (title, description, deadline, priority, status), schedules (content, target_date).

Client: React SPA — authentication, task management dashboard, AI schedule page with date picker.

AI schedule generation:
- User fills in Day Context (day type, mood, free-text notes)
- Active tasks are passed to the AI with deadlines and priorities
- AI returns a JSON array of time blocks; Python converts it to HTML on the server side
- Schedule is stored per date; selecting a date auto-loads its schedule
- "Refine" input lets the user ask AI to adjust the generated schedule

Onboarding: after registration a 4-step questionnaire collects wake/sleep times, preferred work style, main goal, and things to avoid — stored as a user profile JSON and injected into every AI prompt.

Task management on schedule page:
- Tasks are filtered by deadline date — only tasks due on the selected day are shown
- Done tasks are hidden in a collapsible "Completed" section
- Tasks can be checked off directly from the schedule page

Deployment: Docker Compose (backend on port 8000, frontend/nginx on port 3000). Nginx proxy_read_timeout set to 300s to handle slow LLM responses.

Done when: a user can register with onboarding, add tasks, receive a personalized AI-generated schedule for any day, refine it, and mark tasks as done. ✅



Version 2 — Reminders + Polish  ✅ DONE

Core upgrade: the system sends in-app reminders about upcoming and overdue tasks.

Backend: APScheduler background job runs every 5 minutes, checks all active tasks with deadlines and creates notifications:
- ⚠️ Overdue — task past its deadline and still not done
- ⏰ Due in N min — task due within 60 minutes
- 📅 Due today — morning nudge (08:00–09:00) for tasks due that day
Duplicate protection: same notification type for same task is not repeated within 2 hours.

Database: notifications table (user_id, task_id, type, message, read, created_at).

Client:
- 🔔 Notification bell in the header with unread count badge
- Dropdown showing last 50 notifications with icons, message, and relative time
- Click to mark individual notification as read; "Mark all read" and "Clear read" actions
- Auto-polls every 60 seconds for new notifications

Done when: reminders appear in real time as task deadlines approach. ✅



Build Order

Data model: users, tasks, schedules ✅
FastAPI backend + LLM integration ✅
React frontend + auth ✅
Onboarding flow ✅
AI schedule with date picker, day context, refine input ✅
Docker + nginx deployment ✅
Scheduler + reminders (Version 2)
