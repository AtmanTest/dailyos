/* ===== DailyOS Reminders Page ===== */

let remindersFilters = {
  status: '',
  category: ''
};

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

    // Apply filters
    let filtered = [...reminders];
    if (remindersFilters.status) {
      filtered = filtered.filter(r => r.status === remindersFilters.status);
    }
    if (remindersFilters.category) {
      filtered = filtered.filter(r => r.category === remindersFilters.category);
    }

    // "À faire maintenant": overdue + due today, active status
    const nowDue = reminders.filter(r =>
      r.status === 'active' && r.due_date <= today
    );
    nowDue.sort((a, b) => a.due_date.localeCompare(b.due_date));

    // Categorize remaining
    const activeReminders = filtered.filter(r => r.status === 'active' && r.due_date > today);
    const doneReminders = filtered.filter(r => r.status === 'done');
    const snoozedReminders = filtered.filter(r => r.status === 'snoozed');
    const cancelledReminders = filtered.filter(r => r.status === 'cancelled');

    activeReminders.sort((a, b) => a.due_date.localeCompare(b.due_date));

    let html = `
      <div class="section">
        <h1 class="section-title">🔔 Rappels</h1>
      </div>

      <div class="filter-bar">
        <select class="form-select" onchange="remindersFilterChange('status', this.value)" aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          <option value="active" ${remindersFilters.status === 'active' ? 'selected' : ''}>Actif</option>
          <option value="done" ${remindersFilters.status === 'done' ? 'selected' : ''}>Terminé</option>
          <option value="snoozed" ${remindersFilters.status === 'snoozed' ? 'selected' : ''}>Reporté</option>
          <option value="cancelled" ${remindersFilters.status === 'cancelled' ? 'selected' : ''}>Annulé</option>
        </select>
        <select class="form-select" onchange="remindersFilterChange('category', this.value)" aria-label="Filtrer par catégorie">
          <option value="">Toutes catégories</option>
          <option value="action" ${remindersFilters.category === 'action' ? 'selected' : ''}>Action</option>
          <option value="follow_up" ${remindersFilters.category === 'follow_up' ? 'selected' : ''}>Suivi</option>
          <option value="review" ${remindersFilters.category === 'review' ? 'selected' : ''}>Revue</option>
          <option value="open_loop" ${remindersFilters.category === 'open_loop' ? 'selected' : ''}>Boucle ouverte</option>
        </select>
      </div>
    `;

    // À faire maintenant section
    if (nowDue.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title" style="font-size:var(--font-size-base);color:var(--color-error)">⚠️ À faire maintenant</h2>
          ${nowDue.map(r => renderReminderCard(r, true)).join('')}
        </div>
      `;
    }

    // Active reminders
    if (activeReminders.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title" style="font-size:var(--font-size-base)">📋 À venir (${activeReminders.length})</h2>
          ${activeReminders.map(r => renderReminderCard(r)).join('')}
        </div>
      `;
    }

    // Snoozed
    if (snoozedReminders.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title" style="font-size:var(--font-size-base);color:var(--color-warning)">⏰ Reportés (${snoozedReminders.length})</h2>
          ${snoozedReminders.map(r => renderReminderCard(r)).join('')}
        </div>
      `;
    }

    // Done
    if (doneReminders.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title" style="font-size:var(--font-size-base);color:var(--color-success)">✅ Terminés (${doneReminders.length})</h2>
          ${doneReminders.map(r => renderReminderCard(r)).join('')}
        </div>
      `;
    }

    // Cancelled
    if (cancelledReminders.length > 0) {
      html += `
        <div class="section">
          <h2 class="section-title" style="font-size:var(--font-size-base);color:var(--color-text-muted)">❌ Annulés (${cancelledReminders.length})</h2>
          ${cancelledReminders.map(r => renderReminderCard(r)).join('')}
        </div>
      `;
    }

    // Empty state
    if (nowDue.length === 0 && activeReminders.length === 0 && doneReminders.length === 0 && snoozedReminders.length === 0 && cancelledReminders.length === 0) {
      html += renderEmptyState('Tout est en ordre ✓', 'Aucun rappel à afficher avec les filtres actuels.');
    }

    store.setState({ loading: false });
    app.innerHTML = html;
    updateNav();

  } catch (error) {
    console.error('Reminders page error:', error);
    store.setState({ loading: false });
    app.innerHTML = renderError('Erreur lors du chargement des rappels.');
  }
}

function renderReminderCard(reminder, isUrgent = false) {
  const catLabels = {
    action: 'Action',
    follow_up: 'Suivi',
    review: 'Revue',
    open_loop: 'Boucle ouverte'
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
          ${isOverdue ? '<span class="tag tag-error">En retard</span>' : ''}
        </div>
      </div>
      <p class="mb-3" style="${reminder.status === 'done' ? 'text-decoration:line-through;opacity:0.6' : ''}">${escapeHtml(reminder.content)}</p>
      <div class="flex gap-2 flex-wrap">
        ${reminder.status === 'active' ? `
          <button class="btn btn-sm btn-primary" onclick="markReminderDone('${reminder.id}')">✅ Terminer</button>
          <button class="btn btn-sm btn-secondary" onclick="snoozeReminder('${reminder.id}', 1)">Report 1j</button>
          <button class="btn btn-sm btn-secondary" onclick="snoozeReminder('${reminder.id}', 3)">3j</button>
          <button class="btn btn-sm btn-secondary" onclick="snoozeReminder('${reminder.id}', 7)">7j</button>
          <button class="btn btn-sm btn-ghost" onclick="cancelReminder('${reminder.id}')">Annuler</button>
        ` : reminder.status === 'snoozed' ? `
          <button class="btn btn-sm btn-primary" onclick="markReminderDone('${reminder.id}')">✅ Terminer</button>
          <button class="btn btn-sm btn-ghost" onclick="unsnoozeReminder('${reminder.id}')">Réactiver</button>
        ` : ''}
        ${reminder.status === 'done' ? '<span class="text-xs text-muted">Terminé le ' + (reminder.completed_at ? escapeHtml(formatDate(reminder.completed_at, { month: 'short', day: 'numeric' })) : '') + '</span>' : ''}
      </div>
    </div>
  `;
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
  showToast('Rappel marqué comme terminé ✓', 'success');
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
  showToast(`Rappel reporté de ${days} jour${days > 1 ? 's' : ''}`, 'info');
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
  showToast('Rappel annulé', 'warning');
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
  showToast('Rappel réactivé', 'success');
  renderRemindersPage();
}

function remindersFilterChange(field, value) {
  remindersFilters[field] = value;
  renderRemindersPage();
}
