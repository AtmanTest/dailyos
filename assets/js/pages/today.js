/* ===== DailyOS Today Page ===== */

async function renderTodayPage() {
  const app = document.getElementById('app');
  store.setState({ loading: true });
  app.innerHTML = renderLoading();

  try {
    const today = getTodayISO();
    const entries = await getEntries(today);
    const summary = await getDailySummary(today);

    store.setState({ entries, selectedDate: today });

    const dateFormatted = formatDate(today, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dayName = new Date(today + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    let html = `
      <div class="section">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 style="font-size:var(--font-size-2xl);font-weight:var(--font-weight-bold)">${escapeHtml(capitalizedDay)}</h1>
            <div class="text-muted text-sm">${escapeHtml(dateFormatted)}</div>
          </div>
          <span class="tag tag-accent">${entries.length} entrée${entries.length > 1 ? 's' : ''}</span>
        </div>
      </div>
    `;

    // Saisie rapide
    html += `
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">Ajouter une entrée</div>
        </div>
        <div class="card-body">
          <div id="quick-entry-form">
            <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-2)">
              <input type="text" id="qe-time" placeholder="Heure (ex: 09:30)" value="${getLocalTime()}"
                style="flex:0 0 80px;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm)">
              <select id="qe-type"
                style="flex:0 0 120px;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm)">
                <option value="morning">Matin</option>
                <option value="afternoon">Après-midi</option>
                <option value="evening" selected>Soirée</option>
                <option value="reflection">Réflexion</option>
                <option value="event">Événement</option>
                <option value="mood">Humeur</option>
              </select>
            </div>
            <textarea id="qe-content" rows="3" placeholder="Quoi de neuf aujourd'hui ?"
              style="width:100%;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm);resize:vertical"></textarea>
            <div style="display:flex;gap:var(--space-2);margin-top:var(--space-2)">
              <button onclick="submitQuickEntry()" class="btn"
                style="padding:var(--space-2) var(--space-4);background:var(--color-accent);color:white;border:none;border-radius:var(--radius-md);cursor:pointer;font-size:var(--font-size-sm);font-weight:var(--font-weight-semibold)">
                + Ajouter
              </button>
              <button onclick="openFullEntry()" class="btn"
                style="padding:var(--space-2) var(--space-4);background:transparent;color:var(--color-text-muted);border:1px solid var(--color-border);border-radius:var(--radius-md);cursor:pointer;font-size:var(--font-size-sm)">
                Entrée complète
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    if (summary) {
      const s = summary;
      html += `
        <div class="card mb-6">
          <div class="card-header">
            <div class="card-title">Scores du jour</div>
          </div>
          <div class="card-body">
            <div class="score-grid">
              <div class="score-item">
                <div class="score-label">Humeur</div>
                <div class="score-value" style="color:${getScoreColor(s.mood.score)}">${s.mood.score != null ? s.mood.score + '/5 ' + getMoodEmoji(s.mood.score) : '—'}</div>
              </div>
              <div class="score-item">
                <div class="score-label">Énergie</div>
                <div class="score-value" style="color:${getScoreColor(s.energy.score)}">${s.energy.score != null ? s.energy.score + '/5' : '—'}</div>
              </div>
              <div class="score-item">
                <div class="score-label">Stress</div>
                <div class="score-value" style="color:${getScoreColorInverted(s.stress.score)}">${s.stress.score != null ? s.stress.score + '/5' : '—'}</div>
              </div>
              <div class="score-item">
                <div class="score-label">Clarté</div>
                <div class="score-value" style="color:${getScoreColor(s.clarity.score)}">${s.clarity.score != null ? s.clarity.score + '/5' : '—'}</div>
              </div>
              <div class="score-item">
                <div class="score-label">Satisfaction</div>
                <div class="score-value" style="color:${getScoreColor(s.satisfaction.score)}">${s.satisfaction.score != null ? s.satisfaction.score + '/5' : '—'}</div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Highlights
      if (s.highlights && s.highlights.length > 0) {
        html += `
          <div class="card mb-6">
            <div class="card-header">
              <div class="card-title">Points forts</div>
            </div>
            <div class="card-body">
              <ul style="list-style:disc;padding-left:var(--space-5)">
                ${s.highlights.map(h => `<li class="mb-2">${escapeHtml(h)}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
      }

      // Actions
      const hasActions = (s.actions_completed && s.actions_completed.length > 0) ||
                         (s.actions_in_progress && s.actions_in_progress.length > 0) ||
                         (s.actions_blocked && s.actions_blocked.length > 0);

      if (hasActions) {
        html += `<div class="card mb-6"><div class="card-header"><div class="card-title">Actions</div></div><div class="card-body">`;

        if (s.actions_completed && s.actions_completed.length > 0) {
          html += `<div class="mb-3"><span class="tag tag-success mb-2">Terminées</span><ul style="padding-left:var(--space-5)">`;
          s.actions_completed.forEach(a => {
            html += `<li class="mb-1 flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> ${escapeHtml(String(a))}</li>`;
          });
          html += `</ul></div>`;
        }

        if (s.actions_in_progress && s.actions_in_progress.length > 0) {
          html += `<div class="mb-3"><span class="tag tag-info mb-2">En cours</span><ul style="padding-left:var(--space-5)">`;
          s.actions_in_progress.forEach(a => {
            html += `<li class="mb-1 flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg> ${escapeHtml(String(a))}</li>`;
          });
          html += `</ul></div>`;
        }

        if (s.actions_blocked && s.actions_blocked.length > 0) {
          html += `<div class="mb-3"><span class="tag tag-error mb-2">Bloqué</span><ul style="padding-left:var(--space-5)">`;
          s.actions_blocked.forEach(a => {
            html += `<li class="mb-1 flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/></svg> ${escapeHtml(String(a))}</li>`;
          });
          html += `</ul></div>`;
        }

        html += `</div></div>`;
      }

      // Events
      if (s.events && s.events.length > 0) {
        html += `
          <div class="card mb-6">
            <div class="card-header">
              <div class="card-title">Événements</div>
            </div>
            <div class="card-body">
              <ul style="list-style:disc;padding-left:var(--space-5)">
                ${s.events.map(e => `<li class="mb-1">${escapeHtml(String(e))}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
      }

      // Lessons
      if (s.lessons && s.lessons.length > 0) {
        html += `
          <div class="card mb-6">
            <div class="card-header">
              <div class="card-title">Leçons du jour</div>
            </div>
            <div class="card-body">
              <ul style="list-style:disc;padding-left:var(--space-5)">
                ${s.lessons.map(l => `<li class="mb-1">${escapeHtml(String(l))}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
      }

      // Tomorrow Focus
      if (s.tomorrow_focus && s.tomorrow_focus.length > 0) {
        html += `
          <div class="card mb-6">
            <div class="card-header">
              <div class="card-title">Focus demain</div>
            </div>
            <div class="card-body">
              <ul style="list-style:disc;padding-left:var(--space-5)">
                ${s.tomorrow_focus.map(f => `<li class="mb-1">${escapeHtml(String(f))}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
      }

      // Ideas captured today
      const todayIdeas = store.getState('ideas').filter(i => i.created_at && i.created_at.startsWith(today) || (i.journal_entry_id && entries.some(e => e.id === i.journal_entry_id)));
      if (todayIdeas.length > 0) {
        html += `
          <div class="card mb-6">
            <div class="card-header">
              <div class="card-title">Idées du jour</div>
            </div>
            <div class="card-body">
              ${todayIdeas.map(idea => `
                <div class="flex items-center justify-between mb-2">
                  <span>💡 ${escapeHtml(idea.content)}</span>
                  ${getStatusBadge(idea.status)}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    }

    // Timeline of entries
    if (entries.length > 0) {
      html += `
        <div class="card mb-6">
          <div class="card-header">
            <div class="card-title">Chronologie</div>
          </div>
          <div class="card-body">
            <div class="timeline">
              ${entries.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(e => {
                const typeColor = e.type === 'morning' ? 'var(--color-warning)' : e.type === 'afternoon' ? 'var(--color-info)' : 'var(--color-accent)';
                return `
                  <div class="timeline-item">
                    <div class="timeline-dot" style="background:${typeColor}"></div>
                    <div class="timeline-time">${escapeHtml(e.time || '')}</div>
                    <div class="timeline-content">${escapeHtml(e.content)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // Empty state if no data
    if (!summary && entries.length === 0) {
      html = `
        <div class="section">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 style="font-size:var(--font-size-2xl);font-weight:var(--font-weight-bold)">${escapeHtml(capitalizedDay)}</h1>
              <div class="text-muted text-sm">${escapeHtml(dateFormatted)}</div>
            </div>
          </div>
        </div>
        ${renderEmptyState('Aucune donnée pour aujourd\'hui', 'Commencez à journaliser pour voir votre journée ici.')}
      `;
    }

    store.setState({ loading: false });
    app.innerHTML = html;
    updateNav();

  } catch (error) {
    console.error('Today page error:', error);
    store.setState({ loading: false });
    app.innerHTML = renderError('Erreur lors du chargement de la page aujourd\'hui.');
  }
}

function getScoreColor(score) {
  if (score == null) return 'var(--color-text-muted)';
  if (score >= 4) return 'var(--color-success)';
  if (score >= 3) return 'var(--color-warning)';
  return 'var(--color-error)';
}

function getScoreColorInverted(score) {
  if (score == null) return 'var(--color-text-muted)';
  if (score <= 2) return 'var(--color-success)';
  if (score <= 3) return 'var(--color-warning)';
  return 'var(--color-error)';
}

/* ===== Quick Entry Handlers ===== */

/**
 * Submit a quick journal entry
 */
async function submitQuickEntry() {
  const content = document.getElementById('qe-content');
  const timeInput = document.getElementById('qe-time');
  const typeSelect = document.getElementById('qe-type');

  if (!content || !content.value.trim()) {
    showToast("Écris quelque chose d'abord", 'warning');
    content?.focus();
    return;
  }

  const today = getTodayISO();
  const newEntry = {
    date: today,
    time: timeInput?.value || getLocalTime(),
    type: typeSelect?.value || 'evening',
    content: content.value.trim()
  };

  try {
    await addEntry(newEntry);
    content.value = '';
    showToast('Entrée ajoutée ✓', 'success');
    // Re-render the page to show the new entry in timeline
    await renderTodayPage();
  } catch (e) {
    showToast('Erreur: ' + e.message, 'error');
  }
}

/**
 * Open the full entry editor (switches to journal page with entry form)
 */
function openFullEntry() {
  router.navigate('#/journal');
  // Focus on entry textarea after page renders
  setTimeout(() => {
    const ta = document.getElementById('journal-entry-content');
    if (ta) ta.focus();
  }, 100);
}
