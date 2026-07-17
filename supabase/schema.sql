-- ============================================================================
-- DailyOS — Complete Database Schema
-- ============================================================================
-- This schema defines all tables for the DailyOS personal operating system.
-- Designed for Supabase PostgreSQL.
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- 1. PROFILES (extends auth.users) ------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name    text,
    avatar_url      text,
    timezone        text DEFAULT 'Europe/Paris',
    preferences     jsonb DEFAULT '{}'::jsonb,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. RAW ENTRIES ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_entries (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type            text CHECK (type IN ('note','idea','event','task','reflection','mood','link','file','voice','screenshot','checkin','journal')),
    content         text NOT NULL,
    created_at      timestamptz DEFAULT now(),
    tags            text[] DEFAULT '{}',
    mood_score      real,
    energy_score    real,
    metadata        jsonb DEFAULT '{}'::jsonb,
    updated_at      timestamptz DEFAULT now()
);

-- 3. DAILY SUMMARIES --------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_summaries (
    id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date                date NOT NULL,
    headline            text,
    summary             text,
    mood                jsonb DEFAULT '{}'::jsonb,
    highlights          jsonb DEFAULT '[]'::jsonb,
    actions             jsonb DEFAULT '[]'::jsonb,
    ideas               jsonb DEFAULT '[]'::jsonb,
    events              jsonb DEFAULT '[]'::jsonb,
    lessons             jsonb DEFAULT '[]'::jsonb,
    tomorrow_focus      jsonb DEFAULT '[]'::jsonb,
    reminder_ids        uuid[] DEFAULT '{}',
    source_entry_ids    uuid[] DEFAULT '{}',
    generated_at        timestamptz,
    model_metadata      jsonb DEFAULT '{}'::jsonb,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now(),
    UNIQUE(user_id, date)
);

-- 4. IDEAS ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ideas (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content         text NOT NULL,
    created_at      timestamptz DEFAULT now(),
    tags            text[] DEFAULT '{}',
    theme           text,
    potential       int CHECK (potential >= 1 AND potential <= 10),
    status          text CHECK (status IN ('inbox','exploring','active','parked','archived')) DEFAULT 'inbox',
    next_action     text,
    review_date     date,
    updated_at      timestamptz DEFAULT now()
);

-- 5. REMINDERS --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reminders (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           text NOT NULL,
    source          text,
    due_date        timestamptz,
    priority        text CHECK (priority IN ('high','medium','low')) DEFAULT 'medium',
    status          text CHECK (status IN ('active','done','snoozed','cancelled')) DEFAULT 'active',
    category        text CHECK (category IN ('action','follow_up','review','open_loop')) DEFAULT 'action',
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- 6. WEEKLY REVIEWS ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_reviews (
    id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start          date NOT NULL,
    week_end            date NOT NULL,
    progress            jsonb DEFAULT '{}'::jsonb,
    wins                jsonb DEFAULT '[]'::jsonb,
    frictions           jsonb DEFAULT '[]'::jsonb,
    recurring_ideas     jsonb DEFAULT '[]'::jsonb,
    dropped_topics      jsonb DEFAULT '[]'::jsonb,
    suggested_goals     jsonb DEFAULT '[]'::jsonb,
    reminders_review    jsonb DEFAULT '{}'::jsonb,
    generated_at        timestamptz,
    model_metadata      jsonb DEFAULT '{}'::jsonb,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now(),
    UNIQUE(user_id, week_start)
);

-- 7. MONTHLY REVIEWS --------------------------------------------------------
CREATE TABLE IF NOT EXISTS monthly_reviews (
    id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_start         date NOT NULL,
    month_end           date NOT NULL,
    progress            jsonb DEFAULT '{}'::jsonb,
    wins                jsonb DEFAULT '[]'::jsonb,
    frictions           jsonb DEFAULT '[]'::jsonb,
    recurring_ideas     jsonb DEFAULT '[]'::jsonb,
    dropped_topics      jsonb DEFAULT '[]'::jsonb,
    suggested_goals     jsonb DEFAULT '[]'::jsonb,
    reminders_review    jsonb DEFAULT '{}'::jsonb,
    generated_at        timestamptz,
    model_metadata      jsonb DEFAULT '{}'::jsonb,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now(),
    UNIQUE(user_id, month_start)
);

-- 8. INSIGHTS ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insights (
    id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type                text,
    observation         text NOT NULL,
    hypothesis          text,
    confidence          real CHECK (confidence >= 0 AND confidence <= 1),
    source_entry_ids    uuid[] DEFAULT '{}',
    period_start        date,
    period_end          date,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Raw entries: fast lookup by user + recency
CREATE INDEX IF NOT EXISTS idx_raw_entries_user_created
    ON raw_entries (user_id, created_at DESC);

-- Daily summaries: fast lookup by user + date
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date
    ON daily_summaries (user_id, date DESC);

-- Reminders: filter by user, status, and due date
CREATE INDEX IF NOT EXISTS idx_reminders_user_status_due
    ON reminders (user_id, status, due_date);

-- Ideas: browse by user and status
CREATE INDEX IF NOT EXISTS idx_ideas_user_status
    ON ideas (user_id, status);

-- Weekly reviews: lookup by user + week
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_week
    ON weekly_reviews (user_id, week_start DESC);

-- Monthly reviews: lookup by user + month
CREATE INDEX IF NOT EXISTS idx_monthly_reviews_user_month
    ON monthly_reviews (user_id, month_start DESC);

-- Insights: filter by user + type
CREATE INDEX IF NOT EXISTS idx_insights_user_type
    ON insights (user_id, type);

-- ============================================================================
-- UPDATED AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'profiles', 'raw_entries', 'daily_summaries', 'ideas',
            'reminders', 'weekly_reviews', 'monthly_reviews', 'insights'
        ])
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
            tbl
        );
    END LOOP;
END;
$$;

-- Migration v2.0 : gestion du champ "tomorrow" sur raw_entries
-- Option A (metadata JSONB) : stocker { "tomorrow": true } dans metadata — aucune ALTER TABLE.
-- Option B (metadata absent ou non JSONB) : exécuter manuellement :
--   ALTER TABLE raw_entries ADD COLUMN IF NOT EXISTS tomorrow BOOLEAN DEFAULT FALSE;
-- Les policies RLS existantes couvrent les nouvelles colonnes par héritage.
