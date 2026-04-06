from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Task, Schedule, Status
from schemas import ScheduleOut
from services.ai_scheduler import generate_schedule

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.post("/generate", response_model=ScheduleOut)
def generate(db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.status != Status.done).all()
    if not tasks:
        raise HTTPException(status_code=400, detail="No active tasks to schedule")

    content = generate_schedule(tasks)

    schedule = Schedule(content=content)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/latest", response_model=ScheduleOut)
def get_latest(db: Session = Depends(get_db)):
    schedule = db.query(Schedule).order_by(Schedule.created_at.desc()).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="No schedule generated yet")
    return schedule


@router.get("/", response_model=List[ScheduleOut])
def list_schedules(db: Session = Depends(get_db)):
    return db.query(Schedule).order_by(Schedule.created_at.desc()).all()
