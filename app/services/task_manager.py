import uuid
from typing import Dict, Any, Optional

# This is a simple in-memory task manager.
# In a real-world application, you might use Redis, Celery, or a database for this.
tasks: Dict[str, Dict[str, Any]] = {}

def create_task() -> str:
    """
    Creates a new task with a unique ID and sets its status to 'pending'.
    Returns the new task ID.
    """
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "pending", "result": None}
    return task_id

def get_task(task_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves the status and result of a task.
    """
    return tasks.get(task_id)

def update_task_status(task_id: str, status: str, result: Any = None):
    """
    Updates the status and result of a task.
    """
    if task_id in tasks:
        tasks[task_id]["status"] = status
        tasks[task_id]["result"] = result
    else:
        # Handle the case where the task ID is not found, maybe log a warning
        print(f"Warning: Task ID {task_id} not found for update.")

