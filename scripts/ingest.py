"""
Ingestion module for DailyOS.
Parses raw text entries and JSON inbox files.
"""

import json
import re
import uuid
from datetime import datetime, timezone
from typing import Optional


def parse_raw(text: str, user_id: Optional[str] = None) -> dict:
    """
    Parse a raw text line and detect prefixes to create a RawEntry dict.
    Detects: 'idée:', 'fait:', 'rappel:', 'mood N', 'blocage:'
    Uses regex, no LLM.
    """
    text = text.strip()
    if not text:
        return _make_entry('note', text, user_id)

    now_iso = datetime.now(timezone.utc).isoformat()
    actual_user_id = user_id or str(uuid.uuid4())

    # Pattern: "mood N" at start (e.g., "mood 7", "mood 7.5")
    mood_match = re.match(r'^mood\s+(\d+(?:\.\d+)?)\s*[:\-]?\s*(.*)', text, re.IGNORECASE)
    if mood_match:
        score = float(mood_match.group(1))
        content = mood_match.group(2).strip() or 'Humeur du moment'
        entry = _make_entry('mood', content, actual_user_id, now_iso)
        entry['mood_score'] = min(10.0, max(0.0, score))
        return entry

    # Pattern: "idée:" at start
    idee_match = re.match(r'^idée\s*[:\-]\s*(.*)', text, re.IGNORECASE)
    if idee_match:
        content = idee_match.group(1).strip()
        return _make_entry('idea', content, actual_user_id, now_iso)

    # Pattern: "fait:" at start
    fait_match = re.match(r'^fait\s*[:\-]\s*(.*)', text, re.IGNORECASE)
    if fait_match:
        content = fait_match.group(1).strip()
        return _make_entry('event', content, actual_user_id, now_iso)

    # Pattern: "rappel:" at start
    rappel_match = re.match(r'^rappel\s*[:\-]\s*(.*)', text, re.IGNORECASE)
    if rappel_match:
        content = rappel_match.group(1).strip()
        return _make_entry('reminder', content, actual_user_id, now_iso)

    # Pattern: "blocage:" at start
    blocage_match = re.match(r'^blocage\s*[:\-]\s*(.*)', text, re.IGNORECASE)
    if blocage_match:
        content = blocage_match.group(1).strip()
        return _make_entry('blocker', content, actual_user_id, now_iso)

    # Default: thought
    return _make_entry('thought', text, actual_user_id, now_iso)


def _make_entry(entry_type: str, content: str, user_id: str,
                created_at: Optional[str] = None) -> dict:
    """Create a RawEntry-compatible dict."""
    if created_at is None:
        created_at = datetime.now(timezone.utc).isoformat()

    return {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'type': entry_type,
        'content': content,
        'created_at': created_at,
        'tags': [],
        'mood_score': None,
        'energy_score': None,
        'metadata': {}
    }


def parse_inbox_json(json_file_path: str) -> list[dict]:
    """
    Read a JSON file containing an array of entry dicts.
    Each entry should have at least 'content' and optionally other RawEntry fields.
    Returns a list of RawEntry-compatible dicts.
    """
    with open(json_file_path, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)

    if not isinstance(raw_data, list):
        raise ValueError("JSON file must contain a top-level array")

    entries = []
    now_iso = datetime.now(timezone.utc).isoformat()
    default_user_id = str(uuid.uuid4())

    for item in raw_data:
        if isinstance(item, str):
            # Plain text string — parse it
            entries.append(parse_raw(item))
        elif isinstance(item, dict):
            # Dict — ensure required fields exist
            if 'content' not in item:
                continue
            entry = dict(item)
            entry.setdefault('id', str(uuid.uuid4()))
            entry.setdefault('user_id', default_user_id)
            entry.setdefault('type', 'thought')
            entry.setdefault('created_at', now_iso)
            entry.setdefault('tags', [])
            entry.setdefault('mood_score', None)
            entry.setdefault('energy_score', None)
            entry.setdefault('metadata', {})
            entries.append(entry)

    return entries
