/* ===== DailyOS Main App ===== */

/**
 * Initialize the DailyOS application
 */
function initApp() {
  // Load saved preferences from localStorage
  loadSavedPreferences();

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

  // Initialize router
  router.init();

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

  console.log(`${APP_CONFIG.APP_NAME} v${APP_CONFIG.VERSION} initialized`);
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

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
