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
        <h1 class="section-title">💡 Idées</h1>
      </div>

      <div class="filter-bar">
        <select class="form-select" onchange="ideasFilterChange('status', this.value)" aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          <option value="inbox" ${ideasFilters.status === 'inbox' ? 'selected' : ''}>Boîte de réception</option>
          <option value="exploring" ${ideasFilters.status === 'exploring' ? 'selected' : ''}>En exploration</option>
          <option value="active" ${ideasFilters.status === 'active' ? 'selected' : ''}>Actif</option>
          <option value="parked" ${ideasFilters.status === 'parked' ? 'selected' : ''}>En attente</option>
          <option value="archived" ${ideasFilters.status === 'archived' ? 'selected' : ''}>Archivé</option>
        </select>
        <select class="form-select" onchange="ideasFilterChange('tag', this.value)" aria-label="Filtrer par tag">
          <option value="">Tous les tags</option>
          ${allTags.map(t => `<option value="${escapeHtml(t)}" ${ideasFilters.tag === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
        </select>
        <input class="form-input" type="text" placeholder="Rechercher..." value="${escapeHtml(ideasFilters.search)}" oninput="ideasFilterChange('search', this.value)" style="flex:2">
      </div>
    `;

    if (filtered.length > 0) {
      // Idea cards in a grid
      html += `<div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">`;
      filtered.forEach(idea => {
        const createdDate = idea.created_at ? formatDate(idea.created_at, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
        const statusBadge = getStatusBadge(idea.status);
        const potentialColor = idea.potential_score >= 8 ? 'var(--color-success)' : idea.potential_score >= 5 ? 'var(--color-warning)' : 'var(--color-text-muted)';

        html += `
          <div class="card" style="display:flex;flex-direction:column">
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
                  📅 Prochaine revue: ${escapeHtml(formatDate(idea.next_review, { month: 'short', day: 'numeric' }))}
                </div>
              ` : ''}
            </div>
            <div class="flex gap-2 mt-3 pt-3" style="border-top:1px solid var(--color-border)">
              <select class="form-select btn-sm" onchange="changeIdeaStatus('${idea.id}', this.value)" style="flex:1;min-height:32px;font-size:var(--font-size-xs);padding:4px 8px" aria-label="Changer le statut">
                <option value="inbox" ${idea.status === 'inbox' ? 'selected' : ''}>Boîte</option>
                <option value="exploring" ${idea.status === 'exploring' ? 'selected' : ''}>Explore</option>
                <option value="active" ${idea.status === 'active' ? 'selected' : ''}>Actif</option>
                <option value="parked" ${idea.status === 'parked' ? 'selected' : ''}>Parked</option>
                <option value="archived" ${idea.status === 'archived' ? 'selected' : ''}>Archive</option>
              </select>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    } else {
      html += renderEmptyState('Aucune idée pour le moment', 'Capturez vos premières idées pour les voir apparaître ici.');
    }

    store.setState({ loading: false });
    app.innerHTML = html;
    updateNav();

  } catch (error) {
    console.error('Ideas page error:', error);
    store.setState({ loading: false });
    app.innerHTML = renderError('Erreur lors du chargement des idées.');
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
  showToast(`Idée mise à jour: ${newStatus}`, 'success');
  renderIdeasPage();
}
