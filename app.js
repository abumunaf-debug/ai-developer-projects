// app.js - Main application controller
import storage from './utils/storage.js';
import { createTask, updateTask, deleteTask, filterTasks, getStats } from './services/task-service.js';
import { renderTaskItem } from './components/task-item.js';
import { createElement, showElement, hideElement } from './utils/dom.js';

// State
let tasks = [];
let currentFilter = 'all';

// DOM References
const taskList = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const statsContainer = document.getElementById('stats');

// Initialize
function init() {
    // Load tasks from storage
    const saved = storage.get();
    tasks = saved || [];
    render();
}

// Render everything
function render() {
    const filtered = filterTasks(tasks, currentFilter);
    renderTaskList(filtered);
    renderStats();
    saveToStorage();
}

// Render task list
function renderTaskList(filteredTasks) {
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<li class="empty-state">No tasks found</li>';
        return;
    }
    taskList.innerHTML = filteredTasks.map(renderTaskItem).join('');
}

// Render stats
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

// Save to storage
function saveToStorage() {
    storage.set(tasks);
}

// Event Handlers
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
    
    // Handle delete
    if (target.classList.contains('task-item__delete')) {
        tasks = deleteTask(tasks, id);
        render();
        return;
    }
    
    // Handle toggle complete
    if (target.classList.contains('task-item__checkbox')) {
        const completed = target.checked;
        tasks = updateTask(tasks, id, { completed });
        render();
    }
}

// Event Listeners
taskForm.addEventListener('submit', handleAddTask);
taskList.addEventListener('click', handleTaskAction);

// Filter buttons (add to your HTML)
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        render();
    });
});

// Start the app
init();