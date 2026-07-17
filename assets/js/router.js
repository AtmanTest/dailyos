/* ===== DailyOS SPA Router ===== */
const router = {
  routes: {},
  currentHash: '',

  /**
   * Register a route
   * @param {string} hash - e.g. '#/today'
   * @param {Function} renderFn - Function that renders the page
   */
  register(hash, renderFn) {
    this.routes[hash] = renderFn;
  },

  /**
   * Navigate to a hash route
   * @param {string} hash
   */
  navigate(hash) {
    if (!hash.startsWith('#')) hash = '#' + hash;
    window.location.hash = hash;
  },

  /**
   * Handle hash change
   */
  handleRoute() {
    const hash = window.location.hash || '#/today';
    const route = hash.split('?')[0];
    this.currentHash = route;

    store.setState({ loading: true, error: null });

    const renderFn = this.routes[route];
    if (renderFn) {
      const pageId = route.replace('#/', '') || 'today';
      store.setState({ currentPage: pageId });
      renderFn();
    } else {
      this.render404();
    }
  },

  /**
   * Render 404 page
   */
  render404() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
        <div class="empty-state-text">Page introuvable</div>
        <div class="empty-state-sub">Cette page n'existe pas.</div>
        <a href="#/today" class="btn btn-primary mt-4">Retour à l'accueil</a>
      </div>
    `;
  },

  /**
   * Initialize the router
   */
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    if (!window.location.hash) {
      window.location.hash = '#/today';
    }
    this.handleRoute();
  }
};
