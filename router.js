// router.js
// Minimal hash-based router for single-page applications.
// Routes map path strings (e.g. '/tasks') to handler functions.
// Guards can intercept navigation and redirect or block.

class Router {
  constructor() {
    /** @type {Map<string, Function>} */
    this.routes = new Map();
    /** @type {Map<string, Function[]>} */
    this.guards = new Map();
  }

  /**
   * Register a route handler.
   * @param {string} path - Route path, e.g. '/tasks'
   * @param {Function} handler - Called with the route path when active
   */
  addRoute(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  /**
   * Add a guard function to a route.
   * @param {string} path - Route path to protect
   * @param {Function} guardFn - Returns true to allow, false to block
   */
  protect(path, guardFn) {
    if (!this.guards.has(path)) {
      this.guards.set(path, []);
    }
    this.guards.get(path).push(guardFn);
    return this;
  }

  /**
   * Navigate to a path by updating window.location.hash.
   * @param {string} path - e.g. '/login?returnUrl=/admin'
   */
  navigate(path) {
    window.location.hash = path;
  }

  /**
   * Get the current route path from the URL hash.
   * Strips the leading # and /, returns '/tasks' as default.
   * @returns {string}
   */
  getCurrentRoute() {
    const hash = window.location.hash;
    if (!hash || hash === '#') return '/tasks';
    return hash.slice(1);
  }

  /**
   * Start listening for hash changes and dispatch the current route.
   */
  init() {
    window.addEventListener('popstate', () => this._dispatch());
    window.addEventListener('hashchange', () => this._dispatch());
    // Dispatch the initial route immediately
    this._dispatch();
  }

  /**
   * Internal: run guards and then call the route handler.
   * @private
   */
  _dispatch() {
    const fullRoute = this.getCurrentRoute();
    // Separate path from query string: '/login?returnUrl=/tasks' -> '/login'
    const [path] = fullRoute.split('?');

    const routeGuards = this.guards.get(path) ?? [];
    for (const guard of routeGuards) {
      const allowed = guard(path);
      if (!allowed) {
        return; // Guard blocked navigation
      }
    }

    const handler = this.routes.get(path);
    if (handler) {
      handler(path);
    } else {
      this._render404(path);
    }
  }

  /**
   * Render a 404 state for unknown routes.
   * @private
   */
  _render404(path) {
    const main = document.querySelector('[data-testid="main-content"]');
    if (main) {
      main.innerHTML = `
        <div class="error-page" data-testid="not-found">
          <h1>Page not found</h1>
          <p>No route registered for "${path}".</p>
          <a href="#/tasks">Go to tasks</a>
        </div>
      `;
    }
  }
}

export default new Router();