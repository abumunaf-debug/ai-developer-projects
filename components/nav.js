// components/nav.js
// Renders the top navigation bar based on auth state and current route.
import authService from '../services/auth-service.js';

const NAV_LINKS = {
  student: [
    { path: '/tasks', label: 'Tasks', testid: 'nav-tasks' },
    { path: '/search', label: 'Search', testid: 'nav-search' },
    { path: '/profile', label: 'Profile', testid: 'nav-profile' },
  ],
  instructor: [
    { path: '/tasks', label: 'Tasks', testid: 'nav-tasks' },
    { path: '/search', label: 'Search', testid: 'nav-search' },
    { path: '/profile', label: 'Profile', testid: 'nav-profile' },
    { path: '/admin', label: 'Admin', testid: 'nav-admin' },
  ],
};

/**
 * Render the navigation bar as an HTML string.
 * @param {string} currentRoute - Active route path e.g. '/tasks'
 * @returns {string} Nav HTML markup
 */
export function renderNav(currentRoute) {
  const user = authService.getCurrentUser();

  if (!user) {
    return `
      <nav class="nav" aria-label="Main navigation" data-testid="main-nav">
        <a class="nav_brand" href="#/tasks">TaskApp</a>
        <ul class="nav_links">
          <li>
            <a href="#/login" class="nav_link" data-testid="nav-login">Login</a>
          </li>
        </ul>
      </nav>
    `.trim();
  }

  const links = NAV_LINKS[user.role] ?? NAV_LINKS.student;
  const linkItems = links.map(link => {
    const isActive = currentRoute === link.path;
    const activeClass = isActive ? ' nav_link--active' : '';
    const ariaCurrent = isActive ? ' aria-current="page"' : '';
    return `
      <li>
        <a
          href="#${link.path}"
          class="nav_link${activeClass}"
          data-testid="${link.testid}"${ariaCurrent}
        >
          ${link.label}
        </a>
      </li>
    `.trim();
  }).join('');

  return `
    <nav class="nav" aria-label="Main navigation" data-testid="main-nav">
      <a class="nav_brand" href="#/tasks">TaskApp</a>
      <ul class="nav_links">
        ${linkItems}
        <li>
          <span class="nav_user" data-testid="nav-username">${user.name}</span>
        </li>
        <li>
          <button
            class="nav_link nav_logout"
            data-testid="nav-logout-btn"
            type="button"
          >
            Logout
          </button>
        </li>
      </ul>
    </nav>
  `.trim();
}