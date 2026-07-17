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

    // Load all entries for streak, wins, tomorrow focus (use merged demo+user data)
    const allEntries = await getLocalOrDemoData('entries').then(r => Array.isArray(r) ? r : (r.data || []));
    // Ensure allEntries has content field (normalize from potential text field)
    allEntries.forEach(e => { if (!e.content && e.text) e.content = e.text; });

    let html = `
      <div class="section">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 style="font-size:var(--font-size-2xl);font-weight:var(--font-weight-bold)">${escapeHtml(capitalizedDay)}</h1>
            <div class="text-muted text-sm">${escapeHtml(dateFormatted)}</div>
          </div>
          <span class="tag tag-accent">${entries.length} entr&eacute;e${entries.length > 1 ? 's' : ''}</span>
        </div>
      </div>
    `;

    // ===================================================================
    // TOMORROW FOCUS FROM PREVIOUS DAY (at the very top, before streak)
    // ===================================================================
    const yesterdayDate = getYesterdayISO();
    const yesterdayEntry = allEntries.find(e =>
      e.date === yesterdayDate && (
        e.tomorrow === true ||
        (e.content && e.content.startsWith('[TOMORROW]'))
      )
    );
    // Only show if there are no entries yet today (hasn't been started)
    const todayHasEntries = entries.length > 0;

    if (yesterdayEntry && !todayHasEntries) {
      const focusContent = yesterdayEntry.tomorrow === true
        ? yesterdayEntry.content
        : yesterdayEntry.content.replace('[TOMORROW] ', '');
      html += `
        <div class="card mb-6 tomorrow-focus" id="tomorrow-focus-card">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-muted mb-1">Focus du jour</div>
              <div style="font-weight:var(--font-weight-semibold)">${escapeHtml(focusContent)}</div>
            </div>
            <button onclick="markTomorrowFocusDone()" class="btn"
              style="padding:var(--space-1) var(--space-3);background:var(--color-win);color:white;border:none;border-radius:var(--radius-md);cursor:pointer;font-size:var(--font-size-sm)">
              Done &check;
            </button>
          </div>
        </div>
      `;
    }

    // ===================================================================
    // STREAK BADGE
    // ===================================================================
    const streak = calculateStreak(allEntries);
    const lastStreak = localStorage.getItem('dailyos_last_streak');
    const isNewStreak = lastStreak !== null && parseInt(lastStreak, 10) >= 0 && parseInt(lastStreak, 10) !== streak;
    let streakText;
    if (streak === 0) {
      streakText = window.t('streak_start');
    } else if (streak === 1) {
      streakText = window.t('streak_today');
    } else {
      streakText = window.t('streak_days', { count: streak });
    }
    localStorage.setItem('dailyos_last_streak', String(streak));

    html += `
      <div class="section mb-4">
        <div class="streak-badge${isNewStreak ? ' streak-new' : ''}">
          <span>&#x1F525;</span>
          <span class="streak-count">${streak}</span>
          <span>${escapeHtml(streakText)}</span>
        </div>
      </div>
    `;

    // ===================================================================
    // CONTEXTUAL MESSAGE
    // ===================================================================
    const hour = new Date().getHours();
    let msgKey;
    if (hour >= 5 && hour <= 11) msgKey = 'msg_morning';
    else if (hour >= 12 && hour <= 17) msgKey = 'msg_afternoon';
    else if (hour >= 18 && hour <= 21) msgKey = 'msg_evening';
    else msgKey = 'msg_night';

    html += `
      <div class="section mb-4">
        <div class="text-muted text-sm" style="font-style:italic">${escapeHtml(window.t(msgKey))}</div>
      </div>
    `;

    // Saisie rapide
    html += `
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">Ajouter une entr&eacute;e</div>
        </div>
        <div class="card-body">
          <div id="quick-entry-form">
            <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-2)">
              <input type="text" id="qe-time" placeholder="Heure (ex: 09:30)" value="${getLocalTime()}"
                style="flex:0 0 80px;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm)">
              <select id="qe-type"
                style="flex:0 0 120px;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm)">
                <option value="morning">Matin</option>
                <option value="afternoon">Apr&egrave;s-midi</option>
                <option value="evening" selected>Soir&eacute;e</option>
                <option value="reflection">R&eacute;flexion</option>
                <option value="event">&Eacute;v&eacute;nement</option>
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
                Entr&eacute;e compl&egrave;te
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
                <div class="score-value" style="color:${getScoreColor(s.mood.score)}">${s.mood.score != null ? s.mood.score + '/5 ' + getMoodEmoji(s.mood.score) : '&mdash;'}</div>
              </div>
              <div class="score-item">
                <div class="score-label">&Eacute;nergie</div>
                <div class="score-value" style="color:${getScoreColor(s.energy.score)}">${s.energy.score != null ? s.energy.score + '/5' : '&mdash;'}</div>
              </div>
              <div class="score-item">
                <div class="score-label">Stress</div>
                <div class="score-value" style="color:${getScoreColorInverted(s.stress.score)}">${s.stress.score != null ? s.stress.score + '/5' : '&mdash;'}</div>
              </div>
              <div class="score-item">
                <div class="score-label">Clart&eacute;</div>
                <div class="score-value" style="color:${getScoreColor(s.clarity.score)}">${s.clarity.score != null ? s.clarity.score + '/5' : '&mdash;'}</div>
              </div>
              <div class="score-item">
                <div class="score-label">Satisfaction</div>
                <div class="score-value" style="color:${getScoreColor(s.satisfaction.score)}">${s.satisfaction.score != null ? s.satisfaction.score + '/5' : '&mdash;'}</div>
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
          html += `<div class="mb-3"><span class="tag tag-success mb-2">Termin&eacute;es</span><ul style="padding-left:var(--space-5)">`;
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
          html += `<div class="mb-3"><span class="tag tag-error mb-2">Bloqu&eacute;</span><ul style="padding-left:var(--space-5)">`;
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
              <div class="card-title">&Eacute;v&eacute;nements</div>
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
              <div class="card-title">Le&ccedil;ons du jour</div>
            </div>
            <div class="card-body">
              <ul style="list-style:disc;padding-left:var(--space-5)">
                ${s.lessons.map(l => `<li class="mb-1">${escapeHtml(String(l))}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
      }

      // Tomorrow Focus (from summary)
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
              <div class="card-title">Id&eacute;es du jour</div>
            </div>
            <div class="card-body">
              ${todayIdeas.map(idea => `
                <div class="flex items-center justify-between mb-2">
                  <span>&#x1F4A1; ${escapeHtml(idea.content)}</span>
                  ${getStatusBadge(idea.status)}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    }

    // ===================================================================
    // QUICK MOODS
    // ===================================================================
    const todayMoods = entries.filter(e => e.type === 'mood');
    const lastMood = todayMoods.length > 0 ? todayMoods[todayMoods.length - 1] : null;
    const moodMap = {0: '😴', 1: '💫', 2: '⚡', 3: '🔥', 4: '🌪️'};

    html += `
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">Humeur rapide</div>
        </div>
        <div class="card-body">
          <div class="quick-moods-bar">
            ${[0,1,2,3,4].map(i => {
              const moodEmoji = moodMap[i];
              const isSelected = lastMood && lastMood.content === moodEmoji;
              return `<button class="quick-mood-btn${isSelected ? ' selected' : ''}" onclick="addQuickMood('${moodEmoji}')" title="${moodEmoji}">${moodEmoji}</button>`;
            }).join('')}
          </div>
          ${lastMood ? `<div class="text-muted text-xs mt-2">Derni&egrave;re humeur: ${lastMood.content}</div>` : ''}
        </div>
      </div>
    `;

    // ===================================================================
    // WIN OF THE DAY
    // ===================================================================
    const allWins = allEntries
      .filter(e => e.type === 'win')
      .sort((a, b) => {
        const aTime = a.created_at || a.date + 'T' + (a.time || '00:00');
        const bTime = b.created_at || b.date + 'T' + (b.time || '00:00');
        return bTime.localeCompare(aTime);
      });
    const recentWins = allWins.slice(0, 3);

    html += `
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">&#x1F3C6; Win du jour</div>
        </div>
        <div class="card-body">
          <div class="win-section">
            <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-3)">
              <input type="text" id="win-input" placeholder="Note ta victoire du jour..."
                style="flex:1;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm)"
                onkeydown="if(event.key==='Enter')addWin()">
              <button onclick="addWin()" class="btn"
                style="padding:var(--space-2) var(--space-4);background:var(--color-win);color:white;border:none;border-radius:var(--radius-md);cursor:pointer;font-size:var(--font-size-sm);font-weight:var(--font-weight-semibold)">
                +
              </button>
            </div>
            ${recentWins.length > 0 ? `
              <div>
                ${recentWins.map(w => `
                  <div class="flex items-center gap-2 mb-2">
                    <span>&#x1F3C6;</span>
                    <span>${escapeHtml(w.content)}</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-muted text-sm">${escapeHtml(window.t('today_win_empty'))}</div>
            `}
          </div>
        </div>
      </div>
    `;

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

    // ===================================================================
    // TOMORROW PRIORITY (at the bottom)
    // ===================================================================
    html += `
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">Priorit&eacute; de demain</div>
        </div>
        <div class="card-body">
          <div style="display:flex;gap:var(--space-2)">
            <input type="text" id="tomorrow-priority-input" placeholder="Quelle est ta priorit&eacute; pour demain ?"
              style="flex:1;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm)"
              onkeydown="if(event.key==='Enter')saveTomorrowPriority()">
            <button onclick="saveTomorrowPriority()" class="btn"
              style="padding:var(--space-2) var(--space-4);background:var(--color-accent);color:white;border:none;border-radius:var(--radius-md);cursor:pointer;font-size:var(--font-size-sm);font-weight:var(--font-weight-semibold)">
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    `;

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
        ${renderEmptyState('Aucune donn\u00e9e pour aujourd\'hui', 'Commencez \u00e0 journaliser pour voir votre journ\u00e9e ici.')}
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

/* ===== Helper Functions ===== */

/**
 * Calculate streak: consecutive days with at least one entry going backwards from today
 * @param {Array} allEntries - All entries across all dates
 * @returns {number} - Streak count
 */
function calculateStreak(allEntries) {
  if (!allEntries || allEntries.length === 0) return 0;

  // Build a set of dates that have entries
  const dateSet = new Set();
  allEntries.forEach(e => {
    if (e.date) dateSet.add(e.date);
  });

  if (dateSet.size === 0) return 0;

  // Count backwards from today
  let streak = 0;
  const today = new Date();
  const checkDate = new Date(today);

  // Check today first
  const todayStr = checkDate.toISOString().split('T')[0];
  if (!dateSet.has(todayStr)) {
    // If no entry today, check if there's an entry yesterday (consecutive ending yesterday)
    // Return 0 for today with no entry
    return 0;
  }

  // Today has an entry, count consecutive days backward
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get yesterday's ISO date string
 * @returns {string} - YYYY-MM-DD
 */
function getYesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Add a quick mood entry
 * @param {string} emoji - The mood emoji
 */
async function addQuickMood(emoji) {
  const today = getTodayISO();
  const newEntry = {
    date: today,
    time: getLocalTime(),
    type: 'mood',
    content: emoji
  };

  try {
    await addEntry(newEntry);
    showToast('Humeur enregistr\u00e9e ' + emoji, 'success');
    renderTodayPage();
  } catch (e) {
    showToast('Erreur: ' + e.message, 'error');
  }
}

/**
 * Add a win of the day entry
 */
async function addWin() {
  const input = document.getElementById('win-input');
  if (!input || !input.value.trim()) {
    showToast('\u00c9cris ta victoire d\'abord', 'warning');
    input?.focus();
    return;
  }

  const today = getTodayISO();
  const newEntry = {
    date: today,
    time: getLocalTime(),
    type: 'win',
    content: input.value.trim()
  };

  try {
    await addEntry(newEntry);
    input.value = '';
    showToast('Victoire ajout\u00e9e \u2713', 'success');
    // Fire confetti on the win section
    const winCard = document.querySelector('.card:has(.win-section)');
    if (winCard && typeof fireConfetti === 'function') {
      fireConfetti(winCard);
    }
    renderTodayPage();
  } catch (e) {
    showToast('Erreur: ' + e.message, 'error');
  }
}

/**
 * Save tomorrow priority entry
 */
async function saveTomorrowPriority() {
  const input = document.getElementById('tomorrow-priority-input');
  if (!input || !input.value.trim()) {
    showToast('\u00c9cris une priorit\u00e9 d\'abord', 'warning');
    input?.focus();
    return;
  }

  const today = getTodayISO();
  const newEntry = {
    date: today,
    time: getLocalTime(),
    type: 'reflection',
    content: '[TOMORROW] ' + input.value.trim()
  };

  try {
    await addEntry(newEntry);
    input.value = '';
    showToast('Priorit\u00e9 enregistr\u00e9e \u2713', 'success');
    renderTodayPage();
  } catch (e) {
    showToast('Erreur: ' + e.message, 'error');
  }
}

/**
 * Mark the tomorrow focus as done
 */
async function markTomorrowFocusDone() {
  const card = document.getElementById('tomorrow-focus-card');
  if (card) {
    card.classList.add('done');
    card.querySelector('button').textContent = 'Fait \u2713';
    card.querySelector('button').style.background = 'var(--color-text-muted)';
    card.querySelector('button').disabled = true;
  }
  showToast('Focus du jour marqu\u00e9 comme fait \u2713', 'success');
}

/* ===== Score Helpers ===== */

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
    showToast("\u00c9cris quelque chose d'abord", 'warning');
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
    showToast('Entr\u00e9e ajout\u00e9e \u2713', 'success');
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
