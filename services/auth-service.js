// services/auth-service.js
// Simulated client-side authentication.
// WARNING: This is a demonstration only - never store credentials or validate
// passwords in client-side JavaScript in a real application.

const SESSION_KEY = 'session';

const USERS = [
  {
    id: '1',
    username: 'student',
    password: btoa('student123'),
    role: 'student',
    name: 'Alex Student',
  },
  {
    id: '2',
    username: 'instructor',
    password: btoa('teach456'),
    role: 'instructor',
    name: 'Sam Instructor',
  },
];

const ROLE_PERMISSIONS = {
  student: ['view:tasks', 'view:search', 'view:profile'],
  instructor: ['view:tasks', 'view:search', 'view:profile', 'view:admin'],
};

class AuthService {
  /**
   * Attempt to log in with username and password.
   * Stores session in sessionStorage on success.
   * @param {string} username
   * @param {string} password - Plain text password from the form
   * @returns {{ success: true, user: Object } | { success: false, error: string }}
   */
  login(username, password) {
    const encoded = btoa(password);
    const user = USERS.find(
      u => u.username === username && u.password === encoded
    );
    if (!user) {
      return { success: false, error: 'Invalid username or password.' };
    }
    const session = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (err) {
      console.error('[AuthService] Could not write session', err);
      return { success: false, error: 'Session storage unavailable.' };
    }
    return { success: true, user: session };
  }

  /**
   * Clear the current session.
   */
  logout() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      console.error('[AuthService] Could not remove session', err);
    }
  }

  /**
   * Get the current logged-in user, or null.
   * @returns {Object|null}
   */
  getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Returns true if a user session exists.
   * @returns {boolean}
   */
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Check if the current user has a specific permission.
   * @param {string} permission
   * @returns {boolean}
   */
  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] ?? [];
    return perms.includes(permission);
  }

  /**
   * Throw an error if the current user's role doesn't match.
   * @param {string} role - Required role
   * @throws {Error} If user is not logged in or has wrong role
   */
  requireRole(role) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    if (user.role !== role) {
      throw new Error(`Role '${role}' required, got '${user.role}'`);
    }
  }
}

export default new AuthService();