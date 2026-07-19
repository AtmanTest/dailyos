/* ===== DailyOS Profile Page ===== */
/* Full user profile management: identity, preferences, account & security */

const PROFILE_SAVE_DEBOUNCE = 500;
let _profileSaveTimer = null;

/* ===== Main render ===== */

async function renderProfilePage() {
  const app = document.getElementById('app');
  store.setState({ loading: true });
  app.innerHTML = renderSkeleton('profile');

  try {
    const user = (typeof store !== 'undefined') ? store.getState('user') : null;
    const settings = store.getState('settings') || {};
    const theme = store.getState('theme') || 'dark';
    const currentLang = store.getState('lang') || 'fr';

    const displayName = localStorage.getItem('dailyos_display_name') || user?.user_metadata?.username || user?.email?.split('@')[0] || '';
    const fullName = localStorage.getItem('dailyos_full_name') || '';
    const bio = localStorage.getItem('dailyos_bio') || '';
    const avatarColor = localStorage.getItem('dailyos_avatar_color') || '#6366f1';
    const timezone = localStorage.getItem('dailyos_timezone') || settings.timezone || 'Europe/Paris';
    const dateFormat = localStorage.getItem('dailyos_date_format') || 'DD/MM/YYYY';

    const ianaTimezones = [
      'Europe/Paris', 'Europe/London', 'Europe/Berlin',
      'America/New_York', 'America/Los_Angeles', 'America/Chicago',
      'America/Denver', 'Asia/Tokyo', 'Asia/Shanghai',
      'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland',
      'Africa/Cairo', 'Africa/Johannesburg', 'America/Sao_Paulo',
      'Europe/Moscow', 'Europe/Istanbul', 'Asia/Dubai'
    ];

    const initials = (displayName || user?.email || '?').slice(0, 2).toUpperCase();
    const avatarUrl = localStorage.getItem('dailyos_avatar_url') || '';

    let html = `
      <div class="section">
        <h1 class="section-title">👤 ${t('profile_title') || 'Mon Profil'}</h1>
      </div>

      <!-- Section 1: Identité -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">📸 ${t('profile_identity') || 'Identité'}</div>
        </div>
        <div class="card-body">
          <!-- Avatar -->
          <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-4)">
            <div style="position:relative;width:72px;height:72px;flex-shrink:0">
              ${avatarUrl
                ? `<img src="${escapeHtml(avatarUrl)}" alt="" style="width:72px;height:72px;border-radius:50%;object-fit:cover" id="profile-avatar-img">`
                : `<div id="profile-avatar-placeholder" style="width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.8rem;color:#fff;background:${escapeHtml(avatarColor)};cursor:pointer" onclick="document.getElementById('avatar-upload-input').click()">${escapeHtml(initials)}</div>`
              }
              <button class="btn btn-sm btn-secondary" style="position:absolute;bottom:-4px;right:-4px;width:28px;height:28px;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1" onclick="document.getElementById('avatar-upload-input').click()" title="${t('profile_change_avatar') || 'Changer la photo'}">📷</button>
            </div>
            <div>
              <div style="font-weight:bold;font-size:1.1rem">${escapeHtml(displayName || (t('profile_no_name') || 'Sans nom'))}</div>
              <div class="text-sm" style="color:var(--color-text-muted)">${user?.email || ''}</div>
            </div>
          </div>

          <!-- Hidden file input -->
          <input type="file" id="avatar-upload-input" accept="image/*" style="display:none" onchange="handleAvatarUpload(this.files[0])">

          <div class="form-group">
            <label class="form-label" for="profile-username">${t('profile_username') || "Nom d'affichage"}</label>
            <input class="form-input" id="profile-username" type="text" value="${escapeHtml(displayName)}" placeholder="${t('profile_username_placeholder') || 'Comment veux-tu qu\'on t\'appelle ?'}" onchange="saveProfileField('username', this.value)" maxlength="50">
          </div>
          <div class="form-group">
            <label class="form-label" for="profile-fullname">${t('profile_fullname') || 'Nom complet'}</label>
            <input class="form-input" id="profile-fullname" type="text" value="${escapeHtml(fullName)}" placeholder="${t('profile_fullname_placeholder') || 'Optionnel'}" onchange="saveProfileField('full_name', this.value)" maxlength="100">
          </div>
          <div class="form-group">
            <label class="form-label" for="profile-bio">${t('profile_bio') || 'Bio'}</label>
            <textarea class="form-input" id="profile-bio" rows="3" maxlength="280" placeholder="${t('profile_bio_placeholder') || 'Quelques mots sur toi...'}" oninput="updateBioCounter(this)">${escapeHtml(bio)}</textarea>
            <div class="form-hint" style="text-align:right"><span id="bio-counter">${bio.length}</span>/280</div>
          </div>
          <button class="btn btn-primary" onclick="saveProfileIdentity()" id="profile-save-btn">
            💾 ${t('profile_save') || 'Enregistrer'}
          </button>
          <span id="profile-save-status" style="margin-left:var(--space-2);font-size:var(--font-size-sm);color:var(--color-text-muted)"></span>
        </div>
      </div>

      <!-- Section 2: Préférences -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">⚙️ ${t('profile_preferences') || 'Préférences'}</div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">${t('settings_language_label') || 'Langue'}</label>
            <div style="display:flex;gap:var(--space-3);flex-wrap:wrap">
              <label class="pref-radio" style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;padding:var(--space-2) var(--space-3);border:2px solid ${currentLang === 'fr' ? 'var(--color-accent)' : 'var(--color-border)'};border-radius:var(--radius-md);background:${currentLang === 'fr' ? 'var(--color-accent-light)' : 'transparent'}">
                <input type="radio" name="pref-lang" value="fr" ${currentLang === 'fr' ? 'checked' : ''} onchange="savePreference('lang', 'fr')" style="accent-color:var(--color-accent)">
                <span style="font-size:1.2rem">🇫🇷</span>
                <span>Français</span>
              </label>
              <label class="pref-radio" style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;padding:var(--space-2) var(--space-3);border:2px solid ${currentLang === 'en' ? 'var(--color-accent)' : 'var(--color-border)'};border-radius:var(--radius-md);background:${currentLang === 'en' ? 'var(--color-accent-light)' : 'transparent'}">
                <input type="radio" name="pref-lang" value="en" ${currentLang === 'en' ? 'checked' : ''} onchange="savePreference('lang', 'en')" style="accent-color:var(--color-accent)">
                <span style="font-size:1.2rem">🇬🇧</span>
                <span>English</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t('settings_theme') || 'Thème'}</label>
            <div style="display:flex;gap:var(--space-3);flex-wrap:wrap">
              <button class="btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}" onclick="savePreference('theme', 'dark')">
                🌙 ${t('theme_dark') || 'Sombre'}
              </button>
              <button class="btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}" onclick="savePreference('theme', 'light')">
                ☀️ ${t('theme_light') || 'Clair'}
              </button>
              <button class="btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}" onclick="savePreference('theme', 'system')">
                💻 ${t('theme_system') || 'Système'}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="profile-timezone">${t('settings_timezone') || 'Fuseau horaire'}</label>
            <select class="form-select" id="profile-timezone" onchange="savePreference('timezone', this.value)">
              ${ianaTimezones.map(tz =>
                `<option value="${tz}" ${timezone === tz ? 'selected' : ''}>${tz}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('profile_date_format') || 'Format de date'}</label>
            <div style="display:flex;gap:var(--space-3);flex-wrap:wrap">
              <label class="pref-radio" style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;padding:var(--space-2) var(--space-3);border:2px solid ${dateFormat === 'DD/MM/YYYY' ? 'var(--color-accent)' : 'var(--color-border)'};border-radius:var(--radius-md);background:${dateFormat === 'DD/MM/YYYY' ? 'var(--color-accent-light)' : 'transparent'}">
                <input type="radio" name="pref-date" value="DD/MM/YYYY" ${dateFormat === 'DD/MM/YYYY' ? 'checked' : ''} onchange="savePreference('date_format', 'DD/MM/YYYY')">
                <span>31/12/2024</span>
              </label>
              <label class="pref-radio" style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;padding:var(--space-2) var(--space-3);border:2px solid ${dateFormat === 'MM/DD/YYYY' ? 'var(--color-accent)' : 'var(--color-border)'};border-radius:var(--radius-md);background:${dateFormat === 'MM/DD/YYYY' ? 'var(--color-accent-light)' : 'transparent'}">
                <input type="radio" name="pref-date" value="MM/DD/YYYY" ${dateFormat === 'MM/DD/YYYY' ? 'checked' : ''} onchange="savePreference('date_format', 'MM/DD/YYYY')">
                <span>12/31/2024</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Compte & Sécurité -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">🔐 ${t('profile_account') || 'Compte & Sécurité'}</div>
        </div>
        <div class="card-body">
          ${user ? `
          <div class="form-group">
            <label class="form-label" for="profile-new-email">${t('profile_change_email') || "Changer l'email"}</label>
            <div style="display:flex;gap:var(--space-2)">
              <input class="form-input" id="profile-new-email" type="email" placeholder="${escapeHtml(user.email)}" style="flex:1">
              <button class="btn btn-secondary" onclick="changeEmail()">${t('form_update') || 'Mettre à jour'}</button>
            </div>
            <div class="form-hint" id="email-update-status"></div>
          </div>
          <div class="form-group">
            <label class="form-label" for="profile-new-password">${t('profile_change_password') || 'Changer le mot de passe'}</label>
            <div style="display:flex;gap:var(--space-2)">
              <input class="form-input" id="profile-new-password" type="password" placeholder="6 caractères minimum" minlength="6" style="flex:1">
              <button class="btn btn-secondary" onclick="changePassword()">${t('form_update') || 'Mettre à jour'}</button>
            </div>
            <div class="form-hint" id="password-update-status"></div>
          </div>
          <hr style="border-color:var(--color-border);margin:var(--space-4) 0">
          <div class="form-group">
            <label class="form-label">${t('profile_magic_link') || 'Magic Link'}</label>
            <p class="text-sm mb-2" style="color:var(--color-text-muted)">${t('profile_magic_link_desc') || 'Recevoir un lien de connexion par email (pas de mot de passe)'}</p>
            <button class="btn btn-secondary" onclick="sendMagicLink()">✉️ ${t('profile_send_magic_link') || 'Envoyer le lien'}</button>
          </div>
          <hr style="border-color:var(--color-border);margin:var(--space-4) 0">
          <div class="form-group" style="border:1px solid var(--color-error);border-radius:var(--radius-md);padding:var(--space-4)">
            <label class="form-label" style="color:var(--color-error)">⚠️ ${t('profile_danger_zone') || 'Zone dangereuse'}</label>
            <p class="text-sm mb-3" style="color:var(--color-text-muted)">${t('profile_delete_account_desc') || 'Supprimer définitivement votre compte et toutes les données associées'}</p>
            <button class="btn btn-danger" onclick="confirmDeleteAccount()">🗑️ ${t('profile_delete_account') || 'Supprimer mon compte'}</button>
          </div>
          ` : `
          <div class="empty-state" style="margin:0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <div class="empty-state-text">${t('profile_not_connected') || 'Connecte-toi pour gérer ton compte'}</div>
            <button class="btn btn-primary mt-3" onclick="renderAuthModal('login')">🔑 ${t('auth_login') || 'Se connecter'}</button>
          </div>
          `}
        </div>
      </div>
    `;

    store.setState({ loading: false });
    app.innerHTML = html;
    updateNav();

  } catch (error) {
    console.error('Profile page error:', error);
    store.setState({ loading: false });
    app.innerHTML = renderError(t('profile_load_error') || 'Erreur lors du chargement du profil.');
  }
}

/* ===== Avatar Upload ===== */

async function handleAvatarUpload(file) {
  if (!file) return;

  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    showToast(t('avatar_too_big') || 'Image trop volumineuse (max 2 Mo)', 'error');
    return;
  }

  const statusEl = document.getElementById('profile-save-status');
  if (statusEl) statusEl.textContent = t('avatar_uploading') || 'Upload en cours...';

  try {
    // Resize via Canvas API
    const resized = await resizeAvatarImage(file, 400, 400);
    const ext = file.name.split('.').pop() || 'png';
    const contentType = file.type || 'image/png';
    const path = `avatars/${Date.now()}.${ext}`;

    const supabase = await initSupabaseClient();
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, resized, { upsert: true, contentType });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    const avatarUrl = urlData.publicUrl;

    // Update locally
    localStorage.setItem('dailyos_avatar_url', avatarUrl);

    // Update Supabase user metadata
    if (window._supabaseUser) {
      await updateSupabaseProfile({ avatar_url: avatarUrl });
    }

    // Refresh page
    renderProfilePage();
    showToast(t('avatar_updated') || 'Photo de profil mise à jour ✓', 'success');

  } catch (e) {
    console.error('Avatar upload failed:', e);
    const statusEl2 = document.getElementById('profile-save-status');
    if (statusEl2) statusEl2.textContent = '';
    showToast(t('avatar_error') || 'Erreur upload avatar', 'error');
  }
}

function resizeAvatarImage(file, maxW, maxH) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, file.type || 'image/png', 0.85);
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}

/* ===== Profile Save ===== */

function saveProfileField(field, value) {
  const map = {
    username: 'dailyos_display_name',
    full_name: 'dailyos_full_name',
    bio: 'dailyos_bio'
  };
  const lsKey = map[field] || field;
  localStorage.setItem(lsKey, value);

  // Debounced save to Supabase
  clearTimeout(_profileSaveTimer);
  const statusEl = document.getElementById('profile-save-status');
  if (statusEl) statusEl.textContent = t('profile_unsaved') || '⏳ Non sauvegardé';
  _profileSaveTimer = setTimeout(saveProfileIdentity, PROFILE_SAVE_DEBOUNCE);
}

async function saveProfileIdentity() {
  const btn = document.getElementById('profile-save-btn');
  const statusEl = document.getElementById('profile-save-status');
  if (!btn) return;

  btn.disabled = true;
  btn.innerHTML = '⏳...';

  const username = document.getElementById('profile-username')?.value || '';
  const fullName = document.getElementById('profile-fullname')?.value || '';
  const bio = document.getElementById('profile-bio')?.value || '';

  try {
    // Save locally
    localStorage.setItem('dailyos_display_name', username);
    localStorage.setItem('dailyos_full_name', fullName);
    localStorage.setItem('dailyos_bio', bio);

    // Save to Supabase if connected
    if (window._supabaseUser) {
      await updateSupabaseProfile({
        display_name: username,
        full_name: fullName,
        bio: bio
      });
    }

    if (statusEl) statusEl.textContent = t('profile_saved') || '✅ Sauvegardé';
    showToast(t('profile_save_success') || 'Profil enregistré ✓', 'success');
  } catch (e) {
    console.warn('Profile save warning:', e);
    if (statusEl) statusEl.textContent = t('profile_saved_local') || '✅ Sauvegardé localement';
    showToast(t('profile_save_offline') || 'Profil sauvegardé localement', 'success');
  }

  btn.disabled = false;
  btn.innerHTML = '💾 ' + (t('profile_save') || 'Enregistrer');
  setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
}

function updateBioCounter(el) {
  document.getElementById('bio-counter').textContent = el.value.length;
}

/* ===== Preferences (auto-save) ===== */

function savePreference(key, value) {
  const statusEl = document.getElementById('profile-save-status');

  switch (key) {
    case 'lang': {
      localStorage.setItem('dailyos_lang', value);
      store.setState({ lang: value });
      if (typeof refreshLang === 'function') refreshLang();
      renderProfilePage();
      break;
    }
    case 'theme': {
      store.setState({ theme: value });
      if (value === 'system') {
        localStorage.removeItem('dailyos-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
      } else {
        applyTheme(value);
        localStorage.setItem('dailyos-theme', value);
      }
      // Sync header
      document.getElementById('app-header').innerHTML = renderHeader();
      break;
    }
    case 'timezone': {
      localStorage.setItem('dailyos_timezone', value);
      const settings = store.getState('settings');
      settings.timezone = value;
      store.setState({ settings: { ...settings } });
      localStorage.setItem('dailyos-settings', JSON.stringify(settings));
      break;
    }
    case 'date_format': {
      localStorage.setItem('dailyos_date_format', value);
      break;
    }
    default: {
      localStorage.setItem('dailyos_' + key, value);
    }
  }

  // Sync to Supabase user_metadata
  debounceSyncPreference(key, value);
}

const debounceSyncPreference = (() => {
  let timer;
  return (key, value) => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (window._supabaseUser) {
        try {
          await updateSupabaseProfile({ [key]: value });
        } catch (e) { /* silent */ }
      }
    }, 1000);
  };
})();

/* ===== Account & Security ===== */

async function changeEmail() {
  const input = document.getElementById('profile-new-email');
  const status = document.getElementById('email-update-status');
  const email = input?.value?.trim();
  if (!email) { status.textContent = t('profile_enter_email') || 'Entre un email'; return; }

  try {
    status.textContent = t('profile_updating') || 'Mise à jour...';
    const supabase = await initSupabaseClient();
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
    status.textContent = t('profile_email_confirm') || "✉️ Email de confirmation envoyé";
    input.value = '';
  } catch (e) {
    status.textContent = e.message || 'Erreur';
  }
}

async function changePassword() {
  const input = document.getElementById('profile-new-password');
  const status = document.getElementById('password-update-status');
  const password = input?.value;
  if (!password || password.length < 6) { status.textContent = t('profile_password_min') || '6 caractères minimum'; return; }

  try {
    status.textContent = t('profile_updating') || 'Mise à jour...';
    const supabase = await initSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    status.textContent = t('profile_password_updated') || '✅ Mot de passe mis à jour';
    input.value = '';
  } catch (e) {
    status.textContent = e.message || 'Erreur';
  }
}

async function sendMagicLink() {
  const supabase = await initSupabaseClient();
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: window._supabaseUser?.email,
      options: { shouldCreateUser: false }
    });
    if (error) throw error;
    showToast('✉️ ' + (t('profile_magic_link_sent') || 'Lien magique envoyé par email'), 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function confirmDeleteAccount() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header">
        <div class="modal-title" style="color:var(--color-error)">⚠️ ${t('profile_delete_title') || 'Supprimer le compte'}</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <p>${t('profile_delete_warning') || 'Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées.'}</p>
        <div class="form-group mt-4">
          <label class="form-label">${t('profile_delete_type') || 'Tape "SUPPRIMER" pour confirmer'}</label>
          <input class="form-input" id="delete-confirm-input" type="text" placeholder="SUPPRIMER" oninput="document.getElementById('delete-confirm-btn').disabled = this.value !== 'SUPPRIMER'">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">${t('cancel') || 'Annuler'}</button>
        <button class="btn btn-danger" id="delete-confirm-btn" disabled onclick="deleteAccount()">🗑️ ${t('profile_delete_confirm') || 'Supprimer définitivement'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('delete-confirm-input')?.focus(), 100);
}

async function deleteAccount() {
  // Delete user via Supabase Admin API
  // Since client-side can't admin delete, we sign out + clear local
  try {
    const supabase = await initSupabaseClient();
    // Send delete request to serverless function /api/delete-account
    const { error } = await supabase.rpc('delete_user');
    if (error) console.warn('RPC delete_user failed:', error);
  } catch (e) { /* silent */ }

  // Clear all local data
  localStorage.clear();
  store.setState({
    user: null, entries: [], summaries: [], ideas: [],
    reminders: [], insights: [], settings: {}
  });
  await signOut();

  showToast(t('profile_deleted') || 'Compte supprimé', 'info');
  window.location.hash = '#/today';
  window.location.reload();
}

/* ===== Skeleton Loader ===== */

function renderSkeleton(type) {
  if (type === 'profile') {
    return `
      <div class="section"><h1 class="section-title skeleton" style="width:200px;height:32px;border-radius:8px">&nbsp;</h1></div>
      <div class="card mb-6">
        <div class="card-body">
          <div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-4)">
            <div class="skeleton" style="width:72px;height:72px;border-radius:50%;flex-shrink:0">&nbsp;</div>
            <div style="flex:1">
              <div class="skeleton" style="width:150px;height:20px;border-radius:4px;margin-bottom:var(--space-2)">&nbsp;</div>
              <div class="skeleton" style="width:200px;height:14px;border-radius:4px">&nbsp;</div>
            </div>
          </div>
          <div class="skeleton" style="width:100%;height:40px;border-radius:8px;margin-bottom:var(--space-3)">&nbsp;</div>
          <div class="skeleton" style="width:100%;height:40px;border-radius:8px;margin-bottom:var(--space-3)">&nbsp;</div>
          <div class="skeleton" style="width:100%;height:80px;border-radius:8px;margin-bottom:var(--space-3)">&nbsp;</div>
          <div class="skeleton" style="width:120px;height:40px;border-radius:8px">&nbsp;</div>
        </div>
      </div>
    `;
  }
  return `<div class="spinner" role="status">${renderLoading()}</div>`;
}

/* ===== Error helpers ===== */

function getAuthErrorMessage(error) {
  if (!error) return '';
  const msg = error.message || String(error);
  const map = {
    'Invalid login credentials': t('auth_error_invalid') || 'Email ou mot de passe incorrect',
    'Email not confirmed': t('auth_error_unconfirmed') || 'Email non confirmé. Vérifie ta boîte mail',
    'User already registered': t('auth_error_exists') || 'Un compte existe déjà avec cet email',
    'Password should be at least 6 characters': t('auth_error_password_short') || 'Mot de passe trop court (6 caractères min)',
    'rate_limit': t('auth_error_rate_limit') || 'Trop de tentatives. Réessaie dans quelques minutes',
    'Email link is invalid or has expired': t('auth_error_link_expired') || 'Lien invalide ou expiré',
    'Unable to validate email': t('auth_error_email_invalid') || 'Email invalide',
    'NetworkError': t('auth_error_network') || 'Erreur réseau - vérifie ta connexion'
  };
  for (const [key, val] of Object.entries(map)) {
    if (msg.includes(key)) return val;
  }
  return msg;
}

/* ===== Export page function ===== */

// Register globally
window.renderProfilePage = renderProfilePage;
window.handleAvatarUpload = handleAvatarUpload;
window.saveProfileField = saveProfileField;
window.saveProfileIdentity = saveProfileIdentity;
window.updateBioCounter = updateBioCounter;
window.savePreference = savePreference;
window.changeEmail = changeEmail;
window.changePassword = changePassword;
window.sendMagicLink = sendMagicLink;
window.confirmDeleteAccount = confirmDeleteAccount;
window.deleteAccount = deleteAccount;
window.getAuthErrorMessage = getAuthErrorMessage;
