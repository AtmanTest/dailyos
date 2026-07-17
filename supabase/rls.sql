-- ============================================================================
-- DailyOS — Row Level Security Policies
-- ============================================================================
-- Run this AFTER schema.sql (and seed_demo.sql if desired).
-- All tables use auth.uid() to enforce user-data isolation.
-- No admin bypass policies are created — service_role key is used server-side.
-- ============================================================================

-- 1. PROFILES ---------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = user_id);

-- 2. RAW ENTRIES ------------------------------------------------------------
ALTER TABLE raw_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own raw_entries"
    ON raw_entries FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. DAILY SUMMARIES --------------------------------------------------------
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own daily_summaries"
    ON daily_summaries FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. IDEAS ------------------------------------------------------------------
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own ideas"
    ON ideas FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. REMINDERS --------------------------------------------------------------
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own reminders"
    ON reminders FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. WEEKLY REVIEWS ---------------------------------------------------------
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own weekly_reviews"
    ON weekly_reviews FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. MONTHLY REVIEWS --------------------------------------------------------
ALTER TABLE monthly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own monthly_reviews"
    ON monthly_reviews FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. INSIGHTS ---------------------------------------------------------------
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own insights"
    ON insights FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to run)
-- ============================================================================
-- -- List all tables with RLS enabled
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND rowsecurity = true;
--
-- -- List all policies
-- SELECT schemaname, tablename, policyname, permissive, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
