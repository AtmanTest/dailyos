/* ===== DailyOS UI Components ===== */
/* Header, sidebar, bottom nav, modals */

// =============================================================================
// SIDEBAR
// =============================================================================

function renderSidebar() {
  const page = store.getState('currentPage') || 'today';
  const isActive = (p) => page === p ? 'active' : '';
  return `
    <nav class="sidebar" role="navigation" aria-label="${t('nav_main') || 'Navigation principale'}">
      <div class="sidebar-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>${t('app_name') || 'DailyOS'}</span>
      </div>
      <div class="sidebar-items">
        <a href="#/today" class="nav-item ${isActive('today')}" aria-current="${page === 'today' ? 'page' : 'false'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>${t('nav_today') || 'Aujourd\'hui'}</span>
        </a>
        <a href="#/journal" class="nav-item ${isActive('journal')}" aria-current="${page === 'journal' ? 'page' : 'false'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>${t('nav_journal') || 'Journal'}</span>
        </a>
        <a href="#/ideas" class="nav-item ${isActive('ideas')}" aria-current="${page === 'ideas' ? 'page' : 'false'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          <span>${t('nav_ideas') || 'Idées'}</span>
        </a>
        <a href="#/reminders" class="nav-item ${isActive('reminders')}" aria-current="${page === 'reminders' ? 'page' : 'false'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          <span>${t('nav_reminders') || 'Rappels'}</span>
        </a>
        <a href="#/insights" class="nav-item ${isActive('insights')}" aria-current="${page === 'insights' ? 'page' : 'false'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          <span>${t('nav_insights') || 'Statistiques'}</span>
        </a>
        <div class="sidebar-divider"></div>
        <a href="#/profile" class="nav-item ${isActive('profile')}" aria-current="${page === 'profile' ? 'page' : 'false'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>${t('nav_profile') || 'Profil'}</span>
        </a>
        <a href="#/settings" class="nav-item ${isActive('settings')}" aria-current="${page === 'settings' ? 'page' : 'false'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          <span>${t('nav_settings') || 'Réglages'}</span>
        </a>
      </div>
    </nav>
  `;
}

// =============================================================================
// BOTTOM NAV
// =============================================================================

function renderBottomNav() {
  const page = store.getState('currentPage') || 'today';
  const isActive = (p) => page === p ? 'active' : '';
  return `
    <nav class="bottom-nav" role="navigation" aria-label="${t('nav_bottom') || 'Navigation rapide'}">
      <a href="#/today" class="bottom-nav-item ${isActive('today')}" aria-current="${page === 'today' ? 'page' : 'false'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span class="bottom-nav-label">${t('nav_today') || 'Jour'}</span>
      </a>
      <a href="#/journal" class="bottom-nav-item ${isActive('journal')}" aria-current="${page === 'journal' ? 'page' : 'false'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <span class="bottom-nav-label">${t('nav_journal') || 'Journal'}</span>
      </a>
      <a href="#/ideas" class="bottom-nav-item ${isActive('ideas')}" aria-current="${page === 'ideas' ? 'page' : 'false'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        <span class="bottom-nav-label">${t('nav_ideas') || 'Idées'}</span>
      </a>
      <a href="#/reminders" class="bottom-nav-item ${isActive('reminders')}" aria-current="${page === 'reminders' ? 'page' : 'false'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        <span class="bottom-nav-label">${t('nav_reminders') || 'Rappels'}</span>
      </a>
      <a href="#/insights" class="bottom-nav-item ${isActive('insights')}" aria-current="${page === 'insights' ? 'page' : 'false'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
        <span class="bottom-nav-label">${t('nav_insights') || 'Stats'}</span>
      </a>
    </nav>
  `;
}

// =============================================================================
// DEBOUNCE
// =============================================================================

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// =============================================================================
// HEADER (A-01: Topbar order fixed: Logo → [space] → Lang → Theme → Profile)
// =============================================================================

function renderProfileZone() {
  const user = (typeof store !== 'undefined') ? store.getState('user') : null;

  if (user) {
    const displayName = user.user_metadata?.display_name || user.user_metadata?.username || user.email?.split('@')[0] || 'Moi';
    const email = user.email || '';
    const avatarUrl = localStorage.getItem('dailyos_avatar_url') || user.user_metadata?.avatar_url || '';
    const avatarColor = localStorage.getItem('dailyos_avatar_color') || user.user_metadata?.avatar_color || 'var(--color-accent)';
    const fullName = localStorage.getItem('dailyos_full_name') || user.user_metadata?.full_name || '';
    const initials = (displayName || email || '?').slice(0, 2).toUpperCase();

    return `
      <div class="profile-zone" id="profile-zone">
        <button class="avatar-btn" onclick="toggleProfileDropdown()" aria-label="${t('profile_menu') || 'Menu profil'}" aria-expanded="false" id="avatar-btn">
          ${avatarUrl
            ? `<img src="${escapeHtml(avatarUrl)}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover">`
            : initials
          }
        </button>
        <div class="profile-dropdown" id="profile-dropdown" role="menu" aria-hidden="true" tabindex="-1">
          <div class="profile-dropdown-header">
            <div class="profile-dropdown-avatar" style="background:${escapeHtml(avatarColor)}">
              ${avatarUrl
                ? `<img src="${escapeHtml(avatarUrl)}" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover">`
                : initials
              }
            </div>
            <div>
              <div class="profile-dropdown-name">${escapeHtml(displayName)}</div>
              <div class="profile-dropdown-email">${escapeHtml(fullName || email)}</div>
            </div>
          </div>
          <div class="profile-dropdown-divider"></div>
          <button class="profile-dropdown-item" onclick="closeProfileDropdown(); router.navigate('#/profile')" role="menuitem" tabindex="0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            ${t('profile_view_edit') || 'Modifier le profil'}
          </button>
          <button class="profile-dropdown-item" onclick="closeProfileDropdown(); router.navigate('#/settings')" role="menuitem" tabindex="0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            ${t('settings_settings') || 'Réglages'}
          </button>
          <div class="profile-dropdown-divider"></div>
          <button class="profile-dropdown-item profile-dropdown-signout" onclick="closeProfileDropdown(); handleSignOut()" role="menuitem" tabindex="0">
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
  const themeLabel = isLight ? (t('header_theme_dark') || 'Mode sombre') : (t('header_theme_light') || 'Mode clair');

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
        <button class="theme-toggle-btn" onclick="toggleTheme()" aria-label="${themeLabel}">
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
    dropdown.focus();
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', closeOnOutsideClick, { once: true });
    }, 0);
    // Keyboard nav
    dropdown.addEventListener('keydown', dropdownKeyHandler);
  } else {
    dropdown.removeEventListener('keydown', dropdownKeyHandler);
  }
}

function dropdownKeyHandler(e) {
  const items = Array.from(document.querySelectorAll('.profile-dropdown-item'));
  const currentIdx = items.indexOf(document.activeElement);
  if (e.key === 'Escape') {
    closeProfileDropdown();
    document.getElementById('avatar-btn')?.focus();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = (currentIdx + 1) % items.length;
    items[next]?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = (currentIdx - 1 + items.length) % items.length;
    items[prev]?.focus();
  }
}

function closeOnOutsideClick(e) {
  const zone = document.getElementById('profile-zone');
  if (zone && !zone.contains(e.target)) closeProfileDropdown();
}

function closeProfileDropdown() {
  document.removeEventListener('click', closeOnOutsideClick);
  const dropdown = document.getElementById('profile-dropdown');
  const btn = document.getElementById('avatar-btn');
  if (dropdown) { dropdown.classList.remove('open'); dropdown.setAttribute('aria-hidden', 'true'); }
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

// =============================================================================
// STATES
// =============================================================================

function renderLoading() {
  return `<div class="spinner" role="status" aria-label="${t('loading') || 'Chargement'}">
    <svg class="spinner-svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/>
    </svg>
  </div>`;
}

function renderError(message) {
  return `<div class="error-state" role="alert">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <div class="error-state-text">${escapeHtml(message || (t('error_generic') || 'Une erreur est survenue.'))}</div>
  </div>`;
}

// A-04: renderEmptyState with optional CTA
function renderEmptyState(message, subtext, ctaLabel, ctaAction) {
  return `<div class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
    <div class="empty-state-text">${escapeHtml(message)}</div>
    ${subtext ? `<div class="empty-state-sub">${escapeHtml(subtext)}</div>` : ''}
    ${ctaLabel && ctaAction ? `<button class="btn btn-primary mt-3" onclick="${escapeHtml(ctaAction)}">${escapeHtml(ctaLabel)}</button>` : ''}
  </div>`;
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
  try { localStorage.setItem('dailyos-theme', newTheme); } catch (e) { /* noop */ }
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
  const labels = { inbox:'Boite inbox', exploring:'En exploration', active:'Actif', parked:'En attente', archived:'Archivé', done:'Terminé', snoozed:'Reporté', cancelled:'Annulé', completed:'Terminé', in_progress:'En cours', blocked:'Bloqué', action:'Action', follow_up:'Suivi', review:'Revue', open_loop:'Boucle ouverte' };
  return `<span class="tag ${map[status] || 'tag-neutral'}">${escapeHtml(labels[status] || status)}</span>`;
}

function getMoodEmoji(score) {
  return ['', '😞', '😟', '😐', '🙂', '😄'][score] || '';
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
