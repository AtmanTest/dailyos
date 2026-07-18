/* ===== DailyOS Insights Page ===== */

let insightsPeriod = '30d';

async function renderInsightsPage() {
  const app = document.getElementById('app');
  store.setState({ loading: true });
  app.innerHTML = renderLoading();

  try {
    const insights = store.getState('insights').length > 0
      ? store.getState('insights')
      : DEMO_DATA.insights;

    store.setState({ insights });

    const allSummaries = store.getState('summaries').length > 0
      ? store.getState('summaries')
      : DEMO_DATA.summaries;

    const allIdeas = store.getState('ideas').length > 0
      ? store.getState('ideas')
      : DEMO_DATA.ideas;

    const allReminders = store.getState('reminders').length > 0
      ? store.getState('reminders')
      : DEMO_DATA.reminders;

    // Use entries from localStorage/DEMO for ADHD patterns
    const allEntries = store.getState('entries').length > 0
      ? store.getState('entries')
      : DEMO_DATA.entries;

    // Filter by period
    const days = insightsPeriod === '7d' ? 7 : insightsPeriod === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const periodSummaries = allSummaries.filter(s => s.date >= cutoffStr);
    const periodIdeas = allIdeas.filter(i => i.created_at && i.created_at.split('T')[0] >= cutoffStr);
    const periodReminders = allReminders.filter(r => r.created_at && r.created_at.split('T')[0] >= cutoffStr);
    const periodEntries = allEntries.filter(e => e.date >= cutoffStr);

    const hasData = periodSummaries.length >= 2;

    let html = `
      <div class="section">
        <h1 class="section-title">📊 ${window.t ? window.t('insights_title') : 'Insights'}</h1>
      </div>

      <div class="tabs" role="tablist">
        <button class="tab ${insightsPeriod === '7d' ? 'active' : ''}" onclick="changeInsightsPeriod('7d')" role="tab" aria-selected="${insightsPeriod === '7d'}">${window.t ? window.t('period_7d') : '7 jours'}</button>
        <button class="tab ${insightsPeriod === '30d' ? 'active' : ''}" onclick="changeInsightsPeriod('30d')" role="tab" aria-selected="${insightsPeriod === '30d'}">${window.t ? window.t('period_30d') : '30 jours'}</button>
        <button class="tab ${insightsPeriod === '90d' ? 'active' : ''}" onclick="changeInsightsPeriod('90d')" role="tab" aria-selected="${insightsPeriod === '90d'}">${window.t ? window.t('period_90d') : '90 jours'}</button>
      </div>
    `;

    if (!hasData) {
      html += renderEmptyState(
        window.t ? window.t('insights_no_data') : 'Pas assez de données pour générer des insights',
        window.t ? window.t('insights_no_data_hint') : 'Continuez à journaliser pour débloquer vos insights personnalisés.'
      );
      store.setState({ loading: false });
      app.innerHTML = html;
    if (typeof applyLang === 'function') applyLang(app);
      updateNav();
      return;
    }

    // Prepare chart data
    const sortedSummaries = [...periodSummaries].sort((a, b) => a.date.localeCompare(b.date));
    const moodData = sortedSummaries.map(s => ({
      label: s.date.slice(5),
      value: s.mood.score
    }));
    const energyData = sortedSummaries.map(s => ({
      label: s.date.slice(5),
      value: s.energy.score
    }));

    // Summary stats
    const avgMood = (sortedSummaries.reduce((sum, s) => sum + s.mood.score, 0) / sortedSummaries.length).toFixed(1);
    const avgEnergy = (sortedSummaries.reduce((sum, s) => sum + s.energy.score, 0) / sortedSummaries.length).toFixed(1);
    const avgSatisfaction = (sortedSummaries.reduce((sum, s) => sum + s.satisfaction.score, 0) / sortedSummaries.length).toFixed(1);
    const totalActions = sortedSummaries.reduce((sum, s) => sum + (s.actions_completed ? s.actions_completed.length : 0), 0);
    const totalIdeas = periodIdeas.length;
    const totalBlockers = sortedSummaries.reduce((sum, s) => sum + (s.actions_blocked ? s.actions_blocked.length : 0), 0);

    html += `
      <!-- Summary stats -->
      <div class="card-grid mb-6" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr))">
        <div class="card text-center">
          <div class="score-label">${window.t ? window.t('avg_mood') : 'Humeur moy.'}</div>
          <div class="score-value" style="color:var(--color-accent);font-size:1.5rem">${avgMood}/5</div>
        </div>
        <div class="card text-center">
          <div class="score-label">${window.t ? window.t('avg_energy') : 'Énergie moy.'}</div>
          <div class="score-value" style="color:var(--color-info);font-size:1.5rem">${avgEnergy}/5</div>
        </div>
        <div class="card text-center">
          <div class="score-label">${window.t ? window.t('avg_satisfaction') : 'Satisfaction'}</div>
          <div class="score-value" style="color:var(--color-success);font-size:1.5rem">${avgSatisfaction}/5</div>
        </div>
        <div class="card text-center">
          <div class="score-label">${window.t ? window.t('actions_done') : 'Actions faites'}</div>
          <div class="score-value" style="color:var(--color-warning);font-size:1.5rem">${totalActions}</div>
        </div>
        <div class="card text-center">
          <div class="score-label">${window.t ? window.t('ideas_captured') : 'Idées captur.'}</div>
          <div class="score-value" style="color:var(--color-accent);font-size:1.5rem">${totalIdeas}</div>
        </div>
        <div class="card text-center">
          <div class="score-label">${window.t ? window.t('blockers') : 'Bloqueurs'}</div>
          <div class="score-value" style="color:var(--color-error);font-size:1.5rem">${totalBlockers}</div>
        </div>
      </div>
    `;

    // Charts row
    html += `
      <div class="card-grid mb-6" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
        ${moodData.length >= 2 ? `
          <div class="card">
            <div class="card-header"><div class="card-title">${window.t ? window.t('mood') : 'Humeur'}</div></div>
            <div class="card-body">
              <div id="chart-mood-line"></div>
            </div>
          </div>
        ` : ''}
        ${energyData.length >= 2 ? `
          <div class="card">
            <div class="card-header"><div class="card-title">${window.t ? window.t('energy') : 'Énergie'}</div></div>
            <div class="card-body">
              <div id="chart-energy-bar"></div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // ADHD Patterns section (only if >= 5 data points)
    if (periodSummaries.length >= 5 || periodEntries.length >= 5) {
      // Calculate patterns from entries data
      const adhdPatterns = calculateADHDPatterns(periodSummaries, periodEntries, periodIdeas, cutoffStr);

      html += `
        <div class="section">
          <h2 class="section-title">🧠 ${window.t ? window.t('adhd_patterns_title') : 'Patterns TDAH'}</h2>
          <div class="card-grid mb-6" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
            <!-- Most productive hours -->
            <div class="card">
              <div class="card-header"><div class="card-title">⏰ ${window.t ? window.t('productive_hours') : 'Heures productives'}</div></div>
              <div class="card-body text-sm">
                ${adhdPatterns.productiveHours.length > 0
                  ? `<div class="font-medium mb-2">${adhdPatterns.productiveHours.map(h => `🕐 ${h.hour}:00`).join(', ')}</div>
                     <div class="text-muted text-xs">${window.t ? window.t('productive_hours_hint') : 'Moments où tu écris le plus'}</div>`
                  : `<div class="text-muted">${window.t ? window.t('no_data') : 'Pas assez de données'}</div>`}
              </div>
            </div>

            <!-- Energy on win days vs non-win days -->
            <div class="card">
              <div class="card-header"><div class="card-title">⚡ ${window.t ? window.t('energy_pattern') : 'Énergie jours gagnés'}</div></div>
              <div class="card-body text-sm">
                ${adhdPatterns.energyWinDays !== null
                  ? `<div class="flex items-center gap-4">
                       <div><span class="text-muted">${window.t ? window.t('win_days') : 'Jours gagnés'}:</span> <strong>${adhdPatterns.energyWinDays}/5</strong></div>
                       <div><span class="text-muted">${window.t ? window.t('non_win_days') : 'Autres'}:</span> <strong>${adhdPatterns.energyNonWinDays}/5</strong></div>
                     </div>`
                  : `<div class="text-muted">${window.t ? window.t('no_data') : 'Pas assez de données'}</div>`}
              </div>
            </div>

            <!-- Ideas this week -->
            <div class="card">
              <div class="card-header"><div class="card-title">💡 ${window.t ? window.t('ideas_this_week') : 'Idées cette semaine'}</div></div>
              <div class="card-body text-sm">
                <div style="font-size:1.5rem;font-weight:bold;color:var(--color-accent)">${adhdPatterns.ideasThisWeek}</div>
                <div class="text-muted text-xs">${window.t ? window.t('ideas_this_week_hint') : 'Idées capturées cette semaine'}</div>
              </div>
            </div>

            <!-- Days without entries this week -->
            <div class="card">
              <div class="card-header"><div class="card-title">📭 ${window.t ? window.t('empty_days') : 'Jours sans entrée'}</div></div>
              <div class="card-body text-sm">
                <div style="font-size:1.5rem;font-weight:bold;${adhdPatterns.emptyDaysThisWeek > 3 ? 'color:var(--color-warning)' : 'color:var(--color-text)'}">${adhdPatterns.emptyDaysThisWeek}/7</div>
                <div class="text-muted text-xs">${window.t ? window.t('empty_days_hint') : 'Jours sans entrée cette semaine'}</div>
              </div>
            </div>

            <!-- Most frequent entry type -->
            <div class="card">
              <div class="card-header"><div class="card-title">📝 ${window.t ? window.t('frequent_type') : 'Type le plus fréquent'}</div></div>
              <div class="card-body text-sm">
                ${adhdPatterns.mostFrequentType
                  ? `<div style="font-size:1.2rem;font-weight:bold">${adhdPatterns.mostFrequentType.emoji} ${window.t ? window.t('type_' + adhdPatterns.mostFrequentType.type) : adhdPatterns.mostFrequentType.type}</div>
                     <div class="text-muted text-xs">${adhdPatterns.mostFrequentType.count} ${window.t ? window.t('entries') : 'entrées'}</div>`
                  : `<div class="text-muted">${window.t ? window.t('no_data') : 'Pas assez de données'}</div>`}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Patterns detected (existing)
    const periodInsights = insights.filter(i => {
      if (!i.created_at) return false;
      const date = i.created_at.split('T')[0];
      return date >= cutoffStr;
    });

    if (periodInsights.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title">🔍 ${window.t ? window.t('patterns_detected') : 'Patterns détectés'}</h2>
          ${periodInsights.map(ins => `
            <div class="insight-card">
              <div class="insight-observation">📌 ${escapeHtml(ins.observation)}</div>
              <div class="insight-hypothesis">💭 ${escapeHtml(ins.hypothesis || '')}</div>
              <div class="insight-confidence">
                <span class="tag ${ins.confidence >= 0.8 ? 'tag-success' : ins.confidence >= 0.6 ? 'tag-warning' : 'tag-neutral'}">
                  ${window.t ? window.t('confidence') : 'Confiance'}: ${Math.round((ins.confidence || 0) * 100)}%
                </span>
                <span class="tag tag-info">${escapeHtml(ins.category || '')}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // If no patterns
    if (periodInsights.length === 0) {
      html += `<div class="insight-card text-center text-muted">${window.t ? window.t('insights_continue_hint') : 'Continuez à journaliser pour découvrir des patterns personnalisés.'}</div>`;
    }

    store.setState({ loading: false });
    app.innerHTML = html;
    if (typeof applyLang === 'function') applyLang(app);
    updateNav();

    // Render charts after DOM is updated
    if (moodData.length >= 2) {
      renderLineChart('chart-mood-line', moodData, {
        title: window.t ? window.t('mood_evolution') : 'Évolution de l\'humeur',
        lineColor: 'var(--color-accent)',
        fillColor: 'rgba(91, 141, 238, 0.1)'
      });
    }
    if (energyData.length >= 2) {
      renderBarChart('chart-energy-bar', energyData, {
        title: window.t ? window.t('energy_levels') : 'Niveau d\'énergie',
        barColor: 'var(--color-info)'
      });
    }

  } catch (error) {
    console.error('Insights page error:', error);
    store.setState({ loading: false });
    app.innerHTML = renderError(window.t ? window.t('insights_load_error') : 'Erreur lors du chargement des insights.');
  }
}

function changeInsightsPeriod(period) {
  insightsPeriod = period;
  renderInsightsPage();
}

/**
 * Calculate ADHD patterns from entries data
 */
function calculateADHDPatterns(summaries, entries, ideas, cutoffStr) {
  const result = {
    productiveHours: [],
    energyWinDays: null,
    energyNonWinDays: null,
    ideasThisWeek: 0,
    emptyDaysThisWeek: 0,
    mostFrequentType: null
  };

  // 1. Most productive hours (entries grouped by hour)
  const hourCounts = {};
  entries.forEach(e => {
    if (e.time) {
      const hour = e.time.split(':')[0];
      if (hour) {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    }
  });
  const sortedHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, count]) => ({ hour, count }));
  result.productiveHours = sortedHours;

  // 2. Average energy on win days vs non-win days
  const winDays = summaries.filter(s => s.win_day === true);
  const nonWinDays = summaries.filter(s => s.win_day === false || !s.win_day);
  if (winDays.length > 0) {
    result.energyWinDays = (winDays.reduce((sum, s) => sum + (s.energy.score || 0), 0) / winDays.length).toFixed(1);
  }
  if (nonWinDays.length > 0) {
    result.energyNonWinDays = (nonWinDays.reduce((sum, s) => sum + (s.energy.score || 0), 0) / nonWinDays.length).toFixed(1);
  }

  // 3. Ideas captured this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];
  result.ideasThisWeek = ideas.filter(i => {
    const d = i.created_at ? i.created_at.split('T')[0] : '';
    return d >= weekStartStr;
  }).length;

  // 4. Days without entries this week
  const daysWithEntries = new Set(entries.filter(e => e.date >= weekStartStr).map(e => e.date));
  let emptyCount = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    if (!daysWithEntries.has(dateStr)) {
      emptyCount++;
    }
  }
  result.emptyDaysThisWeek = emptyCount;

  // 5. Most frequent entry type
  const typeCounts = {};
  entries.forEach(e => {
    const t = e.type || 'note';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  if (sortedTypes.length > 0) {
    const emojiMap = {
      note: '📝', morning: '🌅', afternoon: '☀️',
      evening: '🌙', reflection: '🪞', event: '📅', mood: '💖'
    };
    result.mostFrequentType = {
      type: sortedTypes[0][0],
      count: sortedTypes[0][1],
      emoji: emojiMap[sortedTypes[0][0]] || '📄'
    };
  }

  return result;
}
