"""
Daily summary generation for DailyOS.
Pure deterministic logic — no LLM calls.
"""

import re
from collections import Counter
from datetime import datetime, timezone
from typing import Optional


def generate_daily_summary(entries: list[dict], date: str,
                           deterministic_mock_mode: bool = False) -> dict:
    """
    Generate a DailySummary dict from a list of RawEntry dicts for a specific date.

    Args:
        entries: List of RawEntry dicts for the given date
        date: Date string in YYYY-MM-DD format
        deterministic_mock_mode: If True, generates realistic mock data without LLM

    Returns:
        DailySummary dict with all fields populated
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    if not entries and not deterministic_mock_mode:
        return _empty_summary(date, now_iso)

    if deterministic_mock_mode and not entries:
        return _mock_summary(date, now_iso)

    # Compute average mood and energy
    mood_scores = [e.get('mood_score') for e in entries if e.get('mood_score') is not None]
    energy_scores = [e.get('energy_score') for e in entries if e.get('energy_score') is not None]

    avg_mood = round(sum(mood_scores) / len(mood_scores), 1) if mood_scores else 0.0
    avg_energy = round(sum(energy_scores) / len(energy_scores), 1) if energy_scores else 0.0

    # Group by type
    grouped = _group_by_type(entries)

    # Generate headline from word frequency
    headline = _generate_headline(entries)

    # Build summary
    summary_parts = []
    total = len(entries)
    summary_parts.append(f"{total} élément{'s' if total > 1 else ''} capturé{'s' if total > 1 else ''} aujourd'hui.")

    type_counts = {t: len(items) for t, items in grouped.items()}
    if type_counts:
        type_summary = ', '.join(f"{n} {t}" for t, n in sorted(type_counts.items(), key=lambda x: -x[1]))
        summary_parts.append(f"Répartition : {type_summary}.")

    if mood_scores:
        summary_parts.append(f"Humeur moyenne : {avg_mood}/10.")
    if energy_scores:
        summary_parts.append(f"Énergie moyenne : {avg_energy}/10.")

    if grouped.get('win'):
        summary_parts.append(f"{len(grouped['win'])} victoire{'s' if len(grouped['win']) > 1 else ''} aujourd'hui.")
    if grouped.get('blocker'):
        summary_parts.append(f"{len(grouped['blocker'])} blocage{'s' if len(grouped['blocker']) > 1 else ''} identifié{'s' if len(grouped['blocker']) > 1 else ''}.")

    summary = ' '.join(summary_parts)

    # Highlights from wins and events
    highlights = []
    for entry_type in ['win', 'event']:
        for e in grouped.get(entry_type, []):
            highlights.append(e.get('content', ''))

    # Actions
    completed_actions = [e.get('content', '') for e in grouped.get('action', [])]
    in_progress_actions = []
    blocked_actions = [e.get('content', '') for e in grouped.get('blocker', [])]

    # Ideas
    ideas = [e.get('content', '') for e in grouped.get('idea', [])]

    # Events
    events = [e.get('content', '') for e in grouped.get('event', [])]

    # Lessons — tagged 'lesson' or 'leçon'
    lessons = []
    for e in entries:
        tags = e.get('tags', [])
        if 'lesson' in tags or 'leçon' in tags:
            lessons.append(e.get('content', ''))

    # Tomorrow focus from entries tagged 'priority'
    tomorrow_focus = []
    for e in entries:
        tags = e.get('tags', [])
        if 'priority' in tags or 'priorité' in tags or 'important' in tags:
            tomorrow_focus.append(e.get('content', ''))

    # Source entry IDs
    source_entry_ids = [str(e.get('id', '')) for e in entries if e.get('id')]

    # Reminder IDs
    reminder_ids = [str(e.get('id', '')) for e in grouped.get('reminder', []) if e.get('id')]

    # Mood dict
    mood_dict = {
        'score': avg_mood,
        'energy': avg_energy,
        'stress': round(10 - avg_mood, 1) if avg_mood > 0 else 0.0,
        'clarity': round(min(10, avg_mood + 1), 1) if avg_mood > 0 else 0.0,
        'satisfaction': round(min(10, avg_energy + 0.5), 1) if avg_energy > 0 else 0.0,
        'tags': []
    }

    return {
        'date': date,
        'headline': headline,
        'summary': summary,
        'mood': mood_dict,
        'highlights': highlights,
        'actions': {
            'completed': completed_actions,
            'in_progress': in_progress_actions,
            'blocked': blocked_actions
        },
        'ideas': ideas,
        'events': events,
        'lessons': lessons,
        'tomorrow_focus': tomorrow_focus,
        'reminder_ids': reminder_ids,
        'source_entry_ids': source_entry_ids,
        'generated_at': now_iso,
        'model_metadata': {
            'provider': 'local',
            'model': 'deterministic',
            'prompt_version': '1.0'
        }
    }


def _group_by_type(entries: list[dict]) -> dict[str, list[dict]]:
    """Group entries by their type field."""
    grouped = {}
    for e in entries:
        t = e.get('type', 'note')
        if t not in grouped:
            grouped[t] = []
        grouped[t].append(e)
    return grouped


def _generate_headline(entries: list[dict]) -> str:
    """
    Generate a headline from the most common theme using simple word frequency.
    """
    # Collect all content words (French stop words removed)
    stop_words = {
        'le', 'la', 'les', 'des', 'de', 'du', 'un', 'une', 'et', 'est', 'sont',
        'a', 'à', 'dans', 'pour', 'sur', 'avec', 'par', 'que', 'qui', 'ne',
        'pas', 'plus', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
        'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'ce', 'cet', 'cette',
        'ces', 'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
        'me', 'te', 'se', 'nous', 'vous', 'se', 'en', 'y', 'au', 'aux', 'du',
        'ou', 'où', 'mais', 'donc', 'car', 'ni', 'or', 'si', 'comme', 'lui',
        'elle', 'eux', 'elles', 'moi', 'toi', 'soi', 'nous', 'vous', 'eux',
        'c\'', 'd\'', 'l\'', 'm\'', 'n\'', 's\'', 't\'', 'qu\'', 'j\'',
        'ai', 'as', 'avons', 'avez', 'ont', 'suis', 'es', 'est', 'sommes',
        'êtes', 'sont', 'fait', 'faire', 'vais', 'vas', 'va', 'allons',
        'allez', 'vont', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent',
        'veux', 'veut', 'voulons', 'voulez', 'veulent', 'dois', 'doit',
        'devons', 'devez', 'doivent'
    }

    words = []
    for e in entries:
        content = e.get('content', '')
        # Lowercase and split on non-alpha
        raw_words = re.findall(r'[a-zàâçéèêëîïôûùüÿœ]+', content.lower())
        for w in raw_words:
            if w not in stop_words and len(w) > 2:
                words.append(w)

    if not words:
        return "Journal du jour"

    counter = Counter(words)
    most_common = counter.most_common(3)

    if most_common:
        top_word = most_common[0][0].capitalize()
        if len(most_common) > 1:
            second_word = most_common[1][0]
            return f"{top_word} et {second_word}"
        return f"Focus sur {top_word}"

    return "Journal du jour"


def _empty_summary(date: str, now_iso: str) -> dict:
    """Return a short summary when no entries exist."""
    return {
        'date': date,
        'headline': 'Aucune entrée',
        'summary': "Peu d'éléments capturés aujourd'hui",
        'mood': {'score': 0.0, 'energy': 0.0, 'stress': 0.0, 'clarity': 0.0, 'satisfaction': 0.0, 'tags': []},
        'highlights': [],
        'actions': {'completed': [], 'in_progress': [], 'blocked': []},
        'ideas': [],
        'events': [],
        'lessons': [],
        'tomorrow_focus': [],
        'reminder_ids': [],
        'source_entry_ids': [],
        'generated_at': now_iso,
        'model_metadata': {'provider': 'local', 'model': 'deterministic', 'prompt_version': '1.0'}
    }


def _mock_summary(date: str, now_iso: str) -> dict:
    """Generate a realistic-looking mock DailySummary."""
    import hashlib
    # Use date hash for deterministic but varied output
    h = int(hashlib.md5(date.encode()).hexdigest(), 16)
    mood_score = round(3.0 + (h % 70) / 10.0, 1)
    energy_score = round(2.0 + ((h // 100) % 80) / 10.0, 1)

    mock_headlines = [
        "Créativité et exploration", "Productivité en progrès",
        "Réflexions personnelles", "Projets et découvertes",
        "Organisation et planification", "Créativité et idées",
        "Travail et apprentissage", "Moments de pause",
        "Échanges et collaborations", "Routine du quotidien"
    ]
    headline = mock_headlines[h % len(mock_headlines)]

    mock_summaries = [
        f"Journée productive avec {5 + (h % 6)} éléments capturés. "
        f"Humeur : {mood_score}/10, Énergie : {energy_score}/10.",
        f"{4 + (h % 5)} entrées aujourd'hui. Plusieurs idées et réflexions notées.",
        f"Journée équilibrée. {3 + (h % 7)} entrées couvrant travail et vie personnelle."
    ]
    summary = mock_summaries[h % len(mock_summaries)]

    mock_highlights = [
        "Avancée significative sur un projet",
        "Belle conversation avec un collègue",
        "Moment de lecture enrichissant",
        "Nouvelle idée prometteuse",
        "Tâche importante terminée"
    ]
    highlights = [mock_highlights[(h + i) % len(mock_highlights)] for i in range(min(2, 1 + (h % 3)))]

    mock_focus = [
        "Finaliser le rapport hebdomadaire",
        "Préparer la réunion de demain",
        "Continuer la lecture en cours",
        "Planifier la semaine prochaine",
        "Répondre aux emails en attente"
    ]
    tomorrow_focus = [mock_focus[h % len(mock_focus)]]

    mock_ideas = [
        "Automatiser la génération de rapports",
        "Créer un tableau de bord personnel",
        "Organiser un atelier d'équipe"
    ]
    ideas = [mock_ideas[(h + i) % len(mock_ideas)] for i in range(min(2, 1 + (h % 2)))]

    mock_events = [
        "Réunion d'équipe matinale",
        "Appel client important",
        "Atelier de réflexion"
    ]
    events = [mock_events[h % len(mock_events)]] if h % 2 == 0 else []

    mock_lessons = [
        "Prendre des pauses régulières améliore la concentration",
        "Communiquer tôt évite les malentendus",
        "Célébrer les petites victoires maintient la motivation"
    ]
    lessons = [mock_lessons[h % len(mock_lessons)]] if h % 3 == 0 else []

    mock_actions = ["Réviser le planning", "Mettre à jour le document", "Envoyer le rapport"]
    num_completed = h % 4
    completed_actions = mock_actions[:num_completed]

    return {
        'date': date,
        'headline': headline,
        'summary': summary,
        'mood': {
            'score': mood_score,
            'energy': energy_score,
            'stress': round(10 - mood_score, 1),
            'clarity': round(min(10, mood_score + 1), 1),
            'satisfaction': round(min(10, energy_score + 0.5), 1),
            'tags': []
        },
        'highlights': highlights,
        'actions': {
            'completed': completed_actions,
            'in_progress': [],
            'blocked': []
        },
        'ideas': ideas,
        'events': events,
        'lessons': lessons,
        'tomorrow_focus': tomorrow_focus,
        'reminder_ids': [],
        'source_entry_ids': [],
        'generated_at': now_iso,
        'model_metadata': {
            'provider': 'local',
            'model': 'deterministic',
            'prompt_version': '1.0'
        }
    }
