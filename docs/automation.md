# DailyOS — Automation Guide

## Overview

DailyOS uses three GitHub Actions workflows to automatically process entries
and generate structured reviews. All workflows run on a schedule (Europe/Paris
timezone) and also support manual triggering.

---

## Workflow 1: Daily Summary

**File**: `.github/workflows/daily-summary.yml`
**Schedule**: Every day at **03:00 Europe/Paris**
**Script**: `scripts/summarize_day.py`

### What It Does

1. Collects all raw entries from the previous day
2. Groups and analyzes them by type, mood, and energy
3. Generates a `daily_summaries` row with:
   - Headline & narrative summary
   - Mood/energy averages and trend
   - Key highlights extracted
   - Action items identified
   - Ideas surfaced
   - Lessons learned
   - Suggested focus for tomorrow
4. Creates or links reminders for extracted action items

### Trigger Details

| Trigger | Schedule/Input |
|---------|---------------|
| Scheduled | `0 2 * * *` (UTC — 03:00 CET / 04:00 CEST) |
| Manual | `workflow_dispatch` with optional `date` and `dry_run` |

### Input Parameters (Manual Trigger)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `date` | string | Yesterday | Date to summarize (YYYY-MM-DD) |
| `dry_run` | boolean | `false` | If true, runs analysis without writing to DB |

### Secrets Required

| Secret | Required? | Purpose |
|--------|-----------|---------|
| `SUPABASE_URL` | Yes (for live mode) | Database endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for live mode) | Admin access to write summaries |

### Dry-Run Mode

If `SUPABASE_URL` is not set (e.g., first run before configuring secrets),
the workflow automatically falls back to dry-run mode:

```bash
python3 scripts/summarize_day.py --date 2025-01-15 --dry-run
```

This outputs the generated summary to logs without writing to the database.

---

## Workflow 2: Weekly Review

**File**: `.github/workflows/weekly-review.yml`
**Schedule**: Every **Sunday at 03:30 Europe/Paris**
**Script**: `scripts/weekly_review.py`

### What It Does

1. Analyzes the past week's raw entries and daily summaries
2. Generates a `weekly_reviews` row with:
   - **Progress**: What was accomplished
   - **Wins**: Positive outcomes and successes
   - **Frictions**: Obstacles and blockers
   - **Recurring ideas**: Ideas that reappeared during the week
   - **Dropped topics**: Things that fell off the radar
   - **Suggested goals**: Goals for the coming week
   - **Reminders review**: Overview of pending/completed reminders

### Trigger Details

| Trigger | Schedule/Input |
|---------|---------------|
| Scheduled | `30 1 * * 0` (UTC — Sunday 02:30 CET / 03:30 CEST) |
| Manual | `workflow_dispatch` with optional `date` and `dry_run` |

### Input Parameters (Manual Trigger)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `date` | string | Last Sunday | End date of the week (YYYY-MM-DD) |
| `dry_run` | boolean | `false` | If true, runs analysis without writing |

---

## Workflow 3: Monthly Review

**File**: `.github/workflows/monthly-review.yml`
**Schedule**: **1st day of every month** at **03:45 Europe/Paris**
**Script**: `scripts/monthly_review.py`

### What It Does

Same structure as weekly review, but scoped to the past month. Generates a
`monthly_reviews` row with broader patterns and long-term insights.

### Trigger Details

| Trigger | Schedule/Input |
|---------|---------------|
| Scheduled | `45 1 1 * *` (UTC — 02:45 CET / 03:45 CEST on 1st) |
| Manual | `workflow_dispatch` with optional `date` and `dry_run` |

### Input Parameters (Manual Trigger)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `date` | string | Last day of previous month | End date (YYYY-MM-DD) |
| `dry_run` | boolean | `false` | If true, runs analysis without writing |

---

## Timezone Handling

All cron schedules are specified in **UTC** (GitHub Actions requirement).
The actual times in **Europe/Paris** are:

| Workflow | UTC (Winter) | CET (Winter) | CEST (Summer) |
|----------|-------------|-------------|---------------|
| Daily Summary | `0 2 * * *` | 03:00 | 04:00 |
| Weekly Review | `30 1 * * 0` | 02:30 | 03:30 |
| Monthly Review | `45 1 1 * *` | 02:45 | 03:45 |

> **DST handling**: The Python scripts (`summarize_day.py`, etc.) internally
> use `pytz` to convert UTC times to Europe/Paris, accounting for DST
> transitions. This means:
> - The **cron schedule stays fixed in UTC** (never changes)
> - The **scripts** correctly identify "yesterday" / "last week" in Paris time
> - No DST-related gaps or double-runs

---

## Concurrency Locking

All three workflows use `concurrency` groups to prevent overlapping runs:

```yaml
concurrency:
  group: daily-summary          # unique per workflow
  cancel-in-progress: true      # cancel stale runs
```

This ensures:
- If a scheduled run takes longer than expected, the next one doesn't start
  on top of it
- Manual triggers cancel any in-progress scheduled runs (and vice versa)
- No duplicate summaries are generated for the same period

---

## Failure Recovery

### What Happens on Failure

1. **Email notification**: GitHub sends a failure email to the repo owner
2. **Logs**: Full logs are available in the Actions tab
3. **Data safety**: Failures are **non-destructive** — no partial writes
   (scripts use transactions or validate before writing)

### Manual Retry

1. Go to the Action's page in GitHub
2. Click **Re-run jobs** for the failed run
3. Or trigger **workflow_dispatch** with the target date

### Common Failures

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `Connection refused` to Supabase | Network issue or wrong URL | Verify `SUPABASE_URL` in secrets |
| `401 Unauthorized` | Invalid service role key | Regenerate and update secret |
| Script exits with code 1 | Missing dependencies | Check `requirements.txt` is up to date |
| `No entries found for date` | No data for that day | Expected if the user didn't log anything |

---

## Manual Trigger Instructions

### From GitHub UI

1. Navigate to your repository on GitHub
2. Click **Actions** tab
3. Select the workflow (e.g., "Daily Summary")
4. Click **Run workflow** button
5. (Optional) Fill in `date` and `dry_run` parameters
6. Click **Run workflow**

### From GitHub CLI

```bash
# Daily summary for a specific date
gh workflow run "Daily Summary" \
  --ref main \
  -f date=2025-01-15 \
  -f dry_run=true

# Weekly review (dry run)
gh workflow run "Weekly Review" \
  --ref main \
  -f dry_run=true

# Monthly review (full run)
gh workflow run "Monthly Review" --ref main
```

### From REST API

```bash
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: Bearer <GH_PAT>" \
  https://api.github.com/repos/<user>/dailyos/actions/workflows/daily-summary.yml/dispatches \
  -d '{"ref":"main", "inputs": {"date": "2025-01-15", "dry_run": "true"}}'
```
