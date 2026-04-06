# Project Idea

## End-user
Students and busy professionals who struggle to organize their daily tasks.

## Problem
Many people create task lists but still struggle to decide what to do first and how to structure their day efficiently.

## Product idea
A web application that allows users to add tasks and uses an AI model to generate an optimized daily schedule.

## Core feature
The user enters tasks and the AI generates a structured daily plan that prioritizes tasks based on deadline and priority.

---

# Implementation Plan

## Version 1 — Task Input + AI Schedule

Version 1 focuses on the main core feature: generating an AI-powered daily schedule.

### Backend
FastAPI service that:
- stores user tasks
- generates an AI schedule using an LLM

### Database
SQLite database with tables:

- `users`
- `tasks`
  - title
  - deadline
  - priority
  - status

### Client
React web application where users can:

- add tasks
- view tasks
- generate an AI daily schedule

### Done when
- User can add tasks through the web interface
- Tasks are stored in the database
- AI generates a daily schedule based on tasks
- The TA can test the feature

---

## Version 2 — Reminders + Deployment

Version 2 improves the product by adding reminders and deployment.

### Backend improvements
- scheduler for task reminders
- reminder logic based on generated schedule

### Database improvements
Add tables:

- `schedules`
- reminder status tracking

### Client improvements
Web UI improvements:

- view generated schedule
- notifications for upcoming tasks
- ability to mark tasks as completed

### Deployment
- Dockerize backend and frontend
- Deploy the application on a server/VM

### Done when
- reminders work
- application is deployed
- TA feedback from Version 1 is addressed

---

# Build Order

1. Design data model
   - users
   - tasks
   - schedules

2. Implement backend
   - FastAPI API
   - CRUD for tasks
   - LLM integration

3. Build frontend
   - React interface
   - task input form
   - schedule view

4. Add scheduler and reminders

5. Dockerize and deploy the application