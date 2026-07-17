# DailyOS — Deployment Guide

## Overview

Deploying DailyOS involves:
1. Pushing the code to GitHub
2. Enabling GitHub Pages
3. Configuring secrets
4. Running initial automation workflows

---

## Step 1: Push to GitHub

```bash
# Initialize git in the project directory
cd /path/to/dailyos
git init
git add .
git commit -m "Initial commit: DailyOS infrastructure"

# Create a repository on GitHub first, then link and push
git remote add origin git@github.com:<your-username>/dailyos.git
git branch -M main
git push -u origin main
```

---

## Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings > Pages**
3. Under **Source**, select **GitHub Actions**
4. (No need to select a branch — the `pages.yml` workflow handles deployment)
5. The Pages URL will be: `https://<your-username>.github.io/dailyos/`

---

## Step 3: Configure GitHub Secrets

Add the following secrets in **Settings > Secrets and variables > Actions**:

| Secret Name | Value | How to Get |
|-------------|-------|-----------|
| `SUPABASE_URL` | `https://<project>.supabase.co` | Supabase Dashboard > Settings > API |
| `SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Supabase Dashboard > Settings > API (⚠️ secret!) |

---

## Step 4: Run Initial Manual Workflow

Run the daily summary manually to verify everything works:

1. Go to **Actions** tab
2. Select **Daily Summary** workflow
3. Click **Run workflow**
4. Set `dry_run` to `true` (safe first run)
5. Click **Run workflow**
6. Check the logs to verify the summary was generated correctly
7. Then run again with `dry_run` = `false` to write to the database

---

## Step 5: Verify the Demo

1. Wait for the Pages deployment to complete
   (check **Actions > Deploy to GitHub Pages**)
2. Visit `https://<your-username>.github.io/dailyos/`
3. You should see the DailyOS frontend

---

## Troubleshooting

### 404 — Page Not Found

| Cause | Fix |
|-------|-----|
| Pages not enabled | Go to Settings > Pages and enable **GitHub Actions** |
| Wrong branch | The `pages.yml` workflow deploys from `main` |
| Artifact empty | Check the deploy workflow logs — the `!exclude` patterns may be filtering too aggressively |
| First deploy takes time | Wait 1-2 minutes after the workflow completes |

### CORS Errors

CORS is **not needed** for a static site served from GitHub Pages. The
frontend calls the Supabase REST API directly, and Supabase handles CORS
automatically. If you see CORS errors:

1. Verify the Supabase URL is correct in `.env` and GitHub Secrets
2. Check Supabase Dashboard > Authentication > Settings > Allowed origins
   (add `https://<your-username>.github.io` if needed)

### Empty Data on Demo

If the demo shows no data:

1. Check if `seed_demo.sql` was run in the Supabase SQL Editor
2. Check if the anon key has access via RLS (the demo user's auth session
   must be valid)
3. Try running a dry-run daily summary to confirm the scripts can see the data

### Workflow Fails with `401 Unauthorized`

1. Regenerate the service role key in Supabase Dashboard
2. Update the GitHub Secret
3. Re-run the workflow

### `scripts/summarize_day.py: not found`

1. Ensure scripts are committed and pushed
2. Check the `.gitignore` doesn't exclude `scripts/`
3. Verify the checkout step in the workflow is working

---

## Post-Deployment Checklist

- [ ] GitHub Pages URL loads the frontend
- [ ] Demo data is visible (if seed_demo.sql was run)
- [ ] Daily summary workflow runs successfully (dry run + live)
- [ ] Weekly review workflow triggers on Sunday
- [ ] Monthly review workflow triggers on 1st of month
- [ ] CI passes on push
- [ ] Secret leak check passes
- [ ] `.env.example` is up to date
- [ ] Docs are accessible

---

## Maintenance

### Updating the Frontend

1. Make changes to `index.html`, assets, etc.
2. Commit and push to `main`
3. The `pages.yml` workflow deploys automatically

### Updating Automation Scripts

1. Modify `scripts/*.py`
2. Update `scripts/requirements.txt` if dependencies changed
3. Commit and push
4. The next scheduled run uses the new code

### Updating the Database Schema

1. Modify `supabase/schema.sql`
2. Run the ALTER TABLE statements in Supabase SQL Editor
3. Update `supabase/rls.sql` if needed
4. Run new RLS policies
5. Commit changes to keep the schema version-controlled
