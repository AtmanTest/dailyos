# Daily ADHD / Daily TDAH

**Ton cerveau, tes règles. — Your brain, your rules.**

Journal personnel spécialisé TDAH. Rapide, visuel, sans distraction.
Bilingue FR/EN. Fonctionne en localStorage (hors ligne) ou Supabase.

## Quick Start

```bash
# Lancer le frontend de démo
cd dailyos && python3 -m http.server 8080

# Tester les scripts backend
pytest scripts/test_scripts.py -v
```

## Structure

- `assets/` — Frontend vanilla HTML/CSS/JS (SPA, dark theme)
- `scripts/` — Python : ingestion, normalisation, synthèse, insights
- `data/demo/` — 30 jours de données fictives
- `supabase/` — Schéma SQL + RLS + seed
- `.github/workflows/` — CI, Pages, bilans quotidiens
- `docs/` — Architecture, déploiement, sécurité, test plan

## Privacy

Les données réelles vont dans Supabase (RLS). GitHub Pages sert uniquement la démo statique. Aucun secret dans le code.

## Licence

MIT
