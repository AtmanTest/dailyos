"""
Comprehensive pytest tests for DailyOS backend scripts.
"""

import os
import sys
import json
import uuid
import tempfile
from datetime import datetime, timedelta, timezone

# Ensure scripts directory is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from schemas import RawEntry, DailySummary, Idea, Reminder, WeeklyReview, MonthlyReview, Insight
from ingest import parse_raw, parse_inbox_json
from normalize import deduplicate, validate_entry, extract_reminders
from summarize_day import generate_daily_summary
from reminders import process_reminders, check_due_reminders
from generate_insights import compute_insights
from validate_data import validate_demo_data


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def sample_entry_base():
    return {
        'id': str(uuid.uuid4()),
        'user_id': str(uuid.uuid4()),
        'type': 'thought',
        'content': 'Une belle journée pour apprendre',
        'created_at': '2024-07-17T10:30:00',
        'tags': ['apprentissage', 'quotidien'],
        'mood_score': None,
        'energy_score': None,
        'metadata': {},
    }


@pytest.fixture
def demo_data_dir(tmp_path):
    """Create a temporary directory with demo data files."""
    d = tmp_path / 'demo'
    d.mkdir(parents=True)
    return str(d)


# =============================================================================
# Tests for ingest.py
# =============================================================================

def test_parse_raw_thought():
    """Parse a plain text as a thought entry."""
    result = parse_raw("Aujourd'hui j'ai appris quelque chose de nouveau")
    assert result['type'] == 'thought'
    assert result['content'] == "Aujourd'hui j'ai appris quelque chose de nouveau"
    assert 'id' in result
    assert 'user_id' in result
    assert 'created_at' in result


def test_parse_raw_idea():
    """Parse an 'idée:' prefixed text."""
    result = parse_raw("idée: Créer une application de suivi d'habitudes")
    assert result['type'] == 'idea'
    assert result['content'] == "Créer une application de suivi d'habitudes"


def test_parse_raw_mood():
    """Parse a 'mood N' prefixed text."""
    result = parse_raw("mood 7: journée productive")
    assert result['type'] == 'mood'
    assert result['mood_score'] == 7.0
    assert result['content'] == 'journée productive'


def test_parse_raw_mood_float():
    """Parse 'mood 7.5' with float score."""
    result = parse_raw("mood 7.5")
    assert result['type'] == 'mood'
    assert result['mood_score'] == 7.5


def test_parse_raw_event():
    """Parse a 'fait:' prefixed text."""
    result = parse_raw("fait: Réunion avec l'équipe ce matin")
    assert result['type'] == 'event'
    assert result['content'] == "Réunion avec l'équipe ce matin"


def test_parse_raw_reminder():
    """Parse a 'rappel:' prefixed text."""
    result = parse_raw("rappel: Appeler le docteur demain")
    assert result['type'] == 'reminder'
    assert result['content'] == "Appeler le docteur demain"


def test_parse_raw_blocker():
    """Parse a 'blocage:' prefixed text."""
    result = parse_raw("blocage: API tierce indisponible")
    assert result['type'] == 'blocker'
    assert result['content'] == "API tierce indisponible"


def test_parse_raw_empty():
    """Parse empty string returns a note."""
    result = parse_raw("")
    assert result['type'] == 'note'
    assert result['content'] == ''


def test_parse_raw_whitespace_variations():
    """Test various whitespace around prefixes."""
    r1 = parse_raw("idée : Apprendre Python")
    assert r1['type'] == 'idea'
    assert r1['content'] == 'Apprendre Python'

    r2 = parse_raw("fait:    Cours de yoga")
    assert r2['type'] == 'event'
    assert r2['content'] == 'Cours de yoga'


def test_parse_inbox_json_string_list():
    """Parse a JSON array of strings."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(["idée: Créer un blog", "mood 8: super journée", "texte normal"], f)
        fname = f.name
    try:
        entries = parse_inbox_json(fname)
        assert len(entries) == 3
        assert entries[0]['type'] == 'idea'
        assert entries[1]['type'] == 'mood'
        assert entries[1]['mood_score'] == 8.0
        assert entries[2]['type'] == 'thought'
    finally:
        os.unlink(fname)


def test_parse_inbox_json_dict_list():
    """Parse a JSON array of dicts."""
    now = datetime.now(timezone.utc).isoformat()
    data = [
        {'content': 'Première entrée', 'type': 'thought', 'created_at': now},
        {'content': 'Deuxième entrée', 'type': 'idea', 'created_at': now, 'tags': ['tag1']},
    ]
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(data, f)
        fname = f.name
    try:
        entries = parse_inbox_json(fname)
        assert len(entries) == 2
        assert entries[0]['type'] == 'thought'
        assert entries[1]['type'] == 'idea'
        assert entries[1]['tags'] == ['tag1']
    finally:
        os.unlink(fname)


def test_parse_inbox_json_invalid():
    """Non-array JSON should raise ValueError."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump({"key": "value"}, f)
        fname = f.name
    try:
        with pytest.raises(ValueError):
            parse_inbox_json(fname)
    finally:
        os.unlink(fname)


# =============================================================================
# Tests for normalize.py
# =============================================================================

def test_deduplicate_exact():
    """Remove exact content+type+date duplicates."""
    entries = [
        {'content': 'Hello', 'type': 'thought', 'created_at': '2024-07-17T10:00:00'},
        {'content': 'Hello', 'type': 'thought', 'created_at': '2024-07-17T10:00:00'},
        {'content': 'World', 'type': 'idea', 'created_at': '2024-07-17T11:00:00'},
    ]
    result = deduplicate(entries)
    assert len(result) == 2


def test_deduplicate_no_dupes():
    """No duplicates should return same list."""
    entries = [
        {'content': 'A', 'type': 'thought', 'created_at': '2024-07-17T10:00:00'},
        {'content': 'B', 'type': 'idea', 'created_at': '2024-07-17T11:00:00'},
        {'content': 'C', 'type': 'mood', 'created_at': '2024-07-17T12:00:00'},
    ]
    result = deduplicate(entries)
    assert len(result) == 3


def test_deduplicate_same_content_diff_date():
    """Same content on different dates should not be deduplicated."""
    entries = [
        {'content': 'Hello', 'type': 'thought', 'created_at': '2024-07-17T10:00:00'},
        {'content': 'Hello', 'type': 'thought', 'created_at': '2024-07-18T10:00:00'},
    ]
    result = deduplicate(entries)
    assert len(result) == 2


def test_validate_entry_valid(sample_entry_base):
    """A valid entry should pass validation."""
    valid, errors = validate_entry(sample_entry_base)
    assert valid
    assert errors == []


def test_validate_entry_invalid_type():
    """Invalid type should fail validation."""
    entry = {
        'type': 'invalid_type',
        'content': 'test',
        'created_at': '2024-07-17T10:00:00',
    }
    valid, errors = validate_entry(entry)
    assert not valid
    assert any('Invalid type' in e for e in errors)


def test_validate_entry_invalid_date():
    """Invalid date should fail validation."""
    entry = {
        'type': 'thought',
        'content': 'test',
        'created_at': 'not-a-date',
    }
    valid, errors = validate_entry(entry)
    assert not valid
    assert any('ISO-8601' in e or 'not valid' in e for e in errors)


def test_validate_entry_missing_fields():
    """Missing required fields should fail validation."""
    entry = {'type': 'thought'}
    valid, errors = validate_entry(entry)
    assert not valid
    assert any('Missing required field' in e for e in errors)


def test_validate_entry_mood_out_of_range():
    """Mood score out of range should fail."""
    entry = {
        'type': 'mood',
        'content': 'test',
        'created_at': '2024-07-17T10:00:00',
        'mood_score': 15.0,
    }
    valid, errors = validate_entry(entry)
    assert not valid
    assert any('between 0 and 10' in e for e in errors)


def test_extract_reminders():
    """Extract reminders from entries with type=reminder."""
    entries = [
        {'type': 'reminder', 'content': 'Appeler le docteur', 'user_id': str(uuid.uuid4()),
         'created_at': '2024-07-17T10:00:00'},
        {'type': 'thought', 'content': 'rappel: Vérifier les emails', 'user_id': str(uuid.uuid4()),
         'created_at': '2024-07-17T11:00:00'},
        {'type': 'thought', 'content': 'Belle journée', 'user_id': str(uuid.uuid4()),
         'created_at': '2024-07-17T12:00:00'},
    ]
    reminders = extract_reminders(entries)
    assert len(reminders) == 2
    assert reminders[0]['title'] == 'Appeler le docteur'
    assert reminders[1]['title'] == 'Vérifier les emails'


def test_normalize_edge_cases_html():
    """Entries with HTML in content should be handled."""
    entry = {
        'type': 'note',
        'content': '<p>Bonjour le monde</p>',
        'created_at': '2024-07-17T10:00:00',
    }
    valid, errors = validate_entry(entry)
    assert valid
    assert errors == []


def test_normalize_edge_cases_empty_string():
    """Entries with empty string content."""
    entry = {
        'type': 'thought',
        'content': '',
        'created_at': '2024-07-17T10:00:00',
    }
    valid, errors = validate_entry(entry)
    assert valid
    # Empty content is technically valid for RawEntry schema
    assert errors == []


def test_normalize_edge_cases_very_long_text():
    """Entries with very long text should be handled."""
    long_text = "Mot " * 10000  # ~50K chars
    entry = {
        'type': 'thought',
        'content': long_text,
        'created_at': '2024-07-17T10:00:00',
    }
    valid, errors = validate_entry(entry)
    assert valid


# =============================================================================
# Tests for summarize_day.py
# =============================================================================

def make_entry(content, etype, date_str, mood=None, energy=None, tags=None):
    eid = str(uuid.uuid4())
    return {
        'id': eid,
        'user_id': str(uuid.uuid4()),
        'type': etype,
        'content': content,
        'created_at': f'{date_str}T10:00:00',
        'tags': tags or [],
        'mood_score': mood,
        'energy_score': energy,
        'metadata': {},
    }


def test_generate_daily_summary_empty():
    """Empty entries yield short summary."""
    summary = generate_daily_summary([], '2024-07-17')
    assert summary['date'] == '2024-07-17'
    assert "Peu d'éléments" in summary['summary']
    assert summary['headline'] == 'Aucune entrée'


def test_generate_daily_summary_rich():
    """Rich entries produce a detailed summary."""
    entries = [
        make_entry('Terminé le projet X', 'win', '2024-07-17', mood=8.0, energy=7.0,
                   tags=['victoire', 'priority']),
        make_entry('Idée pour nouvelle feature', 'idea', '2024-07-17', tags=['créativité']),
        make_entry('Réunion avec équipe', 'event', '2024-07-17'),
        make_entry('Bloqué par API', 'blocker', '2024-07-17', tags=['blocage']),
        make_entry('Rappel: appel fournisseur', 'reminder', '2024-07-17'),
    ]
    summary = generate_daily_summary(entries, '2024-07-17')

    assert summary['date'] == '2024-07-17'
    assert summary['mood']['score'] == 8.0
    assert summary['mood']['energy'] == 7.0
    assert len(summary['highlights']) >= 1
    assert 'Terminé le projet X' in summary['highlights']
    assert len(summary['ideas']) == 1
    assert 'Idée pour nouvelle feature' in summary['ideas']
    assert len(summary['actions']['blocked']) == 1
    assert len(summary['reminder_ids']) == 1
    assert len(summary['source_entry_ids']) == 5


def test_deterministic_mock_mode():
    """Mock mode generates realistic data without entries."""
    summary = generate_daily_summary([], '2024-07-17', deterministic_mock_mode=True)
    assert summary['date'] == '2024-07-17'
    assert summary['mood']['score'] > 0
    assert summary['mood']['energy'] > 0
    assert len(summary['highlights']) >= 1
    assert len(summary['ideas']) >= 1
    assert len(summary['tomorrow_focus']) >= 1


def test_generate_daily_summary_mood_average():
    """Multiple mood entries are averaged correctly."""
    entries = [
        make_entry('Matin', 'mood', '2024-07-17', mood=7.0, energy=6.0),
        make_entry('Midi', 'mood', '2024-07-17', mood=5.0, energy=4.0),
        make_entry('Soir', 'mood', '2024-07-17', mood=9.0, energy=8.0),
    ]
    summary = generate_daily_summary(entries, '2024-07-17')
    assert summary['mood']['score'] == 7.0  # (7+5+9)/3=7.0
    assert summary['mood']['energy'] == 6.0  # (6+4+8)/3=6.0


# =============================================================================
# Tests for reminders.py
# =============================================================================

def test_process_reminders():
    """Process entries to extract reminders."""
    entries = [
        make_entry('rappel: Appeler le docteur demain', 'thought', '2024-07-17'),
        make_entry('Réunion importante', 'reminder', '2024-07-17'),
        make_entry('Belle promenade', 'thought', '2024-07-17'),
    ]
    reminders = process_reminders(entries)
    assert len(reminders) == 2
    titles = [r['title'] for r in reminders]
    assert 'Appeler le docteur demain' in titles
    assert 'Réunion importante' in titles


def test_process_reminders_categorization():
    """Reminders should be properly categorized."""
    entries = [
        make_entry('rappel: relire le rapport', 'thought', '2024-07-17'),
        make_entry('rappel: suivre le projet', 'thought', '2024-07-17'),
        make_entry('rappel: penser à une idée', 'thought', '2024-07-17'),
    ]
    reminders = process_reminders(entries)
    assert len(reminders) == 3
    categories = [r['category'] for r in reminders]
    assert 'review' in categories
    assert 'follow_up' in categories or 'action' in categories
    assert 'open_loop' in categories


def test_check_due_reminders():
    """Check for overdue reminders."""
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime('%Y-%m-%d')
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime('%Y-%m-%d')

    user_id = str(uuid.uuid4())
    reminders = [
        {'id': str(uuid.uuid4()), 'user_id': user_id, 'title': 'Overdue',
         'source': 'inbox', 'due_date': yesterday, 'priority': 'high',
         'status': 'active', 'category': 'action', 'created_at': '2024-07-17T10:00:00'},
        {'id': str(uuid.uuid4()), 'user_id': user_id, 'title': 'Due today',
         'source': 'inbox', 'due_date': today, 'priority': 'medium',
         'status': 'active', 'category': 'action', 'created_at': '2024-07-17T10:00:00'},
        {'id': str(uuid.uuid4()), 'user_id': user_id, 'title': 'Future',
         'source': 'inbox', 'due_date': tomorrow, 'priority': 'low',
         'status': 'active', 'category': 'action', 'created_at': '2024-07-17T10:00:00'},
        {'id': str(uuid.uuid4()), 'user_id': user_id, 'title': 'Done',
         'source': 'inbox', 'due_date': yesterday, 'priority': 'low',
         'status': 'done', 'category': 'action', 'created_at': '2024-07-17T10:00:00'},
    ]
    overdue = check_due_reminders(reminders)
    assert len(overdue) == 2
    titles = [r['title'] for r in overdue]
    assert 'Overdue' in titles
    assert 'Due today' in titles
    assert 'Future' not in titles
    assert 'Done' not in titles


# =============================================================================
# Tests for generate_insights.py
# =============================================================================

def make_summary(date_str, mood_score, energy, stress=0, clarity=0, satisfaction=0,
                 completed=None, ideas=None, blocked=None):
    return {
        'date': date_str,
        'headline': 'Test',
        'summary': 'Test summary',
        'mood': {
            'score': mood_score, 'energy': energy, 'stress': stress,
            'clarity': clarity, 'satisfaction': satisfaction, 'tags': []
        },
        'highlights': [],
        'actions': {
            'completed': completed or [],
            'in_progress': [],
            'blocked': blocked or [],
        },
        'ideas': ideas or [],
        'events': [],
        'lessons': [],
        'tomorrow_focus': [],
        'reminder_ids': [],
        'source_entry_ids': [],
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'model_metadata': {'provider': 'local', 'model': 'deterministic', 'prompt_version': '1.0'}
    }


def test_compute_insights_7days():
    """Compute insights over 7 days."""
    today = datetime.now(timezone.utc)
    summaries = []
    for i in range(7):
        d = (today - timedelta(days=6-i)).strftime('%Y-%m-%d')
        summaries.append(make_summary(
            d, mood_score=6.0 + (i % 3), energy=5.0 + (i % 2),
            completed=[f"Action {i}"] if i % 2 == 0 else [],
            ideas=[f"Idea {i}"] if i % 3 == 0 else [],
        ))

    insights = compute_insights(summaries, days=7)
    assert len(insights) >= 2  # At least metrics_overview and productivity
    types = [i['type'] for i in insights]
    assert 'metrics_overview' in types
    assert 'productivity' in types


def test_compute_insights_empty():
    """Empty summaries produce empty insights."""
    insights = compute_insights([], days=7)
    assert insights == []


def test_deterministic_mock_mode_insights():
    """Mock mode generates insights without real data."""
    today = datetime.now(timezone.utc)
    summaries = []
    for i in range(7):
        d = (today - timedelta(days=6-i)).strftime('%Y-%m-%d')
        summaries.append(make_summary(d, mood_score=6.0, energy=5.0))
    insights = compute_insights(summaries, days=7, deterministic_mock_mode=True)
    assert len(insights) == 5  # Always 5 mock insights


# =============================================================================
# Tests for validate_data.py
# =============================================================================

def test_validate_demo_data(tmp_path):
    """Validate demo data files."""
    # Create temporary demo data
    demo_dir = tmp_path / 'demo'
    demo_dir.mkdir()

    user_id = str(uuid.uuid4())

    # Minimal valid data
    entries = [{
        'id': str(uuid.uuid4()), 'user_id': user_id, 'type': 'thought',
        'content': 'Test', 'created_at': '2024-07-17T10:00:00',
        'tags': [], 'mood_score': None, 'energy_score': None, 'metadata': {}
    }]
    with open(demo_dir / 'raw_entries.json', 'w') as f:
        json.dump(entries, f)

    summary = {
        'date': '2024-07-17', 'headline': 'Test', 'summary': 'Test',
        'mood': {'score': 5.0, 'energy': 5.0, 'stress': 5.0, 'clarity': 5.0, 'satisfaction': 5.0, 'tags': []},
        'highlights': [], 'actions': {'completed': [], 'in_progress': [], 'blocked': []},
        'ideas': [], 'events': [], 'lessons': [], 'tomorrow_focus': [],
        'reminder_ids': [], 'source_entry_ids': [],
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'model_metadata': {'provider': 'local', 'model': 'deterministic', 'prompt_version': '1.0'}
    }
    with open(demo_dir / 'daily_summaries.json', 'w') as f:
        json.dump([summary], f)

    idea = {
        'id': str(uuid.uuid4()), 'user_id': user_id,
        'content': 'Test idea', 'created_at': '2024-07-17T10:00:00',
        'tags': [], 'theme': None, 'potential': None, 'status': 'inbox',
        'next_action': None, 'review_date': None
    }
    with open(demo_dir / 'ideas.json', 'w') as f:
        json.dump([idea], f)

    reminder = {
        'id': str(uuid.uuid4()), 'user_id': user_id, 'title': 'Test',
        'source': 'inbox', 'due_date': None, 'priority': 'medium',
        'status': 'active', 'category': 'action', 'created_at': '2024-07-17T10:00:00'
    }
    with open(demo_dir / 'reminders.json', 'w') as f:
        json.dump([reminder], f)

    insight = {
        'type': 'observation', 'observation': 'Test observation',
        'hypothesis': None, 'confidence': None,
        'source_entry_ids': [], 'period_start': '2024-07-10', 'period_end': '2024-07-17'
    }
    with open(demo_dir / 'insights.json', 'w') as f:
        json.dump([insight], f)

    results = validate_demo_data(str(demo_dir))
    assert results['raw_entries.json']['pass']
    assert results['daily_summaries.json']['pass']
    assert results['ideas.json']['pass']
    assert results['reminders.json']['pass']
    assert results['insights.json']['pass']
    assert results['overall_pass']


def test_validate_demo_data_missing_file(tmp_path):
    """Missing file should fail validation."""
    demo_dir = tmp_path / 'demo'
    demo_dir.mkdir()
    # Only create one file
    with open(demo_dir / 'raw_entries.json', 'w') as f:
        json.dump([], f)

    results = validate_demo_data(str(demo_dir))
    assert not results['overall_pass']
    assert any(not v['pass'] for k, v in results.items() if isinstance(v, dict) and k != 'overall_pass')


# =============================================================================
# Tests for schemas.py - Pydantic validation
# =============================================================================

def test_schemas_raw_entry_valid():
    """RawEntry with all fields validates."""
    entry = RawEntry(
        type='thought',
        content='Test content',
        created_at='2024-07-17T10:30:00',
    )
    assert entry.type == 'thought'
    assert entry.content == 'Test content'
    assert isinstance(entry.id, uuid.UUID)


def test_schemas_raw_entry_invalid_type():
    """RawEntry with invalid type raises."""
    with pytest.raises(ValueError):
        RawEntry(type='invalid', content='test', created_at='2024-07-17T10:00:00')


def test_schemas_daily_summary_valid():
    """DailySummary with all fields validates."""
    summary = DailySummary(
        date='2024-07-17',
        summary='Test',
        generated_at='2024-07-17T20:00:00',
    )
    assert summary.date == '2024-07-17'
    assert summary.headline == ''  # default
    assert summary.mood['score'] == 0.0  # default


def test_schemas_idea_valid():
    """Idea with all fields validates."""
    idea = Idea(
        content='Test idea',
        created_at='2024-07-17T10:00:00',
        status='active',
        potential=7,
    )
    assert idea.status == 'active'
    assert idea.potential == 7


def test_schemas_reminder_valid():
    """Reminder with all fields validates."""
    reminder = Reminder(
        title='Test reminder',
        created_at='2024-07-17T10:00:00',
        priority='high',
        category='action',
    )
    assert reminder.status == 'active'  # default


def test_schemas_insight_valid():
    """Insight with all fields validates."""
    insight = Insight(
        type='observation',
        observation='Test',
        period_start='2024-07-10',
        period_end='2024-07-17',
    )
    assert insight.type == 'observation'


def test_schemas_weekly_review():
    """WeeklyReview validates."""
    review = WeeklyReview(
        week_start='2024-07-08',
        week_end='2024-07-14',
        generated_at='2024-07-14T20:00:00',
    )
    assert review.week_start == '2024-07-08'


def test_schemas_monthly_review():
    """MonthlyReview validates."""
    review = MonthlyReview(
        month='2024-07',
        year=2024,
        generated_at='2024-07-31T20:00:00',
    )
    assert review.month == '2024-07'


# =============================================================================
# Integration test - run all modules together
# =============================================================================

def test_integration_full_pipeline():
    """Test the full pipeline from parsing to insights."""
    # Step 1: Parse raw text
    raw_texts = [
        "idée: Créer un tracker d'habitudes",
        "mood 8: super productive aujourd'hui",
        "fait: Réunion d'équipe",
        "rappel: Vérifier les mails ce soir",
        "Terminé le dossier important !",
        "blocage: Problème de connexion",
    ]
    entries = [parse_raw(t) for t in raw_texts]
    assert len(entries) == 6

    # Step 2: Deduplicate
    deduped = deduplicate(entries)
    assert len(deduped) == 6  # No duplicates

    # Step 3: Validate all
    for e in deduped:
        valid, errors = validate_entry(e)
        assert valid, f"Entry {e['content']} failed: {errors}"

    # Step 4: Generate daily summary
    summary = generate_daily_summary(deduped, datetime.now(timezone.utc).strftime('%Y-%m-%d'))
    assert 'idée' in summary['headline'].lower() or 'humeur' in summary['headline'].lower() or \
           'mood' in summary['mood'].get('tags', []) or summary['mood']['score'] == 8.0
    assert len(summary['ideas']) >= 1
    assert summary['mood']['score'] == 8.0

    # Step 5: Process reminders
    reminders = process_reminders(deduped)
    assert len(reminders) >= 1

    # Step 6: Check due reminders
    overdue = check_due_reminders(reminders)
    assert isinstance(overdue, list)

    # Step 7: Compute insights
    insights = compute_insights([summary], days=7)
    assert len(insights) >= 2
