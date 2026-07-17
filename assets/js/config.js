/* ===== DailyOS Configuration ===== */
const APP_CONFIG = {
  APP_NAME: 'DailyOS',
  VERSION: '0.1.0',
  BUILD_DATE: '2025-07-17',
  DEMO_MODE: true,
  TIMEZONE: 'Europe/Paris',
  SUPABASE_CONFIG: {
    url: 'https://wlxtulibsipesxpwkhyz.supabase.co',
    anonKey: 'sb_publishable_0MkIaGDQs3G5oJuHaKMh1A_wWsrzn4G'
  },
  API_ENDPOINTS: {
    entries: '/rest/v1/raw_entries?select=*',
    summaries: '/rest/v1/daily_summaries?select=*',
    ideas: '/rest/v1/ideas?select=*',
    reminders: '/rest/v1/reminders?select=*',
    insights: '/rest/v1/insights?select=*'
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
