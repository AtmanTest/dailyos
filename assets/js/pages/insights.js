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

    // Filter by period
    const days = insightsPeriod === '7d' ? 7 : insightsPeriod === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const periodSummaries = allSummaries.filter(s => s.date >= cutoffStr);
    const periodIdeas = allIdeas.filter(i => i.created_at && i.created_at.split('T')[0] >= cutoffStr);
    const periodReminders = allReminders.filter(r => r.created_at && r.created_at.split('T')[0] >= cutoffStr);

    const hasData = periodSummaries.length >= 2;

    let html = `
      <div class="section">
        <h1 class="section-title">📊 Insights</h1>
      </div>

      <div class="tabs" role="tablist">
        <button class="tab ${insightsPeriod === '7d' ? 'active' : ''}" onclick="changeInsightsPeriod('7d')" role="tab" aria-selected="${insightsPeriod === '7d'}">7 jours</button>
        <button class="tab ${insightsPeriod === '30d' ? 'active' : ''}" onclick="changeInsightsPeriod('30d')" role="tab" aria-selected="${insightsPeriod === '30d'}">30 jours</button>
        <button class="tab ${insightsPeriod === '90d' ? 'active' : ''}" onclick="changeInsightsPeriod('90d')" role="tab" aria-selected="${insightsPeriod === '90d'}">90 jours</button>
      </div>
    `;

    if (!hasData) {
      html += renderEmptyState('Pas assez de données pour générer des insights', 'Continuez à journaliser pour débloquer vos insights personnalisés.');
      store.setState({ loading: false });
      app.innerHTML = html;
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
          <div class="score-label">Humeur moy.</div>
          <div class="score-value" style="color:var(--color-accent);font-size:1.5rem">${avgMood}/5</div>
        </div>
        <div class="card text-center">
          <div class="score-label">Énergie moy.</div>
          <div class="score-value" style="color:var(--color-info);font-size:1.5rem">${avgEnergy}/5</div>
        </div>
        <div class="card text-center">
          <div class="score-label">Satisfaction</div>
          <div class="score-value" style="color:var(--color-success);font-size:1.5rem">${avgSatisfaction}/5</div>
        </div>
        <div class="card text-center">
          <div class="score-label">Actions faites</div>
          <div class="score-value" style="color:var(--color-warning);font-size:1.5rem">${totalActions}</div>
        </div>
        <div class="card text-center">
          <div class="score-label">Idées captur.</div>
          <div class="score-value" style="color:var(--color-accent);font-size:1.5rem">${totalIdeas}</div>
        </div>
        <div class="card text-center">
          <div class="score-label">Bloqueurs</div>
          <div class="score-value" style="color:var(--color-error);font-size:1.5rem">${totalBlockers}</div>
        </div>
      </div>
    `;

    // Charts row
    html += `
      <div class="card-grid mb-6" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
        ${moodData.length >= 2 ? `
          <div class="card">
            <div class="card-header"><div class="card-title">Humeur</div></div>
            <div class="card-body">
              <div id="chart-mood-line"></div>
            </div>
          </div>
        ` : ''}
        ${energyData.length >= 2 ? `
          <div class="card">
            <div class="card-header"><div class="card-title">Énergie</div></div>
            <div class="card-body">
              <div id="chart-energy-bar"></div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Patterns detected
    const periodInsights = insights.filter(i => {
      if (!i.created_at) return false;
      const date = i.created_at.split('T')[0];
      return date >= cutoffStr;
    });

    if (periodInsights.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title">🔍 Patterns détectés</h2>
          ${periodInsights.map(ins => `
            <div class="insight-card">
              <div class="insight-observation">📌 ${escapeHtml(ins.observation)}</div>
              <div class="insight-hypothesis">💭 ${escapeHtml(ins.hypothesis || '')}</div>
              <div class="insight-confidence">
                <span class="tag ${ins.confidence >= 0.8 ? 'tag-success' : ins.confidence >= 0.6 ? 'tag-warning' : 'tag-neutral'}">
                  Confiance: ${Math.round((ins.confidence || 0) * 100)}%
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
      html += `<div class="insight-card text-center text-muted">Continuez à journaliser pour découvrir des patterns personnalisés.</div>`;
    }

    store.setState({ loading: false });
    app.innerHTML = html;
    updateNav();

    // Render charts after DOM is updated
    if (moodData.length >= 2) {
      renderLineChart('chart-mood-line', moodData, {
        title: 'Évolution de l\'humeur',
        lineColor: 'var(--color-accent)',
        fillColor: 'rgba(91, 141, 238, 0.1)'
      });
    }
    if (energyData.length >= 2) {
      renderBarChart('chart-energy-bar', energyData, {
        title: 'Niveau d\'énergie',
        barColor: 'var(--color-info)'
      });
    }

  } catch (error) {
    console.error('Insights page error:', error);
    store.setState({ loading: false });
    app.innerHTML = renderError('Erreur lors du chargement des insights.');
  }
}

function changeInsightsPeriod(period) {
  insightsPeriod = period;
  renderInsightsPage();
}
