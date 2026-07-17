/* ===== DailyOS UI Utilities ===== */

/**
 * Escape HTML strings to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

/**
 * Format an ISO date string to French locale
 * @param {string} iso - ISO date string
 * @param {Object} options
 * @returns {string}
 */
function formatDate(iso, options = {}) {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    const opts = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    return date.toLocaleDateString('fr-FR', opts);
  } catch {
    return String(iso);
  }
}

/**
 * Format time from ISO string
 * @param {string} iso
 * @returns {string}
 */
function formatTime(iso) {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Get today as ISO date string (YYYY-MM-DD)
 * @returns {string}
 */
function getTodayISO() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get current local time formatted
 * @returns {string}
 */
function getLocalTime() {
  const now = new Date();
  return now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: APP_CONFIG.TIMEZONE
  });
}

/**
 * Debounce a function
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
function debounce(fn, ms = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Render the top header bar
 * @returns {string} HTML string
 */
function renderHeader() {
  const theme = store.getState('theme');
  const isLight = theme === 'light';
  return `
    <header class="topbar" role="banner">
      <div class="topbar-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${APP_CONFIG.APP_NAME}
      </div>
      <div class="topbar-actions">
        <button class="theme-toggle-btn" onclick="toggleTheme()" aria-label="Changer le thème" data-tooltip="${isLight ? 'Mode sombre' : 'Mode clair'}">
          ${isLight
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
          }
        </button>
      </div>
    </header>
  `;
}

/**
 * Render the sidebar navigation (desktop)
 * @returns {string} HTML string
 */
function renderSidebar() {
  const currentPage = store.getState('currentPage');
  const items = APP_CONFIG.NAV_ITEMS.map(item => {
    const isActive = currentPage === item.id;
    const iconSVG = getNavIcon(item.icon);
    return `
      <a class="nav-item ${isActive ? 'active' : ''}" href="${item.hash}" aria-label="${item.label}" aria-current="${isActive ? 'page' : 'false'}">
        ${iconSVG}
        <span class="tooltip-text">${item.label}</span>
      </a>
    `;
  }).join('');

  return `
    <nav class="sidebar" role="navigation" aria-label="Navigation principale">
      ${items}
    </nav>
  `;
}

/**
 * Render the bottom navigation (mobile)
 * @returns {string} HTML string
 */
function renderBottomNav() {
  const currentPage = store.getState('currentPage');
  const items = APP_CONFIG.NAV_ITEMS.map(item => {
    const isActive = currentPage === item.id;
    const iconSVG = getNavIcon(item.icon);
    return `
      <a class="bottom-nav-item ${isActive ? 'active' : ''}" href="${item.hash}" aria-label="${item.label}" aria-current="${isActive ? 'page' : 'false'}">
        ${iconSVG}
        <span>${item.label}</span>
      </a>
    `;
  }).join('');

  return `
    <nav class="bottom-nav" role="navigation" aria-label="Navigation mobile">
      <div class="bottom-nav-inner">
        ${items}
      </div>
    </nav>
  `;
}

/**
 * Get icon SVG by name
 * @param {string} name
 * @returns {string}
 */
function getNavIcon(name) {
  const icons = {
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
    lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
  };
  return icons[name] || icons.calendar;
}

/**
 * Render loading spinner
 * @returns {string} HTML string
 */
function renderLoading() {
  return `
    <div class="spinner" role="status" aria-label="Chargement">
      <svg class="spinner-svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/>
      </svg>
    </div>
  `;
}

/**
 * Render error state
 * @param {string} message
 * @returns {string} HTML string
 */
function renderError(message) {
  const msg = message || 'Une erreur est survenue. Veuillez réessayer.';
  return `
    <div class="error-state" role="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div class="error-state-text">${escapeHtml(msg)}</div>
    </div>
  `;
}

/**
 * Render empty state
 * @param {string} message
 * @param {string} [subtext]
 * @returns {string} HTML string
 */
function renderEmptyState(message, subtext) {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      <div class="empty-state-text">${escapeHtml(message)}</div>
      ${subtext ? `<div class="empty-state-sub">${escapeHtml(subtext)}</div>` : ''}
    </div>
  `;
}

/**
 * Show a toast notification
 * @param {string} text
 * @param {'success'|'error'|'info'|'warning'} type
 */
function showToast(text, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const iconMap = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  toast.innerHTML = `
    ${iconMap[type] || iconMap.info}
    <span>${escapeHtml(text)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'opacity 300ms, transform 300ms';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Toggle theme between dark and light
 */
function toggleTheme() {
  const current = store.getState('theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  store.setState({ theme: newTheme });
  applyTheme(newTheme);
  localStorage.setItem('dailyos-theme', newTheme);
  showToast(newTheme === 'light' ? 'Mode clair activé' : 'Mode sombre activé', 'info');
}

/**
 * Apply theme to document
 * @param {string} theme
 */
function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

/**
 * Get status badge for an idea/reminder
 * @param {string} status
 * @returns {string} HTML
 */
function getStatusBadge(status) {
  const map = {
    inbox: 'tag-accent',
    exploring: 'tag-info',
    active: 'tag-success',
    parked: 'tag-warning',
    archived: 'tag-neutral',
    done: 'tag-success',
    snoozed: 'tag-warning',
    cancelled: 'tag-error',
    completed: 'tag-success',
    in_progress: 'tag-info',
    blocked: 'tag-error',
    action: 'tag-accent',
    follow_up: 'tag-info',
    review: 'tag-warning',
    open_loop: 'tag-error'
  };

  const labels = {
    inbox: 'Boîte de réception',
    exploring: 'En exploration',
    active: 'Actif',
    parked: 'En attente',
    archived: 'Archivé',
    done: 'Terminé',
    snoozed: 'Reporté',
    cancelled: 'Annulé',
    completed: 'Terminé',
    in_progress: 'En cours',
    blocked: 'Bloqué',
    action: 'Action',
    follow_up: 'Suivi',
    review: 'Revue',
    open_loop: 'Boucle ouverte'
  };

  const cls = map[status] || 'tag-neutral';
  const label = labels[status] || status;
  return `<span class="tag ${cls}">${escapeHtml(label)}</span>`;
}

/**
 * Get mood emoji by score
 * @param {number} score - 1-5
 * @returns {string}
 */
function getMoodEmoji(score) {
  const moods = ['', '😞', '😟', '😐', '🙂', '😄'];
  return moods[score] || '';
}

/**
 * Init UI: render header, sidebar, bottom nav
 */
function initUI() {
  document.getElementById('app-header').innerHTML = renderHeader();
  document.getElementById('app-sidebar').innerHTML = renderSidebar();
  document.getElementById('app-bottom-nav').innerHTML = renderBottomNav();
}

/**
 * Update navigation active states
 */
function updateNav() {
  const currentPage = store.getState('currentPage');
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(el => {
    const href = el.getAttribute('href');
    if (href) {
      const pageId = href.replace('#/', '') || 'today';
      el.classList.toggle('active', pageId === currentPage);
      el.setAttribute('aria-current', pageId === currentPage ? 'page' : 'false');
    }
  });
}
