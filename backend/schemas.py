from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models import Priority, Status


# Auth
class UserRegister(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    # Onboarding profile fields (optional at register, saved as JSON)
    wake_time: Optional[str] = None       # e.g. "07:00"
    sleep_time: Optional[str] = None      # e.g. "23:00"
    work_style: Optional[str] = None      # e.g. "deep focus blocks"
    goal: Optional[str] = None            # e.g. "launch a startup"
    avoid: Optional[str] = None           # e.g. "social media"
    extra: Optional[str] = None           # free-form notes


class UserLogin(BaseModel):
    email: str
    password: str


class UserProfileUpdate(BaseModel):
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    work_style: Optional[str] = None
    goal: Optional[str] = None
    avoid: Optional[str] = None
    extra: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str]
    profile: Optional[str]  # raw JSON string
    created_at: datetime
    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# Tasks
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Priority = Priority.medium
    status: Status = Status.pending


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    deadline: Optional[datetime]
    priority: Priority
    status: Status
    created_at: datetime
    model_config = {"from_attributes": True}


# Schedule
class ScheduleGenerateRequest(BaseModel):
    target_date: Optional[str] = None
    user_notes: Optional[str] = None
    day_type: Optional[str] = None
    mood: Optional[str] = None


class ScheduleRefineRequest(BaseModel):
    schedule_id: int
    instruction: str


class ScheduleOut(BaseModel):
    id: int
    content: str
    target_date: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}
