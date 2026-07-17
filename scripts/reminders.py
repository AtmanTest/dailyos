"""
Reminders processing module for DailyOS.
Scans entries for reminders and checks due dates.
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from schemas import Reminder


def process_reminders(entries: list[dict]) -> list[dict]:
    """
    Scan entries for type=reminder or content containing 'rappel:'.
    Returns a list of Reminder dicts with proper categorization.
    """
    reminders = []
    now_iso = datetime.now(timezone.utc).isoformat()
    default_user_id = str(uuid.uuid4())

    for entry in entries:
        entry_type = entry.get('type', '')
        content = entry.get('content', '')
        user_id = entry.get('user_id', default_user_id)
        created_at = entry.get('created_at', now_iso)
        tags = entry.get('tags', [])

        is_reminder = (entry_type == 'reminder')
        if not is_reminder:
            # Check for 'rappel:' in content (case insensitive)
            if re.search(r'\brappel\s*:', content, re.IGNORECASE):
                is_reminder = True

        if not is_reminder:
            continue

        # Extract title: remove 'rappel:' prefix if present
        title = content
        rappel_match = re.match(r'^rappel\s*:\s*(.*)', content, re.IGNORECASE)
        if rappel_match:
            title = rappel_match.group(1).strip()

        # Categorize based on content
        category = _categorize_reminder(title, tags, content)

        # Determine priority
        priority = _determine_priority(title, tags, content)

        # Try to extract due date from content
        due_date = _extract_due_date(title, content)

        reminder = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'title': title,
            'source': 'inbox',
            'due_date': due_date,
            'priority': priority,
            'status': 'active',
            'category': category,
            'created_at': created_at,
        }

        # Validate with Pydantic
        try:
            Reminder(**reminder)
            reminders.append(reminder)
        except Exception:
            pass

    return reminders


def check_due_reminders(reminders: list[dict]) -> list[dict]:
    """
    Filter active reminders that are due or overdue.
    Compares due_date against current date.
    Returns list of overdue reminder dicts.
    """
    now = datetime.now(timezone.utc)
    today = now.strftime('%Y-%m-%d')
    overdue = []

    for reminder in reminders:
        if reminder.get('status') != 'active':
            continue
        due_date = reminder.get('due_date')
        if due_date is None:
            continue
        # Compare dates
        if due_date <= today:
            overdue.append(reminder)

    return overdue


def _categorize_reminder(title: str, tags: list[str], content: str) -> str:
    """Categorize a reminder based on keywords."""
    text = f"{title} {content}".lower()
    tag_set = {t.lower() for t in tags}

    if 'review' in tag_set or 'revoir' in tag_set:
        return 'review'
    if 'follow_up' in tag_set or 'suivi' in tag_set:
        return 'follow_up'

    if any(kw in text for kw in ['revoir', 'relire', 'vérifier', 'check', 'vérification',
                                  'relecture', 'review']):
        return 'review'
    if any(kw in text for kw in ['suivi', 'follow', 'rappeler', 'follow up',
                                  'donner des nouvelles']):
        return 'follow_up'
    if any(kw in text for kw in ['idée', 'réfléchir', 'peut-être', 'penser à',
                                  'explorer', 'open loop']):
        return 'open_loop'

    return 'action'


def _determine_priority(title: str, tags: list[str], content: str) -> str:
    """Determine priority based on urgency keywords."""
    text = f"{title} {content}".lower()
    tag_set = {t.lower() for t in tags}

    if 'high' in tag_set or 'urgent' in tag_set or 'important' in tag_set:
        return 'high'
    if 'low' in tag_set or 'peu import' in tag_set:
        return 'low'

    if any(kw in text for kw in ['urgent', 'important', '!', 'immédiat',
                                  'todo', 'asap']):
        return 'high'
    if any(kw in text for kw in ['peut-être', 'un jour', 'si possible',
                                  'éventuellement']):
        return 'low'

    return 'medium'


def _extract_due_date(title: str, content: str) -> Optional[str]:
    """Try to extract a due date from content.
    Looks for patterns like: 'avant demain', 'pour lundi', '20/12/2024', '2024-12-20'
    """
    text = f"{title} {content}"

    # Look for explicit date in YYYY-MM-DD format
    date_match = re.search(r'(\d{4}-\d{2}-\d{2})', text)
    if date_match:
        return date_match.group(1)

    # Look for DD/MM/YYYY format
    date_match = re.search(r'(\d{2})/(\d{2})/(\d{4})', text)
    if date_match:
        d, m, y = date_match.group(1), date_match.group(2), date_match.group(3)
        return f"{y}-{m}-{d}"

    # Look for "aujourd'hui" or "demain"
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    if re.search(r'aujourd\'hui', text, re.IGNORECASE):
        return today
    if re.search(r'demain', text, re.IGNORECASE):
        from datetime import timedelta
        tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime('%Y-%m-%d')
        return tomorrow

    return None
