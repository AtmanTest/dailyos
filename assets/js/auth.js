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
      showToast(`✅ Connecté en tant que ${name}`, 'success');
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
  showToast('Déconnecté', 'info');
  const current = store.getState('currentPage');
  const routeMap = {
    today: renderTodayPage, journal: renderJournalPage,
    ideas: renderIdeasPage, reminders: renderRemindersPage,
    insights: renderInsightsPage, settings: renderSettingsPage
  };
  if (routeMap[current]) routeMap[current]();
}
