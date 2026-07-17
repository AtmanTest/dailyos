"""
Normalization module for DailyOS.
Deduplication, validation, and extraction of reminders from raw entries.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from schemas import RawEntry, Reminder


def deduplicate(entries: list[dict]) -> list[dict]:
    """
    Remove exact content+type+date duplicates.
    The date is the date portion (YYYY-MM-DD) of created_at.
    Returns a deduplicated list preserving original order.
    """
    seen = set()
    result = []
    for entry in entries:
        content = entry.get('content', '')
        entry_type = entry.get('type', '')
        created_at = entry.get('created_at', '')
        date_part = created_at[:10] if created_at else ''
        key = (content, entry_type, date_part)
        if key not in seen:
            seen.add(key)
            result.append(entry)
    return result


def validate_entry(entry_dict: dict) -> tuple[bool, list[str]]:
    """
    Validate a dict against the RawEntry schema.
    Returns (is_valid, list_of_error_messages).
    """
    errors = []

    # Required fields
    required_fields = ['type', 'content', 'created_at']
    for field in required_fields:
        if field not in entry_dict:
            errors.append(f"Missing required field: {field}")

    if errors:
        return False, errors

    # Validate type
    allowed_types = {'thought', 'idea', 'action', 'event', 'mood', 'reminder', 'win', 'blocker', 'note'}
    if entry_dict['type'] not in allowed_types:
        errors.append(f"Invalid type '{entry_dict['type']}': must be one of {allowed_types}")

    # Validate content is a string
    if not isinstance(entry_dict['content'], str):
        errors.append("content must be a string")

    # Validate created_at is valid ISO-8601
    try:
        datetime.fromisoformat(entry_dict['created_at'])
    except (ValueError, TypeError):
        errors.append(f"created_at is not valid ISO-8601: '{entry_dict['created_at']}'")

    # Validate optional scores
    if 'mood_score' in entry_dict and entry_dict['mood_score'] is not None:
        try:
            ms = float(entry_dict['mood_score'])
            if ms < 0 or ms > 10:
                errors.append(f"mood_score must be between 0 and 10, got {ms}")
        except (ValueError, TypeError):
            errors.append("mood_score must be a number or None")

    if 'energy_score' in entry_dict and entry_dict['energy_score'] is not None:
        try:
            es = float(entry_dict['energy_score'])
            if es < 0 or es > 10:
                errors.append(f"energy_score must be between 0 and 10, got {es}")
        except (ValueError, TypeError):
            errors.append("energy_score must be a number or None")

    # Validate tags is a list
    if 'tags' in entry_dict and not isinstance(entry_dict.get('tags'), list):
        errors.append("tags must be a list")

    # Validate metadata is a dict
    if 'metadata' in entry_dict and not isinstance(entry_dict.get('metadata'), dict):
        errors.append("metadata must be a dict")

    # Try Pydantic validation
    if not errors:
        try:
            RawEntry(**entry_dict)
        except Exception as e:
            errors.append(str(e))

    return len(errors) == 0, errors


def extract_reminders(entries: list[dict]) -> list[dict]:
    """
    Detect entries with type=reminder and return list of Reminder dicts.
    Also detects 'rappel:' in content of non-reminder types.
    """
    reminders = []
    now_iso = datetime.now(timezone.utc).isoformat()
    default_user_id = str(uuid.uuid4())

    for entry in entries:
        entry_type = entry.get('type', '')
        content = entry.get('content', '')
        user_id = entry.get('user_id', default_user_id)
        created_at = entry.get('created_at', now_iso)

        # Determine if this should be a reminder
        is_reminder = (entry_type == 'reminder')
        if not is_reminder and 'rappel:' in content.lower():
            is_reminder = True

        if is_reminder:
            title = content
            # Clean up "rappel:" prefix from title
            rappel_match = content.lower().startswith('rappel:')
            if rappel_match:
                title = content[7:].strip()
            elif content.lower().startswith('rappel :'):
                title = content[8:].strip()

            # Categorize based on content keywords
            category = 'action'
            content_lower = content.lower()
            if any(kw in content_lower for kw in ['revoir', 'relire', 'vérifier', 'check']):
                category = 'review'
            elif any(kw in content_lower for kw in ['suivi', 'follow', 'rappeler']):
                category = 'follow_up'
            elif any(kw in content_lower for kw in ['idée', 'réfléchir', 'peut-être']):
                category = 'open_loop'

            # Determine priority
            priority = 'medium'
            if any(kw in content_lower for kw in ['urgent', 'important', '!']):
                priority = 'high'
            elif any(kw in content_lower for kw in ['peut-être', 'un jour', 'si']):
                priority = 'low'

            reminder = {
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'title': title,
                'source': 'inbox',
                'due_date': None,
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
                # Skip invalid reminders
                pass

    return reminders
