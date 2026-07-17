/* ===== DailyOS Configuration ===== */
const APP_CONFIG = {
  APP_NAME: 'DailyOS',
  VERSION: '0.1.0',
  BUILD_DATE: '2025-07-17',
  DEMO_MODE: true,
  TIMEZONE: 'Europe/Paris',
  SUPABASE_CONFIG: {
    url: 'https://wlxtulibsipesxpwkhyz.supabase.co',
    anonKey: 'eyJhbG...AnL8'
  },
  API_ENDPOINTS: {
    entries: '/api/entries',
    summaries: '/api/summaries',
    ideas: '/api/ideas',
    reminders: '/api/reminders',
    insights: '/api/insights'
  },
  REVIEW_SCHEDULE: {
    idea_3day: 3,
    idea_14day: 14,
    idea_30day: 30
  },
  DATA_RETENTION_DAYS: 90,
  NAV_ITEMS: [
    { id: 'today', label: "Aujourd'hui", icon: 'calendar', hash: '#/today' },
    { id: 'journal', label: 'Journal', icon: 'book', hash: '#/journal' },
    { id: 'ideas', label: 'Idées', icon: 'lightbulb', hash: '#/ideas' },
    { id: 'reminders', label: 'Rappels', icon: 'bell', hash: '#/reminders' },
    { id: 'insights', label: 'Insights', icon: 'chart', hash: '#/insights' },
    { id: 'settings', label: 'Réglages', icon: 'settings', hash: '#/settings' }
  ]
};
