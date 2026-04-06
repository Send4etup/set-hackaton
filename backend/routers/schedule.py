from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Task, Schedule, Status, User
from schemas import ScheduleOut
from services.ai_scheduler import generate_schedule
from services.auth_service import get_current_user

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.post("/generate", response_model=ScheduleOut)
def generate(
    target_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tasks = db.query(Task).filter(Task.user_id == user.id, Task.status != Status.done).all()
    if not tasks:
        raise HTTPException(status_code=400, detail="No active tasks to schedule")

    content = generate_schedule(tasks, target_date=target_date)

    schedule = Schedule(content=content, user_id=user.id, target_date=target_date)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.get("/latest", response_model=ScheduleOut)
def get_latest(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    schedule = (
        db.query(Schedule)
        .filter(Schedule.user_id == user.id)
        .order_by(Schedule.created_at.desc())
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="No schedule generated yet")
    return schedule


@router.get("/", response_model=List[ScheduleOut])
def list_schedules(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Schedule).filter(Schedule.user_id == user.id).order_by(Schedule.created_at.desc()).all()
