"""
Task Store — in-memory registry for background apply jobs.
Maps task_id -> { status, message, result, created_at }
"""
import uuid
from datetime import datetime
from typing import Optional

_tasks: dict = {}

def create_task() -> str:
    task_id = str(uuid.uuid4())
    _tasks[task_id] = {
        "status": "queued",
        "message": "Queued — starting soon...",
        "result": None,
        "created_at": datetime.utcnow().isoformat()
    }
    return task_id

def update_task(task_id: str, status: str, message: str, result: Optional[dict] = None):
    if task_id in _tasks:
        _tasks[task_id]["status"] = status
        _tasks[task_id]["message"] = message
        if result is not None:
            _tasks[task_id]["result"] = result

def get_task(task_id: str) -> Optional[dict]:
    return _tasks.get(task_id)
