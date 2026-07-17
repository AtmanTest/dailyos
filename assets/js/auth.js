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

async function signOut() {
  const supabase = await initSupabaseClient();
  await supabase.auth.signOut();
}

/* ===== Auth UI ===== */

function renderAuthModal(mode) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'auth-modal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:380px">
      <div class="modal-header">
        <div class="modal-title">${mode === 'login' ? '🔑 Connexion' : '📝 Inscription'}</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <form id="auth-form" onsubmit="handleAuth(event)">
          <input type="hidden" name="mode" value="${mode}">
          <div class="form-group">
            <label class="form-label" for="auth-email">Email</label>
            <input class="form-input" type="email" id="auth-email" name="email" required
              placeholder="vous@email.com" autocomplete="email">
          </div>
          <div class="form-group">
            <label class="form-label" for="auth-password">Mot de passe</label>
            <input class="form-input" type="password" id="auth-password" name="password" required minlength="6"
              placeholder="6 caractères minimum" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}">
          </div>
          <div id="auth-error" style="color:var(--color-error);font-size:var(--font-size-sm);margin-bottom:var(--space-2);display:none"></div>
          <button type="submit" class="btn btn-primary" style="width:100%;padding:var(--space-3)">
            ${mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
        <div class="text-sm text-center mt-3" style="color:var(--color-text-muted)">
          ${mode === 'login'
            ? `Pas encore de compte ? <a href="#" onclick="switchAuthMode('signup')" style="color:var(--color-accent)">S'inscrire</a>`
            : `Déjà un compte ? <a href="#" onclick="switchAuthMode('login')" style="color:var(--color-accent)">Se connecter</a>`
          }
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('auth-email')?.focus();
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
