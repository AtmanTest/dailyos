# AGENTS.md — Inter-Agent Communication Protocol

> Ce fichier documente les conventions de coordination entre les agents qui travaillent sur le repo `AtmanTest/dailyos` et le projet Supabase `wlxtulibsipesxpwkhyz`.

---

## Agents actifs

| Nom | Canal principal | Rôle |
|-----|----------------|------|
| **Hermes** | Telegram → GitHub Issues + Supabase | Coordination, tâches humain→machine |
| **DailyOS Agent** | Supabase Realtime + GitHub poll | Exécution, commits, migrations |

---

## Canal 1 — GitHub Issues (humain-lisible)

### Label
`agent-task` (violet `#7B2FBE`) — toute issue portant ce label est une tâche machine.

### Format du body (JSON strict)

```json
{
  "from": "hermes",
  "to": "dailyos-agent",
  "task": "Description courte de la tâche",
  "priority": "low | medium | high | critical",
  "done_when": "Condition de complétion observable",
  "payload": {}
}
```

### Cycle de vie

```
Ouverte (pending)
  └─► Agent claim → commente "⏳ claimed by dailyos-agent"
        └─► Succès  → commente "✅ done: <résumé>"  → GitHub Action ferme l'issue
        └─► Bloqué  → commente "🚫 blocked: <raison>" → reste ouverte
```

### GitHub Action auto-close

Fichier : `.github/workflows/close-agent-task.yml`
Déclenché sur : `issue_comment` contenant `✅ done`
Action : ferme l'issue + ajoute label `completed`

---

## Canal 2 — Table Supabase `agent_tasks` (machine-to-machine)

### Schéma

```sql
-- voir supabase/agent_tasks.sql
```

### Statuts

| Status | Sens |
|--------|------|
| `pending` | Tâche créée, non prise en charge |
| `claimed` | Agent a pris la tâche (updated_at mis à jour) |
| `done` | Tâche terminée, `result` rempli |
| `blocked` | Tâche échouée, `error` rempli |

### Écoute Realtime (DailyOS Agent)

```js
supabase
  .channel('agent-tasks')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'agent_tasks',
    filter: `to=eq.dailyos-agent`
  }, (payload) => handleAgentTask(payload.new))
  .subscribe();
```

### Insertion par Hermes

```js
await supabase.from('agent_tasks').insert({
  from: 'hermes',
  to: 'dailyos-agent',
  task: { action: 'run_migration', file: 'supabase/xxx.sql' },
  priority: 'high'
});
```

---

## Canal 3 — `agent/handoff.json` (fallback git)

Fichier de dernier recours si Supabase/GitHub API indisponibles.

```json
{
  "updated_at": "2026-07-20T00:00:00Z",
  "pending": [],
  "done": [],
  "blocked": []
}
```

Chaque agent lit ce fichier au démarrage de cycle et y commit ses mises à jour.
**Attention** : risque de conflit git si les deux agents commitent en même temps — utiliser une branche dédiée `agent/sync`.

---

## Règles anti-conflits

1. **Jamais deux agents sur la même branche en même temps.** Un agent claim une branche via `agent_tasks` avant de commiter.
2. **Main est protégé.** Tout passe par PR ou branche `feature/`.
3. **Un seul agent applique une migration à la fois.** Vérifier `status = pending` avant `claimed`.
4. **Timeout claim : 10 minutes.** Si `claimed` depuis >10 min sans `done`, la tâche repasse en `pending`.

---

## Priorités

| Priorité | Délai de traitement cible |
|----------|---------------------------|
| `critical` | Immédiat (dès réception Realtime) |
| `high` | < 5 min |
| `medium` | Prochain cycle (≤ 30 min) |
| `low` | Best effort |
