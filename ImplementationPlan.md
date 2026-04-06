Project Idea

End-user: People who struggle to organize their daily tasks and priorities.

Problem: Many users have difficulty deciding which tasks to focus on each day and how to structure their time effectively.

Product idea: A web application where users add tasks and an AI system generates an optimized daily schedule with suggested time blocks and reminders.



Version 1 — Task input + AI schedule

Core feature: the user adds tasks and the AI generates a structured plan for the day.

Backend: FastAPI + SQLite, CRUD operations for tasks, LLM call to generate schedule.

Database: users, tasks (title, deadline, priority, status).

Client: Web application (React) where users can add tasks and view the AI-generated schedule.

Done when: a user can add real tasks, receive an AI-generated schedule, and the data is stored in the database.



Version 2 — Reminders + Deployment

Core upgrade: the system sends reminders about upcoming tasks and schedule items.

Backend: add scheduler and reminder logic.

Database: store generated schedules and reminder states.

Client: reminder notifications inside the web application (or optional email notifications).

Done when: reminders work, the product is deployed using Docker, and TA feedback is addressed.



Build Order

Data model: users, tasks, schedules

FastAPI backend + LLM integration

React frontend

Scheduler + reminders

Docker + deployment