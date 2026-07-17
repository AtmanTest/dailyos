/* ===== DailyOS Settings Page ===== */

async function renderSettingsPage() {
  const app = document.getElementById('app');
  store.setState({ loading: true });
  app.innerHTML = renderLoading();

  try {
    const settings = store.getState('settings');
    const theme = store.getState('theme');
    const demoMode = store.getState('demoMode');

    let html = `
      <div class="section">
        <h1 class="section-title">⚙️ Réglages</h1>
      </div>

      <!-- Profile -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">Profil</div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label" for="settings-name">Nom</label>
            <input class="form-input" id="settings-name" type="text" value="${escapeHtml(settings.name || '')}" placeholder="Votre nom" onchange="saveSetting('name', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label" for="settings-timezone">Fuseau horaire</label>
            <select class="form-select" id="settings-timezone" onchange="saveSetting('timezone', this.value)">
              ${['Europe/Paris', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo'].map(tz =>
                `<option value="${tz}" ${(settings.timezone || 'Europe/Paris') === tz ? 'selected' : ''}>${tz}</option>`
              ).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Apparence -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">Apparence</div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Thème</label>
            <div style="display:flex;gap:var(--space-3);flex-wrap:wrap">
              <button class="btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}" onclick="setSettingTheme('dark')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                Sombre
              </button>
              <button class="btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}" onclick="setSettingTheme('light')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>
                Clair
              </button>
              <button class="btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}" onclick="setSettingTheme('system')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                Système
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Données -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">Données</div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <div class="flex items-center justify-between">
              <div>
                <label class="form-label" style="margin-bottom:2px">Mode démo</label>
                <div class="form-hint">Utiliser des données de démonstration</div>
              </div>
              <label style="position:relative;display:inline-block;width:48px;height:28px;cursor:pointer">
                <input type="checkbox" ${demoMode ? 'checked' : ''} onchange="toggleDemoMode(this.checked)" style="opacity:0;width:0;height:0">
                <span style="position:absolute;inset:0;background:${demoMode ? 'var(--color-accent)' : 'var(--color-card-hover)'};border-radius:14px;transition:background var(--transition-fast)"></span>
                <span style="position:absolute;top:2px;left:${demoMode ? '22px' : '2px'};width:24px;height:24px;background:#fff;border-radius:50%;transition:left var(--transition-fast)"></span>
              </label>
            </div>
            ${demoMode ? '<div class="form-hint" style="color:var(--color-warning)">⚠️ Les données ne sont pas persistées en mode démo.</div>' : ''}
          </div>

          <div class="form-group">
            <button class="btn btn-secondary" onclick="exportData()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exporter les données (JSON)
            </button>
          </div>

          <div class="form-group">
            <label class="form-label">Rétention des données</label>
            <select class="form-select" onchange="saveSetting('retention', this.value)">
              <option value="30">30 jours</option>
              <option value="90" selected>90 jours</option>
              <option value="180">6 mois</option>
              <option value="365">1 an</option>
            </select>
          </div>
        </div>
      </div>

      <!-- À propos -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">À propos</div>
        </div>
        <div class="card-body">
          <div class="mb-2"><strong>Version:</strong> ${escapeHtml(APP_CONFIG.VERSION)}</div>
          <div class="mb-2"><strong>Date de build:</strong> ${escapeHtml(APP_CONFIG.BUILD_DATE)}</div>
          <div class="text-muted text-sm">DailyOS — Votre système d'exploitation quotidien. Toutes les données restent sur votre appareil.</div>
        </div>
      </div>

      <!-- Confidentialité -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">Confidentialité</div>
        </div>
        <div class="card-body">
          <ul style="list-style:disc;padding-left:var(--space-5)">
            <li class="mb-2">🔒 Toutes les données sont stockées localement dans votre navigateur</li>
            <li class="mb-2">📡 Aucune donnée n'est envoyée à des serveurs externes sans votre consentement</li>
            <li class="mb-2">🗑️ Vous pouvez exporter ou supprimer toutes vos données à tout moment</li>
            <li class="mb-2">🔐 Le mode démo utilise des données fictives qui ne vous identifient pas</li>
            <li class="mb-2">🍪 Aucun cookie tiers n'est utilisé</li>
          </ul>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="card mb-6" style="border-color:var(--color-error)">
        <div class="card-header">
          <div class="card-title" style="color:var(--color-error)">⚠️ Zone dangereuse</div>
        </div>
        <div class="card-body">
          <p class="mb-4 text-sm">Ces actions sont irréversibles. Toutes les données locales seront effacées.</p>
          <button class="btn btn-danger" onclick="confirmClearData()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            Effacer toutes les données locales
          </button>
        </div>
      </div>
    `;

    store.setState({ loading: false });
    app.innerHTML = html;
    updateNav();

  } catch (error) {
    console.error('Settings page error:', error);
    store.setState({ loading: false });
    app.innerHTML = renderError('Erreur lors du chargement des réglages.');
  }
}

function saveSetting(key, value) {
  const settings = store.getState('settings');
  settings[key] = value;
  store.setState({ settings: { ...settings } });
  localStorage.setItem('dailyos-settings', JSON.stringify(settings));
  showToast('Paramètre enregistré', 'success');
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
  showToast('Thème mis à jour', 'success');
}

function toggleDemoMode(enabled) {
  store.setState({ demoMode: enabled });
  APP_CONFIG.DEMO_MODE = enabled;
  localStorage.setItem('dailyos-demo-mode', String(enabled));
  if (!enabled) {
    showToast('Mode réel activé — configurez Supabase dans config.js', 'warning');
  } else {
    showToast('Mode démo activé', 'success');
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

  showToast('Données exportées ✓', 'success');
}

function confirmClearData() {
  // Show modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">⚠️ Effacer toutes les données</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <p>Cette action est <strong>irréversible</strong>. Toutes vos entrées, résumés, idées, rappels et préférences seront définitivement supprimés.</p>
        <p class="mt-4">Êtes-vous sûr de vouloir continuer ?</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button class="btn btn-danger" onclick="clearAllData()">Oui, tout effacer</button>
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

  showToast('Toutes les données ont été effacées', 'error');

  // Reload to reset
  setTimeout(() => {
    window.location.hash = '#/today';
    window.location.reload();
  }, 1500);
}
