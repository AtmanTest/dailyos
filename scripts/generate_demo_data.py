"""
Demo data generator for DailyOS.
Creates 30 days of realistic mock data in French.
"""

import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

# Make scripts directory importable
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from schemas import RawEntry, DailySummary, Idea, Reminder, Insight


# Realistic French content pools
THOUGHTS = [
    "Belle journée ensoleillée, j'aimerais en profiter plus souvent.",
    "Je me demande si je devrais changer ma routine matinale.",
    "Penser à appeler maman pour son anniversaire.",
    "Content de la façon dont la réunion s'est déroulée.",
    "Besoin de plus de temps pour lire mes livres.",
    "Le trafic était particulièrement dense ce matin.",
    "J'apprécie vraiment ce nouveau café près du bureau.",
    "Devrais-je commencer un nouveau sport ?",
    "La météo est parfaite pour une promenade ce soir.",
    "Repenser à ce podcast fascinant sur la productivité.",
    "Content d'avoir repris le dessin après si longtemps.",
    "Me demander si je ne devrais pas revoir mon organisation.",
    "Belle conversation avec Sophie sur nos projets.",
    "Je dois vraiment apprendre à mieux gérer mon temps.",
    "Ce nouveau restaurant mérite une deuxième visite.",
    "Réfléchir à l'équilibre entre vie pro et perso.",
    "Content de voir mes progrès en méditation.",
    "La lecture du soir devient une habitude agréable.",
    "J'aimerais voyager plus cette année.",
    "Penser à mes objectifs pour le prochain trimestre.",
]

IDEAS_CONTENT = [
    "Créer un blog personnel sur la productivité",
    "Développer une application de suivi d'habitudes",
    "Organiser un cercle de lecture mensuel",
    "Lancer un podcast sur l'organisation personnelle",
    "Créer un jardin potager sur le balcon",
    "Écrire un guide de survie pour le télétravail",
    "Mettre en place un système de gestion des tâches family",
    "Développer un jeu de société sur la gestion du temps",
    "Créer un groupe de course à pied dans le quartier",
    "Écrire un roman court pendant le NaNoWriMo",
    "Créer une newsletter sur les outils de productivité",
    "Organiser des ateliers de gestion du stress",
    "Développer un template Notion pour la planification",
    "Créer un compte Instagram sur le minimalisme",
    "Écrire un recueil de poésie inspirée du quotidien",
]

ACTIONS = [
    "Rédiger le rapport mensuel",
    "Mettre à jour le tableau de bord",
    "Finaliser la présentation client",
    "Relire et corriger le document technique",
    "Envoyer les emails en attente",
    "Compléter le formulaire administratif",
    "Préparer l'ordre du jour de la réunion",
    "Mettre à jour le CV",
    "Organiser les fichiers du projet",
    "Vérifier les comptes du mois",
    "Planifier les rendez-vous de la semaine",
    "Mettre à jour le site web",
    "Rédiger les notes de release",
    "Faire le point sur les objectifs trimestriels",
    "Nettoyer la boîte mail",
]

EVENTS = [
    "Réunion d'équipe hebdomadaire",
    "Appel avec le client Martin",
    "Déjeuner avec l'équipe",
    "Atelier de formation sur les nouveaux outils",
    "Présentation des résultats du mois",
    "Café virtuel avec les collègues",
    "Séance de brainstorming créatif",
    "Point hebdomadaire avec le manager",
    "Webinaire sur la gestion du temps",
    "Rencontre networking après-midi",
    "Formation continue en ligne",
    "Démo produit avec l'équipe technique",
    "Réunion de planification stratégique",
    "Afterwork avec l'équipe",
    "Session de feedback trimestriel",
]

WINS = [
    "Terminé le gros projet en avance !",
    "Retour très positif du client sur le livrable",
    "Réussi à méditer 20 minutes sans interruption",
    "Lu 50 pages de mon livre ce soir",
    "Finalisé la configuration tant attendue",
    "Obtenu une reconnaissance de l'équipe",
    "Résolu un problème technique complexe",
    "Atteint mon objectif de pas aujourd'hui",
    "Aidé un collègue à débloquer un problème",
    "Reçu des compliments sur ma présentation",
    "Publié mon premier article de blog",
    "Terminé le mois avec tous les objectifs atteints",
    "Réussi à me lever à 6h pendant une semaine",
    "Dépassé mes objectifs de vente",
    "Appris une nouvelle compétence utile",
]

BLOCKERS = [
    "Problème de connexion internet récurrent",
    "Attente de validation de la direction",
    "API tierce indisponible depuis ce matin",
    "Manque d'information pour avancer sur le dossier",
    "Conflit de planning avec une autre réunion",
    "Retard dans la livraison d'un fournisseur",
    "Difficulté à joindre l'interlocuteur clé",
    "Bug non résolu dans l'environnement de test",
    "Chevauchement des priorités projet",
    "Absence d'un membre clé de l'équipe",
]

MOOD_NOTES = [
    "Journée productive malgré un début difficile",
    "Sentiment de fatigue en fin d'après-midi",
    "Très motivé après la réunion inspirante",
    "Un peu stressé par les délais serrés",
    "Calme et serein, journée équilibrée",
    "Énergique et créatif aujourd'hui",
    "Un peu frustré par les contretemps",
    "Content, grosse avancée sur le projet",
    "Fatigué mais satisfait du travail accompli",
    "Serein, bonne journée dans l'ensemble",
]

REMINDER_TITLES = [
    "Appeler le service informatique",
    "Relire le contrat avant signature",
    "Vérifier les disponibilités pour la réunion",
    "Commander les fournitures de bureau",
    "Suivre la candidature du nouveau stagiaire",
    "Mettre à jour le mot de passe du serveur",
    "Planifier la prochaine réunion d'équipe",
    "Vérifier les statistiques du mois",
    "Penser à renouveler l'abonnement logiciel",
    "Faire le suivi des tickets en attente",
]

NOTES = [
    "Pistes pour améliorer le processus de déploiement",
    "Références utiles pour le projet en cours",
    "Notes de la réunion : décisions et actions",
    "Liste de courses pour la semaine",
    "Idées de lecture pour le mois prochain",
    "Contacts importants échangés aujourd'hui",
    "Questions à poser lors du prochain point",
    "Rappel : vérifier les mises à jour de sécurité",
    "Recommandations de livres sur le leadership",
    "Observations sur les nouvelles pratiques agiles",
]

TAGS_POOL = [
    "travail", "personnel", "santé", "projet", "créativité",
    "organisation", "social", "apprentissage", "routine", "objectifs",
    "priority", "important", "suivi", "réflexion", "lecture",
    "fitness", "famille", "finance", "carrière", "bien-être",
]


def _date_str(d: datetime) -> str:
    return d.strftime('%Y-%m-%d')


def _iso_str(d: datetime) -> str:
    return d.isoformat()


def _pick(items: list, seed: int) -> str:
    return items[seed % len(items)]


def _pick_n(items: list, n: int, seed: int) -> list:
    result = []
    for i in range(min(n, len(items))):
        result.append(items[(seed + i * 7) % len(items)])
    return result


def _rand_tags(seed: int, count: int = 2) -> list[str]:
    return _pick_n(TAGS_POOL, count, seed)


def _rand_mood(seed: int) -> float:
    return float(round(3.0 + (seed % 70) / 10.0, 1))


def _rand_energy(seed: int) -> float:
    return float(round(2.0 + ((seed * 3 + 5) % 80) / 10.0, 1))


def generate_raw_entries(base_date: datetime, user_id: str) -> list[dict]:
    """Generate ~150 entries across 30 days."""
    entries = []
    entry_id = 0

    for day_offset in range(30):
        d = base_date + timedelta(days=day_offset)
        date_str = _date_str(d)
        seed = day_offset * 137 + 42

        # Vary entry count per day: some rich, some light
        if day_offset % 7 == 0:
            # Light day
            entry_count = 2 + (seed % 3)
        elif day_offset % 5 == 0:
            # Rich day
            entry_count = 7 + (seed % 4)
        else:
            entry_count = 4 + (seed % 3)

        for i in range(entry_count):
            entry_seed = seed + i * 31
            hour = 8 + (entry_seed % 12)
            minute = entry_seed % 60
            created_at = d.replace(hour=hour, minute=minute, second=entry_seed % 60)
            entry_type_idx = entry_seed % 9
            entry_types = ['thought', 'idea', 'action', 'event', 'mood', 'reminder', 'win', 'blocker', 'note']
            etype = entry_types[entry_type_idx]

            content = ""
            mood_score = None
            energy_score = None
            tags = _rand_tags(entry_seed)

            if etype == 'thought':
                content = _pick(THOUGHTS, entry_seed)
            elif etype == 'idea':
                content = _pick(IDEAS_CONTENT, entry_seed)
                tags = list(set(tags + ['créativité']))
            elif etype == 'action':
                content = _pick(ACTIONS, entry_seed)
                tags = list(set(tags + ['travail']))
            elif etype == 'event':
                content = _pick(EVENTS, entry_seed)
                tags = list(set(tags + ['social']))
            elif etype == 'mood':
                content = _pick(MOOD_NOTES, entry_seed)
                mood_score = _rand_mood(entry_seed)
                energy_score = _rand_energy(entry_seed)
            elif etype == 'reminder':
                content = f"rappel: {_pick(REMINDER_TITLES, entry_seed)}"
                tags = list(set(tags + ['suivi']))
            elif etype == 'win':
                content = _pick(WINS, entry_seed)
                tags = list(set(tags + ['victoire']))
            elif etype == 'blocker':
                content = _pick(BLOCKERS, entry_seed)
                tags = list(set(tags + ['blocage']))
            elif etype == 'note':
                content = _pick(NOTES, entry_seed)
                tags = list(set(tags + ['note']))

            # Add priority tag to some actions
            if etype == 'action' and entry_seed % 3 == 0:
                tags = list(set(tags + ['priority']))

            entry = {
                'id': str(uuid.uuid4()),
                'user_id': user_id,
                'type': etype,
                'content': content,
                'created_at': _iso_str(created_at),
                'tags': tags,
                'mood_score': mood_score,
                'energy_score': energy_score,
                'metadata': {},
            }

            # Validate with Pydantic
            try:
                RawEntry(**entry)
                entries.append(entry)
                entry_id += 1
            except Exception:
                pass

    return entries


def generate_daily_summaries(entries: list[dict], user_id: str) -> list[dict]:
    """Generate DailySummary dicts for each day that has entries."""
    from collections import Counter
    import re
    from summarize_day import generate_daily_summary

    # Group entries by date
    by_date = {}
    for e in entries:
        date_key = e.get('created_at', '')[:10]
        if date_key not in by_date:
            by_date[date_key] = []
        by_date[date_key].append(e)

    summaries = []
    for date_key in sorted(by_date.keys()):
        day_entries = by_date[date_key]
        summary = generate_daily_summary(day_entries, date_key)
        summaries.append(summary)

    return summaries


def generate_ideas(user_id: str) -> list[dict]:
    """Generate 15 Idea dicts."""
    ideas = []
    base_date = datetime.now(timezone.utc).replace(hour=10, minute=0, second=0, microsecond=0)

    for i in range(15):
        d = base_date - timedelta(days=i * 2)
        seed = i * 73 + 11
        statuses = ['inbox', 'exploring', 'active', 'parked', 'archived']
        status = statuses[i % len(statuses)]
        potential = 3 + (seed % 8)
        theme = _pick(['productivité', 'créativité', 'bien-être', 'technologie', 'social'], seed)

        idea = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'content': _pick(IDEAS_CONTENT, seed),
            'created_at': _iso_str(d),
            'tags': _rand_tags(seed, 3),
            'theme': theme,
            'potential': potential,
            'status': status,
            'next_action': _pick(ACTIONS, seed) if status in ['exploring', 'active'] else None,
            'review_date': _date_str(d + timedelta(days=30)) if status == 'active' else None,
        }

        try:
            Idea(**idea)
            ideas.append(idea)
        except Exception:
            pass

    return ideas


def generate_reminders(user_id: str, entries: list[dict]) -> list[dict]:
    """Generate 10 Reminder dicts, some from entries and some fresh."""
    from reminders import process_reminders
    from schemas import Reminder

    # Get some from existing entries
    extracted = process_reminders(entries)

    reminders = list(extracted)
    base_date = datetime.now(timezone.utc).replace(hour=9, minute=0, second=0, microsecond=0)

    # Add more to reach 10
    while len(reminders) < 10:
        idx = len(reminders)
        seed = idx * 53 + 17
        d = base_date - timedelta(days=idx * 3)
        priority = ['high', 'medium', 'low'][idx % 3]
        category = ['action', 'follow_up', 'review', 'open_loop'][idx % 4]
        due = d + timedelta(days=idx % 5)

        reminder = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'title': _pick(REMINDER_TITLES, seed),
            'source': 'inbox',
            'due_date': _date_str(due),
            'priority': priority,
            'status': 'active',
            'category': category,
            'created_at': _iso_str(d),
        }

        try:
            Reminder(**reminder)
            reminders.append(reminder)
        except Exception:
            pass

    return reminders[:10]


def generate_insights(summaries: list[dict], user_id: str) -> list[dict]:
    """Generate ~5 Insight dicts."""
    from generate_insights import compute_insights
    from schemas import Insight

    insights_dicts = compute_insights(summaries, days=30, deterministic_mock_mode=True)

    # Validate with Pydantic
    validated = []
    for ins in insights_dicts:
        try:
            Insight(**ins)
            validated.append(ins)
        except Exception:
            pass

    return validated


def main():
    """Generate all demo data and write to JSON files."""
    demo_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'demo')
    os.makedirs(demo_dir, exist_ok=True)

    user_id = str(uuid.uuid4())
    base_date = datetime.now(timezone.utc).replace(hour=8, minute=0, second=0, microsecond=0)

    print("Generating raw entries...")
    entries = generate_raw_entries(base_date, user_id)

    print(f"  Generated {len(entries)} raw entries")
    with open(os.path.join(demo_dir, 'raw_entries.json'), 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    print("Generating daily summaries...")
    summaries = generate_daily_summaries(entries, user_id)
    print(f"  Generated {len(summaries)} daily summaries")
    with open(os.path.join(demo_dir, 'daily_summaries.json'), 'w', encoding='utf-8') as f:
        json.dump(summaries, f, ensure_ascii=False, indent=2)

    print("Generating ideas...")
    ideas = generate_ideas(user_id)
    print(f"  Generated {len(ideas)} ideas")
    with open(os.path.join(demo_dir, 'ideas.json'), 'w', encoding='utf-8') as f:
        json.dump(ideas, f, ensure_ascii=False, indent=2)

    print("Generating reminders...")
    reminders = generate_reminders(user_id, entries)
    print(f"  Generated {len(reminders)} reminders")
    with open(os.path.join(demo_dir, 'reminders.json'), 'w', encoding='utf-8') as f:
        json.dump(reminders, f, ensure_ascii=False, indent=2)

    print("Generating insights...")
    insights = generate_insights(summaries, user_id)
    print(f"  Generated {len(insights)} insights")
    with open(os.path.join(demo_dir, 'insights.json'), 'w', encoding='utf-8') as f:
        json.dump(insights, f, ensure_ascii=False, indent=2)

    print(f"\nAll demo data written to {demo_dir}/")
    print(f"  - raw_entries.json ({len(entries)} entries)")
    print(f"  - daily_summaries.json ({len(summaries)} summaries)")
    print(f"  - ideas.json ({len(ideas)} ideas)")
    print(f"  - reminders.json ({len(reminders)} reminders)")
    print(f"  - insights.json ({len(insights)} insights)")


if __name__ == '__main__':
    main()
