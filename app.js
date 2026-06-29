// app.js - Main application controller
import storage from './utils/storage.js';
import { createTask, updateTask, deleteTask, filterTasks, getStats } from './services/task-service.js';
import { renderTaskItem } from './components/task-item.js';
import { searchBooks } from './services/book-search-service.js';
import { renderSearchResults } from './components/search-results.js';

// ============ TASK STATE ============
let tasks = [];
let currentFilter = 'all';

// DOM References - Tasks
const taskList = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const statsContainer = document.getElementById('stats');

// ============ SEARCH STATE ============
let searchState = {
  status: 'idle', // 'idle' | 'loading' | 'error' | 'success'
  results: [],
  error: null,
  query: '',
};

// DOM References - Search
const searchInput = document.querySelector('[data-testid="search-input"]');
const resultsContainer = document.querySelector('[data-testid="search-results"]');

// ============ TASK FUNCTIONS ============
function init() {
  const saved = storage.get();
  tasks = saved || [];
  render();
}

function render() {
  const filtered = filterTasks(tasks, currentFilter);
  renderTaskList(filtered);
  renderStats();
  saveToStorage();
}

function renderTaskList(filteredTasks) {
  if (filteredTasks.length === 0) {
    taskList.innerHTML = '<li class="empty-state">No tasks found</li>';
    return;
  }
  taskList.innerHTML = filteredTasks.map(renderTaskItem).join('');
}

function renderStats() {
  const stats = getStats(tasks);
  statsContainer.innerHTML = `
    <span>Total: ${stats.total}</span>
    <span>Active: ${stats.active}</span>
    <span>Completed: ${stats.completed}</span>
    <span>🔴 High: ${stats.byPriority.high}</span>
    <span>🟡 Medium: ${stats.byPriority.medium}</span>
    <span>🟢 Low: ${stats.byPriority.low}</span>
  `;
}

function saveToStorage() {
  storage.set(tasks);
}

// ============ TASK EVENT HANDLERS ============
function handleAddTask(e) {
  e.preventDefault();
  const text = taskInput.value.trim();
  const priority = prioritySelect.value;

  if (!text) return;

  const newTask = createTask(text, priority);
  tasks = [...tasks, newTask];
  taskInput.value = '';
  render();
}

function handleTaskAction(e) {
  const target = e.target;
  const taskItem = target.closest('[data-id]');
  if (!taskItem) return;

  const id = taskItem.dataset.id;

  if (target.classList.contains('task-item__delete')) {
    tasks = deleteTask(tasks, id);
    render();
    return;
  }

  if (target.classList.contains('task-item__checkbox')) {
    const completed = target.checked;
    tasks = updateTask(tasks, id, { completed });
    render();
  }
}

// ============ SEARCH FUNCTIONS ============
function updateSearchState(partial) {
  searchState = { ...searchState, ...partial };
  if (resultsContainer) {
    resultsContainer.innerHTML = renderSearchResults(searchState);
    attachRetryListener();
  }
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
  if (!resultsContainer) return;
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

// ============ SEARCH EVENT HANDLERS ============
function setupSearch() {
  if (!searchInput || !resultsContainer) {
    console.warn('[main] Search elements not found in DOM — skipping search init');
    return;
  }

  const debouncedSearch = debounce((e) => handleSearch(e.target.value), 400);
  searchInput.addEventListener('input', debouncedSearch);

  // Handle "Add as task" clicks via event delegation
  resultsContainer.addEventListener('click', (e) => {
    const importBtn = e.target.closest('[data-testid^="book-import-"]');
    if (!importBtn) return;
    const title = importBtn.getAttribute('data-book-title');
    if (title) {
      // Add the book as a task
      const newTask = createTask(`📖 Read: ${title}`, 'medium');
      tasks = [...tasks, newTask];
      render();
      
      // Clear search input and reset search state
      searchInput.value = '';
      updateSearchState({ status: 'idle', query: '', results: [] });
    }
  });

  // Render initial idle state
  resultsContainer.innerHTML = renderSearchResults(searchState);
}

// ============ EVENT LISTENERS ============
taskForm.addEventListener('submit', handleAddTask);
taskList.addEventListener('click', handleTaskAction);

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    render();
  });
});

// ============ START APP ============
document.addEventListener('DOMContentLoaded', () => {
  init();
  setupSearch();
});