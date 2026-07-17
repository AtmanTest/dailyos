# Daily ADHD — Test Plan v2.0

> Ce document est la référence QA complète pour Daily ADHD v2.0.  
> Les tests automatisés (pytest) s'exécutent à chaque push sur `main` et `develop` via CI.  
> Les tests manuels couvrent les fonctionnalités TDAH spécifiques.

---

## Automated Tests (CI)

### pytest (`scripts/test_scripts.py`)

Run via CI workflow on every push. Tests cover:

| Test | What It Verifies |
|------|------------------|
| `test_parse_raw_*` | Parsing de toutes les entrées (thought, idea, mood, event, reminder, blocker) |
| `test_deduplicate_*` | Déduplication exacte et par date |
| `test_validate_entry_*` | Validation de type, date, champs requis, mood out-of-range |
| `test_generate_daily_summary_*` | Résumé journalier vide, rich, moyennes mood, mock mode |
| `test_process_reminders_*` | Extraction et catégorisation des rappels |
| `test_check_due_reminders` | Détection des rappels en retard |
| `test_compute_insights_*` | Calcul insights 7j, vide, mock mode |
| `test_validate_demo_data` | Intégrité des fichiers JSON de démo |
| `test_schemas_*` | Validation Pydantic de tous les modèles |
| `test_integration_full_pipeline` | Pipeline complet parse → validate → summarize → insights |

### Validation data (`scripts/validate_data.py`)

1. Demo data JSON matches raw_entries schema
2. Schema integrity (no missing required fields)
3. Seed SQL parseable
4. All expected doc files exist
5. All referenced scripts exist in `scripts/`

### i18n parity check (CI)

Vérification automatique que chaque clé présente en `fr` existe aussi en `en` dans `assets/js/i18n.js`.

### Secret scan (CI)

Détection de tokens `ghp_`, `sk-`, `sbp_`, clés Supabase dans tous les fichiers committés.

### Structure check (CI)

Vérification que les fichiers critiques existent bien après chaque push :
- `index.html`, `assets/js/i18n.js`, `assets/css/app.css`
- `assets/js/app.js`, `assets/js/pages/today.js`
- `.github/workflows/pages.yml`

### Running Locally

```bash
pip install -r scripts/requirements.txt
pytest scripts/test_scripts.py -v
python3 scripts/validate_data.py
```

---

## Manual Test Checklist — Core (hérité v1)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Capture entry | FAB → saisie → Ctrl+Entrée | Entrée dans le feed, toast succès |
| 2 | Today entries | Clic "Aujourd'hui" | Seules les entrées du jour, newest first |
| 3 | Edit entry | Clic éditer → modifier | Entrée mise à jour |
| 4 | Delete entry | Clic supprimer → confirmer | Entrée retirée du feed |
| 5 | Filter by type | Sélectionner filtre emoji | Seules les entrées du type sélectionné |
| 6 | Filter by tag | Clic tag | Feed filtré par tag |
| 7 | Toggle theme | Dark / Light | Switch fluide, persistence localStorage |

---

## Manual Test Checklist — TDAH Features v2.0

### FAB Quick Entry

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 8 | FAB visible | Ouvrir n'importe quelle page sauf Réglages | Bouton + visible en bas à droite avec pulse |
| 9 | FAB masqué Réglages | Aller sur `#/settings` | FAB absent |
| 10 | Autofocus | Clic FAB | Curseur directement dans le champ texte |
| 11 | Validation 1 clic | Saisir texte → clic "Ajouter" | Toast succès + confetti + modal fermée |
| 12 | Ctrl+Entrée | Saisir texte → Ctrl+Entrée | Même résultat que clic bouton |
| 13 | Fermeture Escape | FAB ouvert → Escape | Modal fermée, aucune entrée créée |
| 14 | Fermeture overlay | FAB ouvert → clic hors modal | Modal fermée |
| 15 | Sélecteur type | Clic icône type → changer | Type de l'entrée créée = type sélectionné |

### Quick Moods

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 16 | 5 boutons présents | Page Aujourd'hui | 😴💫⚡🔥🌪️ visibles |
| 17 | 1 tap = entrée | Tap sur ⚡ | Entrée type mood score=3 créée, toast discret |
| 18 | Feedback visuel | Tap bouton | Bouton reste actif 2s puis revient neutre |
| 19 | Dernier mood affiché | Après 2 moods | Badge sous les boutons = dernier mood du jour |
| 20 | Historique empilé | 3 moods dans la journée | 3 entrées mood dans le feed, pas d'écrasement |

### Streak

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 21 | Streak 0 | Compte vide | "Commence maintenant 💥" affiché |
| 22 | Streak 1 | 1 entrée aujourd'hui | "Journée en cours ⚡" |
| 23 | Streak 7 | 7 jours consécutifs | "7 jours — une semaine+ 💎" |
| 24 | Streak 30 | 30 jours consécutifs | "30 jours — un mois 🚀" |
| 25 | Animation streak-new | Streak augmente | Flash gold une seule fois |
| 26 | Streak cassé | Jour sans entrée | Retour à 0 ou 1 selon aujourd'hui |

### Message Contextuel

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 27 | Matin (9h) | Ouvrir à 9h | "Nouvelle journée. Qu'est-ce qui compte aujourd'hui ?" |
| 28 | Après-midi (14h) | Ouvrir à 14h | "Mi-journée. Qu'est-ce qui s'est passé ?" |
| 29 | Soir (20h) | Ouvrir à 20h | "Fin de journée. Bilan rapide ?" |
| 30 | Nuit (23h) | Ouvrir à 23h | "Nuit tardive. Une pensée ?" |

### Reminder Nudge

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 31 | Nudge affiché | Aucune entrée + heure ≥ 18h | Toast nudge affiché 1 fois |
| 32 | Nudge 1 fois/session | Fermer et rouvrir même session | Nudge ne réapparaît pas |
| 33 | Bouton nudge → FAB | Clic "+ Entrée" dans le toast | FAB Quick Entry s'ouvre |
| 34 | Pas de nudge si entrée | 1 entrée du jour + heure ≥ 18h | Aucun nudge |

### Win du Jour

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 35 | Empty state | Aucun win | "Rien encore — ta première victoire, même petite 💪" |
| 36 | Ajouter un win | Saisir texte → "Ajouter" | Entrée type win + confetti + toast |
| 37 | 3 wins affichés | 5 wins dans la journée | Seulement les 3 derniers affichés |
| 38 | Pas de suppression | Chercher bouton supprimer | Absent (intentionnel) |

### Priorité de Demain

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 39 | Saisir priorité | Champ en bas de today.js → sauvegarder | Entrée type action créée |
| 40 | Focus du jour J+1 | Le lendemain, ouvrir l'app | Bloc "Focus du jour" en haut avec la priorité |
| 41 | Badge Reportée | Priorité non faite → J+2 | Badge "Reportée" sur le bloc focus |
| 42 | Bouton Fait ✓ | Clic "Fait ✓" | Confetti + badge "✅ Accompli" |

### Bilinguisme FR/EN

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 43 | Toggle header | Clic "EN" dans le header | Toute l'UI passe en anglais sans rechargement |
| 44 | Toggle retour FR | Clic "FR" | Toute l'UI repasse en français |
| 45 | Persistence langue | Toggle EN → refresh page | Langue EN conservée (localStorage) |
| 46 | Contenus utilisateur non traduits | Entrée en FR avec UI en EN | Contenu de l'entrée reste en FR |
| 47 | Parité des clés | — | CI vérifie : aucune clé manquante EN vs FR |

### Capture Éclair Idées

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 48 | Bouton présent | Page Ideas | "⚡ Capture éclair" en haut |
| 49 | Type pré-sélectionné | Clic capture éclair | Modal ouverte avec type = idea |
| 50 | Sauvegarde inbox | Valider | Idée créée en statut inbox |

### Patterns TDAH (Insights)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 51 | Section absente si < 5 données | Compte avec 2 entrées | Section Patterns absente |
| 52 | Heure productive | 30 jours de données | "Tu saisis le plus entre Xh et Yh" affiché |
| 53 | Énergie win days | 5+ jours avec win | Énergie moyenne affichée |
| 54 | Idées semaine | Données présentes | Nombre d'idées cette semaine affiché |
| 55 | Jours vides | Données présentes | "Jours sans entrée cette semaine : X/7" |
| 56 | Type fréquent | Données présentes | Type le plus fréquent affiché |
| 57 | Aucun diagnostic | Lire tous les patterns | Aucun jugement, aucune inférence psych. |

### Migration localStorage → Supabase

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 58 | Détection entrées locales | Se connecter avec entrées locales | Toast "X entrées locales détectées" |
| 59 | Sync "Oui" | Clic "Oui" | Entrées poussées séquentiellement, flag synced: true |
| 60 | Sync "Plus tard" | Clic "Plus tard" | dailyos_sync_pending = true, re-proposé à prochaine session |
| 61 | Pas de doublons | Sync réussie → reconnecter | Toast ne réapparaît pas |
| 62 | Erreur partielle | Couper réseau en cours de sync | Affiche X/total synced, bouton "Réessayer" |

### Profil TDAH (Settings)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 63 | Nom d'affichage | Saisir nom → sauvegarder | Nom stocké en localStorage |
| 64 | Médication privée | Saisir médication | Label "Stocké localement uniquement, jamais partagé" visible |
| 65 | Médication non synced | Se connecter → sync | Champ médication absent des données envoyées à Supabase |
| 66 | Fuseau horaire | Changer timezone | Stocké en localStorage, heures des messages contextuels recalculées |

---

## Responsive & Accessibilité

| # | Test | Expected |
|---|------|----------|
| 67 | 320px | Pas de scroll horizontal, FAB visible |
| 68 | 375px (iPhone SE) | Bottom nav visible, touch targets ≥ 44px |
| 69 | 768px (iPad) | Layout adapté |
| 70 | 1024px+ | Desktop layout |
| 71 | prefers-reduced-motion | Toutes les animations désactivées (adhd-pulse, confetti, streak-new) |
| 72 | Keyboard navigation | Tab → focus visible sur tous les éléments interactifs |

---

## Error States

| # | Test | Expected |
|---|------|----------|
| 73 | Network offline | Banner erreur + bouton retry |
| 74 | API 401 | "Session expirée" + redirect login |
| 75 | Submit vide | Validation inline "Contenu requis" |
| 76 | Texte > 10 000 chars | Message limite caractères |

---

## QA Workflow (à suivre à chaque push)

1. **CI automatique** : pytest + validate_data + i18n parity + secret scan + structure check
2. **Smoke test manuel** : tests 1, 8, 11, 17, 35, 43 (< 5 min)
3. **Regression TDAH** : tests 8–57 après toute modification de today.js, ideas.js, insights.js
4. **Test sécurité** : tests 64–65 après toute modification de settings.js ou api.js
5. **Cross-browser** : Chrome, Firefox, Safari, Edge
6. **Mobile** : iOS Safari, Android Chrome (tests 67–70)
