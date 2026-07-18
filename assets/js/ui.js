/* ===== DailyOS UI Utilities ===== */

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

function formatDate(iso, options = {}) {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', ...options };
    const lang = (typeof store !== 'undefined' && store.getState('lang')) || 'fr';
    const locale = lang === 'en' ? 'en-US' : 'fr-FR';
    return date.toLocaleDateString(locale, opts);
  } catch { return String(iso); }
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function getLocalTime() {
  return new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: APP_CONFIG.TIMEZONE
  });
}

function debounce(fn, ms = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// =============================================================================
// HEADER
// =============================================================================

/**
 * Build the right-side profile zone:
 * - If logged in  → avatar circle + dropdown (name, email, settings, sign out)
 * - If demo/guest → "Connexion" button
 */
function renderProfileZone() {
  const user = (typeof store !== 'undefined') ? store.getState('user') : null;

  if (user) {
    const initials = (user.user_metadata?.username || user.email || '?')
      .slice(0, 2).toUpperCase();
    const displayName = user.user_metadata?.username || user.email?.split('@')[0] || 'Moi';
    const email = user.email || '';

    return `
      <div class="profile-zone" id="profile-zone">
        <button class="avatar-btn" onclick="toggleProfileDropdown()" aria-label="Profil" aria-expanded="false" id="avatar-btn">
          ${initials}
        </button>
        <div class="profile-dropdown" id="profile-dropdown" role="menu" aria-hidden="true">
          <div class="profile-dropdown-header">
            <div class="profile-dropdown-avatar">${initials}</div>
            <div>
              <div class="profile-dropdown-name">${escapeHtml(displayName)}</div>
              <div class="profile-dropdown-email">${escapeHtml(email)}</div>
            </div>
          </div>
          <div class="profile-dropdown-divider"></div>
          <button class="profile-dropdown-item" onclick="closeProfileDropdown(); router.navigate('#/settings')" role="menuitem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            ${t('settings_settings') || 'Réglages'}
          </button>
          <button class="profile-dropdown-item profile-dropdown-signout" onclick="closeProfileDropdown(); handleSignOut()" role="menuitem">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            ${t('settings_logout') || 'Déconnexion'}
          </button>
        </div>
      </div>
    `;
  }

  // Not logged in
  return `
    <div class="profile-zone">
      <button class="btn btn-primary" onclick="renderAuthModal('login')"
        style="padding:var(--space-1) var(--space-3);font-size:var(--font-size-sm)">
        Connexion
      </button>
    </div>
  `;
}

function renderHeader() {
  const theme = store.getState('theme');
  const isLight = theme === 'light';
  const lang = store.getState('lang') || 'fr';

  return `
    <header class="topbar" id="app-header-inner" role="banner">
      <div class="topbar-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${escapeHtml(t('app_name') || APP_CONFIG.APP_NAME)}
      </div>
      <div class="topbar-actions">
        <div class="lang-toggle" role="group" aria-label="${t('settings_language_label') || 'Langue'}">
          <button class="lang-btn ${lang === 'fr' ? 'active' : ''}" onclick="setLang('fr')" aria-pressed="${lang === 'fr'}">FR</button>
          <button class="lang-btn ${lang === 'en' ? 'active' : ''}" onclick="setLang('en')" aria-pressed="${lang === 'en'}">EN</button>
        </div>
        <button class="theme-toggle-btn" onclick="toggleTheme()" aria-label="${t('header_theme_dark') || 'Changer le thème'}">
          ${isLight
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
          }
        </button>
        ${renderProfileZone()}
      </div>
    </header>
  `;
}

// Profile dropdown toggle
function toggleProfileDropdown() {
  const dropdown = document.getElementById('profile-dropdown');
  const btn = document.getElementById('avatar-btn');
  if (!dropdown) return;
  const isOpen = dropdown.classList.toggle('open');
  dropdown.setAttribute('aria-hidden', String(!isOpen));
  btn && btn.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) {
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', closeOnOutsideClick, { once: true });
    }, 0);
  }
}

function closeOnOutsideClick(e) {
  const zone = document.getElementById('profile-zone');
  if (zone && !zone.contains(e.target)) closeProfileDropdown();
}

function closeProfileDropdown() {
  const dropdown = document.getElementById('profile-dropdown');
  const btn = document.getElementById('avatar-btn');
  if (dropdown) { dropdown.classList.remove('open'); dropdown.setAttribute('aria-hidden', 'true'); }
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

// =============================================================================
// NAVIGATION
// =============================================================================

function renderSidebar() {
  const currentPage = store.getState('currentPage');
  const items = APP_CONFIG.NAV_ITEMS.map(item => {
    const isActive = currentPage === item.id;
    const label = t(item.navKey) || item.navKey;
    return `
      <a class="nav-item ${isActive ? 'active' : ''}" href="${item.hash}" aria-label="${escapeHtml(label)}" aria-current="${isActive ? 'page' : 'false'}">
        ${getNavIcon(item.icon)}
        <span class="tooltip-text">${escapeHtml(label)}</span>
      </a>
    `;
  }).join('');
  return `<nav class="sidebar" role="navigation" aria-label="Navigation principale">${items}</nav>`;
}

function renderBottomNav() {
  const currentPage = store.getState('currentPage');
  const items = APP_CONFIG.NAV_ITEMS.map(item => {
    const isActive = currentPage === item.id;
    const label = t(item.navKey) || item.navKey;
    return `
      <a class="bottom-nav-item ${isActive ? 'active' : ''}" href="${item.hash}" aria-label="${escapeHtml(label)}" aria-current="${isActive ? 'page' : 'false'}">
        ${getNavIcon(item.icon)}
        <span>${escapeHtml(label)}</span>
      </a>
    `;
  }).join('');
  return `<nav class="bottom-nav" id="app-bottom-nav" role="navigation" aria-label="Navigation mobile"><div class="bottom-nav-inner">${items}</div></nav>`;
}

function getNavIcon(name) {
  const icons = {
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
    lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
  };
  return icons[name] || icons.calendar;
}

// =============================================================================
// SPINNERS / ERRORS / EMPTY
// =============================================================================

function renderLoading() {
  return `<div class="spinner" role="status" aria-label="Chargement"><svg class="spinner-svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg></div>`;
}

function renderError(message) {
  return `<div class="error-state" role="alert"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><div class="error-state-text">${escapeHtml(message || 'Une erreur est survenue.')}</div></div>`;
}

function renderEmptyState(message, subtext) {
  return `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><div class="empty-state-text">${escapeHtml(message)}</div>${subtext ? `<div class="empty-state-sub">${escapeHtml(subtext)}</div>` : ''}</div>`;
}

// =============================================================================
// TOAST
// =============================================================================

function showToast(text, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  const iconMap = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };
  toast.innerHTML = `${iconMap[type] || iconMap.info}<span>${escapeHtml(text)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'opacity 300ms, transform 300ms';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =============================================================================
// THEME
// =============================================================================

function toggleTheme() {
  const current = store.getState('theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  store.setState({ theme: newTheme });
  applyTheme(newTheme);
  localStorage.setItem('dailyos-theme', newTheme);
  // Re-render header to flip the icon
  document.getElementById('app-header').innerHTML = renderHeader();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
}

// =============================================================================
// MISC HELPERS
// =============================================================================

function getStatusBadge(status) {
  const map = { inbox:'tag-accent', exploring:'tag-info', active:'tag-success', parked:'tag-warning', archived:'tag-neutral', done:'tag-success', snoozed:'tag-warning', cancelled:'tag-error', completed:'tag-success', in_progress:'tag-info', blocked:'tag-error', action:'tag-accent', follow_up:'tag-info', review:'tag-warning', open_loop:'tag-error' };
  const labels = { inbox:'Boite inbox', exploring:'En exploration', active:'Actif', parked:'En attente', archived:'Archiv\u00e9', done:'Termin\u00e9', snoozed:'Report\u00e9', cancelled:'Annul\u00e9', completed:'Termin\u00e9', in_progress:'En cours', blocked:'Bloqu\u00e9', action:'Action', follow_up:'Suivi', review:'Revue', open_loop:'Boucle ouverte' };
  return `<span class="tag ${map[status] || 'tag-neutral'}">${escapeHtml(labels[status] || status)}</span>`;
}

function getMoodEmoji(score) {
  return ['', '\uD83D\uDE1E', '\uD83D\uDE1F', '\uD83D\uDE10', '\uD83D\uDE42', '\uD83D\uDE04'][score] || '';
}

function getScoreColor(score) {
  if (score == null) return 'var(--color-text-muted)';
  if (score >= 4) return 'var(--color-success)';
  if (score >= 3) return 'var(--color-warning)';
  return 'var(--color-error)';
}

function getScoreColorInverted(score) {
  if (score == null) return 'var(--color-text-muted)';
  if (score <= 2) return 'var(--color-success)';
  if (score <= 3) return 'var(--color-warning)';
  return 'var(--color-error)';
}

function initUI() {
  document.getElementById('app-header').innerHTML = renderHeader();
  document.getElementById('app-sidebar').innerHTML = renderSidebar();
  document.getElementById('app-bottom-nav').innerHTML = renderBottomNav();
}

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

// Refresh header when auth state changes
function refreshHeader() {
  const header = document.getElementById('app-header');
  if (header) header.innerHTML = renderHeader();
}
