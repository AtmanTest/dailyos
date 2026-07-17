/* ===== DailyOS Main App ===== */

/**
 * Initialize the DailyOS application
 */
function initApp() {
  // Load saved preferences from localStorage
  loadSavedPreferences();

  // Initialize i18n
  refreshLang();

  // Apply theme
  const theme = store.getState('theme');
  applyTheme(theme);

  // Register routes
  router.register('#/today', renderTodayPage);
  router.register('#/journal', renderJournalPage);
  router.register('#/ideas', renderIdeasPage);
  router.register('#/reminders', renderRemindersPage);
  router.register('#/insights', renderInsightsPage);
  router.register('#/settings', renderSettingsPage);

  // Init UI components
  initUI();

  // FAB quick entry handler
  document.getElementById('fab-quick-entry')?.addEventListener('click', openQuickEntry);

  // Initialize router
  router.init();

  // Check for evening reminder nudge
  setTimeout(checkEveningNudge, 1000);

  // Observe theme changes to update header/nav
  store.subscribe('theme', () => {
    initUI();
    updateNav();
  });

  // Register service worker
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed silently
      });
    } catch (e) {
      // SW not supported
    }
  }

  // Listen for prefers-color-scheme changes (system theme)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const theme = store.getState('theme');
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  });

  console.log(`${t('app_name')} v${APP_CONFIG.VERSION} initialized`);
}

/**
 * Load saved preferences from localStorage
 */
function loadSavedPreferences() {
  // Theme
  const savedTheme = localStorage.getItem('dailyos-theme');
  if (savedTheme) {
    store.setState({ theme: savedTheme });
  }

  // Demo mode
  const savedDemoMode = localStorage.getItem('dailyos-demo-mode');
  if (savedDemoMode !== null) {
    const mode = savedDemoMode === 'true';
    store.setState({ demoMode: mode });
    APP_CONFIG.DEMO_MODE = mode;
  }

  // Settings
  const savedSettings = localStorage.getItem('dailyos-settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      store.setState({ settings: { ...store.getState('settings'), ...parsed } });
    } catch (e) {
      // Ignore parse errors
    }
  }
}

/**
 * Open the quick entry modal for fast note/log capture
 */
function openQuickEntry() {
  // Remove any existing modal
  document.querySelector('.quick-entry-modal')?.remove();

  const modal = document.createElement('div');
  modal.className = 'quick-entry-modal modal-overlay';
  modal.innerHTML = `
    <div class="modal-content card">
      <div class="modal-header">
        <h3>${t('quick_title') || 'Quick Entry'}</h3>
        <span class="quick-entry-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div class="modal-body">
        <textarea class="quick-entry-input" placeholder="${t('quick_placeholder') || 'What\'s on your mind?'}" autofocus></textarea>
        <div class="quick-entry-options">
          <select class="quick-entry-type">
            <option value="💡">💡 ${t('type_idea') || 'Idea'}</option>
            <option value="📝">📝 ${t('type_note') || 'Note'}</option>
            <option value="✅">✅ ${t('type_action') || 'Action'}</option>
            <option value="🌟">🌟 ${t('type_win') || 'Win'}</option>
            <option value="😤">😤 ${t('type_blocker') || 'Blocker'}</option>
            <option value="📅">📅 ${t('type_reminder') || 'Reminder'}</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary quick-entry-cancel">${t('form_cancel') || 'Cancel'}</button>
        <button class="btn btn-primary quick-entry-confirm">${t('form_save') || 'Save'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Focus textarea
  const textarea = modal.querySelector('.quick-entry-input');
  setTimeout(() => textarea?.focus(), 100);

  // Cancel button
  modal.querySelector('.quick-entry-cancel')?.addEventListener('click', () => modal.remove());

  // Confirm button
  modal.querySelector('.quick-entry-confirm')?.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text) return;

    const typeSelect = modal.querySelector('.quick-entry-type');
    const type = typeSelect ? typeSelect.value : '📝';

    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: type,
      text: text,
      date: getTodayISO(),
      time: new Date().toISOString(),
      timestamp: Date.now()
    };

    addEntry(entry);
    fireConfetti(modal.querySelector('.modal-content'));
    showToast(t('toast_entry_added') || 'Entry saved!');
    modal.remove();
  });

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

/**
 * Check if it's evening and nudge the user to log their day
 */
function checkEveningNudge() {
  if (sessionStorage.getItem('dailyos_nudge_shown')) return;
  const hour = new Date().getHours();
  if (hour < 18) return;
  const entries = (loadFromLS('entries') || []).filter(e => e.date === getTodayISO());
  if (entries.length > 0) return;
  sessionStorage.setItem('dailyos_nudge_shown', '1');
  showToastNudge(t('nudge_no_entry'), t('nudge_add_entry'), () => openQuickEntry());
}

/**
 * Show a toast notification with an action button
 */
function showToastNudge(message, buttonLabel, onClick) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-nudge';
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-action btn btn-sm btn-primary">${buttonLabel}</button>
  `;
  document.body.appendChild(toast);

  toast.querySelector('.toast-action')?.addEventListener('click', () => {
    onClick();
    toast.remove();
  });

  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 8000);
}

/**
 * Fire confetti animation on a parent element
 */
function fireConfetti(parentEl) {
  const colors = ['#7C3AED', '#A3E635', '#F59E0B', '#4ADE80', '#F87171'];
  const rect = parentEl.getBoundingClientRect();
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = (Math.random() * 60 + 20) + '%';
    el.style.top = '-4px';
    el.style.background = colors[i % colors.length];
    parentEl.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
