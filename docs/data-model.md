# DailyOS — Data Model

## Overview

DailyOS uses 8 tables in a Supabase PostgreSQL database. All tables share a
common base structure (`id`, `created_at`, `updated_at`) and are linked by
`user_id` to `auth.users`.

---

## Entity Relationship Diagram

```
 auth.users
     │
     ├── 1:1 ── profiles
     │
     ├── 1:N ── raw_entries
     │
     ├── 1:N ── daily_summaries
     │
     ├── 1:N ── ideas
     │
     ├── 1:N ── reminders
     │
     ├── 1:N ── weekly_reviews
     │
     ├── 1:N ── monthly_reviews
     │
     └── 1:N ── insights
```

---

## Table Definitions

### 1. `profiles`

Extends `auth.users` with user preferences.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | — | FK → `auth.users(id)`, UNIQUE |
| `display_name` | `text` | — | |
| `avatar_url` | `text` | — | |
| `timezone` | `text` | `'Europe/Paris'` | |
| `preferences` | `jsonb` | `'{}'` | Theme, notifications, etc. |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

### 2. `raw_entries`

The core input table. Every capture lands here first.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | — | FK → `auth.users(id)` |
| `type` | `text` | — | `CHECK` constraint: note, idea, event, task, reflection, mood, link, file, voice, screenshot, checkin, journal |
| `content` | `text` | — | `NOT NULL` |
| `created_at` | `timestamptz` | `now()` | Indexed with `user_id` |
| `tags` | `text[]` | `'{}'` | |
| `mood_score` | `real` | — | 0-10 scale |
| `energy_score` | `real` | — | 0-10 scale |
| `metadata` | `jsonb` | `'{}'` | Flexible per-type metadata |
| `updated_at` | `timestamptz` | `now()` | |

**JSON Schema for `metadata`:**

```jsonc
{
  "type": "object",
  "properties": {
    "source":         { "type": "string", "enum": ["manual", "telegram", "shortcut", "import"] },
    "context":        { "type": "string" },
    "url":            { "type": "string", "format": "uri" },
    "due":            { "type": "string", "format": "date" },
    "effort_estimate":{ "type": "string" },
    "read_later":     { "type": "boolean" },
    "location":       { "type": "string" },
    "device":         { "type": "string" }
  }
}
```

### 3. `daily_summaries`

Generated each day at 03:00. Aggregates raw_entries into a structured overview.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | — | FK → `auth.users(id)` |
| `date` | `date` | — | UNIQUE per user |
| `headline` | `text` | — | One-line summary |
| `summary` | `text` | — | Full narrative |
| `mood` | `jsonb` | `'{}'` | `{average_mood, average_energy, range, trend}` |
| `highlights` | `jsonb` | `'[]'` | Array of highlight strings |
| `actions` | `jsonb` | `'[]'` | Action items extracted |
| `ideas` | `jsonb` | `'[]'` | Ideas surfaced |
| `events` | `jsonb` | `'[]'` | Events logged |
| `lessons` | `jsonb` | `'[]'` | Lessons learned |
| `tomorrow_focus` | `jsonb` | `'[]'` | Suggested focus areas |
| `reminder_ids` | `uuid[]` | `'{}'` | Linked reminders |
| `source_entry_ids` | `uuid[]` | `'{}'` | FK refs → raw_entries |
| `generated_at` | `timestamptz` | — | When summary was created |
| `model_metadata` | `jsonb` | `'{}'` | LLM model info |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

### 4. `ideas`

Captured ideas with a lifecycle status.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | — | FK → `auth.users(id)` |
| `content` | `text` | — | `NOT NULL` |
| `created_at` | `timestamptz` | `now()` | |
| `tags` | `text[]` | `'{}'` | |
| `theme` | `text` | — | Category label |
| `potential` | `int` | — | CHECK 1-10 |
| `status` | `text` | `'inbox'` | CHECK: inbox, exploring, active, parked, archived |
| `next_action` | `text` | — | |
| `review_date` | `date` | — | Next review date |
| `updated_at` | `timestamptz` | `now()` | |

### 5. `reminders`

Actionable items with priority and lifecycle.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | — | FK → `auth.users(id)` |
| `title` | `text` | — | `NOT NULL` |
| `source` | `text` | — | Source reference (e.g. "raw_entries/<uuid>") |
| `due_date` | `timestamptz` | — | |
| `priority` | `text` | `'medium'` | CHECK: high, medium, low |
| `status` | `text` | `'active'` | CHECK: active, done, snoozed, cancelled |
| `category` | `text` | `'action'` | CHECK: action, follow_up, review, open_loop |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

### 6. `weekly_reviews`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | — | FK → `auth.users(id)` |
| `week_start` | `date` | — | UNIQUE per user |
| `week_end` | `date` | — | |
| `progress` | `jsonb` | `'{}'` | |
| `wins` | `jsonb` | `'[]'` | |
| `frictions` | `jsonb` | `'[]'` | |
| `recurring_ideas` | `jsonb` | `'[]'` | |
| `dropped_topics` | `jsonb` | `'[]'` | |
| `suggested_goals` | `jsonb` | `'[]'` | |
| `reminders_review` | `jsonb` | `'{}'` | |
| `generated_at` | `timestamptz` | — | |
| `model_metadata` | `jsonb` | `'{}'` | |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

### 7. `monthly_reviews`

Same structure as `weekly_reviews`, scoped to a month.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| Same as weekly_reviews | | | |
| `month_start` | `date` | — | UNIQUE per user |
| `month_end` | `date` | — | |

### 8. `insights`

Long-running patterns and observations derived from entry analysis.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | — | FK → `auth.users(id)` |
| `type` | `text` | — | e.g. "pattern", "anomaly", "suggestion" |
| `observation` | `text` | — | `NOT NULL` |
| `hypothesis` | `text` | — | |
| `confidence` | `real` | — | CHECK 0.0-1.0 |
| `source_entry_ids` | `uuid[]` | `'{}'` | FK refs → raw_entries |
| `period_start` | `date` | — | |
| `period_end` | `date` | — | |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

---

## Indexed Columns

| Table | Index | Purpose |
|-------|-------|---------|
| `raw_entries` | `(user_id, created_at DESC)` | Timeline queries |
| `daily_summaries` | `(user_id, date DESC)` | Recent summaries |
| `reminders` | `(user_id, status, due_date)` | Agenda/task view |
| `ideas` | `(user_id, status)` | Browse by status |
| `weekly_reviews` | `(user_id, week_start DESC)` | Recent weeks |
| `monthly_reviews` | `(user_id, month_start DESC)` | Recent months |
| `insights` | `(user_id, type)` | Filter by insight type |

---

## Example Queries

### Get today's raw entries (authenticated user)

```sql
SELECT id, type, content, created_at, tags, mood_score, energy_score
FROM raw_entries
WHERE user_id = auth.uid()
  AND created_at::date = CURRENT_DATE
ORDER BY created_at DESC;
```

### Get pending reminders sorted by urgency

```sql
SELECT id, title, due_date, priority, category
FROM reminders
WHERE user_id = auth.uid()
  AND status = 'active'
ORDER BY
  CASE priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END,
  due_date ASC NULLS LAST;
```

### Get latest daily summary headline

```sql
SELECT date, headline, generated_at
FROM daily_summaries
WHERE user_id = auth.uid()
ORDER BY date DESC
LIMIT 7;
```

### Aggregate mood trend over 30 days

```sql
SELECT
  date,
  mood->>'average_mood' AS avg_mood,
  mood->>'average_energy' AS avg_energy
FROM daily_summaries
WHERE user_id = auth.uid()
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date ASC;
```

### Get all ideas in "exploring" status

```sql
SELECT id, content, theme, potential, next_action
FROM ideas
WHERE user_id = auth.uid()
  AND status = 'exploring'
ORDER BY potential DESC;
```
