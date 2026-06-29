// auth-guard.js
// Guard factory functions for protecting router routes.
// Guards return true (allow navigation) or false (deny + redirect).
import authService from './services/auth-service.js';
import router from './router.js';

/**
 * Get the current route path (without leading #).
 * @returns {string}
 */
function getCurrentRoute() {
  return router.getCurrentRoute();
}

/**
 * Guard: require the user to be logged in.
 * If not logged in, redirects to /login with the current path as returnUrl.
 * @param {string} _path - The route being guarded (provided by router)
 * @returns {boolean} true to allow, false to deny
 */
export function requireAuth(_path) {
  if (authService.isLoggedIn()) {
    return true;
  }
  const returnUrl = encodeURIComponent(getCurrentRoute());
  router.navigate(`/login?returnUrl=${returnUrl}`);
  return false;
}

/**
 * Guard factory: require a specific role.
 * Returns a guard function that first checks auth, then checks role.
 * On failure: logged out users go to /login, wrong role goes to /tasks.
 * @param {string} role - Required role (e.g. 'instructor')
 * @returns {Function} Guard function compatible with router.protect()
 */
export function requireRole(role) {
  return function roleGuard(_path) {
    if (!authService.isLoggedIn()) {
      const returnUrl = encodeURIComponent(_path);
      router.navigate(`/login?returnUrl=${returnUrl}`);
      return false;
    }
    const user = authService.getCurrentUser();
    if (user.role !== role) {
      console.warn(
        `[requireRole] Access denied: '${user.role}' cannot access '${_path}' (requires '${role}')`
      );
      router.navigate('/tasks');
      return false;
    }
    return true;
  };
}