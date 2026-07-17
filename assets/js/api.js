/* ===== DailyOS API Module ===== */

/**
 * Fetch data from Supabase (or demo data)
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - fetch options
 * @returns {Promise<Object>}
 */
async function fetchFromSupabase(endpoint, options = {}) {
  const config = store.getState('demoMode') !== false ? true : false;

  if (store.getState('demoMode')) {
    // Return demo data
    return getDemoData(endpoint, options);
  }

  // Real Supabase call
  const { url, anonKey } = APP_CONFIG.SUPABASE_CONFIG;
  if (!url || !anonKey) {
    throw new Error('Supabase non configuré. Activez le mode démo ou configurez les clés API.');
  }

  try {
    const response = await fetch(`${url}${endpoint}`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
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
 * Add a new entry (demo mode just returns success)
 * @param {Object} entry
 * @returns {Promise<Object>}
 */
async function addEntry(entry) {
  if (store.getState('demoMode')) {
    await new Promise(r => setTimeout(r, 100));
    return { data: { ...entry, id: Date.now(), created_at: new Date().toISOString() }, error: null };
  }

  try {
    const result = await fetchFromSupabase(APP_CONFIG.API_ENDPOINTS.entries, {
      method: 'POST',
      body: JSON.stringify(entry)
    });
    return result;
  } catch (error) {
    console.error('addEntry error:', error);
    throw error;
  }
}
