-- ============================================================================
-- DailyOS — Seed Demo Data
-- ============================================================================
-- INSERTS mock data for a demo user (Tazou / Jahangir).
-- Uses fixed UUIDs so the dataset is fully reproducible.
-- All user-facing content is in FRENCH.
-- ============================================================================
-- RUN AFTER: schema.sql, rls.sql
-- USAGE:    psql or Supabase SQL Editor
-- ============================================================================

-- Demo user UUID (matches a fake auth.users entry for development)
-- In production, this would correspond to a real auth.users id.
-- For demo purposes, we create a placeholder auth user first.
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'demo@dailyos.app',
    crypt('demo-password', gen_salt('bf')),
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Demo profile
INSERT INTO profiles (id, user_id, display_name, avatar_url, timezone, preferences)
VALUES (
    'd0000000-0000-0000-0000-000000000010',
    'd0000000-0000-0000-0000-000000000001',
    'Tazou (Demo)',
    NULL,
    'Europe/Paris',
    '{"theme": "dark", "notifications": true, "language": "fr"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RAW ENTRIES (~10 entries, all in French)
-- ============================================================================

INSERT INTO raw_entries (id, user_id, type, content, created_at, tags, mood_score, energy_score, metadata)
VALUES
-- 2025-01-15 entries
(
    'd0000000-0000-0000-0000-000000000101',
    'd0000000-0000-0000-0000-000000000001',
    'note',
    'Matinée productive : review du projet API terminée, documentation mise à jour.',
    '2025-01-15 09:30:00+01',
    ARRAY['travail', 'api', 'documentation'],
    7.5, 8.0,
    '{"source": "manual", "context": "morning_review"}'::jsonb
),
(
    'd0000000-0000-0000-0000-000000000102',
    'd0000000-0000-0000-0000-000000000001',
    'idea',
    'Idée : application de tracking d''habitudes avec rappels intelligents basés sur le contexte.',
    '2025-01-15 10:15:00+01',
    ARRAY['idée', 'productivité', 'dev'],
    8.0, 7.5,
    '{}'::jsonb
),
(
    'd0000000-0000-0000-0000-000000000103',
    'd0000000-0000-0000-0000-000000000001',
    'reflection',
    'Je remarque que je suis plus créatif le matin. Les après-midis sont meilleurs pour les tâches répétitives.',
    '2025-01-15 12:00:00+01',
    ARRAY['réflexion', 'rythme', 'productivité'],
    6.5, 6.0,
    '{}'::jsonb
),
(
    'd0000000-0000-0000-0000-000000000104',
    'd0000000-0000-0000-0000-000000000001',
    'mood',
    'Énergie moyenne en fin d''après-midi. Besoin d''une pause et d''une marche dehors.',
    '2025-01-15 15:45:00+01',
    ARRAY['humeur', 'énergie', 'pause'],
    5.0, 4.5,
    '{}'::jsonb
),
(
    'd0000000-0000-0000-0000-000000000105',
    'd0000000-0000-0000-0000-000000000001',
    'task',
    'IMPORTANT : Préparer la présentation pour la réunion client de vendredi.',
    '2025-01-15 17:00:00+01',
    ARRAY['tâche', 'client', 'présentation', 'urgent'],
    6.0, 3.5,
    '{"due": "2025-01-17", "effort_estimate": "2h"}'::jsonb
),
-- 2025-01-16 entries
(
    'd0000000-0000-0000-0000-000000000106',
    'd0000000-0000-0000-0000-000000000001',
    'checkin',
    'Check-in matinal : bien dormi, motivation au top. Objectif du jour : finir le module d''auth.',
    '2025-01-16 08:00:00+01',
    ARRAY['checkin', 'matin', 'objectif'],
    8.5, 9.0,
    '{}'::jsonb
),
(
    'd0000000-0000-0000-0000-000000000107',
    'd0000000-0000-0000-0000-000000000001',
    'event',
    'Déjeuner avec l''équipe — discussion sur les nouvelles techs. Sujet : Svelte 5 vs React 19.',
    '2025-01-16 12:30:00+01',
    ARRAY['événement', 'équipe', 'tech'],
    7.0, 7.0,
    '{}'::jsonb
),
(
    'd0000000-0000-0000-0000-000000000108',
    'd0000000-0000-0000-0000-000000000001',
    'note',
    'Découverte du jour : Supabase Edge Functions supporte maintenant Deno 2. À explorer pour les webhooks.',
    '2025-01-16 14:20:00+01',
    ARRAY['travail', 'supabase', 'découverte'],
    8.0, 6.5,
    '{}'::jsonb
),
(
    'd0000000-0000-0000-0000-000000000109',
    'd0000000-0000-0000-0000-000000000001',
    'journal',
    'Journal du soir : journée chargée mais satisfaisante. Content d''avoir avancé sur le module d''auth. Demain : tests et déploiement.',
    '2025-01-16 21:00:00+01',
    ARRAY['journal', 'soir', 'bilan'],
    7.5, 5.0,
    '{}'::jsonb
),
(
    'd0000000-0000-0000-0000-000000000110',
    'd0000000-0000-0000-0000-000000000001',
    'link',
    'Article intéressant : "The Art of Building Second Brains" — lien vers le blog de Ness Labs.',
    '2025-01-16 22:30:00+01',
    ARRAY['lien', 'lecture', 'productivité', 'deuxième cerveau'],
    6.0, 3.0,
    '{"url": "https://nesslabs.com/second-brain", "read_later": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DAILY SUMMARIES (2 summaries)
-- ============================================================================

INSERT INTO daily_summaries (id, user_id, date, headline, summary, mood, highlights, actions, ideas, events, lessons, tomorrow_focus, source_entry_ids, generated_at)
VALUES
(
    'd0000000-0000-0000-0000-000000000201',
    'd0000000-0000-0000-0000-000000000001',
    '2025-01-15',
    'Matin créatif, après-midi administratif',
    'Journée productive démarrée par une revue API. Une idée intéressante sur le tracking d''habitudes a émergé. Baisse d''énergie en fin de journée.',
    '{"average_mood": 6.25, "average_energy": 5.875, "range": "5.0-7.5", "trend": "declining"}'::jsonb,
    '["Review API terminée", "Documentation mise à jour", "Idée de tracking notée"]'::jsonb,
    '["Préparer présentation client"]'::jsonb,
    '["App de tracking d''habitudes avec rappels contextuels"]'::jsonb,
    '[]'::jsonb,
    '["Plus créatif le matin", "Besoin de pause en après-midi"]'::jsonb,
    '["Terminer la présentation client"]'::jsonb,
    ARRAY['d0000000-0000-0000-0000-000000000101', 'd0000000-0000-0000-0000-000000000102', 'd0000000-0000-0000-0000-000000000103', 'd0000000-0000-0000-0000-000000000104', 'd0000000-0000-0000-0000-000000000105'],
    '2025-01-15 23:00:00+01'
),
(
    'd0000000-0000-0000-0000-000000000202',
    'd0000000-0000-0000-0000-000000000001',
    '2025-01-16',
    'Module d''auth terminé — bonne journée !',
    'Check-in matinal énergique, bonne progression sur le module d''authentification. Déjeuner enrichissant sur les frameworks JS. Veille technologique productive.',
    '{"average_mood": 7.4, "average_energy": 6.1, "range": "6.0-8.5", "trend": "stable"}'::jsonb,
    '["Module d''auth terminé", "Discussion Svelte vs React enrichissante", "Découverte Deno 2 + Supabase"]'::jsonb,
    '["Tester le module d''auth", "Déploiement en preview"]'::jsonb,
    '[]'::jsonb,
    '["Déjeuner équipe — veille tech"]'::jsonb,
    '["Svelte 5 pourrait être un bon choix pour le prochain projet"]'::jsonb,
    '["Tests du module d''auth", "Déploiement"]'::jsonb,
    ARRAY['d0000000-0000-0000-0000-000000000106', 'd0000000-0000-0000-0000-000000000107', 'd0000000-0000-0000-0000-000000000108', 'd0000000-0000-0000-0000-000000000109', 'd0000000-0000-0000-0000-000000000110'],
    '2025-01-16 23:00:00+01'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- IDEAS (3 ideas, in French)
-- ============================================================================

INSERT INTO ideas (id, user_id, content, created_at, tags, theme, potential, status, next_action, review_date)
VALUES
(
    'd0000000-0000-0000-0000-000000000301',
    'd0000000-0000-0000-0000-000000000001',
    'App de tracking d''habitudes avec rappels contextuels basés sur la géolocalisation et l''heure.',
    '2025-01-15 10:15:00+01',
    ARRAY['productivité', 'mobile', 'habitudes'],
    'Productivité',
    8,
    'exploring',
    'Créer un wireframe et une liste de fonctionnalités MVP',
    '2025-02-01'
),
(
    'd0000000-0000-0000-0000-000000000302',
    'd0000000-0000-0000-0000-000000000001',
    'Blog technique en français sur l''architecture des PWA modernes avec Supabase.',
    '2025-01-16 14:00:00+01',
    ARRAY['blog', 'technique', 'pwa', 'supabase'],
    'Écriture',
    6,
    'inbox',
    'Esquisser le plan de l''article',
    '2025-01-30'
),
(
    'd0000000-0000-0000-0000-000000000303',
    'd0000000-0000-0000-0000-000000000001',
    'Outil dashboard temps réel pour visualiser sa productivité et son humeur sur la semaine.',
    '2025-01-17 09:00:00+01',
    ARRAY['dashboard', 'productivité', 'visualisation', 'humeur'],
    'Data & Analytics',
    7,
    'inbox',
    'Chercher des librairies de charting pour Svelte',
    '2025-02-07'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- REMINDERS (2 reminders, in French)
-- ============================================================================

INSERT INTO reminders (id, user_id, title, source, due_date, priority, status, category)
VALUES
(
    'd0000000-0000-0000-0000-000000000401',
    'd0000000-0000-0000-0000-000000000001',
    'Préparer et répéter la présentation client',
    'raw_entries/d0000000-0000-0000-0000-000000000105',
    '2025-01-17 10:00:00+01',
    'high',
    'active',
    'action'
),
(
    'd0000000-0000-0000-0000-000000000402',
    'd0000000-0000-0000-0000-000000000001',
    'Lire l''article Ness Labs sur le Second Brain',
    'raw_entries/d0000000-0000-0000-0000-000000000110',
    '2025-01-20 20:00:00+01',
    'low',
    'active',
    'follow_up'
)
ON CONFLICT (id) DO NOTHING;
