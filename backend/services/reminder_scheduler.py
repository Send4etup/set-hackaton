"""
Background scheduler that checks for upcoming/overdue tasks
and creates in-app notifications for users.

Runs every 5 minutes via APScheduler.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Task, Notification, NotificationType, Status

# Moscow time UTC+3
MSK = timezone(timedelta(hours=3))


def now_msk() -> datetime:
    """Current naive datetime in Moscow time (UTC+3)."""
    return datetime.now(tz=MSK).replace(tzinfo=None)


def _already_notified(db: Session, user_id: int, task_id: int, ntype: NotificationType) -> bool:
    """Avoid duplicate notifications of the same type for the same task within 2 hours."""
    cutoff = now_msk() - timedelta(hours=2)
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.task_id == task_id,
        Notification.type == ntype,
        Notification.created_at >= cutoff,
    ).first() is not None


def _push(db: Session, user_id: int, task_id: int, ntype: NotificationType, msg: str):
    if _already_notified(db, user_id, task_id, ntype):
        return
    db.add(Notification(
        user_id=user_id,
        task_id=task_id,
        type=ntype,
        message=msg,
    ))


def check_reminders():
    """Called by APScheduler every 30 seconds."""
    db: Session = SessionLocal()
    try:
        now = now_msk()
        soon = now + timedelta(minutes=60)
        today_end = now.replace(hour=23, minute=59, second=59)

        active_tasks = (
            db.query(Task)
            .filter(Task.status != Status.done, Task.deadline.isnot(None))
            .all()
        )

        for task in active_tasks:
            dl = task.deadline
            uid = task.user_id

            # 1. Overdue
            if dl < now:
                _push(db, uid, task.id, NotificationType.overdue,
                      f"⚠️ Просрочено: «{task.title}» — было {dl.strftime('%d %b %H:%M')}")

            # 2. Due within 60 minutes
            elif dl <= soon:
                mins = int((dl - now).total_seconds() / 60)
                _push(db, uid, task.id, NotificationType.deadline_soon,
                      f"⏰ Через {mins} мин: «{task.title}»")

            # 3. Due today — morning nudge 08:00–09:00 MSK
            elif dl <= today_end and 8 <= now.hour < 9:
                _push(db, uid, task.id, NotificationType.deadline_today,
                      f"📅 Сегодня: «{task.title}» — дедлайн {dl.strftime('%H:%M')}")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[reminder_scheduler] error: {e}")
    finally:
        db.close()
