/* ===== DailyOS Ideas Page ===== */

let ideasFilters = {
  status: '',
  tag: '',
  search: ''
};

async function renderIdeasPage() {
  const app = document.getElementById('app');
  store.setState({ loading: true });
  app.innerHTML = renderLoading();

  try {
    const ideas = store.getState('ideas').length > 0
      ? store.getState('ideas')
      : DEMO_DATA.ideas;

    store.setState({ ideas });

    // Get all unique tags
    const allTags = [...new Set(ideas.flatMap(i => i.tags || []))].sort();

    // Apply filters
    let filtered = [...ideas];
    if (ideasFilters.status) {
      filtered = filtered.filter(i => i.status === ideasFilters.status);
    }
    if (ideasFilters.tag) {
      filtered = filtered.filter(i => i.tags && i.tags.includes(ideasFilters.tag));
    }
    if (ideasFilters.search) {
      const q = ideasFilters.search.toLowerCase();
      filtered = filtered.filter(i => i.content.toLowerCase().includes(q));
    }

    // Sort by potential score descending, then by creation date
    filtered.sort((a, b) => {
      if (b.potential_score !== a.potential_score) return (b.potential_score || 0) - (a.potential_score || 0);
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

    let html = `
      <div class="section">
        <h1 class="section-title">💡 ${window.t ? window.t('ideas_title') : 'Idées'}</h1>
      </div>

      <!-- Quick capture button -->
      <div class="mb-4">
        <button class="btn btn-primary" onclick="openQuickEntry('idea')" style="font-size:var(--font-size-base);padding:var(--space-2) var(--space-4);width:100%">
          ⚡ ${window.t ? window.t('ideas_capture_eclair') : 'Capture éclair'}
        </button>
      </div>

      <!-- Status pill filters -->
      <div class="mb-4" style="display:flex;gap:var(--space-2);flex-wrap:wrap">
        <button class="btn btn-sm ${!ideasFilters.status ? 'btn-primary' : 'btn-ghost'}" onclick="ideasFilterChange('status', '')">
          ${window.t ? window.t('all') : 'Tous'}
        </button>
        <button class="btn btn-sm ${ideasFilters.status === 'inbox' ? 'btn-primary' : 'btn-ghost'}" onclick="ideasFilterChange('status', 'inbox')">
          📥 ${window.t ? window.t('idea_status_inbox') : 'Boîte de réception'}
        </button>
        <button class="btn btn-sm ${ideasFilters.status === 'inprogress' ? 'btn-primary' : 'btn-ghost'}" onclick="ideasFilterChange('status', 'inprogress')">
          🔄 ${window.t ? window.t('idea_status_inprogress') : 'En cours'}
        </button>
        <button class="btn btn-sm ${ideasFilters.status === 'exploring' ? 'btn-primary' : 'btn-ghost'}" onclick="ideasFilterChange('status', 'exploring')">
          🔍 ${window.t ? window.t('idea_status_exploring') : 'En exploration'}
        </button>
        <button class="btn btn-sm ${ideasFilters.status === 'active' ? 'btn-primary' : 'btn-ghost'}" onclick="ideasFilterChange('status', 'active')">
          🚀 ${window.t ? window.t('idea_status_active') : 'Actif'}
        </button>
        <button class="btn btn-sm ${ideasFilters.status === 'parked' ? 'btn-primary' : 'btn-ghost'}" onclick="ideasFilterChange('status', 'parked')">
          🅿️ ${window.t ? window.t('idea_status_parked') : 'En attente'}
        </button>
        <button class="btn btn-sm ${ideasFilters.status === 'archived' ? 'btn-primary' : 'btn-ghost'}" onclick="ideasFilterChange('status', 'archived')">
          📦 ${window.t ? window.t('idea_status_archived') : 'Archivé'}
        </button>
      </div>

      <div class="filter-bar">
        <select class="form-select" onchange="ideasFilterChange('tag', this.value)" aria-label="${window.t ? window.t('filter_by_tag') : 'Filtrer par tag'}">
          <option value="">${window.t ? window.t('all_tags') : 'Tous les tags'}</option>
          ${allTags.map(t => `<option value="${escapeHtml(t)}" ${ideasFilters.tag === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
        </select>
        <input class="form-input" type="text" placeholder="${window.t ? window.t('search_placeholder') : 'Rechercher...'}" value="${escapeHtml(ideasFilters.search)}" oninput="ideasFilterChange('search', this.value)" style="flex:2">
      </div>
    `;

    if (filtered.length > 0) {
      // Idea cards in a grid
      html += `<div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">`;
      filtered.forEach(idea => {
        const createdDate = idea.created_at ? formatDate(idea.created_at, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
        const statusBadge = getStatusBadge(idea.status);
        const potentialColor = idea.potential_score >= 8 ? 'var(--color-success)' : idea.potential_score >= 5 ? 'var(--color-warning)' : 'var(--color-text-muted)';
        const isInbox = idea.status === 'inbox';

        html += `
          <div class="card" style="display:flex;flex-direction:column;${isInbox ? 'border-left:4px solid var(--color-accent);' : ''}">
            <div class="card-body" style="flex:1">
              <div class="flex items-center justify-between mb-3">
                ${statusBadge}
                <span style="color:${potentialColor};font-weight:var(--font-weight-bold);font-size:var(--font-size-sm)">${idea.potential_score || '—'}/10</span>
              </div>
              <p class="mb-3" style="line-height:var(--line-height-relaxed)">${escapeHtml(idea.content)}</p>
              ${idea.tags && idea.tags.length > 0 ? `
                <div class="flex gap-2 flex-wrap mb-3">
                  ${idea.tags.map(t => `<span class="tag tag-neutral">${escapeHtml(t)}</span>`).join('')}
                </div>
              ` : ''}
              <div class="text-xs text-muted">${escapeHtml(createdDate)}</div>
              ${idea.next_review ? `
                <div class="text-xs mt-2" style="color:var(--color-warning)">
                  📅 ${window.t ? window.t('next_review') : 'Prochaine revue'}: ${escapeHtml(formatDate(idea.next_review, { month: 'short', day: 'numeric' }))}
                </div>
              ` : ''}

              <!-- Next action inline editable field -->
              <div class="mt-3 pt-2" style="border-top:1px solid var(--color-border)">
                <label class="text-xs text-muted" style="display:block;margin-bottom:4px">${window.t ? window.t('next_action') : 'Next action'}</label>
                <input type="text" class="form-input" style="font-size:var(--font-size-xs);padding:4px 8px;width:100%" 
                  value="${escapeHtml(idea.next_action || '')}" 
                  placeholder="${window.t ? window.t('next_action_placeholder') : 'What\'s the next step?'}"
                  onchange="updateIdeaNextAction('${idea.id}', this.value)" />
              </div>
            </div>
            <div class="flex gap-2 mt-3 pt-3" style="border-top:1px solid var(--color-border)">
              <select class="form-select btn-sm" onchange="changeIdeaStatus('${idea.id}', this.value)" style="flex:1;min-height:32px;font-size:var(--font-size-xs);padding:4px 8px" aria-label="${window.t ? window.t('change_status') : 'Changer le statut'}">
                <option value="inbox" ${idea.status === 'inbox' ? 'selected' : ''}>${window.t ? window.t('idea_inbox') : 'Boîte'}</option>
                <option value="inprogress" ${idea.status === 'inprogress' ? 'selected' : ''}>${window.t ? window.t('idea_inprogress') : 'En cours'}</option>
                <option value="exploring" ${idea.status === 'exploring' ? 'selected' : ''}>${window.t ? window.t('idea_explore') : 'Explore'}</option>
                <option value="active" ${idea.status === 'active' ? 'selected' : ''}>${window.t ? window.t('idea_active') : 'Actif'}</option>
                <option value="parked" ${idea.status === 'parked' ? 'selected' : ''}>${window.t ? window.t('idea_parked') : 'Parked'}</option>
                <option value="archived" ${idea.status === 'archived' ? 'selected' : ''}>${window.t ? window.t('idea_archive') : 'Archive'}</option>
              </select>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    } else {
      html += renderEmptyState(window.t ? window.t('no_ideas') : 'Aucune idée pour le moment', window.t ? window.t('no_ideas_hint') : 'Capturez vos premières idées pour les voir apparaître ici.');
    }

    store.setState({ loading: false });
    app.innerHTML = html;
    updateNav();

  } catch (error) {
    console.error('Ideas page error:', error);
    store.setState({ loading: false });
    app.innerHTML = renderError(window.t ? window.t('ideas_load_error') : 'Erreur lors du chargement des idées.');
  }
}

function ideasFilterChange(field, value) {
  ideasFilters[field] = value;
  renderIdeasPage();
}

function changeIdeaStatus(ideaId, newStatus) {
  const ideas = store.getState('ideas');
  const updated = ideas.map(i => {
    if (i.id === ideaId) {
      return { ...i, status: newStatus, updated_at: new Date().toISOString() };
    }
    return i;
  });
  store.setState({ ideas: updated });
  // Also update demo data
  const demoIdx = DEMO_DATA.ideas.findIndex(i => i.id === ideaId);
  if (demoIdx >= 0) {
    DEMO_DATA.ideas[demoIdx].status = newStatus;
    DEMO_DATA.ideas[demoIdx].updated_at = new Date().toISOString();
  }
  showToast(`${window.t ? window.t('idea_updated') : 'Idée mise à jour'}: ${newStatus}`, 'success');
  renderIdeasPage();
}

function updateIdeaNextAction(ideaId, nextAction) {
  const ideas = store.getState('ideas');
  const updated = ideas.map(i => {
    if (i.id === ideaId) {
      return { ...i, next_action: nextAction, updated_at: new Date().toISOString() };
    }
    return i;
  });
  store.setState({ ideas: updated });
  const demoIdx = DEMO_DATA.ideas.findIndex(i => i.id === ideaId);
  if (demoIdx >= 0) {
    DEMO_DATA.ideas[demoIdx].next_action = nextAction;
    DEMO_DATA.ideas[demoIdx].updated_at = new Date().toISOString();
  }
}
