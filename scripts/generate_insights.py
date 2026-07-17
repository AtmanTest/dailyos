"""
Insights generation module for DailyOS.
Computes metrics and detects simple patterns from daily summaries.
"""

import hashlib
from datetime import datetime, timezone
from typing import Optional


def compute_insights(summaries: list[dict], days: int = 7,
                     deterministic_mock_mode: bool = False) -> list[dict]:
    """
    Compute insights from a list of DailySummary dicts.

    Args:
        summaries: List of DailySummary dicts
        days: Period to analyze (7, 30, or 90)
        deterministic_mock_mode: If True, generates realistic mock data without LLM

    Returns:
        List of Insight dicts
    """
    if not summaries:
        return []

    if deterministic_mock_mode:
        return _generate_mock_insights(summaries, days)

    # Filter summaries to the requested period
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    from datetime import timedelta
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime('%Y-%m-%d')

    filtered = [s for s in summaries if s.get('date', '') >= start_date and s.get('date', '') <= today]

    if not filtered:
        return []

    insights = []

    # Compute average metrics
    mood_scores = [s.get('mood', {}).get('score', 0) for s in filtered]
    energy_scores = [s.get('mood', {}).get('energy', 0) for s in filtered]
    stress_scores = [s.get('mood', {}).get('stress', 0) for s in filtered]
    clarity_scores = [s.get('mood', {}).get('clarity', 0) for s in filtered]
    satisfaction_scores = [s.get('mood', {}).get('satisfaction', 0) for s in filtered]

    avg_mood = round(sum(mood_scores) / len(mood_scores), 2) if mood_scores else 0.0
    avg_energy = round(sum(energy_scores) / len(energy_scores), 2) if energy_scores else 0.0
    avg_stress = round(sum(stress_scores) / len(stress_scores), 2) if stress_scores else 0.0
    avg_clarity = round(sum(clarity_scores) / len(clarity_scores), 2) if clarity_scores else 0.0
    avg_satisfaction = round(sum(satisfaction_scores) / len(satisfaction_scores), 2) if satisfaction_scores else 0.0

    # Count actions, ideas, blockers
    total_completed = sum(len(s.get('actions', {}).get('completed', [])) for s in filtered)
    total_ideas = sum(len(s.get('ideas', [])) for s in filtered)
    total_blockers = sum(len(s.get('actions', {}).get('blocked', [])) for s in filtered)
    total_events = sum(len(s.get('events', [])) for s in filtered)
    total_highlights = sum(len(s.get('highlights', [])) for s in filtered)

    period_start = filtered[0]['date'] if filtered else start_date
    period_end = filtered[-1]['date'] if filtered else today

    # Insight 1: Average metrics overview
    source_ids = [s.get('date', '') for s in filtered]
    insights.append({
        'type': 'metrics_overview',
        'observation': (
            f"Sur les {len(filtered)} derniers jours, humeur moyenne à {avg_mood}/10, "
            f"énergie à {avg_energy}/10, clarté à {avg_clarity}/10, "
            f"satisfaction à {avg_satisfaction}/10, stress à {avg_stress}/10."
        ),
        'hypothesis': None,
        'confidence': 'high',
        'source_entry_ids': source_ids,
        'period_start': period_start,
        'period_end': period_end
    })

    # Insight 2: Productivity
    insights.append({
        'type': 'productivity',
        'observation': (
            f"{total_completed} actions complétées, {total_ideas} idées capturées, "
            f"{total_blockers} blocages identifiés sur la période."
        ),
        'hypothesis': None,
        'confidence': 'high',
        'source_entry_ids': source_ids,
        'period_start': period_start,
        'period_end': period_end
    })

    # Insight 3: Pattern detection - higher energy on days with more completed actions
    if len(filtered) >= 3:
        high_action_days = [s for s in filtered if len(s.get('actions', {}).get('completed', [])) > 0]
        low_action_days = [s for s in filtered if len(s.get('actions', {}).get('completed', [])) == 0]

        if high_action_days and low_action_days:
            high_energy = [s.get('mood', {}).get('energy', 0) for s in high_action_days]
            low_energy = [s.get('mood', {}).get('energy', 0) for s in low_action_days]
            avg_high = sum(high_energy) / len(high_energy)
            avg_low = sum(low_energy) / len(low_energy)

            diff = avg_high - avg_low
            if abs(diff) > 0.3:
                direction = "plus élevée" if diff > 0 else "plus basse"
                insights.append({
                    'type': 'pattern',
                    'observation': (
                        f"L'énergie moyenne est {direction} ({abs(diff):.1f} point) "
                        f"les jours avec des actions complétées ({avg_high:.1f}) "
                        f"vs sans ({avg_low:.1f})."
                    ),
                    'hypothesis': 'L\'accomplissement de tâches peut influencer positivement le niveau d\'énergie perçue.',
                    'confidence': 'moderate',
                    'source_entry_ids': source_ids,
                    'period_start': period_start,
                    'period_end': period_end
                })

    # Insight 4: Mood vs ideas captured
    idea_days = [s for s in filtered if len(s.get('ideas', [])) > 0]
    no_idea_days = [s for s in filtered if len(s.get('ideas', [])) == 0]
    if idea_days and no_idea_days:
        idea_moods = [s.get('mood', {}).get('score', 0) for s in idea_days]
        no_idea_moods = [s.get('mood', {}).get('score', 0) for s in no_idea_days]
        avg_idea_mood = sum(idea_moods) / len(idea_moods)
        avg_no_idea_mood = sum(no_idea_moods) / len(no_idea_moods)
        if abs(avg_idea_mood - avg_no_idea_mood) > 0.3:
            insights.append({
                'type': 'pattern',
                'observation': (
                    f"Humeur {'plus élevée' if avg_idea_mood > avg_no_idea_mood else 'plus basse'} "
                    f"les jours avec des idées ({avg_idea_mood:.1f}) vs sans ({avg_no_idea_mood:.1f})."
                ),
                'hypothesis': 'La capture d\'idées est corrélée à l\'état d\'esprit général.',
                'confidence': 'moderate',
                'source_entry_ids': source_ids,
                'period_start': period_start,
                'period_end': period_end
            })

    # Insight 5: Highlight density
    if total_highlights > 0:
        highlights_per_day = round(total_highlights / len(filtered), 1)
        insights.append({
            'type': 'observation',
            'observation': (
                f"En moyenne {highlights_per_day} moment(s) marquant(s) par jour identifié(s)."
            ),
            'hypothesis': 'Noter les moments positifs peut renforcer la mémoire des bons souvenirs.',
            'confidence': 'low',
            'source_entry_ids': source_ids,
            'period_start': period_start,
            'period_end': period_end
        })

    return insights


def _generate_mock_insights(summaries: list[dict], days: int) -> list[dict]:
    """Generate realistic mock insights for demo purposes."""
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    from datetime import timedelta
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime('%Y-%m-%d')

    filtered = [s for s in summaries if s.get('date', '') >= start_date and s.get('date', '') <= today]
    if not filtered:
        filtered = summaries[-min(days, len(summaries)):] if summaries else []

    if not filtered:
        return []

    period_start = filtered[0]['date'] if filtered else start_date
    period_end = filtered[-1]['date'] if filtered else today
    source_ids = [s.get('date', '') for s in filtered]

    # Use hash for deterministic variation
    seed = hashlib.md5(str(days).encode()).hexdigest()
    h = int(seed, 16)

    return [
        {
            'type': 'metrics_overview',
            'observation': (
                f"Analyse sur {len(filtered)} jours : humeur moyenne à "
                f"{round(5.5 + (h % 20) / 20.0, 1)}/10, énergie à "
                f"{round(5.0 + ((h // 10) % 20) / 20.0, 1)}/10."
            ),
            'hypothesis': None,
            'confidence': 'high',
            'source_entry_ids': source_ids,
            'period_start': period_start,
            'period_end': period_end
        },
        {
            'type': 'productivity',
            'observation': (
                f"{10 + (h % 15)} actions complétées, {5 + (h % 10)} idées "
                f"capturées sur la période."
            ),
            'hypothesis': None,
            'confidence': 'high',
            'source_entry_ids': source_ids,
            'period_start': period_start,
            'period_end': period_end
        },
        {
            'type': 'pattern',
            'observation': (
                "Tendance observée : les jours avec plus d'actions complétées "
                "montrent un niveau d'énergie légèrement plus élevé."
            ),
            'hypothesis': 'L\'accomplissement de tâches peut influencer positivement le niveau d\'énergie perçue.',
            'confidence': 'moderate',
            'source_entry_ids': source_ids,
            'period_start': period_start,
            'period_end': period_end
        },
        {
            'type': 'pattern',
            'observation': (
                "Les jours avec des idées notées ont une humeur "
                "légèrement supérieure à la moyenne."
            ),
            'hypothesis': 'La capture d\'idées est corrélée à un état d\'esprit plus créatif.',
            'confidence': 'moderate',
            'source_entry_ids': source_ids,
            'period_start': period_start,
            'period_end': period_end
        },
        {
            'type': 'observation',
            'observation': (
                f"{round(1.5 + (h % 10) / 10.0, 1)} moment(s) marquant(s) "
                f"identifié(s) en moyenne par jour."
            ),
            'hypothesis': 'Noter les moments positifs peut aider à maintenir une perspective équilibrée.',
            'confidence': 'low',
            'source_entry_ids': source_ids,
            'period_start': period_start,
            'period_end': period_end
        }
    ]
