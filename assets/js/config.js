/* ===== DailyOS Configuration ===== */
const APP_CONFIG = {
  APP_NAME: 'Daily TDAH',
  VERSION: '0.2.0',
  BUILD_DATE: '2026-07-18',
  DEMO_MODE: false,
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
    { id: 'today', navKey: 'nav_today', icon: 'calendar', hash: '#/today' },
    { id: 'journal', navKey: 'nav_journal', icon: 'book', hash: '#/journal' },
    { id: 'ideas', navKey: 'nav_ideas', icon: 'lightbulb', hash: '#/ideas' },
    { id: 'reminders', navKey: 'nav_reminders', icon: 'bell', hash: '#/reminders' },
    { id: 'insights', navKey: 'nav_insights', icon: 'chart', hash: '#/insights' },
    { id: 'settings', navKey: 'nav_settings', icon: 'settings', hash: '#/settings' }
  ]
};
