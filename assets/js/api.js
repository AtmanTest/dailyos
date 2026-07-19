/* ===== DailyOS API Module ===== */

/* ===== LocalStorage Persistence Layer ===== */
const LS_PREFIX = 'dailyos_';

function loadFromLS(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToLS(key, data) {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(data)); } catch {}
}

function addToLSCollection(key, item) {
  const items = loadFromLS(key) || [];
  items.push(item);
  saveToLS(key, items);
  return items;
}

function replaceLSCollection(key, items) {
  saveToLS(key, items);
  return items;
}

/**
 * Get data from localStorage with demo fallback
 * @param {string} endpoint
 * @param {Object} options
 * @returns {Promise<Object>}
 */
/**
 * LocalStorage-only persistence (no demo fiction). Used as fallback when
 * Supabase schema doesn't match yet, so the app keeps working offline.
 */
async function getLocalDataOnly(endpoint, options = {}) {
  await new Promise(resolve => setTimeout(resolve, 20));
  const key = endpoint.includes('entries') ? 'entries'
    : endpoint.includes('summaries') ? 'summaries'
    : endpoint.includes('ideas') ? 'ideas'
    : endpoint.includes('reminders') ? 'reminders'
    : endpoint.includes('insights') ? 'insights' : null;
  if (!key) return { data: null, error: 'Endpoint inconnu: ' + endpoint };
  let stored = loadFromLS(key) || [];
  if (options.date) stored = stored.filter(e => e.date === options.date);
  if (options.dateFrom && options.dateTo) stored = stored.filter(e => e.date >= options.dateFrom && e.date <= options.dateTo);
  if (options.status) stored = stored.filter(e => e.status === options.status);
  if (options.tag) stored = stored.filter(e => e.tags && e.tags.includes(options.tag));
  if (options.category) stored = stored.filter(e => e.category === options.category);
  return { data: stored, error: null };
}

async function getLocalOrDemoData(endpoint, options = {}) {
  await new Promise(resolve => setTimeout(resolve, 30));

  // Entries: merge localStorage + demo data (keep all demo entries alongside user entries)
  if (endpoint.includes('entries')) {
    const stored = loadFromLS('entries') || [];
    const demo = DEMO_DATA.entries || [];

    // Merge: demo entries first, user entries appended on top (demo provides structure for new users)
    // This ensures the chronology/layout stays populated even when user starts adding entries
    const merged = [...demo, ...stored];

    if (options.date) {
      return { data: merged.filter(e => e.date === options.date), error: null };
    }
    if (options.dateFrom && options.dateTo) {
      return { data: merged.filter(e => e.date >= options.dateFrom && e.date <= options.dateTo), error: null };
    }
    return { data: merged, error: null };
  }

  if (endpoint.includes('summaries')) {
    const stored = loadFromLS('summaries') || [];
    const demo = DEMO_DATA.summaries || [];
    const userDates = new Set(stored.map(s => s.date));
    const merged = [...stored, ...demo.filter(s => !userDates.has(s.date))];

    if (options.date) {
      return { data: merged.find(s => s.date === options.date) || null, error: null };
    }
    return { data: merged, error: null };
  }

  if (endpoint.includes('ideas')) {
    const stored = loadFromLS('ideas') || [];
    const demo = DEMO_DATA.ideas || [];
    let result = [...stored, ...demo];
    if (options.status) result = result.filter(i => i.status === options.status);
    if (options.tag) result = result.filter(i => i.tags && i.tags.includes(options.tag));
    return { data: result, error: null };
  }

  if (endpoint.includes('reminders')) {
    const stored = loadFromLS('reminders') || [];
    const demo = DEMO_DATA.reminders || [];
    let result = [...stored, ...demo];
    if (options.status) result = result.filter(r => r.status === options.status);
    if (options.category) result = result.filter(r => r.category === options.category);
    return { data: result, error: null };
  }

  if (endpoint.includes('insights')) {
    const periods = { '7d': 7, '30d': 30, '90d': 90 };
    const days = periods[options.period] || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const storedSummaries = loadFromLS('summaries') || [];
    return {
      data: {
        summaries: storedSummaries.filter(s => s.date >= cutoffStr),
        ideas: [],
        reminders: [],
        insights: DEMO_DATA.insights || [],
        period: options.period || '30d'
      },
      error: null
    };
  }

  return { data: null, error: 'Endpoint inconnu: ' + endpoint };
}

/**
 * Fetch data from Supabase (or localStorage/demo)
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - fetch options
 * @returns {Promise<Object>}
 */
async function fetchFromSupabase(endpoint, options = {}) {

  if (store.getState('demoMode')) {
    // Return localStorage data, fallback to demo data
    return getLocalOrDemoData(endpoint, options);
  }

  // Real Supabase call
  const { url, anonKey } = APP_CONFIG.SUPABASE_CONFIG;
  if (!url || !anonKey) {
    // No Supabase configured: fall back to local-only data
    return getLocalDataOnly(endpoint, options);
  }

  try {
    // Get session access token (if user is logged in)
    let authToken = anonKey;
    try {
      const supabase = await initSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        authToken = session.access_token;
      }
    } catch {
      // Fallback to anon key
    }

    // Build Supabase query params
    let queryEndpoint = endpoint;
    const params = [];
    if (options.date) params.push(`date=eq.${options.date}`);
    if (options.dateFrom && options.dateTo) {
      params.push(`and=(date.gte.${options.dateFrom},date.lte.${options.dateTo})`);
    }
    if (options.status) params.push(`status=eq.${options.status}`);
    if (options.tag) params.push(`tags=cs.${options.tag}`);
    if (options.category) params.push(`category=eq.${options.category}`);
    if (options.period) {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[options.period] || 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      params.push(`created_at=gte.${cutoff.toISOString()}`);
    }
    if (params.length > 0) {
      queryEndpoint += queryEndpoint.includes('?') ? '&' : '?';
      queryEndpoint += params.join('&');
    }

    const response = await fetch(`${url}${queryEndpoint}`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return { data: json, error: null };
  } catch (error) {
    console.warn('Supabase read failed, falling back to local data:', error.message);
    // Schema mismatch or network error: serve local data so UI still works
    return getLocalDataOnly(endpoint, options);
  }
}

/**
 * Get demo data based on endpoint
 * @param {string} endpoint
 * @param {Object} options
 * @returns {Promise<Object>}
 */
async function getDemoData(endpoint, options = {}) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));

  const data = DEMO_DATA;

  // Parse the endpoint to determine what data to return
  if (endpoint.includes('entries')) {
    if (options.date) {
      const entry = data.entries.filter(e => e.date === options.date);
      return { data: entry, error: null };
    }
    if (options.dateFrom && options.dateTo) {
      const filtered = data.entries.filter(e =>
        e.date >= options.dateFrom && e.date <= options.dateTo
      );
      return { data: filtered, error: null };
    }
    return { data: data.entries, error: null };
  }

  if (endpoint.includes('summaries')) {
    if (options.date) {
      const summary = data.summaries.find(s => s.date === options.date);
      return { data: summary || null, error: null };
    }
    if (options.dateFrom && options.dateTo) {
      const filtered = data.summaries.filter(s =>
        s.date >= options.dateFrom && s.date <= options.dateTo
      );
      return { data: filtered, error: null };
    }
    return { data: data.summaries, error: null };
  }

  if (endpoint.includes('ideas')) {
    let result = [...data.ideas];
    if (options.status) {
      result = result.filter(i => i.status === options.status);
    }
    if (options.tag) {
      result = result.filter(i => i.tags && i.tags.includes(options.tag));
    }
    return { data: result, error: null };
  }

  if (endpoint.includes('reminders')) {
    let result = [...data.reminders];
    if (options.status) {
      result = result.filter(r => r.status === options.status);
    }
    if (options.category) {
      result = result.filter(r => r.category === options.category);
    }
    return { data: result, error: null };
  }

  if (endpoint.includes('insights')) {
    const period = options.period || '7d';
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const recentSummaries = data.summaries.filter(s => s.date >= cutoffStr);
    const recentIdeas = data.ideas.filter(i => i.created_at >= cutoffStr);
    const recentReminders = data.reminders.filter(r => r.created_at >= cutoffStr);

    return {
      data: {
        summaries: recentSummaries,
        ideas: recentIdeas,
        reminders: recentReminders,
        insights: data.insights,
        period
      },
      error: null
    };
  }

  return { data: null, error: 'Endpoint inconnu: ' + endpoint };
}

/**
 * Get entries for a specific date
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<Array>}
 */
async function getEntries(date) {
  try {
    const result = await fetchFromSupabase(APP_CONFIG.API_ENDPOINTS.entries, { date });
    return result.data || [];
  } catch (error) {
    console.error('getEntries error:', error);
    return [];
  }
}

/**
 * Get daily summary for a specific date
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<Object|null>}
 */
async function getDailySummary(date) {
  try {
    const result = await fetchFromSupabase(APP_CONFIG.API_ENDPOINTS.summaries, { date });
    return result.data || null;
  } catch (error) {
    console.error('getDailySummary error:', error);
    return null;
  }
}

/**
 * Get ideas with optional filters
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
async function getIdeas(filters = {}) {
  try {
    const result = await fetchFromSupabase(APP_CONFIG.API_ENDPOINTS.ideas, filters);
    return result.data || [];
  } catch (error) {
    console.error('getIdeas error:', error);
    return [];
  }
}

/**
 * Get reminders with optional filters
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
async function getReminders(filters = {}) {
  try {
    const result = await fetchFromSupabase(APP_CONFIG.API_ENDPOINTS.reminders, filters);
    return result.data || [];
  } catch (error) {
    console.error('getReminders error:', error);
    return [];
  }
}

/**
 * Get insights for a period
 * @param {string} period - '7d', '30d', '90d'
 * @returns {Promise<Object>}
 */
async function getInsights(period = '30d') {
  try {
    const result = await fetchFromSupabase(APP_CONFIG.API_ENDPOINTS.insights, { period });
    return result.data || null;
  } catch (error) {
    console.error('getInsights error:', error);
    return null;
  }
}

/**
 * Add a new entry (persists to localStorage in demo mode)
 * @param {Object} entry
 * @returns {Promise<Object>}
 */
async function addEntry(entry) {
  if (store.getState('demoMode')) {
    const newEntry = {
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      created_at: new Date().toISOString()
    };
    addToLSCollection('entries', newEntry);
    return { data: newEntry, error: null };
  }

  try {
    const supabase = await initSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) throw new Error('No authenticated user');
    const { data, error } = await supabase
      .from('raw_entries')
      .insert([{
        id: crypto.randomUUID(),
        user_id: uid,
        content: entry.content || '',
        type: entry.type || 'note',
        tags: entry.tags || [],
        mood_score: (entry.mood !== undefined && entry.mood !== null) ? entry.mood : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
    if (error) throw error;
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.warn('addEntry Supabase failed, saving locally:', error.message);
    const newEntry = {
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      user_id: (await getSession().catch(() => ({})))?.user?.id || null,
      created_at: new Date().toISOString()
    };
    addToLSCollection('entries', newEntry);
    localStorage.setItem('dailyos_sync_pending', 'true');
    return { data: newEntry, error: null };
  }
}

/**
 * Add a new idea (persists to localStorage in demo mode)
 * @param {Object} idea
 * @returns {Promise<Object>}
 */
async function addIdea(idea) {
  const newIdea = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    content: idea.content || '',
    status: idea.status || 'inbox',
    tags: idea.tags || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  if (store.getState('demoMode')) {
    addToLSCollection('ideas', newIdea);
    return { data: newIdea, error: null };
  }
  try {
    const supabase = await initSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) throw new Error('No authenticated user');
    const { data, error } = await supabase
      .from('ideas')
      .insert([{ ...newIdea, id: crypto.randomUUID(), user_id: uid }])
      .select();
    if (error) throw error;
    return { data: data?.[0] || newIdea, error: null };
  } catch (error) {
    console.warn('addIdea Supabase failed, saving locally:', error.message);
    addToLSCollection('ideas', newIdea);
    localStorage.setItem('dailyos_sync_pending', 'true');
    return { data: newIdea, error: null };
  }
}

/**
 * Add a new reminder (persists to localStorage in demo mode)
 * @param {Object} reminder
 * @returns {Promise<Object>}
 */
async function addReminder(reminder) {
  const newReminder = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: reminder.title || '',
    category: reminder.category || 'action',
    priority: reminder.priority || 'medium',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  if (store.getState('demoMode')) {
    addToLSCollection('reminders', newReminder);
    return { data: newReminder, error: null };
  }
  try {
    const supabase = await initSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) throw new Error('No authenticated user');
    const { data, error } = await supabase
      .from('reminders')
      .insert([{ id: crypto.randomUUID(), user_id: uid, title: newReminder.title, category: newReminder.category, priority: newReminder.priority, status: 'active', created_at: newReminder.created_at, updated_at: newReminder.updated_at }])
      .select();
    if (error) throw error;
    return { data: data?.[0] || newReminder, error: null };
  } catch (error) {
    console.warn('addReminder Supabase failed, saving locally:', error.message);
    addToLSCollection('reminders', newReminder);
    localStorage.setItem('dailyos_sync_pending', 'true');
    return { data: newReminder, error: null };
  }
}

/**
 * Sync local unsynced entries to Supabase
 * @returns {Promise<{done: number, total: number, errors: number}>}
 */
async function syncLocalToSupabase() {
  const entries = loadFromLS('entries') || [];
  const unsynced = entries.filter(e => !e.synced);
  if (!unsynced.length) return { done: 0, total: 0, errors: 0 };
  let synced = 0, errors = 0;
  const supabase = await initSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return { done: 0, total: unsynced.length, errors: unsynced.length };
  for (const entry of unsynced) {
    try {
      entry.user_id = uid;
      const { error } = await supabase.from('raw_entries').insert([entry]);
      if (error) { errors++; continue; }
      entry.synced = true;
      synced++;
    } catch { errors++; }
  }
  saveToLS('entries', entries);
  if (errors === 0) {
    localStorage.removeItem('dailyos_sync_pending');
  } else {
    localStorage.setItem('dailyos_sync_pending', 'true');
  }
  return { done: synced, total: unsynced.length, errors };
}
window.syncLocalToSupabase = syncLocalToSupabase;
