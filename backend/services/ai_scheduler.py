import json
import os
from openai import OpenAI
from datetime import datetime, timedelta, timezone

MSK = timezone(timedelta(hours=3))
def _now_msk(): return datetime.now(tz=MSK).replace(tzinfo=None)
from typing import List, Optional
from models import Task, User

QWEN_BASE_URL = os.getenv("QWEN_BASE_URL", "http://10.93.26.100:42005/v1")
QWEN_API_KEY = os.getenv("QWEN_API_KEY", "1234567890")

SYSTEM_PROMPT = """You are a scheduling assistant. Return ONLY a JSON array, no explanation, no markdown.

Each item: {"time":"HH:MM-HH:MM","name":"...","desc":"...","priority":"high|medium|low|break","task_id":123}
task_id is the numeric ID from the input, or null for breaks.
6-9 blocks max. Descriptions under 8 words. Output ONLY the JSON array."""


def _parse_profile(user: Optional[User]) -> dict:
    if not user or not user.profile:
        return {}
    try:
        return json.loads(user.profile)
    except Exception:
        return {}


def build_task_prompt(
    tasks: List[Task],
    target_date: Optional[str] = None,
    user_notes: Optional[str] = None,
    day_type: Optional[str] = None,
    mood: Optional[str] = None,
    user: Optional[User] = None,
) -> str:
    if target_date:
        try:
            dt = datetime.strptime(target_date, "%Y-%m-%d")
            date_str = dt.strftime("%A, %B %d, %Y")
        except ValueError:
            date_str = target_date
    else:
        date_str = _now_msk().strftime("%A, %B %d, %Y")

    now = _now_msk().strftime("%H:%M")
    profile = _parse_profile(user)

    lines = [f"Schedule date: {date_str} (current time: {now})."]

    # User profile context
    if profile:
        lines.append("\nUser profile:")
        if profile.get("wake_time"):
            lines.append(f"  - Wakes up at: {profile['wake_time']}")
        if profile.get("sleep_time"):
            lines.append(f"  - Sleeps at: {profile['sleep_time']}")
        if profile.get("work_style"):
            lines.append(f"  - Preferred work style: {profile['work_style']}")
        if profile.get("goal"):
            lines.append(f"  - Main goal: {profile['goal']}")
        if profile.get("avoid"):
            lines.append(f"  - Wants to avoid: {profile['avoid']}")
        if profile.get("extra"):
            lines.append(f"  - Additional notes: {profile['extra']}")

    if day_type:
        lines.append(f"\nDay type: {day_type}")
    if mood:
        lines.append(f"User's current mood/energy: {mood}")
    if user_notes:
        lines.append(f"User's notes for today: {user_notes}")

    lines.append("")

    if tasks:
        lines.append("User's active tasks (use their numeric ID in data-task-id):")
        for t in tasks:
            deadline_str = t.deadline.strftime("%Y-%m-%d %H:%M") if t.deadline else "no deadline"
            desc = f" — {t.description}" if t.description else ""
            lines.append(
                f"- [ID:{t.id}] [{t.priority.upper()}] {t.title}{desc} | deadline: {deadline_str} | status: {t.status}"
            )
    else:
        lines.append("No active tasks. Generate a general productive day plan.")

    lines += ["", "Return a JSON array schedule for this date. 6-9 blocks only."]
    return "\n".join(lines)


def _json_to_html(blocks: list, date_str: str) -> str:
    prio_map = {"high": "ai-prio-high", "medium": "ai-prio-medium", "low": "ai-prio-low", "break": "ai-prio-break"}
    badge_map = {"high": "HIGH", "medium": "MEDIUM", "low": "LOW", "break": "BREAK"}
    items_html = ""
    for b in blocks:
        prio = b.get("priority", "medium")
        tid = b.get("task_id") or ""
        items_html += (
            f'<div class="ai-sched-block {prio_map.get(prio, "ai-prio-medium")}" data-task-id="{tid}">'
            f'<div class="ai-sched-time">{b.get("time","")}</div>'
            f'<div class="ai-sched-info">'
            f'<div class="ai-sched-name">{b.get("name","")}</div>'
            f'<div class="ai-sched-desc">{b.get("desc","")}</div>'
            f'</div>'
            f'<span class="ai-sched-badge">{badge_map.get(prio, "MEDIUM")}</span>'
            f'</div>'
        )
    return (
        f'<div class="ai-schedule">'
        f'<div class="ai-sched-header">'
        f'<div class="ai-sched-title">{date_str}</div>'
        f'<div class="ai-sched-subtitle">Optimized Schedule</div>'
        f'</div>'
        f'<div class="ai-sched-timeline">{items_html}</div>'
        f'</div>'
    )


def _call_ai(messages: list, date_str: str = "") -> str:
    client = OpenAI(api_key=QWEN_API_KEY, base_url=QWEN_BASE_URL, timeout=180.0)
    response = client.chat.completions.create(
        model="coder-model",
        messages=messages,
        max_tokens=900,
    )
    raw = response.choices[0].message.content.strip()

    # Strip markdown fences
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    # Try to parse JSON and convert to HTML on our side
    try:
        # Find JSON array in response
        start = raw.find("[")
        end = raw.rfind("]") + 1
        blocks = json.loads(raw[start:end])
        return _json_to_html(blocks, date_str)
    except Exception:
        # Fallback: return raw text wrapped in pre
        return f'<pre class="schedule-content">{raw}</pre>'


def generate_schedule(
    tasks: List[Task],
    target_date: Optional[str] = None,
    user_notes: Optional[str] = None,
    day_type: Optional[str] = None,
    mood: Optional[str] = None,
    user: Optional[User] = None,
) -> str:
    if target_date:
        try:
            dt = datetime.strptime(target_date, "%Y-%m-%d")
            date_str = dt.strftime("%A, %B %d, %Y")
        except ValueError:
            date_str = target_date
    else:
        date_str = _now_msk().strftime("%A, %B %d, %Y")

    prompt = build_task_prompt(
        tasks,
        target_date=target_date,
        user_notes=user_notes,
        day_type=day_type,
        mood=mood,
        user=user,
    )
    return _call_ai([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ], date_str=date_str)


def refine_schedule(current_html: str, instruction: str) -> str:
    """Apply refinement to existing schedule: parse current HTML back, ask AI to adjust JSON."""
    system = SYSTEM_PROMPT + "\nYou are given a current schedule as JSON and must apply the user's change. Return ONLY the updated JSON array."
    user_msg = (
        f"Current schedule (reconstruct from this HTML if needed): {current_html[:500]}\n\n"
        f"Instruction: {instruction}\n\nReturn updated JSON array only."
    )
    return _call_ai([
        {"role": "system", "content": system},
        {"role": "user", "content": user_msg},
    ], date_str="")
