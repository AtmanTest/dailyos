# DailyOS — Architecture

## Overview

DailyOS is a personal operating system for logging, summarizing, and reviewing
your daily life. It combines a **static frontend** (GitHub Pages), a **backend
database** (Supabase), and **automated review pipelines** (GitHub Actions) to
turn raw daily entries into structured insights.

---

## System Architecture Diagram

```mermaid
graph TB
    subgraph Public [Public — GitHub Pages]
        FE[Static Frontend<br/>index.html + assets]
    end

    subgraph Auth [Authentication — Supabase Auth]
        SA[Supabase Auth]
    end

    subgraph Private [Private — Supabase with RLS]
        DB[(PostgreSQL<br/>RLS Protected)]
        API[Supabase REST API<br/>Anon Key]
    end

    subgraph Automation [Automation — GitHub Actions]
        DS[Daily Summary<br/>03:00 CET]
        WR[Weekly Review<br/>Sun 03:30 CET]
        MR[Monthly Review<br/>1st 03:45 CET]
        CI[CI Pipeline]
    end

    subgraph Scripts [Script Layer]
        SD[summarize_day.py]
        WP[weekly_review.py]
        MP[monthly_review.py]
        VD[validate_data.py]
        TT[test_scripts.py]
    end

    subgraph External [External Inputs]
        USER[User<br/>Multiple Devices]
        TG[Telegram Bot<br/>(Future)]
        SC[Apple Shortcuts<br/>(Future)]
    end

    %% Connections
    USER -->|browses| FE
    FE -->|anon key + RLS| API
    API --> DB
    SA -->|JWT| FE

    Automation -->|service role key| API
    DS -->|runs| SD
    WR -->|runs| WP
    MR -->|runs| MP
    CI -->|runs| VD
    CI -->|runs| TT

    SD -->|writes| DB
    WP -->|writes| DB
    MP -->|writes| DB

    USER -->|captures| SC
    USER -->|captures| TG
    SC -->|webhook| API
    TG -->|webhook| API
```

---

## Data Flow

```
                  ┌──────────────┐
                  │   Capture    │  ← User writes a note, idea, event, etc.
                  └──────┬───────┘
                         │
                  ┌──────▼───────┐
                  │    Inbox     │  ← Raw entries table
                  └──────┬───────┘
                         │
                  ┌──────▼───────┐
                  │   Normalize  │  ← Clean types, tags, validate schema
                  └──────┬───────┘
                         │
                  ┌──────▼───────┐
                  │    Store     │  ← Supabase with RLS
                  └──────┬───────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
     ┌──────▼─────┐ ┌───▼────┐ ┌────▼─────┐
     │  Summarize  │ │ Review │ │ Insights │
     │  (daily)    │ │(weekly)│ │ (monthly)│
     └──────┬─────┘ └───┬────┘ └────┬─────┘
            │            │            │
            └────────────┼────────────┘
                         │
                  ┌──────▼───────┐
                  │  Structured  │
                  │   Memory     │
                  └──────────────┘
```

---

## Security Boundary

| Layer | Visibility | Access | Key Type |
|-------|-----------|--------|----------|
| **GitHub Pages** (frontend) | Public (demo only) | Anyone with URL | None |
| **Supabase Data** (tables) | Private per-user | Authenticated user only | Anon key + RLS |
| **Supabase API** (admin) | Private | GitHub Actions only | Service role key |

### Authentication Flow

```
User → GitHub Pages → Supabase Auth (JWT) → Supabase REST API
  │                    │                        │
  │                    │                        └── RLS enforces user_id = auth.uid()
  │                    │
  │                    └── anon key (public, but RLS-protected)
  │
  └── Service Role Key (GitHub Actions, never exposed to frontend)
```

- **Frontend**: Uses the Supabase **anon key** with RLS policies. Each query
  includes a JWT from Supabase Auth; RLS ensures users can only access their own
  `user_id` rows.
- **Backend (GitHub Actions)**: Uses the Supabase **service_role key** (admin).
  Bypasses RLS intentionally — used exclusively for automated daily/weekly/
  monthly scripts.

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Vanilla HTML/CSS/JS | Zero-build static site |
| Hosting | GitHub Pages | Free static hosting |
| Database | Supabase (PostgreSQL) | Auth + structured data |
| Automation | GitHub Actions | Cron-based pipelines |
| Scripts | Python 3.11 | Data processing |
| Diagrams | Mermaid | Architecture docs |

---

## Key Design Decisions

1. **Static frontend**: No build step, no framework lock-in, instant deploys.
2. **Supabase RLS**: Security is enforced at the database level, not the app layer.
3. **Service role isolation**: Backend scripts run with elevated privileges but
   are never exposed to clients.
4. **Cron with dry-run**: All automation workflows support `--dry-run` for
   safe testing.
5. **UTC schedules + DST handling**: Cron runs at UTC times; Python scripts
   convert to Europe/Paris accounting for DST.
