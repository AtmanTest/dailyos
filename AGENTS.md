# Daily ADHD — Agent Context

> Ce fichier est lu automatiquement par les agents IA (Cursor, Copilot, ChatGPT, etc.)
> Ne pas modifier sans mettre à jour la section "Last updated".
> Last updated: 2026-07-17

---

## Projet

**Daily ADHD** — Journal personnel conçu pour les cerveaux TDAH.
- Repo : https://github.com/AtmanTest/dailyos
- App live : https://atmantest.github.io/dailyos/
- Branche principale : `main`

---

## Stack technique

| Couche | Techno |
|--------|--------|
| Frontend | HTML + CSS + JS vanilla (aucun framework) |
| Auth + DB | Supabase (projet `wlxtulibsipesxpwkhyz`) |
| SDK | `@supabase/supabase-js@2` via CDN esm.sh |
| Hébergement | GitHub Pages (`.github/workflows/pages.yml`) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |
| Tests backend | pytest (`scripts/test_scripts.py`) |
| Tests E2E | Playwright (`tests/e2e/smoke.spec.js`) |

---

## Architecture fichiers

```
/
├── index.html                   # Point d'entrée unique (SPA hash-router)
├── assets/
│   ├── css/app.css              # Tous les styles (variables CSS, dark/light)
│   └── js/
│       ├── config.js            # APP_CONFIG (Supabase URL, anonKey, nav items)
│       ├── state.js             # Store réactif (demoMode, user, theme, lang…)
│       ├── i18n.js              # Traductions FR/EN (window.t())
│       ├── router.js            # Hash router (#/today, #/journal, etc.)
│       ├── api.js               # CRUD : getEntries, addEntry, addIdea… (LS ou Supabase)
│       ├── auth.js              # Auth : signIn, signUp, signInWithGoogle, sendPasswordReset
│       ├── ui.js                # Header (avatar profil), sidebar, bottom nav, toasts
│       └── pages/
│           ├── today.js         # Page Aujourd'hui (FAB, streak, moods, wins, tomorrow)
│           ├── journal.js       # Page Journal
│           ├── ideas.js         # Page Idées (capture éclair)
│           ├── reminders.js     # Page Rappels
│           ├── insights.js      # Page Insights (patterns TDAH)
│           └── settings.js      # Page Réglages (profil TDAH, langue, thème)
├── scripts/                     # Scripts Python backend (ingest, normalize, summarize…)
├── data/demo/                   # Données de démo JSON
├── tests/e2e/smoke.spec.js      # Tests Playwright (25 tests navigateur)
└── docs/test-plan.md            # Plan de test complet v2.0 (76 cas)
```

---

## Fonctionnalités implémentées (v2.0)

### Auth
- ✅ Inscription email/password
- ✅ Connexion email/password
- ✅ Déconnexion
- ✅ Mot de passe oublié (email reset via Supabase)
- ✅ Google OAuth (`signInWithGoogle` → `supabase.auth.signInWithOAuth`)
- ✅ `onAuthStateChange` → header se met à jour automatiquement
- ✅ Avatar + dropdown profil en haut à droite du header
- ✅ Sync localStorage → Supabase après connexion

### TDAH Features
- ✅ FAB Quick Entry (autofocus, Ctrl+Entrée, Escape, sélecteur de type)
- ✅ Quick Moods (5 emojis, 1 tap = entrée mood)
- ✅ Streak (calcul jours consécutifs, animation streak-new)
- ✅ Message contextuel (matin/après-midi/soir/nuit)
- ✅ Reminder nudge (1 fois/session si aucune entrée après 18h)
- ✅ Win du jour (+ confetti)
- ✅ Priorité de demain (focus J+1)
- ✅ Toggle FR/EN sans rechargement (localStorage persistence)
- ✅ Capture éclair idées (pré-sélection type=idea)
- ✅ Patterns TDAH dans Insights (heure productive, énergie, etc.)
- ✅ Migration localStorage → Supabase

### CI (chaque push sur main/develop)
- ✅ pytest 50+ tests backend
- ✅ Structure check (17 fichiers critiques + ?v= cohérent)
- ✅ i18n parity FR ↔ EN
- ✅ Secret scan (ghp_, sk-, sbp_)
- ✅ Playwright E2E (25 tests navigateur, Chromium + iPhone 14)

---

## Ce qui RESTE à configurer (dashboards uniquement, pas de code)

### Google OAuth
1. **Google Cloud Console** → Créer identifiants OAuth 2.0
   - Origines JS : `https://atmantest.github.io`
   - URI de redirection : `https://wlxtulibsipesxpwkhyz.supabase.co/auth/v1/callback`
2. **Supabase Dashboard** → Authentication → Providers → Google
   - Coller Client ID + Client Secret

---

## Règles pour les agents

### À TOUJOURS faire
- Lire ce fichier en entier avant toute modification
- Respecter le style vanilla JS (pas de `import/export` ES modules sauf CDN)
- Toujours incrémenter `?v=` dans `index.html` quand tu modifies un JS ou CSS
- Maintenir la parité FR/EN dans `i18n.js` (la CI vérifie)
- Ne jamais committer de vraies clés API (la CI scanne)
- Mettre à jour `docs/test-plan.md` si tu ajoutes une feature

### À NE JAMAIS faire
- Ne pas toucher à `.github/workflows/pages.yml` (déploiement GitHub Pages)
- Ne pas installer de bundler (webpack, vite, etc.) — le projet est intentionnellement sans build
- Ne pas changer l'architecture hash-router
- Ne pas mettre de données médicales dans Supabase (médication stockée localStorage uniquement)

### Conventions de code
- Fonctions en camelCase, fichiers en kebab-case
- `escapeHtml()` obligatoire sur tout contenu utilisateur affiché
- `store.setState()` pour tout changement d'état global
- `showToast(message, type)` pour tout feedback utilisateur

---

## Variables d'environnement (GitHub Secrets)

Aucune variable secrète dans le code. La `anonKey` Supabase est publique par nature (clé anon).
Les secrets métier (service role key, etc.) ne doivent jamais apparaître dans ce repo.
