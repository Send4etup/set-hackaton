from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from database import Base, engine
from routers import tasks, schedule, auth, notifications
from sqlalchemy import text

Base.metadata.create_all(bind=engine)

# Migrations for existing databases
with engine.connect() as conn:
    for stmt in [
        "ALTER TABLE users ADD COLUMN profile TEXT",
        """CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            task_id INTEGER REFERENCES tasks(id),
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            read INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )""",
    ]:
        try:
            conn.execute(text(stmt))
            conn.commit()
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start reminder scheduler
    from services.reminder_scheduler import check_reminders
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_reminders, "interval", seconds=30, id="reminders")
    scheduler.start()
    print("[scheduler] Reminder job started — runs every 5 minutes")
    yield
    scheduler.shutdown(wait=False)
    print("[scheduler] Stopped")


app = FastAPI(title="AI Task Scheduler", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(schedule.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {"status": "ok"}
