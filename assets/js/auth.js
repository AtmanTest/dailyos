/* ===== DailyOS Supabase Auth v2 ===== */

async function initSupabaseClient() {
  if (window._supabase) return window._supabase;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(
    APP_CONFIG.SUPABASE_CONFIG.url,
    APP_CONFIG.SUPABASE_CONFIG.anonKey
  );
  window._supabase = supabase;

  // Listen to auth state changes → refresh header automatically
  supabase.auth.onAuthStateChange((_event, session) => {
    store.setState({ user: session?.user || null });
    if (typeof refreshHeader === 'function') refreshHeader();
  });

  return supabase;
}

// =============================================================================
// SESSION
// =============================================================================

async function getSession() {
  try {
    const supabase = await initSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) return { user: null, error };
    return { user: data.session?.user || null, error: null };
  } catch { return { user: null, error: null }; }
}

// =============================================================================
// AUTH METHODS
// =============================================================================

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

/** Google OAuth — redirects back to the app after auth */
async function signInWithGoogle() {
  try {
    const supabase = await initSupabaseClient();
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (error) throw error;
  } catch (e) {
    showToast('Erreur Google : ' + (e.message || 'inconnue'), 'error');
  }
}

/** Send a password reset email */
async function sendPasswordReset(email) {
  try {
    const supabase = await initSupabaseClient();
    const redirectTo = window.location.origin + window.location.pathname + '#/reset-password';
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return { error: null };
  } catch (e) {
    return { error: e };
  }
}

async function signOut() {
  const supabase = await initSupabaseClient();
  await supabase.auth.signOut();
  store.setState({ user: null });
}

// =============================================================================
// AUTH MODAL  (modes: 'login' | 'signup' | 'forgot')
// =============================================================================

function renderAuthModal(mode = 'login') {
  const existing = document.getElementById('auth-modal');
  if (existing) existing.remove();

  const titles   = { login: '\uD83D\uDD11 Connexion', signup: '\uD83D\uDCDD Inscription', forgot: '\uD83D\uDD12 Mot de passe oubli\u00e9' };
  const btnTexts = { login: 'Se connecter', signup: 'Cr\u00e9er mon compte', forgot: 'Envoyer le lien' };

  const forgotLink = mode === 'login'
    ? `<div class="text-right mt-1"><a href="#" onclick="renderAuthModal('forgot');return false" style="font-size:var(--font-size-xs);color:var(--color-text-muted)">Mot de passe oubli\u00e9 ?</a></div>`
    : '';

  const switchLink = mode === 'login'
    ? `Pas de compte ? <a href="#" onclick="renderAuthModal('signup');return false" style="color:var(--color-accent)">S'inscrire</a>`
    : mode === 'signup'
    ? `D\u00e9j\u00e0 un compte ? <a href="#" onclick="renderAuthModal('login');return false" style="color:var(--color-accent)">Se connecter</a>`
    : `<a href="#" onclick="renderAuthModal('login');return false" style="color:var(--color-accent)">&larr; Retour</a>`;

  const passwordField = mode !== 'forgot' ? `
    <div class="form-group">
      <label class="form-label" for="auth-password">Mot de passe</label>
      <input class="form-input" type="password" id="auth-password" name="password"
        ${mode === 'login' ? 'required' : 'required minlength="6"'}
        placeholder="${mode === 'signup' ? '6 caract\u00e8res minimum' : '••••••••'}"
        autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}">
    </div>
    ${forgotLink}
  ` : '';

  const googleBtn = mode !== 'forgot' ? `
    <div style="display:flex;align-items:center;gap:var(--space-2);margin:var(--space-3) 0">
      <div style="flex:1;height:1px;background:var(--color-border)"></div>
      <span style="font-size:var(--font-size-xs);color:var(--color-text-muted)">ou</span>
      <div style="flex:1;height:1px;background:var(--color-border)"></div>
    </div>
    <button type="button" onclick="signInWithGoogle()" class="btn"
      style="width:100%;padding:var(--space-2) var(--space-3);display:flex;align-items:center;justify-content:center;gap:var(--space-2);background:var(--color-surface);border:1px solid var(--color-border);color:var(--color-text);border-radius:var(--radius-md);cursor:pointer">
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continuer avec Google
    </button>
  ` : '';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'auth-modal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:400px">
      <div class="modal-header">
        <div class="modal-title">${titles[mode]}</div>
        <button class="modal-close" onclick="document.getElementById('auth-modal').remove()" aria-label="Fermer">&times;</button>
      </div>
      <div class="modal-body">
        <form id="auth-form" onsubmit="handleAuth(event)" novalidate>
          <input type="hidden" name="mode" value="${mode}">
          <div class="form-group">
            <label class="form-label" for="auth-email">Email</label>
            <input class="form-input" type="email" id="auth-email" name="email" required
              placeholder="vous@email.com" autocomplete="email">
          </div>
          ${passwordField}
          <div id="auth-error" style="color:var(--color-error);font-size:var(--font-size-sm);margin-bottom:var(--space-2);display:none"></div>
          <div id="auth-success" style="color:var(--color-success);font-size:var(--font-size-sm);margin-bottom:var(--space-2);display:none"></div>
          <button type="submit" id="auth-submit" class="btn btn-primary" style="width:100%;padding:var(--space-3)">
            ${btnTexts[mode]}
          </button>
        </form>
        ${googleBtn}
        <div class="text-sm text-center mt-3" style="color:var(--color-text-muted)">${switchLink}</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  // Close on overlay click
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('auth-email')?.focus();
}

// =============================================================================
// HANDLE SUBMIT
// =============================================================================

async function handleAuth(event) {
  event.preventDefault();
  const form    = event.target;
  const mode    = form.mode.value;
  const email   = form.email.value.trim();
  const errorEl = document.getElementById('auth-error');
  const successEl = document.getElementById('auth-success');
  const submitBtn = document.getElementById('auth-submit');

  errorEl.style.display = 'none';
  successEl.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = '...';

  // --- Forgot password ---
  if (mode === 'forgot') {
    const { error } = await sendPasswordReset(email);
    if (error) {
      errorEl.textContent = error.message || 'Erreur inconnue';
      errorEl.style.display = 'block';
    } else {
      successEl.textContent = '\u2705 Email envoy\u00e9 ! V\u00e9rifie ta bo\u00eete de r\u00e9ception.';
      successEl.style.display = 'block';
      form.reset();
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Envoyer le lien';
    return;
  }

  // --- Login / Signup ---
  const password = form.password?.value;
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
    submitBtn.textContent = mode === 'login' ? 'Se connecter' : 'Cr\u00e9er mon compte';
    return;
  }

  // Success
  document.getElementById('auth-modal')?.remove();

  if (result.user) {
    store.setState({ user: result.user, demoMode: false });
    const name = result.user.user_metadata?.username || result.user.email?.split('@')[0] || 'toi';
    showToast('\u2705 Bienvenue ' + name + ' !', 'success');
    if (typeof refreshHeader === 'function') refreshHeader();

    // Offer sync if local entries exist
    try {
      const syncResult = await window.syncLocalToSupabase();
      if (syncResult && syncResult.total > 0) {
        _showSyncOffer(syncResult.total);
      }
    } catch (e) { console.warn('Post-auth sync (non-blocking):', e); }

    // Re-render current page
    _rerenderCurrentPage();
  } else if (mode === 'signup') {
    // Email confirmation required
    successEl.textContent = '\uD83D\uDCE7 V\u00e9rifie tes emails pour confirmer ton compte.';
    // re-append message since modal was removed
    showToast('\uD83D\uDCE7 Confirme ton email avant de te connecter', 'info');
  }
}

// =============================================================================
// SIGN OUT
// =============================================================================

async function handleSignOut() {
  await signOut();
  store.setState({ user: null, demoMode: true });
  showToast('D\u00e9connect\u00e9', 'info');
  if (typeof refreshHeader === 'function') refreshHeader();
  _rerenderCurrentPage();
}

// =============================================================================
// HELPERS (internal)
// =============================================================================

function _rerenderCurrentPage() {
  const current = store.getState('currentPage');
  const map = {
    today: renderTodayPage, journal: renderJournalPage,
    ideas: renderIdeasPage, reminders: renderRemindersPage,
    insights: renderInsightsPage, settings: renderSettingsPage
  };
  if (map[current]) map[current]();
}

function _showSyncOffer(count) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:340px">
      <div class="modal-header"><div class="modal-title">\uD83D\uDCE4 Synchronisation</div></div>
      <div class="modal-body">
        <p>${count} entr\u00e9e${count > 1 ? 's' : ''} locale${count > 1 ? 's' : ''} d\u00e9tect\u00e9e${count > 1 ? 's' : ''}. Synchroniser vers Supabase ?</p>
        <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3)">
          <button class="btn" style="flex:1" onclick="this.closest('.modal-overlay').remove()">Plus tard</button>
          <button class="btn btn-primary" style="flex:1" onclick="this.closest('.modal-overlay').remove();doSyncAfterAuth()">Oui \u2192</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function doSyncAfterAuth() {
  try {
    const r = await window.syncLocalToSupabase();
    if (r.errors > 0) {
      showToast(`Sync partiel : ${r.done}/${r.total} (${r.errors} erreur${r.errors > 1 ? 's' : ''})`, 'warning');
    } else {
      showToast(`\u2705 ${r.done} entr\u00e9e${r.done > 1 ? 's' : ''} synchronis\u00e9e${r.done > 1 ? 's' : ''}`, 'success');
    }
  } catch { showToast('Erreur de synchronisation', 'error'); }
}

function switchAuthMode(mode) {
  renderAuthModal(mode);
}
