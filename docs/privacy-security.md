# DailyOS — Privacy & Security

## Overview

DailyOS follows a **defense-in-depth** approach to privacy and security.
The system is divided into a public surface (GitHub Pages demo) and a
private backend (Supabase with Row-Level Security).

---

## What's Public vs Private

| Asset | Visibility | Notes |
|-------|-----------|-------|
| **GitHub Pages** (https://<user>.github.io/dailyos/) | **Public** | Contains a **demo** frontend with **demo data only**. No real user data. |
| **`data/demo/`** directory | **Public** | Mock/fake demo entries. Never contains real user data. |
| **Supabase Database** | **Private** | All real user data. Access controlled by RLS. |
| **GitHub Secrets** | **Private** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc. Encrypted at rest. |

---

## Key Separation

DailyOS uses two distinct Supabase API keys with different privilege levels:

| Key | Where Used | Permissions | Notes |
|-----|-----------|-------------|-------|
| **Anon Key** (`SUPABASE_ANON_KEY`) | Frontend (GitHub Pages) | RLS-enforced: users can only access their own `user_id` rows | Safe to expose in client-side code **because RLS prevents data leakage** |
| **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`) | GitHub Actions (backend scripts) | **Full admin access** — bypasses all RLS | **NEVER** exposed to frontend, committed, or shared |

### Why This Separation Matters

- The anon key is **public by design** — it's meant to be in the client code.
  Security comes from RLS, not key secrecy.
- The service role key is **highly sensitive** — anyone with it can read/write
  all data. It lives only in GitHub Secrets and local `.env` files.
- GitHub Actions workflows use the service role key because they run automated
  summaries/reviews that must see **all** entries for a user (not just what
  the user's browser session can see).

---

## `.env` and Secret Management

### `.env` is in `.gitignore`

The `.env` file (containing real keys) is **explicitly gitignored** and must
never be committed. A template is provided as `.env.example`.

### GitHub Secrets

The following secrets must be configured in the GitHub repository:

| Secret Name | Required For | Sensitivity |
|-------------|-------------|-------------|
| `SUPABASE_URL` | All workflows | Low (just the project URL) |
| `SUPABASE_ANON_KEY` | Frontend builds | Low (public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Automation workflows | **Critical** |

### CI Secret Leak Detection

The CI workflow automatically checks for leaked secrets:

```yaml
- name: Check for leaked secrets
  run: grep -r 'ghp_\|sk-\|sbp_' . --exclude-dir=.git || echo "✅ No secrets found"
```

This catches accidental commits of GitHub tokens (`ghp_*`), OpenAI-style keys
(`sk-*`), and Supabase service keys (`sbp_*`).

---

## Backup & Data Retention

### Supabase Daily Backups (Automatic)

Supabase **automatically backs up** your database daily (Pro plan and above).
You can also trigger manual backups via the Supabase Dashboard.

### Local Export (Recommended)

For full control, export your data regularly:

```bash
# Export all tables for a user
pg_dump \
  --dbname="$SUPABASE_URL" \
  --username="postgres" \
  --data-only \
  --table=raw_entries \
  --table=daily_summaries \
  --table=ideas \
  --table=reminders \
  --table=insights \
  --table=weekly_reviews \
  --table=monthly_reviews \
  > dailyos_backup_$(date +%Y-%m-%d).sql
```

### Data Retention Configuration

| Data Type | Retention | Notes |
|-----------|-----------|-------|
| Raw entries | Indefinite (configurable) | Can be pruned by age via `metadata` |
| Daily summaries | Indefinite | Derived data, compact |
| Reminders | 30 days after completion | Auto-archive via cron |
| Insights | Indefinite | Derived patterns |

Retention can be customized via a future admin script (`scripts/retention.py`).

---

## XSS Prevention

Since the frontend renders user-entered content, all text output must be
escaped. Use this helper:

```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
```

This is built into the frontend rendering pipeline. All dynamic content
(text, tags, metadata values) passes through `escapeHtml()` before being
inserted into the DOM.

### Additional XSS Measures

- Content is rendered using `textContent` (not `innerHTML`) where possible
- JSON fields are parsed safely with `JSON.parse()`, not `eval()`
- User-submitted URLs in `metadata.url` are sanitized before creating links

---

## Secret Rotation Guide

### When to Rotate

- **Immediately** if a key is accidentally committed or exposed
- Every **90 days** as a security best practice
- When a team member with access leaves

### Rotation Steps

1. **Supabase Anon Key**: Regenerate in Supabase Dashboard
   (Settings > API > Project API keys > Anon public > Regenerate)
2. **Supabase Service Role Key**: Regenerate in Supabase Dashboard
   (Settings > API > Project API keys > Service role > Regenerate)
3. **Update GitHub Secrets**: Replace old keys in repository Secrets
4. **Update local `.env`**: Replace old keys in your development `.env` file
5. **Verify**: Run a manual workflow_dispatch for daily-summary to confirm

---

## Security Checklist

- [ ] `.env` is in `.gitignore` ✓ (included by default)
- [ ] No real secrets in any committed file
- [ ] RLS enabled on all tables ✓ (via `rls.sql`)
- [ ] Anon key has no direct table access without RLS
- [ ] Service role key is only in GitHub Secrets / local `.env`
- [ ] CI checks for secret leakage
- [ ] Frontend uses `escapeHtml()` on all user content
- [ ] HTTPS enforced (GitHub Pages + Supabase enforce this)
- [ ] CORS is not applicable for static file serving
- [ ] Data backups configured (Supabase auto + manual export)
