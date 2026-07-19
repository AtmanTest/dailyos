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

async function signInWithMagicLink(email) {
  const supabase = await initSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true }
  });
  return { data, error };
}

async function resetPassword(email) {
  const supabase = await initSupabaseClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/dailyos#/profile'
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
        store.setState({ user: session?.user || null });
        document.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: session?.user, event } }));
      } else if (event === 'SIGNED_OUT') {
        window._supabaseUser = null;
        store.setState({ user: null });
        document.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null, event } }));
      }
    });
    _authUnsubscribe = () => subscription?.unsubscribe();
    // Check for existing session immediately
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      window._supabaseUser = data.session.user;
      store.setState({ user: data.session.user });
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

  let title, btnLabel, altText, altAction, altLabel;
  if (mode === 'login') {
    title = '🔑 ' + T('auth_login', 'Connexion');
    btnLabel = T('auth_login', 'Se connecter');
    altText = T('auth_no_account', 'Pas encore de compte ?');
    altAction = "switchAuthMode('signup')";
    altLabel = T('auth_signup_link', "S'inscrire");
  } else if (mode === 'signup') {
    title = '📝 ' + T('auth_signup', 'Inscription');
    btnLabel = T('auth_create_account', 'Créer mon compte');
    altText = T('auth_have_account', 'Déjà un compte ?');
    altAction = "switchAuthMode('login')";
    altLabel = T('auth_login_link', 'Se connecter');
  } else if (mode === 'forgot') {
    title = '🔑 ' + T('auth_forgot_title', 'Mot de passe oublié');
    btnLabel = T('auth_reset_send', 'Envoyer le lien');
    altText = T('auth_back_to_login', 'Retour à la connexion');
    altAction = "switchAuthMode('login')";
    altLabel = T('auth_login_link', 'Se connecter');
  }

  overlay.innerHTML = `
    <div class="modal" style="max-width:380px">
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <form id="auth-form" onsubmit="handleAuth(event)">
          <input type="hidden" name="mode" value="${mode}">
          <div class="form-group">
            <label class="form-label" for="auth-email">${T('auth_email', 'Email')}</label>
            <input class="form-input" type="email" id="auth-email" name="email" required
              placeholder="vous@email.com" autocomplete="${mode === 'login' ? 'email' : 'email'}">
          </div>
          ${mode !== 'forgot' ? `
          <div class="form-group">
            <label class="form-label" for="auth-password">${T('auth_password', 'Mot de passe')}</label>
            <input class="form-input" type="password" id="auth-password" name="password" ${mode === 'signup' ? 'required minlength="6"' : 'required'} minlength="6"
              placeholder="${mode === 'signup' ? '6 caractères minimum' : 'Votre mot de passe'}"
              autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}">
          </div>
          ` : ''}
          <div id="auth-error" style="color:var(--color-error);font-size:var(--font-size-sm);margin-bottom:var(--space-2);display:none"></div>
          <button type="submit" class="btn btn-primary" style="width:100%;padding:var(--space-3)">
            ${btnLabel}
          </button>

          ${mode === 'login' ? `
          <div class="text-sm text-center mt-2">
            <a href="#" onclick="switchAuthMode('forgot')" style="color:var(--color-text-muted);text-decoration:underline">${T('auth_forgot_password', 'Mot de passe oublié ?')}</a>
          </div>
          ` : ''}

          ${mode !== 'forgot' ? `
          <div style="display:flex;align-items:center;gap:var(--space-2);margin:var(--space-3) 0">
            <hr style="flex:1;border:none;border-top:1px solid var(--color-border)">
            <span style="color:var(--color-text-muted);font-size:var(--font-size-sm)">${T('auth_or', 'ou')}</span>
            <hr style="flex:1;border:none;border-top:1px solid var(--color-border)">
          </div>
          <button type="button" class="btn btn-secondary" onclick="handleGoogleSignIn()" style="width:100%;padding:var(--space-3)">
            🔵 ${mode === 'login' ? T('auth_continue_google', 'Continuer avec Google') : T('auth_signup_google', "S'inscrire avec Google")}
          </button>
          ${mode === 'login' ? `
          <button type="button" class="btn btn-secondary mt-2" onclick="handleMagicLink()" style="width:100%;padding:var(--space-3)">
            ✉️ ${T('auth_magic_link', 'Envoyer un Magic Link')}
          </button>
          ` : ''}
          ` : ''}
        </form>
        <div class="text-sm text-center mt-3" style="color:var(--color-text-muted)">
          ${altText} <a href="#" onclick="${altAction}" style="color:var(--color-accent)">${altLabel}</a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('auth-email')?.focus();
}

function handleGoogleSignIn() {
  signInWithGoogle();
  document.getElementById('auth-modal')?.remove();
}

function switchAuthMode(mode) {
  const old = document.getElementById('auth-modal');
  if (old) old.remove();
  renderAuthModal(mode);
}

function setAuthError(message) {
  const errorEl = document.getElementById('auth-error');
  if (!errorEl) return;
  const fn = window.getAuthErrorMessage || ((e) => e.message || e);
  errorEl.textContent = fn(typeof message === 'object' ? message : { message });
  errorEl.style.display = 'block';
}

async function handleMagicLink() {
  const email = document.getElementById('auth-email')?.value?.trim();
  if (!email) {
    setAuthError({ message: 'Entre ton email' });
    return;
  }
  const btn = document.querySelector('#auth-form button[type="button"]');
  if (btn) { btn.disabled = true; btn.textContent = '✉️ Envoi...'; }

  const result = await signInWithMagicLink(email);
  if (result.error) {
    setAuthError(result.error);
  } else {
    showToast('✉️ ' + (window.t ? window.t('auth_magic_sent') : 'Lien magique envoyé ! Vérifie ta boîte mail'), 'success');
  }
  if (btn) { btn.disabled = false; btn.textContent = '✉️ Magic Link'; }
}

async function handleAuth(event) {
  event.preventDefault();
  const form = event.target;
  const mode = form.mode.value;
  const email = form.email.value.trim();
  const password = form.password?.value;
  const errorEl = document.getElementById('auth-error');

  errorEl.style.display = 'none';
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = mode === 'login' ? 'Connexion...' : mode === 'forgot' ? 'Envoi...' : 'Inscription...';

  try {
    let result;
    if (mode === 'login') {
      result = await signIn(email, password);
    } else if (mode === 'forgot') {
      result = await resetPassword(email);
    } else {
      result = await signUp(email, password);
    }

    if (result.error) {
      setAuthError(result.error);
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'login' ? 'Se connecter' : mode === 'forgot' ? 'Envoyer le lien' : 'Créer mon compte';
      return;
    }

    if (mode === 'forgot') {
      showToast('✉️ ' + (window.t ? window.t('auth_reset_sent') : 'Lien de réinitialisation envoyé par email'), 'success');
      const modal = document.getElementById('auth-modal');
      if (modal) modal.remove();
      return;
    }

    // Close modal
    const modal = document.getElementById('auth-modal');
    if (modal) modal.remove();

    if (result.user) {
      // Check if user needs email confirmation
      if (mode === 'signup' && result.user?.identities?.length === 0) {
        showToast('✉️ ' + (window.t ? window.t('auth_check_email') : 'Email de confirmation envoyé'), 'info');
        return;
      }

      const name = result.user.email?.split('@')[0] || 'Utilisateur';
      showToast(`✅ ${window.t ? window.t('auth_connected_as') : 'Connecté en tant que'} ${name}`, 'success');

      // After successful auth, attempt to sync local data to Supabase
      try {
        const syncResult = await window.syncLocalToSupabase();
        if (syncResult && syncResult.total > 0) {
          const toastMsg = window.t
            ? window.t('toast_sync_offer', { count: syncResult.total })
            : `📤 ${syncResult.total} entrée${syncResult.total > 1 ? 's' : ''} locale${syncResult.total > 1 ? 's' : ''} à synchroniser. Synchroniser maintenant ?`;

          const syncOverlay = document.createElement('div');
          syncOverlay.className = 'modal-overlay';
          syncOverlay.innerHTML = `
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
          document.body.appendChild(syncOverlay);
        }
      } catch (syncError) {
        console.warn('Post-auth sync attempt failed (non-blocking):', syncError);
      }

      // Re-render current page
      const current = store.getState('currentPage');
      const routeMap = {
        today: renderTodayPage, journal: renderJournalPage,
        ideas: renderIdeasPage, reminders: renderRemindersPage,
        insights: renderInsightsPage, settings: renderSettingsPage,
        profile: renderProfilePage
      };
      if (routeMap[current]) routeMap[current]();
    }
  } catch (e) {
    setAuthError(e);
    submitBtn.disabled = false;
    submitBtn.textContent = mode === 'login' ? 'Se connecter' : mode === 'forgot' ? 'Envoyer le lien' : 'Créer mon compte';
  }
}

async function handleSignOut() {
  await signOut();
  showToast(window.t ? window.t('auth_signed_out') : 'Déconnecté', 'info');
  const current = store.getState('currentPage');
  const routeMap = {
    today: renderTodayPage, journal: renderJournalPage,
    ideas: renderIdeasPage, reminders: renderRemindersPage,
    insights: renderInsightsPage, settings: renderSettingsPage,
    profile: renderProfilePage
  };
  if (routeMap[current]) routeMap[current]();
}

/**
 * Save personal profile data into Supabase auth user_metadata
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
        avatar_color: profile.avatar_color || '',
        avatar_url: profile.avatar_url || '',
        full_name: profile.full_name || '',
        bio: profile.bio || ''
      }
    });
    if (error) throw error;
    if (profile.display_name) localStorage.setItem('dailyos_display_name', profile.display_name);
    if (profile.medication) localStorage.setItem('dailyos_medication', profile.medication);
    if (profile.avatar_url) localStorage.setItem('dailyos_avatar_url', profile.avatar_url);
    if (profile.full_name) localStorage.setItem('dailyos_full_name', profile.full_name);
    if (profile.bio) localStorage.setItem('dailyos_bio', profile.bio);
    return { data, error: null };
  } catch (e) {
    console.warn('updateSupabaseProfile failed:', e.message);
    if (profile.display_name) localStorage.setItem('dailyos_display_name', profile.display_name);
    if (profile.medication) localStorage.setItem('dailyos_medication', profile.medication);
    if (profile.avatar_url) localStorage.setItem('dailyos_avatar_url', profile.avatar_url);
    if (profile.full_name) localStorage.setItem('dailyos_full_name', profile.full_name);
    if (profile.bio) localStorage.setItem('dailyos_bio', profile.bio);
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
