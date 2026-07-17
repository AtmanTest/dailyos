/* ===== DailyOS Settings Page ===== */

let _settingsSyncCheckInterval = null;

async function renderSettingsPage() {
  const app = document.getElementById('app');
  store.setState({ loading: true });
  app.innerHTML = renderLoading();

  try {
    const settings = store.getState('settings');
    const theme = store.getState('theme');
    const demoMode = store.getState('demoMode');

    // Read ADHD-specific localStorage values
    const displayName = localStorage.getItem('dailyos_display_name') || '';
    const bedtime = localStorage.getItem('dailyos_bedtime') || '';
    const medication = localStorage.getItem('dailyos_medication') || '';
    const currentLang = localStorage.getItem('dailyos_lang') || 'fr';
    const syncPending = localStorage.getItem('dailyos_sync_pending');

    // IANA timezone options
    const ianaTimezones = [
      'Europe/Paris', 'Europe/London', 'Europe/Berlin',
      'America/New_York', 'America/Los_Angeles', 'America/Chicago',
      'America/Denver', 'Asia/Tokyo', 'Asia/Shanghai',
      'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland',
      'Africa/Cairo', 'Africa/Johannesburg', 'America/Sao_Paulo',
      'Europe/Moscow', 'Europe/Istanbul', 'Asia/Dubai'
    ];

    let html = `
      <div class="section">
        <h1 class="section-title">⚙️ ${window.t ? window.t('settings_title') : 'Réglages'}</h1>
      </div>

      <!-- Language toggle -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">🌐 ${window.t ? window.t('settings_language') : 'Langue'}</div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">${window.t ? window.t('settings_language_label') : 'Langue de l\'interface'}</label>
            <div style="display:flex;gap:var(--space-3);flex-wrap:wrap">
              <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;padding:var(--space-2) var(--space-3);border:2px solid ${currentLang === 'fr' ? 'var(--color-accent)' : 'var(--color-border)'};border-radius:var(--radius-md);background:${currentLang === 'fr' ? 'var(--color-accent-light)' : 'transparent'}">
                <input type="radio" name="lang" value="fr" ${currentLang === 'fr' ? 'checked' : ''} onchange="changeLang('fr')" style="accent-color:var(--color-accent)">
                <span style="font-size:1.2rem">🇫🇷</span>
                <span style="font-weight:${currentLang === 'fr' ? 'bold' : 'normal'}">Français</span>
              </label>
              <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;padding:var(--space-2) var(--space-3);border:2px solid ${currentLang === 'en' ? 'var(--color-accent)' : 'var(--color-border)'};border-radius:var(--radius-md);background:${currentLang === 'en' ? 'var(--color-accent-light)' : 'transparent'}">
                <input type="radio" name="lang" value="en" ${currentLang === 'en' ? 'checked' : ''} onchange="changeLang('en')" style="accent-color:var(--color-accent)">
                <span style="font-size:1.2rem">🇬🇧</span>
                <span style="font-weight:${currentLang === 'en' ? 'bold' : 'normal'}">English</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">${window.t ? window.t('settings_profile') : 'Profil'}</div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label" for="settings-name">${window.t ? window.t('settings_name') : 'Nom'}</label>
            <input class="form-input" id="settings-name" type="text" value="${escapeHtml(settings.name || '')}" placeholder="${window.t ? window.t('settings_name_placeholder') : 'Votre nom'}" onchange="saveSetting('name', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label" for="settings-timezone">${window.t ? window.t('settings_timezone') : 'Fuseau horaire'}</label>
            <select class="form-select" id="settings-timezone" onchange="saveSetting('timezone', this.value)">
              ${ianaTimezones.map(tz =>
                `<option value="${tz}" ${(settings.timezone || 'Europe/Paris') === tz ? 'selected' : ''}>${tz}</option>`
              ).join('')}
            </select>
          </div>
          <hr style="border-color:var(--color-border);margin:var(--space-4) 0">
          <div class="form-group">
            <label class="form-label">${window.t ? window.t('settings_supabase') : 'Connexion Supabase'}</label>
            <div id="auth-status-section">
              <div class="flex items-center justify-between">
                <span id="auth-user-label" class="text-sm">${window.t ? window.t('settings_checking') : 'Vérification...'}</span>
                <div class="flex gap-2">
                  <button id="auth-login-btn" class="btn btn-sm btn-primary" onclick="renderAuthModal('login')" style="display:none">${window.t ? window.t('settings_login') : 'Se connecter'}</button>
                  <button id="auth-signup-btn" class="btn btn-sm btn-secondary" onclick="renderAuthModal('signup')" style="display:none">${window.t ? window.t('settings_signup') : "S'inscrire"}</button>
                  <button id="auth-logout-btn" class="btn btn-sm btn-danger" onclick="handleSignOut()" style="display:none">${window.t ? window.t('settings_logout') : 'Déconnexion'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ADHD Profile -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">🧠 ${window.t ? window.t('settings_adhd_profile') : 'ADHD Profile'}</div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label" for="settings-adhd-name">${window.t ? window.t('settings_display_name') : 'Display name'}</label>
            <input class="form-input" id="settings-adhd-name" type="text" value="${escapeHtml(displayName)}" placeholder="${window.t ? window.t('settings_display_name_placeholder') : 'How should we call you?'}" onchange="saveADHDSetting('dailyos_display_name', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label" for="settings-timezone-iana">${window.t ? window.t('settings_timezone') : 'Timezone'}</label>
            <select class="form-select" id="settings-timezone-iana" onchange="saveADHDSetting('dailyos_timezone', this.value)">
              ${ianaTimezones.map(tz =>
                `<option value="${tz}" ${(localStorage.getItem('dailyos_timezone') || settings.timezone || 'Europe/Paris') === tz ? 'selected' : ''}>${tz}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="settings-bedtime">${window.t ? window.t('settings_bedtime') : 'Bedtime'}</label>
            <input class="form-input" id="settings-bedtime" type="time" value="${escapeHtml(bedtime)}" onchange="saveADHDSetting('dailyos_bedtime', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label" for="settings-medication">${window.t ? window.t('settings_medication_note') : 'Médication / Notes'}</label>
            <textarea class="form-input" id="settings-medication" rows="3" placeholder="${window.t ? window.t('settings_medication_placeholder') : 'Medication schedule, dosages, notes...'}" onchange="saveADHDSetting('dailyos_medication', this.value)">${escapeHtml(medication)}</textarea>
          </div>
        </div>
      </div>

      <!-- Apparence -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">${window.t ? window.t('settings_appearance') : 'Apparence'}</div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">${window.t ? window.t('settings_theme') : 'Thème'}</label>
            <div style="display:flex;gap:var(--space-3);flex-wrap:wrap">
              <button class="btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}" onclick="setSettingTheme('dark')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                ${window.t ? window.t('theme_dark') : 'Sombre'}
              </button>
              <button class="btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}" onclick="setSettingTheme('light')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>
                ${window.t ? window.t('theme_light') : 'Clair'}
              </button>
              <button class="btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}" onclick="setSettingTheme('system')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                ${window.t ? window.t('theme_system') : 'Système'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Données -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">${window.t ? window.t('settings_data') : 'Données'}</div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <div class="flex items-center justify-between">
              <div>
                <label class="form-label" style="margin-bottom:2px">${window.t ? window.t('settings_demo_mode') : 'Mode démo'}</label>
                <div class="form-hint">${window.t ? window.t('settings_demo_hint') : 'Utiliser des données de démonstration'}</div>
              </div>
              <label style="position:relative;display:inline-block;width:48px;height:28px;cursor:pointer">
                <input type="checkbox" ${demoMode ? 'checked' : ''} onchange="toggleDemoMode(this.checked)" style="opacity:0;width:0;height:0">
                <span style="position:absolute;inset:0;background:${demoMode ? 'var(--color-accent)' : 'var(--color-card-hover)'};border-radius:14px;transition:background var(--transition-fast)"></span>
                <span style="position:absolute;top:2px;left:${demoMode ? '22px' : '2px'};width:24px;height:24px;background:#fff;border-radius:50%;transition:left var(--transition-fast)"></span>
              </label>
            </div>
            ${demoMode ? '<div class="form-hint" style="color:var(--color-warning)">⚠️ ' + (window.t ? window.t('settings_demo_warning') : 'Les données ne sont pas persistées en mode démo.') + '</div>' : ''}
          </div>

          <!-- Sync indicator badge -->
          <div class="form-group" id="sync-indicator-section">
            <div class="flex items-center justify-between">
              <div>
                <label class="form-label" style="margin-bottom:2px">${window.t ? window.t('settings_sync') : 'Synchronisation'}</label>
                <div class="form-hint">${window.t ? window.t('settings_sync_hint') : 'État de la synchronisation Supabase'}</div>
              </div>
              <div id="sync-status-badge">
                ${syncPending
                  ? `<div class="flex items-center gap-2">
                       <span class="tag tag-warning">⚠️ ${syncPending} ${window.t ? window.t('settings_sync_pending') : 'en attente'}</span>
                       <button class="btn btn-sm btn-primary" onclick="handleSyncNow()">${window.t ? window.t('settings_sync_now') : 'Sync now'}</button>
                     </div>`
                  : `<span class="tag tag-success">✅ ${window.t ? window.t('settings_synced') : 'Synchronisé'}</span>`
                }
              </div>
            </div>
          </div>

          <div class="form-group">
            <button class="btn btn-secondary" onclick="exportData()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              ${window.t ? window.t('settings_export') : 'Exporter les données (JSON)'}
            </button>
          </div>

          <div class="form-group">
            <label class="form-label">${window.t ? window.t('settings_retention') : 'Rétention des données'}</label>
            <select class="form-select" onchange="saveSetting('retention', this.value)">
              <option value="30">30 ${window.t ? window.t('days') : 'jours'}</option>
              <option value="90" selected>90 ${window.t ? window.t('days') : 'jours'}</option>
              <option value="180">6 ${window.t ? window.t('months') : 'mois'}</option>
              <option value="365">1 ${window.t ? window.t('year') : 'an'}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- À propos -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">${window.t ? window.t('settings_about') : 'À propos'}</div>
        </div>
        <div class="card-body">
          <div class="mb-2"><strong>${window.t ? window.t('settings_version') : 'Version'}:</strong> ${escapeHtml(APP_CONFIG.VERSION)}</div>
          <div class="mb-2"><strong>${window.t ? window.t('settings_build_date') : 'Date de build'}:</strong> ${escapeHtml(APP_CONFIG.BUILD_DATE)}</div>
          <div class="text-muted text-sm">${window.t ? window.t('settings_about_desc') : 'DailyOS — Votre système d\'exploitation quotidien. Toutes les données restent sur votre appareil.'}</div>
        </div>
      </div>

      <!-- Confidentialité -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">${window.t ? window.t('settings_privacy') : 'Confidentialité'}</div>
        </div>
        <div class="card-body">
          <ul style="list-style:disc;padding-left:var(--space-5)">
            <li class="mb-2">🔒 ${window.t ? window.t('privacy_local') : 'Toutes les données sont stockées localement dans votre navigateur'}</li>
            <li class="mb-2">📡 ${window.t ? window.t('privacy_no_external') : 'Aucune donnée n\'est envoyée à des serveurs externes sans votre consentement'}</li>
            <li class="mb-2">🗑️ ${window.t ? window.t('privacy_export') : 'Vous pouvez exporter ou supprimer toutes vos données à tout moment'}</li>
            <li class="mb-2">🔐 ${window.t ? window.t('privacy_demo') : 'Le mode démo utilise des données fictives qui ne vous identifient pas'}</li>
            <li class="mb-2">🍪 ${window.t ? window.t('privacy_cookies') : 'Aucun cookie tiers n\'est utilisé'}</li>
          </ul>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="card mb-6" style="border-color:var(--color-error)">
        <div class="card-header">
          <div class="card-title" style="color:var(--color-error)">⚠️ ${window.t ? window.t('settings_danger_zone') : 'Zone dangereuse'}</div>
        </div>
        <div class="card-body">
          <p class="mb-4 text-sm">${window.t ? window.t('settings_danger_desc') : 'Ces actions sont irréversibles. Toutes les données locales seront effacées.'}</p>
          <button class="btn btn-danger" onclick="confirmClearData()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            ${window.t ? window.t('settings_clear_data') : 'Effacer toutes les données locales'}
          </button>
        </div>
      </div>
    `;

    store.setState({ loading: false });
    app.innerHTML = html;
    updateNav();

    // Check auth status
    (async () => {
      const { user } = await getSession();
      const label = document.getElementById('auth-user-label');
      const loginBtn = document.getElementById('auth-login-btn');
      const signupBtn = document.getElementById('auth-signup-btn');
      const logoutBtn = document.getElementById('auth-logout-btn');
      if (!label) return;
      if (user) {
        label.innerHTML = `<span style="color:var(--color-success)">✅ ${window.t ? window.t('settings_connected') : 'Connecté'}</span> <span class="text-muted">${escapeHtml(user.email)}</span>`;
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-flex';
      } else {
        label.textContent = '🔓 ' + (window.t ? window.t('settings_not_connected') : 'Non connecté');
        loginBtn.style.display = 'inline-flex';
        signupBtn.style.display = 'inline-flex';
        logoutBtn.style.display = 'none';
      }
    })();

  } catch (error) {
    console.error('Settings page error:', error);
    store.setState({ loading: false });
    app.innerHTML = renderError(window.t ? window.t('settings_load_error') : 'Erreur lors du chargement des réglages.');
  }
}

function saveSetting(key, value) {
  const settings = store.getState('settings');
  settings[key] = value;
  store.setState({ settings: { ...settings } });
  localStorage.setItem('dailyos-settings', JSON.stringify(settings));
  showToast(window.t ? window.t('settings_saved') : 'Paramètre enregistré', 'success');
}

function saveADHDSetting(key, value) {
  localStorage.setItem(key, value);
  showToast(window.t ? window.t('settings_saved') : 'Paramètre enregistré', 'success');
}

function changeLang(lang) {
  localStorage.setItem('dailyos_lang', lang);
  if (typeof refreshLang === 'function') {
    refreshLang();
  } else {
    // Fallback: reload the page
    window.location.reload();
  }
}

function setSettingTheme(theme) {
  store.setState({ theme });
  if (theme === 'system') {
    localStorage.removeItem('dailyos-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  } else {
    applyTheme(theme);
    localStorage.setItem('dailyos-theme', theme);
  }
  renderSettingsPage();
  showToast(window.t ? window.t('theme_updated') : 'Thème mis à jour', 'success');
}

function toggleDemoMode(enabled) {
  store.setState({ demoMode: enabled });
  APP_CONFIG.DEMO_MODE = enabled;
  localStorage.setItem('dailyos-demo-mode', String(enabled));
  if (!enabled) {
    showToast(window.t ? window.t('demo_mode_off') : 'Mode réel activé — configurez Supabase dans config.js', 'warning');
  } else {
    showToast(window.t ? window.t('demo_mode_on') : 'Mode démo activé', 'success');
  }
  renderSettingsPage();
}

async function handleSyncNow() {
  const btn = document.querySelector('#sync-status-badge .btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = window.t ? window.t('settings_syncing') : 'Syncing...';
  }
  try {
    const result = await window.syncLocalToSupabase();
    if (result.errors > 0) {
      showToast(`${window.t ? window.t('settings_sync_partial') : 'Sync partiel'}: ${result.done}/${result.total}`, 'warning');
    } else {
      showToast(`${window.t ? window.t('settings_sync_done') : 'Sync terminé'} (${result.done}/${result.total})`, 'success');
    }
  } catch (e) {
    showToast(window.t ? window.t('settings_sync_error') : 'Erreur de synchronisation', 'error');
  }
  renderSettingsPage();
}

function exportData() {
  const data = {
    version: APP_CONFIG.VERSION,
    exported_at: new Date().toISOString(),
    entries: store.getState('entries'),
    summaries: store.getState('summaries'),
    ideas: store.getState('ideas'),
    reminders: store.getState('reminders'),
    insights: store.getState('insights'),
    settings: store.getState('settings')
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dailyos-export-${getTodayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(window.t ? window.t('settings_exported') : 'Données exportées ✓', 'success');
}

function confirmClearData() {
  // Show modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">⚠️ ${window.t ? window.t('settings_clear_title') : 'Effacer toutes les données'}</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <p>${window.t ? window.t('settings_clear_warning') : 'Cette action est <strong>irréversible</strong>. Toutes vos entrées, résumés, idées, rappels et préférences seront définitivement supprimés.'}</p>
        <p class="mt-4">${window.t ? window.t('settings_clear_confirm') : 'Êtes-vous sûr de vouloir continuer ?'}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">${window.t ? window.t('cancel') : 'Annuler'}</button>
        <button class="btn btn-danger" onclick="clearAllData()">${window.t ? window.t('settings_clear_yes') : 'Oui, tout effacer'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function clearAllData() {
  // Close modal
  document.querySelectorAll('.modal-overlay').forEach(el => el.remove());

  // Clear state
  store.setState({
    entries: [],
    summaries: [],
    ideas: [],
    reminders: [],
    insights: [],
    selectedDate: null
  });

  // Clear localStorage
  localStorage.removeItem('dailyos-theme');
  localStorage.removeItem('dailyos-settings');
  localStorage.removeItem('dailyos-demo-mode');

  showToast(window.t ? window.t('settings_cleared') : 'Toutes les données ont été effacées', 'error');

  // Reload to reset
  setTimeout(() => {
    window.location.hash = '#/today';
    window.location.reload();
  }, 1500);
}
