import os
from openai import OpenAI
from datetime import datetime
from typing import List
from models import Task

QWEN_BASE_URL = os.getenv("QWEN_BASE_URL", "http://localhost:8080/v1")
QWEN_API_KEY = os.getenv("QWEN_API_KEY", "1234567890")


def build_task_prompt(tasks: List[Task]) -> str:
    today = datetime.now().strftime("%A, %B %d, %Y")
    now = datetime.now().strftime("%H:%M")

    lines = [
        f"Today is {today}, current time is {now}.",
        "",
        "Here are the user's tasks:",
    ]

    for t in tasks:
        deadline_str = t.deadline.strftime("%Y-%m-%d %H:%M") if t.deadline else "no deadline"
        desc = f" — {t.description}" if t.description else ""
        lines.append(
            f"- [{t.priority.upper()}] {t.title}{desc} | deadline: {deadline_str} | status: {t.status}"
        )

    lines += [
        "",
        "Generate an optimized daily schedule for the user.",
        "Prioritize by deadline and priority level.",
        "Suggest specific time blocks (e.g. 09:00–10:30).",
        "Be concise and practical. Format as a clear list of time slots.",
    ]

    return "\n".join(lines)


def generate_schedule(tasks: List[Task]) -> str:
    client = OpenAI(api_key=QWEN_API_KEY, base_url=QWEN_BASE_URL)

    prompt = build_task_prompt(tasks)

    response = client.chat.completions.create(
        model="coder-model",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a productivity assistant that creates optimized daily schedules. "
                    "You receive a list of tasks with deadlines and priorities, and return "
                    "a structured daily plan with specific time blocks. Be practical and realistic."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=2048,
    )

    return response.choices[0].message.content
