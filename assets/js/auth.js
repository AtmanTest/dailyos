/* ===== DailyOS Supabase Auth ===== */
/* Uses @supabase/supabase-js from CDN */

async function initSupabaseClient() {
  if (window._supabase) return window._supabase;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(
    APP_CONFIG.SUPABASE_CONFIG.url,
    APP_CONFIG.SUPABASE_CONFIG.anonKey
  );
  window._supabase = supabase;
  return supabase;
}

/* ===== Session Management ===== */

async function getSession() {
  try {
    const supabase = await initSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) return { user: null, error };
    return { user: data.session?.user || null, error: null };
  } catch {
    return { user: null, error: null };
  }
}

async function signUp(email, password) {
  const supabase = await initSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { username: email.split('@')[0] } }
  });
  return { user: data.user, session: data.session, error };
}

async function signIn(email, password) {
  const supabase = await initSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user, session: data.session, error };
}

async function signInWithGoogle() {
  const supabase = await initSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/dailyos' }
  });
  return { data, error };
}

async function signOut() {
  const supabase = await initSupabaseClient();
  await supabase.auth.signOut();
}

let _authUnsubscribe = null;

/**
 * Subscribe to auth state changes (called once at app init)
 */
async function initAuthListener() {
  try {
    const supabase = await initSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        window._supabaseUser = session?.user || null;
        document.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: session?.user, event } }));
      } else if (event === 'SIGNED_OUT') {
        window._supabaseUser = null;
        document.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null, event } }));
      }
    });
    _authUnsubscribe = () => subscription?.unsubscribe();
    // Check for existing session immediately
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      window._supabaseUser = data.session.user;
      document.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: data.session.user, event: 'INIT' } }));
    }
  } catch (e) {
    console.warn('Auth listener init failed:', e);
  }
}

/* ===== Auth UI ===== */

function renderAuthModal(mode) {
  const T = (k, fb) => (window.t ? window.t(k) : fb);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'auth-modal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:380px">
      <div class="modal-header">
        <div class="modal-title">${mode === 'login' ? '🔑 ' + T('auth_login', 'Connexion') : '📝 ' + T('auth_signup', 'Inscription')}</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <form id="auth-form" onsubmit="handleAuth(event)">
          <input type="hidden" name="mode" value="${mode}">
          <div class="form-group">
            <label class="form-label" for="auth-email">${T('auth_email', 'Email')}</label>
            <input class="form-input" type="email" id="auth-email" name="email" required
              placeholder="vous@email.com" autocomplete="email">
          </div>
          <div class="form-group">
            <label class="form-label" for="auth-password">${T('auth_password', 'Mot de passe')}</label>
            <input class="form-input" type="password" id="auth-password" name="password" required minlength="6"
              placeholder="6 caractères minimum" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}">
          </div>
          <div id="auth-error" style="color:var(--color-error);font-size:var(--font-size-sm);margin-bottom:var(--space-2);display:none"></div>
          <button type="submit" class="btn btn-primary" style="width:100%;padding:var(--space-3)">
            ${mode === 'login' ? T('auth_login', 'Se connecter') : T('auth_create_account', 'Créer mon compte')}
          </button>
          <div style="display:flex;align-items:center;gap:var(--space-2);margin:var(--space-3) 0">
            <hr style="flex:1;border:none;border-top:1px solid var(--color-border)">
            <span style="color:var(--color-text-muted);font-size:var(--font-size-sm)">${T('auth_or', 'ou')}</span>
            <hr style="flex:1;border:none;border-top:1px solid var(--color-border)">
          </div>
          <button type="button" class="btn btn-secondary" onclick="handleGoogleSignIn()" style="width:100%;padding:var(--space-3)">
            🔵 ${mode === 'login' ? T('auth_continue_google', 'Continuer avec Google') : T('auth_signup_google', "S'inscrire avec Google")}
          </button>
        </form>
        <div class="text-sm text-center mt-3" style="color:var(--color-text-muted)">
          ${mode === 'login'
            ? `${T('auth_no_account', 'Pas encore de compte ?')} <a href="#" onclick="switchAuthMode('signup')" style="color:var(--color-accent)">${T('auth_signup_link', "S'inscrire")}</a>`
            : `${T('auth_have_account', 'Déjà un compte ?')} <a href="#" onclick="switchAuthMode('login')" style="color:var(--color-accent)">${T('auth_login_link', 'Se connecter')}</a>`}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('auth-email')?.focus();
}

function handleGoogleSignIn() {
  signInWithGoogle();
  // OAuth redirects away, so we just close the modal
  document.getElementById('auth-modal')?.remove();
}

function switchAuthMode(mode) {
  const old = document.getElementById('auth-modal');
  if (old) old.remove();
  renderAuthModal(mode);
}

async function handleAuth(event) {
  event.preventDefault();
  const form = event.target;
  const mode = form.mode.value;
  const email = form.email.value.trim();
  const password = form.password.value;
  const errorEl = document.getElementById('auth-error');

  errorEl.style.display = 'none';
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = mode === 'login' ? 'Connexion...' : 'Inscription...';

  try {
    let result;
    if (mode === 'login') {
      result = await signIn(email, password);
    } else {
      result = await signUp(email, password);
    }

    if (result.error) {
      errorEl.textContent = result.error.message || 'Erreur inconnue';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'login' ? 'Se connecter' : 'Créer mon compte';
      return;
    }

    // Close modal
    const modal = document.getElementById('auth-modal');
    if (modal) modal.remove();

    if (result.user) {
      const name = result.user.email?.split('@')[0] || 'Utilisateur';
      showToast(`✅ ${window.t ? window.t('auth_connected_as') : 'Connecté en tant que'} ${name}`, 'success');

      // After successful auth, attempt to sync local data to Supabase
      try {
        const syncResult = await window.syncLocalToSupabase();
        if (syncResult && syncResult.total > 0) {
          // Show sync offer toast with Yes/Later
          const toastMsg = window.t
            ? window.t('toast_sync_offer', { count: syncResult.total })
            : `📤 ${syncResult.total} entrée${syncResult.total > 1 ? 's' : ''} locale${syncResult.total > 1 ? 's' : ''} à synchroniser. Synchroniser maintenant ?`;
          
          // Create a custom sync dialog
          const overlay = document.createElement('div');
          overlay.className = 'modal-overlay';
          overlay.innerHTML = `
            <div class="modal" style="max-width:360px">
              <div class="modal-header">
                <div class="modal-title">📤 ${window.t ? window.t('sync_offer_title') : 'Synchronisation'}</div>
              </div>
              <div class="modal-body">
                <p>${toastMsg}</p>
              </div>
              <div class="modal-footer" style="display:flex;gap:var(--space-2)">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="flex:1">
                  ${window.t ? window.t('sync_later') : 'Plus tard'}
                </button>
                <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); doSyncAfterAuth()" style="flex:1">
                  ${window.t ? window.t('sync_yes') : 'Oui'}
                </button>
              </div>
            </div>
          `;
          document.body.appendChild(overlay);
        }
      } catch (syncError) {
        console.warn('Post-auth sync attempt failed (non-blocking):', syncError);
      }

      // Re-render current page
      const current = store.getState('currentPage');
      const routeMap = {
        today: renderTodayPage, journal: renderJournalPage,
        ideas: renderIdeasPage, reminders: renderRemindersPage,
        insights: renderInsightsPage, settings: renderSettingsPage
      };
      if (routeMap[current]) routeMap[current]();
    }
  } catch (e) {
    errorEl.textContent = 'Erreur réseau';
    errorEl.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = mode === 'login' ? 'Se connecter' : 'Créer mon compte';
  }
}

async function handleSignOut() {
  await signOut();
  showToast(window.t ? window.t('auth_signed_out') : 'Déconnecté', 'info');
  const current = store.getState('currentPage');
  const routeMap = {
    today: renderTodayPage, journal: renderJournalPage,
    ideas: renderIdeasPage, reminders: renderRemindersPage,
    insights: renderInsightsPage, settings: renderSettingsPage
  };
  if (routeMap[current]) routeMap[current]();
}

/**
 * Save personal profile data into Supabase auth user_metadata (no extra table needed).
 * @param {Object} profile - { display_name, adhd_type, medication, daily_goal, avatar_color }
 */
async function updateSupabaseProfile(profile) {
  try {
    const supabase = await initSupabaseClient();
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: profile.display_name || '',
        adhd_type: profile.adhd_type || '',
        medication: profile.medication || '',
        daily_goal: profile.daily_goal || '',
        avatar_color: profile.avatar_color || ''
      }
    });
    if (error) throw error;
    // Persist locally too
    if (profile.display_name) localStorage.setItem('dailyos_display_name', profile.display_name);
    if (profile.medication) localStorage.setItem('dailyos_medication', profile.medication);
    return { data, error: null };
  } catch (e) {
    console.warn('updateSupabaseProfile failed:', e.message);
    // Still persist locally
    if (profile.display_name) localStorage.setItem('dailyos_display_name', profile.display_name);
    if (profile.medication) localStorage.setItem('dailyos_medication', profile.medication);
    return { data: null, error: e };
  }
}
window.updateSupabaseProfile = updateSupabaseProfile;

/**
 * Execute sync after user clicks "Yes" on the sync offer dialog
 */
async function doSyncAfterAuth() {
  try {
    const result = await window.syncLocalToSupabase();
    if (result.errors > 0) {
      showToast(
        window.t
          ? window.t('toast_sync_partial', { done: result.done, total: result.total, errors: result.errors })
          : `Sync partiel: ${result.done}/${result.total} synchronisé, ${result.errors} erreur(s)`,
        'warning'
      );
    } else {
      showToast(
        window.t
          ? window.t('toast_sync_done', { count: result.done })
          : `✅ ${result.done} entrée${result.done > 1 ? 's' : ''} synchronisée${result.done > 1 ? 's' : ''}`,
        'success'
      );
    }
  } catch (e) {
    showToast(window.t ? window.t('toast_sync_error') : 'Erreur de synchronisation', 'error');
  }
}
