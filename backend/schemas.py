from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models import Priority, Status


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


class ScheduleOut(BaseModel):
    id: int
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
