from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from models import Priority, Status


# Auth
class UserRegister(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str]
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
class ScheduleOut(BaseModel):
    id: int
    content: str
    target_date: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}
