/* ===== DailyOS Journal Page ===== */

let journalState = {
  selectedDate: getTodayISO(),
  searchQuery: '',
  dateFrom: '',
  dateTo: ''
};

async function renderJournalPage(focusHint) {
  const app = document.getElementById('app');
  store.setState({ loading: true });
  app.innerHTML = renderLoading();

  try {
    const allSummaries = store.getState('summaries').length > 0
      ? store.getState('summaries')
      : DEMO_DATA.summaries;

    const allEntries = store.getState('entries').length > 0
      ? store.getState('entries')
      : DEMO_DATA.entries;

    store.setState({ summaries: allSummaries, entries: allEntries });

    const summaries = allSummaries;
    const entries = allEntries;

    // Count entries per day
    const entryCounts = {};
    entries.forEach(e => {
      entryCounts[e.date] = (entryCounts[e.date] || 0) + 1;
    });

    // Build calendar
    const today = getTodayISO();
    const selDate = journalState.selectedDate || today;
    const parsedDate = new Date(selDate + 'T12:00:00');
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth();
    const monthName = parsedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // First day of month and total days
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Filter summaries by search / date range
    let filteredSummaries = [...summaries];
    if (journalState.searchQuery) {
      const q = journalState.searchQuery.toLowerCase();
      filteredSummaries = filteredSummaries.filter(s =>
        (s.highlights && s.highlights.some(h => h.toLowerCase().includes(q))) ||
        (s.lessons && s.lessons.some(l => l.toLowerCase().includes(q)))
      );
    }
    if (journalState.dateFrom) {
      filteredSummaries = filteredSummaries.filter(s => s.date >= journalState.dateFrom);
    }
    if (journalState.dateTo) {
      filteredSummaries = filteredSummaries.filter(s => s.date <= journalState.dateTo);
    }

    // Sort summaries by date descending
    filteredSummaries.sort((a, b) => b.date.localeCompare(a.date));

    // Selected summary
    const selectedSummary = summaries.find(s => s.date === selDate);

    let html = `
      <div class="section">
        <h1 class="section-title">📖 Journal</h1>
      </div>

      <!-- Entry form -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">Nouvelle entrée</div>
        </div>
        <div class="card-body">
          <form id="journal-entry-form" onsubmit="submitJournalEntry(event)">
            <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-2);flex-wrap:wrap">
              <input type="date" id="journal-entry-date" value="${selDate}"
                style="flex:1;min-width:140px;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm)">
              <input type="text" id="journal-entry-time" placeholder="Heure" value="${getLocalTime()}"
                style="flex:0 0 80px;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm)">
              <select id="journal-entry-type"
                style="flex:0 0 130px;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm)">
                <option value="note">Note</option>
                <option value="morning">Matin</option>
                <option value="afternoon">Après-midi</option>
                <option value="evening">Soirée</option>
                <option value="reflection">Réflexion</option>
                <option value="event">Événement</option>
                <option value="mood">Humeur</option>
              </select>
            </div>
            <textarea id="journal-entry-content" rows="4" placeholder="Qu'as-tu fait ? Comment te sens-tu ?"
              style="width:100%;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm);resize:vertical">${focusHint || ''}</textarea>
            <div style="display:flex;gap:var(--space-2);margin-top:var(--space-2);flex-wrap:wrap">
              <input type="text" id="journal-entry-tags" placeholder="Tags (séparés par des virgules)"
                style="flex:1;min-width:120px;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm)">
              <input type="number" id="journal-entry-mood" min="1" max="5" placeholder="Humeur 1-5"
                style="flex:0 0 120px;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);font-size:var(--font-size-sm)">
              <button type="submit"
                style="padding:var(--space-2) var(--space-4);background:var(--color-accent);color:white;border:none;border-radius:var(--radius-md);cursor:pointer;font-size:var(--font-size-sm);font-weight:var(--font-weight-semibold)">
                Publier
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Calendar -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">${escapeHtml(monthName)}</div>
          <div class="flex gap-2">
            <button class="btn btn-sm btn-ghost" onclick="changeMonth(-1)" aria-label="Mois précédent">◀</button>
            <button class="btn btn-sm btn-ghost" onclick="changeMonth(1)" aria-label="Mois suivant">▶</button>
          </div>
        </div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center">
            ${['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'].map(d => `<div class="text-xs text-muted" style="padding:4px">${d}</div>`).join('')}
            ${Array.from({length: firstDay === 0 ? 6 : firstDay - 1}, () => '<div></div>').join('')}
            ${Array.from({length: daysInMonth}, (_, i) => {
              const day = String(i + 1).padStart(2, '0');
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${day}`;
              const isSelected = dateStr === selDate;
              const isToday = dateStr === today;
              const hasEntry = entryCounts[dateStr] > 0;
              const hasSummary = summaries.some(s => s.date === dateStr);
              const count = entryCounts[dateStr] || 0;
              const cls = isSelected ? 'accent' : isToday ? 'today' : '';
              return `<div onclick="selectJournalDate('${dateStr}')" style="cursor:pointer;padding:4px;border-radius:var(--radius-sm);background:${isSelected ? 'var(--color-accent)' : isToday ? 'var(--color-accent-light)' : 'transparent'};color:${isSelected ? '#fff' : isToday ? 'var(--color-accent)' : 'var(--color-text)'};position:relative;min-height:36px;display:flex;flex-direction:column;align-items:center;justify-content:center">
                <span style="font-size:var(--font-size-sm);font-weight:${isSelected || isToday ? 'bold' : 'normal'}">${i + 1}</span>
                ${hasSummary ? '<span style="font-size:8px;color:var(--color-success)">●</span>' : count > 0 ? `<span style="font-size:10px;color:var(--color-text-muted)">${count}</span>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Selected date summary
    if (selectedSummary) {
      const s = selectedSummary;
      html += `
        <div class="card mb-6">
          <div class="card-header">
            <div class="card-title">${escapeHtml(formatDate(selDate))}</div>
          </div>
          <div class="card-body">
            <div class="score-grid mb-4">
              <div class="score-item">
                <div class="score-label">Humeur</div>
                <div class="score-value" style="color:${getScoreColor(s.mood.score)};font-size:1.2rem">${s.mood.score != null ? s.mood.score + '/5' : '—'}</div>
              </div>
              <div class="score-item">
                <div class="score-label">Énergie</div>
                <div class="score-value" style="color:${getScoreColor(s.energy.score)};font-size:1.2rem">${s.energy.score != null ? s.energy.score + '/5' : '—'}</div>
              </div>
              <div class="score-item">
                <div class="score-label">Satisfaction</div>
                <div class="score-value" style="color:${getScoreColor(s.satisfaction.score)};font-size:1.2rem">${s.satisfaction.score != null ? s.satisfaction.score + '/5' : '—'}</div>
              </div>
            </div>

            ${s.highlights && s.highlights.length > 0 ? `
              <div class="mb-3">
                <div class="font-medium text-sm mb-2">Points forts</div>
                <ul style="list-style:disc;padding-left:var(--space-5)">
                  ${s.highlights.map(h => `<li class="mb-1">${escapeHtml(h)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${s.lessons && s.lessons.length > 0 ? `
              <div class="mb-3">
                <div class="font-medium text-sm mb-2">Leçons</div>
                <ul style="list-style:disc;padding-left:var(--space-5)">
                  ${s.lessons.map(l => `<li class="mb-1">${escapeHtml(String(l))}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${s.tomorrow_focus && s.tomorrow_focus.length > 0 ? `
              <div>
                <div class="font-medium text-sm mb-2">Focus demain</div>
                <ul style="list-style:disc;padding-left:var(--space-5)">
                  ${s.tomorrow_focus.map(f => `<li class="mb-1">${escapeHtml(String(f))}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <div class="mt-4 text-sm text-muted">
              ${s.entry_count || entryCounts[selDate] || 0} entrée${(s.entry_count || entryCounts[selDate] || 0) > 1 ? 's' : ''} • ${s.ideas_count || 0} idée${(s.ideas_count || 0) > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      `;
    } else {
      html += renderEmptyState('Aucun résumé pour cette date', 'Sélectionnez une autre date ou créez une entrée.');
    }

    // Search / filter
    html += `
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">Tous les résumés</div>
        </div>
        <div class="card-body">
          <div class="filter-bar">
            <input class="form-input" type="text" id="journal-search" placeholder="Rechercher..." value="${escapeHtml(journalState.searchQuery)}" oninput="filterJournal(event)">
            <input class="form-input" type="date" id="journal-date-from" value="${journalState.dateFrom}" onchange="journalDateFromChange(event)">
            <input class="form-input" type="date" id="journal-date-to" value="${journalState.dateTo}" onchange="journalDateToChange(event)">
          </div>

          ${filteredSummaries.length > 0 ? filteredSummaries.map(s => `
            <div class="insight-card" onclick="selectJournalDate('${s.date}')" style="cursor:pointer">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">${escapeHtml(formatDate(s.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}</div>
                <span class="text-xs text-muted">${s.entry_count || 0} entrée${(s.entry_count || 0) > 1 ? 's' : ''}</span>
              </div>
              ${s.highlights && s.highlights.length > 0 ? `<div class="text-sm text-muted">${s.highlights.slice(0, 2).map(h => escapeHtml(h)).join(' · ')}</div>` : ''}
              <div class="flex gap-2 mt-2">
                <span class="tag ${s.mood.score >= 4 ? 'tag-success' : s.mood.score >= 3 ? 'tag-warning' : 'tag-error'}">Humeur: ${s.mood.score}/5</span>
                <span class="tag ${s.satisfaction.score >= 4 ? 'tag-success' : 'tag-neutral'}">Sat.: ${s.satisfaction.score}/5</span>
              </div>
            </div>
          `).join('') : renderEmptyState('Aucun résumé trouvé', 'Essayez d\'ajuster vos filtres de recherche.')}
        </div>
      </div>
    `;

    store.setState({ loading: false });
    app.innerHTML = html;
    updateNav();

  } catch (error) {
    console.error('Journal page error:', error);
    store.setState({ loading: false });
    app.innerHTML = renderError('Erreur lors du chargement du journal.');
  }
}

function selectJournalDate(dateStr) {
  journalState.selectedDate = dateStr;
  renderJournalPage();
}

function changeMonth(delta) {
  const current = new Date((journalState.selectedDate || getTodayISO()) + 'T12:00:00');
  current.setMonth(current.getMonth() + delta);
  journalState.selectedDate = current.toISOString().split('T')[0];
  renderJournalPage();
}

/**
 * Submit a journal entry from the form
 */
async function submitJournalEntry(event) {
  event.preventDefault();

  const content = document.getElementById('journal-entry-content');
  const dateInput = document.getElementById('journal-entry-date');
  const timeInput = document.getElementById('journal-entry-time');
  const typeSelect = document.getElementById('journal-entry-type');
  const tagsInput = document.getElementById('journal-entry-tags');
  const moodInput = document.getElementById('journal-entry-mood');

  if (!content || !content.value.trim()) {
    showToast('Écris quelque chose', 'warning');
    content?.focus();
    return;
  }

  const tags = tagsInput?.value
    ? tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const mood = moodInput?.value ? parseFloat(moodInput.value) : null;

  const newEntry = {
    date: dateInput?.value || getTodayISO(),
    time: timeInput?.value || getLocalTime(),
    type: typeSelect?.value || 'note',
    content: content.value.trim(),
    tags: tags,
    mood_score: (mood >= 1 && mood <= 5) ? mood : null
  };

  try {
    await addEntry(newEntry);
    content.value = '';
    if (tagsInput) tagsInput.value = '';
    if (moodInput) moodInput.value = '';
    showToast('Entrée publiée ✓', 'success');
    renderJournalPage();
  } catch (e) {
    showToast('Erreur: ' + e.message, 'error');
  }
}

function filterJournal(event) {
  journalState.searchQuery = event.target.value;
  renderJournalPage();
}

function journalDateFromChange(event) {
  journalState.dateFrom = event.target.value;
  renderJournalPage();
}

function journalDateToChange(event) {
  journalState.dateTo = event.target.value;
  renderJournalPage();
}
