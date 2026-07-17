/* ===== DailyOS Reminders Page ===== */

let remindersFilters = {
  status: '',
  category: ''
};

let remindersTab = 'today';

async function renderRemindersPage() {
  const app = document.getElementById('app');
  store.setState({ loading: true });
  app.innerHTML = renderLoading();

  try {
    const reminders = store.getState('reminders').length > 0
      ? store.getState('reminders')
      : DEMO_DATA.reminders;

    store.setState({ reminders });

    const today = getTodayISO();
    const now = new Date();
    
    // Calculate "this week" boundaries
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

    // Apply filters
    let filtered = [...reminders];
    if (remindersFilters.status) {
      filtered = filtered.filter(r => r.status === remindersFilters.status);
    }
    if (remindersFilters.category) {
      filtered = filtered.filter(r => r.category === remindersFilters.category);
    }

    // Filter by tab
    let tabFiltered = [...filtered];
    if (remindersTab === 'today') {
      tabFiltered = tabFiltered.filter(r => {
        const rDate = r.created_at ? r.created_at.split('T')[0] : r.due_date;
        return rDate === today;
      });
    } else if (remindersTab === 'week') {
      tabFiltered = tabFiltered.filter(r => {
        const rDate = r.created_at ? r.created_at.split('T')[0] : r.due_date;
        return rDate >= startOfWeekStr && rDate <= endOfWeekStr;
      });
    }
    // 'all' = no additional filter

    // "À faire maintenant": overdue + due today, active status
    const nowDue = tabFiltered.filter(r =>
      r.status === 'active' && r.due_date <= today
    );
    nowDue.sort((a, b) => a.due_date.localeCompare(b.due_date));

    // Categorize remaining
    const activeReminders = tabFiltered.filter(r => r.status === 'active' && r.due_date > today);
    const doneReminders = tabFiltered.filter(r => r.status === 'done');
    const snoozedReminders = tabFiltered.filter(r => r.status === 'snoozed');
    const cancelledReminders = tabFiltered.filter(r => r.status === 'cancelled');

    activeReminders.sort((a, b) => a.due_date.localeCompare(b.due_date));

    let html = `
      <div class="section">
        <h1 class="section-title">🔔 ${window.t ? window.t('reminders_title') : 'Rappels'}</h1>
      </div>

      <!-- Tabs: Today / This week / All -->
      <div class="tabs mb-4" role="tablist">
        <button class="tab ${remindersTab === 'today' ? 'active' : ''}" onclick="changeRemindersTab('today')" role="tab" aria-selected="${remindersTab === 'today'}">
          ${window.t ? window.t('reminders_tab_today') : 'Today'}
        </button>
        <button class="tab ${remindersTab === 'week' ? 'active' : ''}" onclick="changeRemindersTab('week')" role="tab" aria-selected="${remindersTab === 'week'}">
          ${window.t ? window.t('reminders_tab_week') : 'This week'}
        </button>
        <button class="tab ${remindersTab === 'all' ? 'active' : ''}" onclick="changeRemindersTab('all')" role="tab" aria-selected="${remindersTab === 'all'}">
          ${window.t ? window.t('reminders_tab_all') : 'All'}
        </button>
      </div>

      <div class="filter-bar">
        <select class="form-select" onchange="remindersFilterChange('status', this.value)" aria-label="${window.t ? window.t('filter_by_status') : 'Filtrer par statut'}">
          <option value="">${window.t ? window.t('all_statuses') : 'Tous les statuts'}</option>
          <option value="active" ${remindersFilters.status === 'active' ? 'selected' : ''}>${window.t ? window.t('reminder_active') : 'Actif'}</option>
          <option value="done" ${remindersFilters.status === 'done' ? 'selected' : ''}>${window.t ? window.t('reminder_done') : 'Terminé'}</option>
          <option value="snoozed" ${remindersFilters.status === 'snoozed' ? 'selected' : ''}>${window.t ? window.t('reminder_snoozed') : 'Reporté'}</option>
          <option value="cancelled" ${remindersFilters.status === 'cancelled' ? 'selected' : ''}>${window.t ? window.t('reminder_cancelled') : 'Annulé'}</option>
        </select>
        <select class="form-select" onchange="remindersFilterChange('category', this.value)" aria-label="${window.t ? window.t('filter_by_category') : 'Filtrer par catégorie'}">
          <option value="">${window.t ? window.t('all_categories') : 'Toutes catégories'}</option>
          <option value="action" ${remindersFilters.category === 'action' ? 'selected' : ''}>${window.t ? window.t('cat_action') : 'Action'}</option>
          <option value="follow_up" ${remindersFilters.category === 'follow_up' ? 'selected' : ''}>${window.t ? window.t('cat_follow_up') : 'Suivi'}</option>
          <option value="review" ${remindersFilters.category === 'review' ? 'selected' : ''}>${window.t ? window.t('cat_review') : 'Revue'}</option>
          <option value="open_loop" ${remindersFilters.category === 'open_loop' ? 'selected' : ''}>${window.t ? window.t('cat_open_loop') : 'Boucle ouverte'}</option>
        </select>
      </div>
    `;

    // À faire maintenant section
    if (nowDue.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title" style="font-size:var(--font-size-base);color:var(--color-error)">⚠️ ${window.t ? window.t('reminders_due_now') : 'À faire maintenant'}</h2>
          ${nowDue.map(r => renderReminderCard(r, true)).join('')}
        </div>
      `;
    }

    // Active reminders
    if (activeReminders.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title" style="font-size:var(--font-size-base)">📋 ${window.t ? window.t('reminders_upcoming') : 'À venir'} (${activeReminders.length})</h2>
          ${activeReminders.map(r => renderReminderCard(r)).join('')}
        </div>
      `;
    }

    // Snoozed
    if (snoozedReminders.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title" style="font-size:var(--font-size-base);color:var(--color-warning)">⏰ ${window.t ? window.t('reminders_snoozed_section') : 'Reportés'} (${snoozedReminders.length})</h2>
          ${snoozedReminders.map(r => renderReminderCard(r)).join('')}
        </div>
      `;
    }

    // Done
    if (doneReminders.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title" style="font-size:var(--font-size-base);color:var(--color-success)">✅ ${window.t ? window.t('reminders_done_section') : 'Terminés'} (${doneReminders.length})</h2>
          ${doneReminders.map(r => renderReminderCard(r)).join('')}
        </div>
      `;
    }

    // Cancelled
    if (cancelledReminders.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title" style="font-size:var(--font-size-base);color:var(--color-text-muted)">❌ ${window.t ? window.t('reminders_cancelled_section') : 'Annulés'} (${cancelledReminders.length})</h2>
          ${cancelledReminders.map(r => renderReminderCard(r)).join('')}
        </div>
      `;
    }

    // Empty state
    if (nowDue.length === 0 && activeReminders.length === 0 && doneReminders.length === 0 && snoozedReminders.length === 0 && cancelledReminders.length === 0) {
      html += renderEmptyState(window.t ? window.t('reminders_all_clear') : 'Tout est en ordre ✓', window.t ? window.t('reminders_empty_hint') : 'Aucun rappel à afficher avec les filtres actuels.');
    }

    store.setState({ loading: false });
    app.innerHTML = html;
    updateNav();

  } catch (error) {
    console.error('Reminders page error:', error);
    store.setState({ loading: false });
    app.innerHTML = renderError(window.t ? window.t('reminders_load_error') : 'Erreur lors du chargement des rappels.');
  }
}

function renderReminderCard(reminder, isUrgent = false) {
  const catLabels = {
    action: window.t ? window.t('cat_action') : 'Action',
    follow_up: window.t ? window.t('cat_follow_up') : 'Suivi',
    review: window.t ? window.t('cat_review') : 'Revue',
    open_loop: window.t ? window.t('cat_open_loop') : 'Boucle ouverte'
  };
  const catBadge = getStatusBadge(reminder.category);
  const dueDate = reminder.due_date ? formatDate(reminder.due_date, { month: 'short', day: 'numeric' }) : '';
  const isOverdue = reminder.due_date && reminder.due_date < getTodayISO() && reminder.status === 'active';

  return `
    <div class="insight-card" style="${isUrgent ? 'border-color:var(--color-error)' : ''}">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2 flex-wrap">
          ${catBadge}
          <span class="text-xs text-muted">${escapeHtml(dueDate)}</span>
          ${isOverdue ? '<span class="tag tag-error">' + (window.t ? window.t('overdue') : 'En retard') + '</span>' : ''}
        </div>
      </div>
      <p class="mb-3" style="${reminder.status === 'done' ? 'text-decoration:line-through;opacity:0.6' : ''}">${escapeHtml(reminder.content)}</p>
      <div class="flex gap-2 flex-wrap">
        ${reminder.status === 'active' ? `
          <button class="btn btn-sm btn-primary" onclick="markReminderDone('${reminder.id}')">✅ ${window.t ? window.t('complete') : 'Terminer'}</button>
          <button class="btn btn-sm btn-secondary" onclick="snoozeReminderHours('${reminder.id}', 1)">${window.t ? window.t('snooze_1h') : '+1h'}</button>
          <button class="btn btn-sm btn-secondary" onclick="snoozeReminder('${reminder.id}', 1)">${window.t ? window.t('snooze_1d') : '+1d'}</button>
          <button class="btn btn-sm btn-secondary" onclick="snoozeReminder('${reminder.id}', 3)">${window.t ? window.t('snooze_3d') : '+3d'}</button>
          <button class="btn btn-sm btn-ghost" onclick="cancelReminder('${reminder.id}')">${window.t ? window.t('cancel') : 'Annuler'}</button>
        ` : reminder.status === 'snoozed' ? `
          <button class="btn btn-sm btn-primary" onclick="markReminderDone('${reminder.id}')">✅ ${window.t ? window.t('complete') : 'Terminer'}</button>
          <button class="btn btn-sm btn-ghost" onclick="unsnoozeReminder('${reminder.id}')">${window.t ? window.t('reactivate') : 'Réactiver'}</button>
        ` : ''}
        ${reminder.status === 'done' ? '<span class="text-xs text-muted">' + (window.t ? window.t('completed_on') : 'Terminé le') + ' ' + (reminder.completed_at ? escapeHtml(formatDate(reminder.completed_at, { month: 'short', day: 'numeric' })) : '') + '</span>' : ''}
      </div>
    </div>
  `;
}

function changeRemindersTab(tab) {
  remindersTab = tab;
  renderRemindersPage();
}

function markReminderDone(reminderId) {
  const reminders = store.getState('reminders');
  const updated = reminders.map(r => {
    if (r.id === reminderId) {
      return { ...r, status: 'done', completed_at: new Date().toISOString() };
    }
    return r;
  });
  store.setState({ reminders: updated });
  const demoIdx = DEMO_DATA.reminders.findIndex(r => r.id === reminderId);
  if (demoIdx >= 0) {
    DEMO_DATA.reminders[demoIdx].status = 'done';
    DEMO_DATA.reminders[demoIdx].completed_at = new Date().toISOString();
  }
  showToast(window.t ? window.t('reminder_completed') : 'Rappel marqué comme terminé ✓', 'success');
  renderRemindersPage();
}

function snoozeReminder(reminderId, days) {
  const reminders = store.getState('reminders');
  const snoozedUntil = new Date();
  snoozedUntil.setDate(snoozedUntil.getDate() + days);

  const updated = reminders.map(r => {
    if (r.id === reminderId) {
      return { ...r, status: 'snoozed', snoozed_until: snoozedUntil.toISOString().split('T')[0] };
    }
    return r;
  });
  store.setState({ reminders: updated });
  const demoIdx = DEMO_DATA.reminders.findIndex(r => r.id === reminderId);
  if (demoIdx >= 0) {
    DEMO_DATA.reminders[demoIdx].status = 'snoozed';
    DEMO_DATA.reminders[demoIdx].snoozed_until = snoozedUntil.toISOString().split('T')[0];
  }
  showToast(`${window.t ? window.t('reminder_snoozed_msg') : 'Rappel reporté de'} ${days} ${window.t ? window.t('days') : 'jour'}${days > 1 ? 's' : ''}`, 'info');
  renderRemindersPage();
}

function snoozeReminderHours(reminderId, hours) {
  const reminders = store.getState('reminders');
  const snoozedUntil = new Date();
  snoozedUntil.setHours(snoozedUntil.getHours() + hours);

  const updated = reminders.map(r => {
    if (r.id === reminderId) {
      return { ...r, status: 'snoozed', snoozed_until: snoozedUntil.toISOString() };
    }
    return r;
  });
  store.setState({ reminders: updated });
  const demoIdx = DEMO_DATA.reminders.findIndex(r => r.id === reminderId);
  if (demoIdx >= 0) {
    DEMO_DATA.reminders[demoIdx].status = 'snoozed';
    DEMO_DATA.reminders[demoIdx].snoozed_until = snoozedUntil.toISOString();
  }
  showToast(`${window.t ? window.t('reminder_snoozed_msg') : 'Rappel reporté de'} ${hours}h`, 'info');
  renderRemindersPage();
}

function cancelReminder(reminderId) {
  const reminders = store.getState('reminders');
  const updated = reminders.map(r => {
    if (r.id === reminderId) {
      return { ...r, status: 'cancelled' };
    }
    return r;
  });
  store.setState({ reminders: updated });
  const demoIdx = DEMO_DATA.reminders.findIndex(r => r.id === reminderId);
  if (demoIdx >= 0) {
    DEMO_DATA.reminders[demoIdx].status = 'cancelled';
  }
  showToast(window.t ? window.t('reminder_cancelled_msg') : 'Rappel annulé', 'warning');
  renderRemindersPage();
}

function unsnoozeReminder(reminderId) {
  const reminders = store.getState('reminders');
  const updated = reminders.map(r => {
    if (r.id === reminderId) {
      return { ...r, status: 'active', snoozed_until: null };
    }
    return r;
  });
  store.setState({ reminders: updated });
  const demoIdx = DEMO_DATA.reminders.findIndex(r => r.id === reminderId);
  if (demoIdx >= 0) {
    DEMO_DATA.reminders[demoIdx].status = 'active';
    DEMO_DATA.reminders[demoIdx].snoozed_until = null;
  }
  showToast(window.t ? window.t('reminder_reactivated') : 'Rappel réactivé', 'success');
  renderRemindersPage();
}

function remindersFilterChange(field, value) {
  remindersFilters[field] = value;
  renderRemindersPage();
}
