from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import enum


class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Status(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    done = "done"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    deadline: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    priority: Mapped[Priority] = mapped_column(SAEnum(Priority), default=Priority.medium)
    status: Mapped[Status] = mapped_column(SAEnum(Status), default=Status.pending)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
