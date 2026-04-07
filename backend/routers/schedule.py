from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Task, Schedule, Status, User
from schemas import ScheduleOut, ScheduleGenerateRequest, ScheduleRefineRequest
from services.ai_scheduler import generate_schedule, refine_schedule
from services.auth_service import get_current_user

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.post("/generate", response_model=ScheduleOut)
def generate(
    body: ScheduleGenerateRequest = Body(default_factory=ScheduleGenerateRequest),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tasks = db.query(Task).filter(Task.user_id == user.id, Task.status != Status.done).all()

    content = generate_schedule(
        tasks,
        target_date=body.target_date,
        user_notes=body.user_notes,
        day_type=body.day_type,
        mood=body.mood,
        user=user,
    )

    schedule = Schedule(content=content, user_id=user.id, target_date=body.target_date)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.post("/refine", response_model=ScheduleOut)
def refine(
    body: ScheduleRefineRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    original = db.query(Schedule).filter(
        Schedule.id == body.schedule_id, Schedule.user_id == user.id
    ).first()
    if not original:
        raise HTTPException(status_code=404, detail="Schedule not found")

    new_content = refine_schedule(original.content, body.instruction)

    # Save as new schedule entry with same target_date
    updated = Schedule(
        content=new_content,
        user_id=user.id,
        target_date=original.target_date,
    )
    db.add(updated)
    db.commit()
    db.refresh(updated)
    return updated


@router.get("/by-date/{date}", response_model=ScheduleOut)
def get_by_date(date: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    schedule = (
        db.query(Schedule)
        .filter(Schedule.user_id == user.id, Schedule.target_date == date)
        .order_by(Schedule.created_at.desc())
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="No schedule for this date")
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
