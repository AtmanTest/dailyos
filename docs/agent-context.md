# Daily ADHD — Contexte Agent Hermes v2.1

> **Usage :** Lire ce fichier intégralement avant toute action sur le repo. Ne pas demander de confirmation sur ce qui est déjà spécifié ici.

---

## MISSION

Livrer la version 2.0 complète et finale du repo AtmanTest/dailyos (branch main). Renommer l'app "Daily ADHD" (EN) / "Daily TDAH" (FR). Transformer le site en journal personnel spécialisé TDAH avec bilinguisme complet, design motivant et friction zéro. Tu termines tout, tu pushs tout, tu vérifies tout, puis tu me parles. Aucune question, aucune confirmation, aucun mock livré sans implémentation réelle.

---

## SECTION 1 — ÉTAT RÉEL DU REPO

- **Repo :** AtmanTest/dailyos, branch main
- **URL live :** https://atmantest.github.io/dailyos/
- **Stack :** Vanilla JS SPA, CSS custom, localStorage + Supabase REST, Chart.js, aucun framework

### Structure complète confirmée

```
dailyos/
├── index.html                  # Entry point, scripts avec ?v=2
├── .env.example
├── .gitignore
├── README.md
├── LICENSE
├── 404.html
├── package.json
├── journal.md
├── .github/workflows/
│   ├── pages.yml               # NE PAS MODIFIER
│   ├── ci.yml
│   ├── daily-summary.yml       # NE PAS MODIFIER
│   ├── weekly-review.yml       # NE PAS MODIFIER
│   └── monthly-review.yml      # NE PAS MODIFIER
├── assets/
│   ├── css/app.css
│   └── js/
│       ├── config.js
│       ├── state.js
│       ├── charts.js
│       ├── ui.js
│       ├── demo-data.js
│       ├── api.js
│       ├── auth.js
│       ├── router.js
│       ├── app.js
│       └── pages/
│           ├── today.js
│           ├── journal.js
│           ├── ideas.js
│           ├── reminders.js
│           ├── insights.js
│           └── settings.js
├── supabase/
│   ├── schema.sql
│   └── rls.sql
├── data/                       # LIRE avant toute modification
├── docs/                       # LIRE avant toute modification
├── scripts/                    # LIRE avant toute modification
└── sw.js                       # SI présent : NE PAS MODIFIER. Si absent : NE PAS CRÉER.
```

### Tables Supabase (NE PAS renommer ni supprimer)

`raw_entries`, `daily_summaries`, `ideas`, `reminders`, `insights`, `profiles`

### Routes SPA hash-router

| Hash | Fichier |
|------|---------|
| `#/` ou `#/today` | today.js |
| `#/journal` | journal.js |
| `#/ideas` | ideas.js |
| `#/reminders` | reminders.js |
| `#/insights` | insights.js |
| `#/settings` | settings.js |

### Infra Supabase

- **Project ID :** `wlxtulibsipesxpwkhyz` (eu-west-3)
- **URL :** `https://wlxtulibsipesxpwkhyz.supabase.co`
- **Anon key :** déjà dans `assets/js/config.js` — ne pas modifier, ne pas re-commiter

---

## SECTION 2 — RÈGLES ABSOLUES

1. Lire **chaque fichier existant** via Contents API AVANT toute modification — ne jamais écraser à l'aveugle.
2. Ne supprimer aucune fonctionnalité existante qui fonctionne.
3. **Cache-busting :** incrémenter tous les `?v=2` à `?v=3` dans `index.html` pour les fichiers modifiés uniquement.
4. Ne jamais commiter un secret, token, clé API ou PAT — ni dans le code, ni dans un commentaire, ni dans ce fichier.
5. Ne jamais livrer un mock ou placeholder vide à la place d'une vraie implémentation.
6. Ne poser aucune question. Ne demander aucune confirmation. Prendre la meilleure décision technique.
7. Finir 100% du travail, puis produire le rapport final. Pas de rapport intermédiaire.
8. `pages.yml` : ne jamais modifier la ligne `path: '.'` — NE PAS TOUCHER ce fichier.
9. Push uniquement via **GitHub Contents API** (blob → tree → commit → ref). Pas de `git push` HTTPS.
10. Tout doit fonctionner en **mode démo** (localStorage) ET en **mode réel** (Supabase).
11. Critère TDAH : chaque nouvelle fonctionnalité doit être utilisable en **moins de 10 secondes** sans lire d'instructions.
12. **Zéro écran blanc**, zéro état de chargement silencieux — toujours un feedback visuel immédiat.
13. Toute interaction : **moins de 3 clics/taps** maximum.
14. **Stratégie commit résiliente :** si un commit échoue (SHA stale), re-lire le fichier → obtenir SHA à jour → recommencer ce commit seul. Ne pas bloquer toute la chaîne. Logger les fichiers en échec dans le rapport.
15. Ne jamais créer de doublon de fichier ou de fonction — vérifier l'existence avant de créer.

---

## SECTION 3 — IDENTITÉ ET BRANDING

- Remplacer "DailyOS" par **"Daily ADHD"** (EN) / **"Daily TDAH"** (FR) partout : `<title>`, header, README, 404.html, meta tags, toasts, modals.
- **Tagline EN :** "Your brain, your rules." / **FR :** "Ton cerveau, tes règles."
- **Favicon :** emoji ⚡ via `<link rel="icon">` data URI SVG inline (pas de fichier image externe).
- **Meta description EN :** "Daily ADHD — Personal journal built for ADHD brains. Fast, visual, distraction-free."
- **Meta description FR :** "Daily TDAH — Journal personnel conçu pour les cerveaux TDAH. Rapide, visuel, sans distraction."
- `og:title` et `og:description` à jour selon la langue active.

---

## SECTION 4 — BILINGUISME FR / EN

Créer `assets/js/i18n.js` :

```js
const TRANSLATIONS = {
  fr: { /* toutes les clés */ },
  en: { /* toutes les clés */ }
};
function t(key, vars) {
  const lang = localStorage.getItem('dailyos_lang') || 'fr';
  let str = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key])
    || (TRANSLATIONS['fr'] && TRANSLATIONS['fr'][key])
    || key;
  if (vars) Object.keys(vars).forEach(k => {
    str = str.replace('{{' + k + '}}', vars[k]);
  });
  return str;
}
window.t = t;
window.TRANSLATIONS = TRANSLATIONS;
```

Couvrir **100% des chaînes visibles** : labels, boutons, titres, toasts, erreurs, placeholders, empty states, badges streak, types d'entrées, catégories, statuts, confirmations.

### Types d'entrées

| Clé | FR | EN |
|-----|----|----|
| thought | Pensée | Thought |
| idea | Idée | Idea |
| action | Action | Action |
| event | Événement | Event |
| mood | Humeur | Mood |
| reminder | Rappel | Reminder |
| win | Victoire | Win |
| blocker | Blocage | Blocker |
| note | Note | Note |

### Toggle langue

- Stocker dans localStorage : clé `dailyos_lang`, valeur `"fr"` ou `"en"`.
- Langue par défaut : `"fr"`.
- Toggle visible dans le **header** (bouton FR | EN) ET dans la page **Réglages**.
- Changement de langue → appeler `refreshLang()` qui met à jour tous les `data-i18n="key"` via `querySelectorAll`. **Ne pas recharger la page.**
- Ajouter `data-i18n="key"` à tous les éléments statiques traduits dans `index.html` et templates JS.
- Les contenus saisis par l'utilisateur ne sont **jamais** traduits.

---

## SECTION 5 — DESIGN SYSTEM v2.0 TDAH

Mettre à jour `assets/css/app.css` — **conserver tout l'existant**, ajouter :

### Nouvelles variables CSS

```css
--color-accent: #7C3AED;
--color-accent-secondary: #A3E635;
--color-accent-hover: #6D28D9;
--color-card-radius: 16px;
--color-fab-size: 56px;
--color-streak-gold: #F59E0B;
--color-win: #10B981;
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
```

> Si des variables du même nom existent déjà : mettre à jour leurs valeurs, ne pas dupliquer.

### Animation `.adhd-pulse`

```css
@keyframes adhd-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(124,58,237,0); }
}
.adhd-pulse { animation: adhd-pulse 2s infinite; }
@media (prefers-reduced-motion: reduce) { .adhd-pulse { animation: none; } }
```

### FAB `.fab-quick-entry`

- `position: fixed; bottom: 24px; right: 24px`
- Taille : `var(--color-fab-size)` × `var(--color-fab-size)`, `border-radius: 50%`
- `background: var(--color-accent); color: white; font-size: 28px`
- Box-shadow prononcé, `z-index: 1000`, classe `.adhd-pulse`
- Hover : `scale(1.1)`, `background: var(--color-accent-hover)`
- Active : `scale(0.95)`
- Masqué sur Réglages : `.page-settings .fab-quick-entry { display: none }`

### Bottom nav mobile (`max-width: 768px`)

- Height: 64px, 5 onglets (Today, Journal, Ideas, Reminders, Insights)
- Icône emoji + label court, min touch target 44×44px
- Onglet actif : `color: var(--color-accent)`, indicator line en haut

### Quick moods `.quick-moods-bar`

- Flexbox, gap: 8px, 5 boutons emoji 28px
- Selected : `background: var(--color-accent)` opacity 0.2, border 1px

### Streak badge `.streak-badge`

- `inline-flex`, gradient `var(--color-streak-gold)` sur le chiffre
- Classe `.streak-new` pour animation flash (1 seule fois)

### Win section `.win-section`

- `border-left: 3px solid var(--color-win); padding-left: 16px`

### Flash Capture modal `.flash-capture-modal`

- Bottom sheet sur mobile (border-radius 20px en bas), centré desktop
- Animation slide-up 200ms, 1 champ texte + bouton Confirmer uniquement

### Confetti `.confetti-burst`

- 5 spans générés dynamiquement, couleurs aléatoires parmi accent/secondary/streak-gold
- Animation scale(0)→scale(1)→translateY(-40px)+opacity(0), 600ms
- Respecter `prefers-reduced-motion`, supprimer via `animationend`

### Badge mode réel `.mode-badge`

- Visible uniquement en mode réel, texte "🔴 LIVE"
- `background: var(--color-win); color: white; font-size: 10px; border-radius: 4px; padding: 2px 6px`

---

## SECTION 6 — FONCTIONNALITÉS TDAH

### A. Quick Entry FAB (toutes pages sauf Réglages)

- Clic FAB → modal léger : champ texte **autofocus**, sélecteur type (emojis), heure auto, date auto.
- Aucun autre champ obligatoire.
- Validation : 1 clic → toast + confetti + fermeture.
- Raccourci clavier : `Ctrl+Entrée` pour valider.
- Fermeture : clic overlay, `Escape`, ou bouton ✕.

### B. Quick Moods (today.js)

- 5 boutons : 😴(1) 💫(2) ⚡(3) 🔥(4) 🌪️(5)
- 1 tap → entrée type `mood` + score + timestamp, sauvegarde immédiate.
- Bouton actif visuellement 2s, toast discret.
- Afficher le dernier mood du jour sous les boutons.
- Empiler les moods dans l'historique, ne pas écraser.

### C. Streak (today.js)

Calcul déterministe (localStorage ou Supabase) du nombre de jours consécutifs avec ≥ 1 entrée.

| Valeur | Label FR | Label EN |
|--------|----------|----------|
| 0 | Commence maintenant 💥 | Start now 💥 |
| 1 | Journée en cours ⚡ | Day in progress ⚡ |
| 2 | 2 jours de suite 🔥 | 2 days in a row 🔥 |
| 3–6 | X jours de suite 🔥 | X days in a row 🔥 |
| 7–29 | X jours — une semaine+ 💎 | X days — over a week 💎 |
| 30+ | X jours — un mois 🚀 | X days — a month 🚀 |

Animation `.streak-new` si streak a augmenté depuis `dailyos_last_streak` (localStorage).

### D. Message contextuel (today.js)

| Heure | FR | EN |
|-------|----|----|
| 5h–11h59 | Nouvelle journée. Qu'est-ce qui compte aujourd'hui ? | New day. What matters today? |
| 12h–17h59 | Mi-journée. Qu'est-ce qui s'est passé ? | Midday. What happened? |
| 18h–21h59 | Fin de journée. Bilan rapide ? | End of day. Quick recap? |
| 22h–4h59 | Nuit tardive. Une pensée ? | Late night. One thought? |

### E. Reminder Nudge

- Condition : aucune entrée du jour ET heure ≥ 18:00.
- Toast non bloquant, **1 seule fois par session** (`sessionStorage` clé `dailyos_nudge_shown`).
- Inclut un bouton "+ Entrée" qui ouvre le FAB.

### F. Win du jour (today.js)

- Champ texte + bouton "Ajouter" / "Add" → entrée type `win` → confetti → toast.
- Afficher les 3 derniers wins du jour.
- **Pas de suppression** depuis cette vue (intentionnel — psychologie positive).
- Empty state : "Rien encore — ta première victoire, même petite 💪" / "Nothing yet — your first win, even small 💪"

### G. Priorité de demain (today.js)

- Champ texte "Ma priorité de demain" / "Tomorrow's focus" en bas de page.
- Vérifier `schema.sql` : si colonne `metadata` est JSONB → stocker `{ "tomorrow": true }` dedans. Sinon → préfixer le contenu avec `[TOMORROW] `. **Ne pas faire d'ALTER TABLE automatiquement.**
- Le lendemain : afficher en haut de today.js dans un bloc "Focus du jour" / "Today's focus".
- Si non marquée done → badge "Reportée" / "Carried over".
- Bouton "Fait ✓" / "Done ✓" → marque `completed`, confetti, badge "✅ Accompli".

### H. Capture Éclair Idées (ideas.js)

- Bouton "⚡ Capture éclair" / "⚡ Flash capture" en haut.
- Ouvre le FAB modal pré-sélectionné sur type `idea`, sauvegarde en statut `inbox`.

### I. Migration localStorage → Supabase

- Après `signIn` / `signUp` réussi : détecter entrées sans flag `synced: true`.
- Toast : "X entrées locales détectées — synchroniser ? [Oui] [Plus tard]"
- Si "Oui" : push **séquentiel** (pas parallèle) via `api.js`. Marquer `synced: true` après confirmation serveur.
- Erreur partielle : stopper proprement, afficher X/total, proposer de réessayer.
- Si "Plus tard" : `dailyos_sync_pending = true` dans localStorage, re-proposer à la prochaine session.

---

## SECTION 7 — MISE À JOUR DES PAGES

### today.js
Ajouter (dans l'ordre visuel) : streak → message contextuel → quick moods → scores existants → chronologie existante → Win du jour → Priorité de demain. Afficher priorité du jour (veille) en tout premier si elle existe. Appliquer `t()`.

### journal.js
Ajouter filtre par type (emojis) + pagination 20 entrées, bouton "Voir plus ↓" / "Load more ↓". Conserver formulaire. Appliquer `t()`.

### ideas.js
Ajouter bouton Capture Éclair + filtres tag/statut + champ "Prochaine action" inline. Inbox : `border-left 3px var(--color-accent)`. Appliquer `t()`.

### reminders.js
Ajouter 3 tabs : Aujourd'hui / Cette semaine / Tous. Snooze rapide : +1h, +1j, +3j. Appliquer `t()`.

### insights.js
Ajouter section "Patterns TDAH" après les graphiques. Patterns **100% déterministes** (pas de LLM) :
- Heure la plus productive (30 derniers jours)
- Énergie moyenne les jours avec une victoire (si ≥ 5 points)
- Nombre d'idées cette semaine
- Jours sans entrée cette semaine (X/7)
- Type d'entrée le plus fréquent

Afficher uniquement si ≥ 5 points de données. **Jamais de diagnostic, jugement ou inférence psychologique.** Appliquer `t()`.

### settings.js
Ajouter : toggle langue FR/EN en haut + section "Profil TDAH" :
- Nom d'affichage (`dailyos_display_name`)
- Sélecteur fuseau horaire (zones IANA principales)
- Heure de coucher (HH:MM, optionnel)
- Champ Médication (**UNIQUEMENT localStorage** clé `dailyos_medication`, jamais envoyé à Supabase, label explicite : "Stocké localement uniquement, jamais partagé" / "Stored locally only, never shared")

Indicateur sync : badge "X entrées en attente" si `dailyos_sync_pending = true`, bouton "Synchroniser maintenant".

---

## SECTION 8 — SUPABASE

Ne pas modifier `schema.sql` de manière destructive. Lire le fichier avant modification. Ajouter uniquement ce commentaire en bas :

```sql
-- Migration v2.0 : gestion du champ "tomorrow" sur raw_entries
-- Option A (metadata JSONB) : stocker { "tomorrow": true } dans metadata — aucune ALTER TABLE.
-- Option B (metadata absent ou non JSONB) : exécuter manuellement :
--   ALTER TABLE raw_entries ADD COLUMN IF NOT EXISTS tomorrow BOOLEAN DEFAULT FALSE;
-- Les policies RLS existantes couvrent les nouvelles colonnes par héritage.
```

---

## SECTION 9 — index.html

Lire avant modification. Appliquer :
- `<title>` : "Daily ADHD"
- Meta description + og:title + og:description
- Favicon data URI SVG emoji ⚡
- Ajouter `<script src="assets/js/i18n.js?v=3"></script>` **AVANT** app.js
- Incrémenter `?v=2` → `?v=3` pour tous les fichiers modifiés
- FAB HTML dans le body (hors conteneur page) : `<button class="fab-quick-entry adhd-pulse" id="fab-quick-entry" aria-label="Quick entry">+</button>`
- Attributs `data-i18n` sur tous les éléments statiques traduits

---

## SECTION 10 — WORKFLOWS

- `pages.yml` → **NE PAS MODIFIER**
- `daily-summary.yml`, `weekly-review.yml`, `monthly-review.yml` → **NE PAS MODIFIER**
- `ci.yml` → mise à jour optionnelle pour valider parité des clés i18n FR ↔ EN

---

## SECTION 11 — ORDRE D'EXÉCUTION

**ÉTAPE 1 — LECTURE** (obligatoire avant toute écriture)
Lire : `index.html`, `app.css`, `app.js`, `config.js`, `api.js`, `auth.js`, `router.js`, `state.js`, `ui.js`, `today.js`, `journal.js`, `ideas.js`, `reminders.js`, `insights.js`, `settings.js`, `schema.sql`, `rls.sql`, `pages.yml`
ET lire : `data/`, `docs/`, `scripts/`

**ÉTAPE 2** — Créer `assets/js/i18n.js` (100% des strings FR + EN)

**ÉTAPE 3** — Mettre à jour `assets/css/app.css`

**ÉTAPE 4** — Mettre à jour les pages JS dans cet ordre :
`app.js` → `today.js` → `journal.js` → `ideas.js` → `reminders.js` → `insights.js` → `settings.js` → `api.js` → `auth.js`

**ÉTAPE 5** — Mettre à jour `index.html` + `schema.sql`

**ÉTAPE 6 — PUSH** via GitHub Contents API :
- Commit 1 : `i18n.js`
- Commit 2 : `app.css`
- Commit 3 : pages JS + `api.js` + `auth.js`
- Commit 4 : `index.html` + `schema.sql`

> Si commit échoue (SHA stale) : re-lire le fichier → SHA à jour → recommencer ce commit seul. Logger les échecs.

**ÉTAPE 7** — Vérification mentale : titre "Daily ADHD", FAB visible, hash router fonctionnel, pas d'erreurs JS évidentes.

**ÉTAPE 8** — Rapport final.

---

## SECTION 12 — RAPPORT FINAL OBLIGATOIRE

Produire uniquement après avoir terminé toutes les étapes.

```
STATUS : GO / NO-GO
VERSION : 2.0
URL LIVE : https://atmantest.github.io/dailyos/
FICHIERS MODIFIÉS OU CRÉÉS : liste avec raison courte
FONCTIONNALITÉS LIVRÉES : liste
FONCTIONNALITÉS NON LIVRÉES : raison réelle uniquement
MIGRATION SUPABASE : commande ALTER TABLE à exécuter manuellement si nécessaire
CACHE-BUSTING : version ?v= appliquée
COMMITS : liste avec SHA résultant
FICHIERS EN ÉCHEC : nom + erreur + action de reprise
BUGS CONNUS : uniquement les vrais blocages
NEXT : une seule action si nécessaire
```

---

*Commence maintenant. Ne pose aucune question. Ne t'arrête pas. Finis tout. Parle uniquement quand c'est terminé.*
