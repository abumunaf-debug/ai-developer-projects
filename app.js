// app.js - Main application controller with Auth & Routing
import storage from './utils/storage.js';
import {
  createTask,
  updateTask,
  deleteTask,
  filterTasks,
  getStats,
} from './services/task-service.js';
import { renderTaskItem } from './components/task-item.js';
import { searchBooks } from './services/book-search-service.js';
import { renderSearchResults } from './components/search-results.js';
import authService from './services/auth-service.js';
import router from './router.js';
import { renderNav } from './components/nav.js';
import { requireAuth, requireRole } from './auth-guard.js';

// ============ DOM REFS ============
const navContainer = document.getElementById('nav-container');
const mainContent = document.querySelector('[data-testid="main-content"]');

// ============ TASK STATE ============
let tasks = [];
let currentFilter = 'all';

// ============ SEARCH STATE ============
let searchState = {
  status: 'idle',
  results: [],
  error: null,
  query: '',
};

// ============ VIEW HANDLERS ============

function renderTasksView() {
  const filtered = filterTasks(tasks, currentFilter);
  const taskListHtml = filtered.length === 0
    ? '<li class="empty-state">No tasks found</li>'
    : filtered.map(renderTaskItem).join('');

  const stats = getStats(tasks);

  mainContent.innerHTML = `
    <div id="task-app">
      <div id="stats" class="stats">
        <span>Total: ${stats.total}</span>
        <span>Active: ${stats.active}</span>
        <span>Completed: ${stats.completed}</span>
        <span>🔴 High: ${stats.byPriority.high}</span>
        <span>🟡 Medium: ${stats.byPriority.medium}</span>
        <span>🟢 Low: ${stats.byPriority.low}</span>
      </div>

      <div class="filters">
        <button class="filter-btn" data-filter="all">All</button>
        <button class="filter-btn" data-filter="active">Active</button>
        <button class="filter-btn" data-filter="completed">Completed</button>
      </div>

      <form id="task-form">
        <input type="text" id="task-input" placeholder="Enter task..." required>
        <select id="priority-select">
          <option value="low">Low</option>
          <option value="medium" selected>Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit">Add Task</button>
      </form>

      <ul id="task-list">${taskListHtml}</ul>
    </div>
  `;

  // Re-bind task events
  const taskForm = document.getElementById('task-form');
  const taskList = document.getElementById('task-list');
  const taskInput = document.getElementById('task-input');
  const prioritySelect = document.getElementById('priority-select');

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;
    if (!text) return;
    const newTask = createTask(text, priority);
    tasks = [...tasks, newTask];
    taskInput.value = '';
    renderTasksView();
    saveToStorage();
  });

  taskList.addEventListener('click', (e) => {
    const target = e.target;
    const taskItem = target.closest('[data-id]');
    if (!taskItem) return;
    const id = taskItem.dataset.id;

    if (target.classList.contains('task-item__delete')) {
      tasks = deleteTask(tasks, id);
      renderTasksView();
      saveToStorage();
      return;
    }

    if (target.classList.contains('task-item__checkbox')) {
      const completed = target.checked;
      tasks = updateTask(tasks, id, { completed });
      renderTasksView();
      saveToStorage();
    }
  });

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      renderTasksView();
    });
  });
}

function renderSearchView() {
  mainContent.innerHTML = `
    <div id="search-app">
      <h2>🔍 Search Books</h2>
      <div class="search-bar">
        <input
          type="text"
          data-testid="search-input"
          placeholder="Search for a book by title or author..."
          aria-label="Search for books"
        />
        <span class="search-hint">Type at least 2 characters</span>
      </div>
      <div data-testid="search-results" class="search-results"></div>
    </div>
  `;

  // Re-bind search events
  const searchInput = document.querySelector('[data-testid="search-input"]');
  const resultsContainer = document.querySelector('[data-testid="search-results"]');

  function updateSearchState(partial) {
    searchState = { ...searchState, ...partial };
    resultsContainer.innerHTML = renderSearchResults(searchState);
    attachRetryListener();
  }

  async function handleSearch(query) {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      updateSearchState({ status: 'idle', query: trimmed });
      return;
    }

    updateSearchState({ status: 'loading', query: trimmed });

    try {
      const results = await searchBooks(trimmed, 10);
      updateSearchState({ status: 'success', results, error: null });
    } catch (err) {
      console.error('[main] Book search failed:', err);
      updateSearchState({ status: 'error', error: err, results: [] });
    }
  }

  function attachRetryListener() {
    const retryBtn = resultsContainer.querySelector('[data-testid="search-retry-btn"]');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        handleSearch(searchState.query);
      });
    }
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const debouncedSearch = debounce((e) => handleSearch(e.target.value), 400);
  searchInput.addEventListener('input', debouncedSearch);

  resultsContainer.addEventListener('click', (e) => {
    const importBtn = e.target.closest('[data-testid^="book-import-"]');
    if (!importBtn) return;
    const title = importBtn.getAttribute('data-book-title');
    if (title) {
      const newTask = createTask(`📖 Read: ${title}`, 'medium');
      tasks = [...tasks, newTask];
      saveToStorage();
      searchInput.value = '';
      updateSearchState({ status: 'idle', query: '', results: [] });
    }
  });

  // Initial idle state
  resultsContainer.innerHTML = renderSearchResults(searchState);
}

function renderLoginView() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const returnUrl = params.get('returnUrl') || '/tasks';

  mainContent.innerHTML = `
    <div class="login-page" data-testid="login-page">
      <h1>Login</h1>
      <form data-testid="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" data-testid="username-input" placeholder="Enter username" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" data-testid="password-input" placeholder="Enter password" required />
        </div>
        <div data-testid="login-error" class="login-error hidden"></div>
        <button type="submit" class="btn btn--primary" data-testid="login-submit">Sign In</button>
        <div class="login-hint">
          <p><strong>Demo credentials:</strong></p>
          <p>Student: student / student123</p>
          <p>Instructor: instructor / teach456</p>
        </div>
      </form>
    </div>
  `;

  const form = document.querySelector('[data-testid="login-form"]');
  const errorEl = document.querySelector('[data-testid="login-error"]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    errorEl.classList.add('hidden');
    errorEl.textContent = '';

    const result = authService.login(username, password);

    if (!result.success) {
      errorEl.textContent = result.error;
      errorEl.classList.remove('hidden');
      return;
    }

    // Redirect to returnUrl or tasks
    router.navigate(returnUrl);
  });
}

function renderProfileView() {
  const user = authService.getCurrentUser();
  mainContent.innerHTML = `
    <div class="profile-page" data-testid="profile-page">
      <h1>Profile</h1>
      <div class="profile-card">
        <p><strong>Name:</strong> ${user.name}</p>
        <p><strong>Username:</strong> ${user.username}</p>
        <p><strong>Role:</strong> ${user.role}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
      </div>
    </div>
  `;
}

function renderAdminView() {
  const user = authService.getCurrentUser();
  mainContent.innerHTML = `
    <div class="admin-page" data-testid="admin-page">
      <h1>Admin Panel</h1>
      <div class="admin-card">
        <p>Welcome to the admin panel, ${user.name}!</p>
        <p>This area is only visible to instructors.</p>
        <hr />
        <h3>System Information</h3>
        <ul>
          <li><strong>User Count:</strong> 2 (student, instructor)</li>
          <li><strong>Session Storage:</strong> ${sessionStorage.getItem('session') ? 'Active' : 'None'}</li>
          <li><strong>Role:</strong> ${user.role}</li>
        </ul>
      </div>
    </div>
  `;
}

// ============ SAVE TO STORAGE ============
function saveToStorage() {
  storage.set(tasks);
}

// ============ ROUTE SETUP ============
function setupRoutes() {
  // Add public routes
  router.addRoute('/login', renderLoginView);

  // Add protected routes (require authentication)
  router
    .addRoute('/tasks', renderTasksView)
    .addRoute('/search', renderSearchView)
    .addRoute('/profile', renderProfileView)
    .addRoute('/admin', renderAdminView);

  // Apply guards
  router
    .protect('/tasks', requireAuth)
    .protect('/search', requireAuth)
    .protect('/profile', requireAuth)
    .protect('/admin', requireRole('instructor'));
}

// ============ NAVIGATION ============
function renderNavBar() {
  const currentRoute = router.getCurrentRoute();
  navContainer.innerHTML = renderNav(currentRoute);

  // Logout button listener
  const logoutBtn = document.querySelector('[data-testid="nav-logout-btn"]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      authService.logout();
      // Clear tasks from memory
      tasks = [];
      router.navigate('/login');
    });
  }
}

// Listen for route changes to update nav
window.addEventListener('hashchange', renderNavBar);

// ============ INIT ============
function init() {
  // Load tasks
  const saved = storage.get();
  tasks = saved || [];

  // Setup routes
  setupRoutes();

  // Initial nav render
  renderNavBar();

  // Start router
  router.init();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);