# DailyOS — Supabase Setup Guide

## Prerequisites

- A **Supabase account** (free tier works for development)
- Access to the **Supabase Dashboard** at https://supabase.com

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Fill in:
   - **Name**: `dailyos`
   - **Database password**: Generate a strong password (save it securely)
   - **Region**: Choose the closest to you (e.g., `West Europe` for Paris)
   - **Pricing Plan**: Free tier is sufficient to start
4. Click **Create new project** (takes ~2 minutes)

---

## Step 2: Copy Your Project Credentials

Once the project is ready, go to **Project Settings > API**:

| Parameter | Where to Find It |
|-----------|-----------------|
| **Project URL** | Settings > API > Project URL |
| **Anon Key** (`SUPABASE_ANON_KEY`) | Settings > API > Project API keys > `anon public` |
| **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`) | Settings > API > Project API keys > `service_role` (⚠️ secret!) |

Copy all three values — you'll need them in Steps 5 and 6.

---

## Step 3: Run the Schema

1. In the Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Open the file `supabase/schema.sql` from this repository
4. Copy and paste the entire contents into the SQL Editor
5. Click **Run** (or `Ctrl+Enter`)

Expected output: `Success. No rows returned` (the function and trigger creation
may show a success notice).

---

## Step 4: Run RLS Policies

1. In the same SQL Editor, open a **New query**
2. Open the file `supabase/rls.sql` from this repository
3. Paste the entire contents
4. Click **Run**

Expected output: Each `CREATE POLICY` statement should succeed.

> **Note**: RLS is what makes the anon key safe to expose in the frontend.
> Without RLS, anyone with the anon key could read/write all data.

---

## Step 5: (Optional) Load Demo Data

To populate the database with sample data for development/testing:

1. Open a **New query** in SQL Editor
2. Open `supabase/seed_demo.sql`
3. Paste and run the entire file

This creates:
- A demo auth user (`demo@dailyos.app`)
- A demo profile ("Tazou")
- 10 raw entries (in French)
- 2 daily summaries
- 3 ideas
- 2 reminders

To clear demo data later:

```sql
-- WARNING: Deletes ALL data in these tables
TRUNCATE insights, monthly_reviews, weekly_reviews, reminders,
         ideas, daily_summaries, raw_entries, profiles CASCADE;
DELETE FROM auth.users WHERE id = 'd0000000-0000-0000-0000-000000000001';
```

---

## Step 6: Configure Local `.env`

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```ini
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: LLM for summaries
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini

APP_TIMEZONE=Europe/Paris
```

---

## Step 7: Configure GitHub Secrets

For the GitHub Actions automation workflows to work, add these secrets to your
GitHub repository:

1. Go to your repo on GitHub: **Settings > Secrets and variables > Actions**
2. Click **New repository secret** for each of the following:

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |

---

## Verification

### Local Verification

```bash
# Check that the schema is loaded
curl -X GET "$SUPABASE_URL/rest/v1/raw_entries" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# With demo data loaded, you should see rows
```

### CI Verification

Push to GitHub. The CI workflow will run and:
1. Install dependencies
2. Run tests
3. Validate data files
4. Check for secret leaks

---

## Troubleshooting

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| `relation "raw_entries" does not exist` | Schema not run | Run `schema.sql` in SQL Editor |
| `permission denied for table raw_entries` | RLS not enabled | Run `rls.sql` in SQL Editor |
| `new row violates row-level security` | JWT doesn't match `user_id` | Check auth token / user session |
| Demo data not appearing | Seed not run | Run `seed_demo.sql` |
| CORS errors (local dev) | Supabase not configured | Add localhost origin in Supabase Dashboard > Authentication > Settings |
