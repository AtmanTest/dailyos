/* ===== DailyOS Reactive State Manager ===== */
/**
 * Creates a simple reactive store.
 * @param {Object} initialState
 * @returns {{ getState: Function, setState: Function, subscribe: Function }}
 */
function createStore(initialState) {
  let state = { ...initialState };
  const listeners = {};

  function getState(key) {
    if (key) return state[key];
    return { ...state };
  }

  function setState(updates) {
    const changedKeys = [];
    for (const key in updates) {
      if (state[key] !== updates[key]) {
        state[key] = updates[key];
        changedKeys.push(key);
      }
    }
    if (changedKeys.length > 0) {
      changedKeys.forEach(key => {
        if (listeners[key]) {
          listeners[key].forEach(fn => {
            try { fn(state[key], state); } catch (e) { console.warn('State listener error:', e); }
          });
        }
      });
      if (listeners['*']) {
        listeners['*'].forEach(fn => {
          try { fn(state, changedKeys); } catch (e) { console.warn('Global listener error:', e); }
        });
      }
    }
  }

  function subscribe(key, fn) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(fn);
    return () => {
      listeners[key] = listeners[key].filter(l => l !== fn);
    };
  }

  return { getState, setState, subscribe };
}

/* ===== App Store Instance ===== */
const store = createStore({
  currentPage: 'today',
  theme: 'dark',
  lang: (typeof localStorage !== 'undefined' && localStorage.getItem('dailyos_lang')) || 'fr',
  entries: [],
  summaries: [],
  ideas: [],
  reminders: [],
  insights: [],
  demoMode: true,
  loading: false,
  error: null,
  selectedDate: null,
  settings: {
    name: '',
    timezone: 'Europe/Paris',
    theme: 'dark',
    demoMode: true
  }
});
