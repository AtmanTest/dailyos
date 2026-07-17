/* ===== DailyOS Demo Data (30 days, French) ===== */
const DEMO_DATA = (function() {
  const today = new Date();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  function dayOfWeek(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.getDay(); // 0=Sun, 6=Sat
  }

  function isWeekend(dateStr) {
    const d = dayOfWeek(dateStr);
    return d === 0 || d === 6;
  }

  // --- ENTRIES ---
  const entries = [];
  const entryTemplates = {
    morning: [
      "Matinée productive, review de code terminée",
      "Réveil à 6h30, café et lecture",
      "Séance de sport à 7h, bonne énergie",
      "Méditation 15 minutes, pleine conscience",
      "Petit-déjeuner healthy: avocat, œufs, pain complet",
      "Planification de la journée, objectifs clairs",
      "Réveil difficile mais motivé après le café",
      "Yoga matinal, étirements et respiration",
      "Check des emails et des notifications",
      "Lecture des news tech et veille sectorielle"
    ],
    afternoon: [
      "Review de code en cours, PR #234 ouverte",
      "Déjeuner rapide, salade composée",
      "Réunion d'équipe: sprint planning (2h)",
      "Debug d'un bug CSS responsive",
      "Appel client: retours positifs sur le projet",
      "Rédaction de la doc API REST",
      "Mise à jour des dépendances npm",
      "Refactoring du module d'authentification",
      "Tests unitaires: 85% de couverture",
      "Design review des nouvelles maquettes",
      "Pair programming sur la feature analytics",
      "Correction de bugs signalés par l'équipe QA",
      "Implémentation de la pagination côté serveur",
      "Optimisation des requêtes SQL (index manquants)",
      "Déploiement staging v0.8.3"
    ],
    evening: [
      "Fin de journée, bilan positif",
      "Marche en ville, 30 minutes d'air frais",
      "Lecture: 'Clean Code' chapitre 4",
      "Appel avec un ami, bonne discussion",
      "Journaling du soir, gratitude",
      "Préparation des repas pour demain",
      "Film: documentaire sur l'IA",
      "Étirement et relaxation avant coucher",
      "Planification du lendemain, priorisation",
      "Musique et détente, playlist jazz",
      "Méditation guidée 20 minutes",
      "Review des objectifs de la semaine"
    ],
    idea: [
      "Idée: créer un outil de tracking d'humeur visuel",
      "Idée: automatiser les rapports hebdomadaires",
      "Pensée: améliorer le système de tags",
      "Idée: intégrer un calendrier mental",
      "Concept: dashboard de productivité personnelle",
      "Idée: système de badges de progression",
      "Noté: fonctionnalité de partage d'insights",
      "Idée: template de daily note automatique",
      "Concept: module de gestion de projets légers",
      "Idée: exporter les données en Markdown"
    ],
    blocker: [
      "Bloqué: dépendance externe non résolue",
      "Problème: API tierce rate-limit atteint",
      "Blocage: décision UI en attente du designer",
      "Difficulté: performance sur mobile dégradée",
      "Blocker: test flaky à identifier",
      "Risque: deadline serrée pour le sprint"
    ],
    social: [
      "Déjeuner avec l'équipe, bonne ambiance",
      "Standup quotidien: 15 minutes efficaces",
      "Mentorat: session avec le nouveau développeur",
      "After-work: jeux de société",
      "Feedback reçu: très constructif",
      "Collaboration avec l'équipe design"
    ]
  };

  const moodCycle = [4, 3, 4, 3, 5, 4, 3, 4, 3, 2, 3, 4, 5, 4, 3, 4, 3, 4, 5, 3, 4, 4, 3, 5, 4, 3, 4, 3, 4, 5];

  days.forEach((date, idx) => {
    const weekend = isWeekend(date);
    const numEntries = weekend ? 2 + Math.floor(Math.random() * 2) : 4 + Math.floor(Math.random() * 4);
    const seeds = [
      { time: '07:30', type: 'morning' },
      { time: '08:15', type: 'morning' },
      { time: '08:45', type: 'morning' },
      { time: '10:30', type: 'afternoon' },
      { time: '11:00', type: 'afternoon' },
      { time: '12:30', type: 'afternoon' },
      { time: '14:00', type: 'afternoon' },
      { time: '15:30', type: 'afternoon' },
      { time: '16:45', type: 'afternoon' },
      { time: '17:30', type: 'afternoon' },
      { time: '18:00', type: 'evening' },
      { time: '19:00', type: 'evening' },
      { time: '20:30', type: 'evening' },
      { time: '21:00', type: 'evening' }
    ];

    const usedTypes = {};
    for (let i = 0; i < numEntries && i < seeds.length; i++) {
      const seed = seeds[i];
      const pool = entryTemplates[seed.type];
      if (!pool) continue;

      // Pick content ensuring some variety
      const contentIdx = (idx * 7 + i * 3) % pool.length;
      let content = pool[contentIdx];

      // Occasionally add random other content
      if (i === 2 && idx % 3 === 0 && entryTemplates.blocker.length > 0) {
        content = entryTemplates.blocker[idx % entryTemplates.blocker.length];
      }
      if (i === numEntries - 1 && idx % 2 === 0 && entryTemplates.idea.length > 0) {
        content = entryTemplates.idea[idx % entryTemplates.idea.length];
      }
      if (i === 1 && idx % 5 === 0 && entryTemplates.social.length > 0) {
        content = entryTemplates.social[idx % entryTemplates.social.length];
      }

      const timeParts = seed.time.split(':');
      const hour = parseInt(timeParts[0]);
      const min = parseInt(timeParts[1]) + Math.floor(Math.random() * 4) * 10;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

      entries.push({
        id: `entry-${date}-${i}`,
        date: date,
        time: timeStr,
        content: content,
        type: seed.type,
        created_at: `${date}T${timeStr}:00.000Z`,
        source: 'manual',
        demo: true
      });
    }
  });

  // --- SUMMARIES ---
  const summaries = [];
  const moodScores = [3, 4, 3, 4, 5, 4, 3, 4, 4, 3, 4, 5, 4, 3, 4, 3, 4, 4, 3, 5, 4, 3, 4, 5, 4, 3, 4, 3, 4, 5];
  const energyScores = [3, 4, 3, 4, 5, 3, 4, 4, 3, 2, 3, 4, 5, 3, 4, 3, 4, 4, 3, 5, 4, 3, 4, 5, 4, 3, 4, 3, 4, 5];
  const stressScores = [2, 3, 2, 3, 1, 2, 2, 3, 3, 4, 3, 2, 1, 2, 2, 3, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 3, 2, 1];
  const clarityScores = [4, 3, 4, 4, 5, 4, 3, 4, 4, 3, 4, 5, 4, 3, 4, 3, 4, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 4, 5];
  const satisfactionScores = [3, 4, 3, 4, 5, 4, 3, 4, 3, 2, 4, 5, 4, 3, 3, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 3, 3, 4, 4, 5];

  const highlightsList = [
    ["Code review terminée", "Sprint planning réussi"],
    ["Nouveau record de productivité", "Feedback client positif"],
    ["Bug critique résolu", "Doc mise à jour"],
    ["Tests passent à 90%", "Refactoring propre"],
    ["Feature livrée en avance", "Bonne sync d'équipe"],
    ["Design system avancé", "Revue UX constructive"],
    ["Déploiement réussi", "Zéro régression"],
    ["API documentée", "Tests E2E ajoutés"],
    ["Mentorat productif", "Code review appréciée"],
    ["Hotfix déployé rapidement", "Stabilité améliorée"],
    ["Sprint validé", "Burndown en vert"],
    ["Nouvelle feature démo", "Retours encourageants"],
    ["Tâches administives rattrapées", "Organisation améliorée"],
    ["Focus profond 4h", "Sans interruption"],
    ["Refactoring majeur terminé", "Code plus propre"],
    ["Réunion client productive", "Prochaine étape claire"],
    ["Optimisation requêtes -50%", "Perf améliorée"],
    ["Pair programming enrichissant", "Partage de connaissance"],
    ["Doc technique finalisée", "Wiki mis à jour"],
    ["Dashboard livré", "KPIs visibles"],
    ["Architecture revue", "Dette technique réduite"],
    ["Tests de charge passés", "Scalabilité OK"],
    ["Migration DB réussie", "Zéro downtime"],
    ["Revue de sécurité", "Vulnérabilités corrigées"],
    ["Atelier team building", "Cohésion renforcée"],
    ["Blog post drafté", "Veille tech partagée"],
    ["Mentorat: bon progrès", "Junior autonome"],
    ["Accessibilité améliorée", "A11y score up"],
    ["CI/CD optimisé", "Builds plus rapides"],
    ["Sprint rétrospective", "Améliorations continues"]
  ];

  const actionsCompletedList = [
    ["Review PR #234", "Mise à jour dépendances", "Tests QA"],
    ["Déploiement staging", "Correction bugs", "Doc API"],
    ["Sprint planning", "Estimation tâches", "Priorisation"],
    ["Refactoring auth", "Tests unitaires", "Code review"],
    ["Feature analytics", "Dashboard KPIs", "Tests integration"],
    ["Optimisation SQL", "Index manquants", "Cache redis"],
    ["Design review", "Maquettes validées", "Prototype"],
    ["Mise à jour tokens", "Variables CSS", "Theme switcher"],
    ["Bug fix responsive", "Tests mobiles", "Validation"],
    ["Hotfix production", "Roolback plan", "Monitoring"],
    ["Sprint review", "Démo client", "Feedback"],
    ["Pair programming", "Revue code", "Documentation"],
    ["Cleanup branches", "Merge PRs", "Git housekeeping"],
    ["Doc technique", "Readme mis à jour", "Changelog"],
    ["Migration données", "Scripts vérifiés", "Backup"],
    ["Client meeting", "Specs clarifiées", "Next steps"],
    ["Performance audit", "Lighthouse score", "Optimisations"],
    ["Knowledge sharing", "Présentation interne", "Q&A"],
    ["Sprint rétro", "Actions items", "Améliorations"],
    ["Security patch", "Dépendances à jour", "Audit npm"],
    ["CI pipeline fix", "Tests parallélisés", "Cache layer"],
    ["Load testing", "k6 scripts", "Rapport perf"],
    ["DB migration", "Schema update", "Data validation"],
    ["Security review", "Vuln scan", "Report"],
    ["Team workshop", "Exercices", "Feedback"],
    ["Blog post review", "Édition", "Publication"],
    ["Mentorat session", "Code review exercices", "Support"],
    ["A11y audit", "ARIA labels", "Contrast check"],
    ["GitHub Actions", "Workflow optimisation", "Docker build"],
    ["Rétro sprint", "Action items", "Team health check"]
  ];

  const actionsInProgress = [
    ["Implémentation pagination", "Refactoring modules"],
    ["Tests E2E Cypress", "Storybook"],
    ["Design system v2", "Composants"],
    ["API rate limiting", "Cache stratégie"],
    ["Auth v2", "OAuth provider"],
    ["Migration TS", "Types strict"],
    ["Monitoring setup", "Alertes"],
    ["SEO optimisation", "Meta tags"],
    ["Websocket integration", "Real-time"],
    ["PWA support", "Service worker"],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    []
  ];

  const actionsBlocked = [
    ["API tierce en attente", "Licence pas reçue"],
    ["Review design en attente"],
    [],
    [],
    ["Décision architecture"],
    [],
    ["Dépendance externe"],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    ["Validation sécurité"],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    []
  ];

  const lessonsList = [
    ["Ne pas sous-estimer le temps de review"],
    ["Faire des pauses régulières améliore la concentration"],
    ["La communication précoce évite les blocks"],
    ["Toujours tester sur mobile d'abord"],
    ["Les objectifs clairs doublent la productivité"],
    ["Un bon design system fait gagner des heures"],
    ["Documenter au fur et à mesure, pas après"],
    ["Le pair programming réduit les bugs de 50%"],
    ["Prioriser par impact, pas par urgence"],
    ["Les tests ne sont pas optionnels"],
    ["La dette technique se paie avec intérêts"],
    ["Les rituels d'équipe créent de la confiance"],
    ["L'itération rapide bat la perfection"],
    ["Le feedback précoce est un cadeau"],
    ["Les standups devraient être courts et précis"],
    ["La clarté > la vitesse"],
    ["Le refactoring incremental est plus sûr"],
    ["Les métriques aident à prioriser"],
    ["Célébrer les petites victoires motive"],
    ["Le sommeil impacte directement la qualité du code"],
    ["Une bonne spec évite 3 itérations"],
    ["L'automatisation libère du temps créatif"],
    ["La simplicité est la sophistication ultime"],
    ["Les revues de code sont des opportunités d'apprentissage"],
    ["La transparence construit la confiance"],
    ["Les délais serrés révèlent ce qui compte vraiment"],
    ["L'humilité intellectuelle améliore le code"],
    ["Les outils ne font pas l'artisan"],
    ["La régularité bat l'intensité"],
    ["Prendre soin de soi est productif"]
  ];

  const tomorrowFocusList = [
    ["Terminer la review", "Démarrer les tests"],
    ["Finaliser la doc", "Planifier le sprint"],
    ["Corriger les bugs", "Préparer la démo"],
    ["Implémenter la pagination", "Tests associés"],
    ["Déployer en prod", "Monitorer"],
    ["Refactoring auth", "Tests de sécurité"],
    ["Design review", "Prototype mobile"],
    ["Optimisation perf", "Audit lighthouse"],
    ["Pair programming: module X", "Documentation"],
    ["Sprint rétro", "Planifier v2"],
    ["Cleanup tickets", "Priorisation"],
    ["Démo client", "Feedback loop"],
    ["Recherche solution API", "POC"],
    ["Tests E2E", "CI pipeline"],
    ["Migration données", "Validation"],
    ["Client meeting prep", "Proposal"],
    ["Perf optimisation", "Cache strategy"],
    ["Knowledge transfer", "Doc session"],
    ["Release v0.9", "Changelog"],
    ["Security review", "Pen test"],
    ["CI/CD pipeline", "Docker optimization"],
    ["Load testing", "Results analysis"],
    ["DB migration v2", "Rollback plan"],
    ["Security patch", "Dépendances"],
    ["Workshop prep", "Materials"],
    ["Blog post final", "Publication"],
    ["Mentorat plan", "Exercices"],
    ["A11y fixes", "Tests screen reader"],
    ["CI optimisation", "Cache Docker"],
    ["Rétro actions", "Sprint planning"]
  ];

  days.forEach((date, idx) => {
    const mood = moodScores[idx];
    summaries.push({
      id: `summary-${date}`,
      date: date,
      day_name: new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long' }),
      mood: { score: mood, label: ['', 'Terrible', 'Mauvais', 'Moyen', 'Bon', 'Excellent'][mood] },
      energy: { score: energyScores[idx], label: ['', 'Très bas', 'Bas', 'Moyen', 'Élevé', 'Très élevé'][energyScores[idx]] },
      stress: { score: stressScores[idx], label: ['', 'Très stressé', 'Stressé', 'Modéré', 'Calme', 'Très calme'][stressScores[idx]] },
      clarity: { score: clarityScores[idx], label: ['', 'Confus', 'Flou', 'Moyen', 'Clair', 'Très clair'][clarityScores[idx]] },
      satisfaction: { score: satisfactionScores[idx], label: ['', 'Très insatisfait', 'Insatisfait', 'Neutre', 'Satisfait', 'Très satisfait'][satisfactionScores[idx]] },
      highlights: highlightsList[idx],
      actions_completed: actionsCompletedList[idx],
      actions_in_progress: actionsInProgress[idx],
      actions_blocked: actionsBlocked[idx],
      lessons: lessonsList[idx] ? [lessonsList[idx]] : [],
      tomorrow_focus: tomorrowFocusList[idx] ? [tomorrowFocusList[idx][0]] : [],
      events: idx % 3 === 0 ? [`Réunion équipe ${idx % 4 + 1}h`, `Deadline ticket #${100 + idx}`] : [],
      ideas_count: Math.floor(Math.random() * 3),
      entry_count: entries.filter(e => e.date === date).length,
      created_at: `${date}T19:00:00.000Z`,
      demo: true
    });
  });

  // --- IDEAS ---
  const ideaTemplates = [
    { content: "Créer un dashboard de tracking d'humeur visuel avec des graphiques SVG", tags: ["productivité", "dev"], status: 'inbox', potential: 8 },
    { content: "Automatiser les rapports hebdomadaires avec génération Markdown", tags: ["automatisation", "dev"], status: 'exploring', potential: 7 },
    { content: "Système de tags hiérarchiques pour mieux organiser les notes", tags: ["productivité", "design"], status: 'active', potential: 6 },
    { content: "Intégration calendrier mental avec visualisation des tâches", tags: ["productivité", "UX"], status: 'inbox', potential: 9 },
    { content: "Dashboard de productivité personnelle avec métriques clés", tags: ["productivité", "analytics"], status: 'exploring', potential: 8 },
    { content: "Badges de progression et achievements pour la motivation", tags: ["gamification", "UX"], status: 'parked', potential: 5 },
    { content: "Partage d'insights et patterns de productivité avec l'équipe", tags: ["social", "analytics"], status: 'inbox', potential: 6 },
    { content: "Template de note quotidienne automatique avec prompts", tags: ["productivité", "template"], status: 'active', potential: 7 },
    { content: "Module de gestion de projets légers type Kanban intégré", tags: ["productivité", "dev"], status: 'exploring', potential: 8 },
    { content: "Export des données en Markdown et PDF formaté", tags: ["export", "dev"], status: 'inbox', potential: 5 },
    { content: "Système de rappels contextuels basés sur l'activité", tags: ["IA", "rappel"], status: 'inbox', potential: 9 },
    { content: "Analyse des patterns de sommeil et productivité", tags: ["santé", "analytics"], status: 'parked', potential: 7 },
    { content: "Mode focus avec pomodoro intégré et tracking", tags: ["productivité", "timer"], status: 'exploring', potential: 6 },
    { content: "Intégration Spotify pour musique de travail adaptée", tags: ["intégration", "audio"], status: 'archived', potential: 4 },
    { content: "Générateur de prompts de journaling quotidiens", tags: ["journaling", "IA"], status: 'active', potential: 6 },
    { content: "Widget météo et conditions pour contextualiser les notes", tags: ["widget", "UX"], status: 'inbox', potential: 3 },
    { content: "Système de goals avec suivi visuel de progression", tags: ["productivité", "goals"], status: 'exploring', potential: 8 },
    { content: "Mode hors-ligne avec sync différée", tags: ["dev", "offline"], status: 'parked', potential: 8 },
    { content: "Rappels de révision espacée pour les idées importantes", tags: ["productivité", "learning"], status: 'inbox', potential: 7 },
    { content: "Chatbot pour saisie vocale des notes et idées", tags: ["IA", "voice"], status: 'inbox', potential: 9 }
  ];

  const ideas = [];
  ideaTemplates.forEach((t, idx) => {
    const dayIdx = (idx * 3) % 30;
    const created = new Date(days[dayIdx] + 'T10:00:00');
    const reviewDates = [];
    if (t.status === 'active' || t.status === 'exploring') {
      const d1 = new Date(created);
      d1.setDate(d1.getDate() + 3);
      reviewDates.push(d1.toISOString().split('T')[0]);
      const d2 = new Date(created);
      d2.setDate(d2.getDate() + 14);
      reviewDates.push(d2.toISOString().split('T')[0]);
    }

    ideas.push({
      id: `idea-${idx + 1}`,
      content: t.content,
      tags: t.tags || [],
      status: t.status,
      potential_score: t.potential,
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
      review_dates: reviewDates,
      next_review: reviewDates.length > 0 ? reviewDates[0] : null,
      source: 'manual',
      journal_entry_id: null,
      demo: true
    });
  });

  // --- REMINDERS ---
  const reminderTemplates = [
    { content: "Finaliser la review de code pour le sprint", category: 'action', status: 'active', days_offset: 0 },
    { content: "Envoyer le compte-rendu de réunion à l'équipe", category: 'follow_up', status: 'active', days_offset: 0 },
    { content: "Appeler le client pour le feedback client", category: 'action', status: 'active', days_offset: 0 },
    { content: "Relire les notes du dernier atelier", category: 'review', status: 'active', days_offset: 1 },
    { content: "Mettre à jour le planning du sprint", category: 'action', status: 'active', days_offset: 1 },
    { content: "Penser à la feature analytics - brainstorming", category: 'open_loop', status: 'active', days_offset: 2 },
    { content: "Planifier la rétrospective d'équipe", category: 'action', status: 'snoozed', days_offset: -2 },
    { content: "Vérifier les dépendances npm à jour", category: 'review', status: 'active', days_offset: 2 },
    { content: "Préparer la présentation pour le meetup", category: 'action', status: 'active', days_offset: 4 },
    { content: "Relancer le designer pour les maquettes", category: 'follow_up', status: 'active', days_offset: -1 },
    { content: "Rechercher des solutions d'hébergement", category: 'open_loop', status: 'active', days_offset: 3 },
    { content: "Écrire le post mortem du dernier déploiement", category: 'action', status: 'done', days_offset: -5 },
    { content: "Mettre à jour le README du projet", category: 'action', status: 'cancelled', days_offset: -3 },
    { content: "Vérifier les logs d'erreur du serveur", category: 'review', status: 'active', days_offset: -1 },
    { content: "Contacter le fournisseur API pour le nouveau endpoint", category: 'follow_up', status: 'active', days_offset: 5 },
    { content: "Planifier les congés du mois prochain", category: 'action', status: 'active', days_offset: 10 },
    { content: "Ranger le tableau Trello des idées", category: 'review', status: 'snoozed', days_offset: -7 },
    { content: "Faire un point sur les objectifs du trimestre", category: 'review', status: 'active', days_offset: 6 },
    { content: "Idée: app de tracking - noter les specs", category: 'open_loop', status: 'active', days_offset: 0 },
    { content: "Compléter le dossier de santé annuel", category: 'action', status: 'done', days_offset: -10 },
    { content: "Commander le nouveau matériel", category: 'action', status: 'active', days_offset: 7 },
    { content: "Vérifier les accès GitHub de l'équipe", category: 'review', status: 'done', days_offset: -4 },
    { content: "Publier l'article de blog sur le refactoring", category: 'action', status: 'snoozed', days_offset: -2 },
    { content: "Prototyper l'écran de connexion mobile", category: 'action', status: 'active', days_offset: 2 },
    { content: "Brainstorming features pour la v2", category: 'open_loop', status: 'active', days_offset: 8 }
  ];

  const reminders = [];
  reminderTemplates.forEach((t, idx) => {
    const baseDate = new Date(days[15]);
    baseDate.setDate(baseDate.getDate() + t.days_offset);
    const dateStr = baseDate.toISOString().split('T')[0];

    reminders.push({
      id: `reminder-${idx + 1}`,
      content: t.content,
      category: t.category,
      status: t.status,
      due_date: dateStr,
      created_at: new Date(days[idx % 30] + 'T09:00:00').toISOString(),
      snoozed_until: t.status === 'snoozed' ? new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] : null,
      completed_at: t.status === 'done' ? new Date(Date.now() - Math.random() * 7 * 86400000).toISOString() : null,
      tags: [],
      demo: true
    });
  });

  // --- INSIGHTS ---
  const insights = [
    {
      id: 'insight-1',
      type: 'pattern',
      observation: "La productivité est 30% plus élevée les mardis et mercredis matins",
      hypothesis: "Le début de semaine bénéficie d'une énergie résiduelle du week-end et de moins de réunions",
      confidence: 0.75,
      category: 'productivity',
      created_at: days[15] + 'T08:00:00.000Z',
      relevant_period: '30d',
      demo: true
    },
    {
      id: 'insight-2',
      type: 'pattern',
      observation: "L'humeur est corrélée positivement avec les séances de sport matinales",
      hypothesis: "L'exercice physique libère des endorphines qui améliorent l'humeur pour la journée",
      confidence: 0.82,
      category: 'wellness',
      created_at: days[12] + 'T08:00:00.000Z',
      relevant_period: '30d',
      demo: true
    },
    {
      id: 'insight-3',
      type: 'pattern',
      observation: "Les blocages surviennent principalement en milieu d'après-midi (14h-16h)",
      hypothesis: "Le creux post-prandial et la fatigue accumulée réduisent la capacité à résoudre des problèmes complexes",
      confidence: 0.68,
      category: 'productivity',
      created_at: days[10] + 'T08:00:00.000Z',
      relevant_period: '30d',
      demo: true
    },
    {
      id: 'insight-4',
      type: 'pattern',
      observation: "Les jours avec 5+ entrées sont 2x plus satisfaisants que les jours avec moins d'entrées",
      hypothesis: "Prendre le temps de journaler régulièrement améliore la conscience de soi et la satisfaction",
      confidence: 0.71,
      category: 'journaling',
      created_at: days[8] + 'T08:00:00.000Z',
      relevant_period: '30d',
      demo: true
    },
    {
      id: 'insight-5',
      type: 'pattern',
      observation: "Le niveau de stress est inversement corrélé à la clarté mentale (r=-0.64)",
      hypothesis: "Le stress réduit la capacité à clarifier ses pensées et à prioriser efficacement",
      confidence: 0.79,
      category: 'wellness',
      created_at: days[5] + 'T08:00:00.000Z',
      relevant_period: '30d',
      demo: true
    },
    {
      id: 'insight-6',
      type: 'recommendation',
      observation: "Planifier les tâches complexes le matin et les tâches routinières l'après-midi",
      hypothesis: "L'énergie cognitive est maximale le matin après le sommeil et le petit-déjeuner",
      confidence: 0.85,
      category: 'productivity',
      created_at: days[3] + 'T08:00:00.000Z',
      relevant_period: '30d',
      demo: true
    },
    {
      id: 'insight-7',
      type: 'pattern',
      observation: "Les idées sont plus créatives après une promenade ou une activité physique",
      hypothesis: "L'activité physique légère augmente le flux sanguin cérébral et la connectivité neuronale",
      confidence: 0.72,
      category: 'creativity',
      created_at: days[1] + 'T08:00:00.000Z',
      relevant_period: '30d',
      demo: true
    },
    {
      id: 'insight-8',
      type: 'pattern',
      observation: "Le temps de concentration diminue après 3 heures d'écran continu",
      hypothesis: "La fatigue visuelle et cognitive s'accumule, réduisant l'efficacité après des périodes prolongées",
      confidence: 0.88,
      category: 'wellness',
      created_at: days[0] + 'T08:00:00.000Z',
      relevant_period: '30d',
      demo: true
    }
  ];

  return {
    entries: entries,
    summaries: summaries,
    ideas: ideas,
    reminders: reminders,
    insights: insights
  };
})();
