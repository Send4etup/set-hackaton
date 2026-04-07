import json
import os
from openai import OpenAI
from datetime import datetime
from typing import List, Optional
from models import Task, User

QWEN_BASE_URL = os.getenv("QWEN_BASE_URL", "http://10.93.26.100:42005/v1")
QWEN_API_KEY = os.getenv("QWEN_API_KEY", "1234567890")

SYSTEM_PROMPT = """You are a productivity assistant that creates optimized daily schedules.
You receive a list of tasks with deadlines, priorities, and optional user context.

Return ONLY valid HTML — no markdown, no code fences, no explanation, nothing else.
Use exactly this structure:

<div class="ai-schedule">
  <div class="ai-sched-header">
    <div class="ai-sched-title">DAY_NAME, MONTH DD, YYYY</div>
    <div class="ai-sched-subtitle">SUBTITLE (e.g. "Optimized Schedule · Starts at HH:MM")</div>
  </div>
  <div class="ai-sched-timeline">
    <div class="ai-sched-block ai-prio-high" data-task-id="TASK_ID_OR_EMPTY">
      <div class="ai-sched-time">HH:MM – HH:MM</div>
      <div class="ai-sched-info">
        <div class="ai-sched-name">Task Name</div>
        <div class="ai-sched-desc">Short description of what to do</div>
      </div>
      <span class="ai-sched-badge">HIGH</span>
    </div>
    <div class="ai-sched-block ai-prio-break" data-task-id="">
      <div class="ai-sched-time">HH:MM – HH:MM</div>
      <div class="ai-sched-info">
        <div class="ai-sched-name">☕ Short Break</div>
        <div class="ai-sched-desc">Hydrate, stretch, step away from screen</div>
      </div>
      <span class="ai-sched-badge">BREAK</span>
    </div>
  </div>
</div>

Priority CSS classes: ai-prio-high, ai-prio-medium, ai-prio-low, ai-prio-break
Badge text: HIGH, MEDIUM, LOW, BREAK

IMPORTANT: For each real task block, set data-task-id to the task's numeric ID from the input list.
For break/lunch blocks, set data-task-id="" (empty).

Rules:
- Be practical and realistic with time blocks
- Include 1–2 short breaks (10–15 min) and a lunch break if applicable
- Prioritize by deadline urgency and priority level
- Account for user's wake/sleep times and work style if provided
- Output ONLY the HTML block — nothing before or after it"""


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
        date_str = datetime.now().strftime("%A, %B %d, %Y")

    now = datetime.now().strftime("%H:%M")
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

    lines += ["", "Generate an optimized daily schedule for the given date as HTML."]
    return "\n".join(lines)


def _call_ai(messages: list) -> str:
    client = OpenAI(api_key=QWEN_API_KEY, base_url=QWEN_BASE_URL)
    response = client.chat.completions.create(
        model="coder-model",
        messages=messages,
        max_tokens=2048,
    )
    content = response.choices[0].message.content.strip()
    # Strip markdown code fences if the model wrapped the HTML anyway
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return content


def generate_schedule(
    tasks: List[Task],
    target_date: Optional[str] = None,
    user_notes: Optional[str] = None,
    day_type: Optional[str] = None,
    mood: Optional[str] = None,
    user: Optional[User] = None,
) -> str:
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
    ])


def refine_schedule(current_html: str, instruction: str) -> str:
    """Apply a user's correction/refinement instruction to an existing schedule HTML."""
    system = (
        SYSTEM_PROMPT + "\n\n"
        "You are given an existing schedule HTML and a user instruction to modify it. "
        "Apply the change and return the complete updated HTML schedule. "
        "Return ONLY the HTML — nothing else."
    )
    user_msg = (
        f"Current schedule HTML:\n{current_html}\n\n"
        f"User instruction: {instruction}\n\n"
        "Return the updated schedule HTML."
    )
    return _call_ai([
        {"role": "system", "content": system},
        {"role": "user", "content": user_msg},
    ])
