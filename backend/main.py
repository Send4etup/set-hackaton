from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import tasks, schedule, auth
from sqlalchemy import text

Base.metadata.create_all(bind=engine)

# Add new columns to existing tables without full migration
with engine.connect() as conn:
    for stmt in [
        "ALTER TABLE users ADD COLUMN profile TEXT",
    ]:
        try:
            conn.execute(text(stmt))
            conn.commit()
        except Exception:
            pass  # column already exists

app = FastAPI(title="AI Task Scheduler")

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


@app.get("/")
def root():
    return {"status": "ok"}
