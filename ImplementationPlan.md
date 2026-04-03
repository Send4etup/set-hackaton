Project Idea
End-user: Telegram users who struggle to organize their daily tasks
Problem: Difficult to prioritize tasks and know what to focus on each day
Product idea: A Telegram Mini App where you add tasks and AI builds an optimized daily schedule with reminders.

Version 1 — Task input + AI schedule
Core feature: user adds tasks, AI returns a structured plan for the day.

Backend: FastAPI + SQLite, CRUD for tasks, LLM call to generate schedule
Database: users, tasks (title, deadline, priority, status)
Client: Telegram Mini App — add tasks, view AI-generated schedule

Done when: user adds real tasks, gets a real AI schedule, data stored in DB.

Version 2 — Reminders + Deployment
Core upgrade: Telegram Bot sends reminders based on the generated schedule.

Backend: add scheduler, reminder logic
Database: store schedules, track reminder status
Client: reminder messages in Telegram chat, snooze option

Done when: reminders work, product is deployed Docker, TA feedback addressed.

Build Order

Data model: users, tasks, schedules
FastAPI backend + LLM integration
Telegram Mini App frontend
Scheduler + reminders
Docker + deploy