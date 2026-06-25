// ===== IMPORTS =====
import { parseStudyPlan, renderStudyPlan, saveStudyPlan, COACH_STORAGE_KEY } from './study-coach.js';

// ==========================================
// TASK MANAGER (Existing code - kept the same)
// ==========================================
const STORAGE_KEY = 'tasks-v1';
let tasks = [];
let currentFilter = 'all';

const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const count = document.getElementById('task-count');
const errorEl = document.getElementById('form-error');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearBtn = document.getElementById('clear-completed');

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function loadTasks() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) tasks = parsed;
        }
    } catch { tasks = []; }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function addTask(title) {
    const trimmed = title.trim();
    if (!trimmed) throw new Error('Task title cannot be blank');
    if (trimmed.length > 200) throw new Error('Title must be 200 characters or less');
    const task = { id: Date.now(), title: trimmed, completed: false, createdAt: new Date().toISOString() };
    tasks.push(task);
    saveTasks();
    render();
    return tasks;
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) { task.completed = !task.completed; saveTasks(); render(); }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
}

function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    render();
}

function getFilteredTasks() {
    if (currentFilter === 'active') return tasks.filter(t => !t.completed);
    if (currentFilter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
}

function render() {
    const filtered = getFilteredTasks();
    if (filtered.length === 0) {
        list.innerHTML = `<li style="color:#6b7280; justify-content:center; border:none; background:transparent;">No ${currentFilter !== 'all' ? currentFilter : ''} tasks</li>`;
    } else {
        list.innerHTML = filtered.map(task => `
            <li data-id="${task.id}" class="${task.completed ? 'completed' : ''}">
                <input type="checkbox" ${task.completed ? 'checked' : ''} class="task-checkbox" />
                <span class="task-text">${escapeHtml(task.title)}</span>
                <button class="delete-btn" aria-label="Delete task">✕</button>
            </li>
        `).join('');
    }
    const stats = { total: tasks.length, active: tasks.filter(t => !t.completed).length };
    count.textContent = `${stats.active} active · ${stats.total} total`;
    filterBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === currentFilter));
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    try { addTask(input.value); input.value = ''; input.focus(); } 
    catch (err) { errorEl.textContent = err.message; }
});

list.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const id = Number(li.dataset.id);
    if (e.target.classList.contains('delete-btn')) { deleteTask(id); return; }
    if (e.target.classList.contains('task-checkbox')) { toggleTask(id); }
});

filterBtns.forEach(btn => btn.addEventListener('click', () => { currentFilter = btn.dataset.filter; render(); }));
clearBtn.addEventListener('click', clearCompleted);

loadTasks();
render();

// ==========================================
// ===== NEW: AI STUDY COACH =====
// ==========================================
const coachForm = document.getElementById('coach-form');
const planInput = document.getElementById('plan-input');
const parseBtn = document.getElementById('parse-btn');
const clearPlanBtn = document.getElementById('clear-plan');
const coachError = document.getElementById('coach-error');
const coachOutput = document.getElementById('coach-output');
const promptTemplateEl = document.getElementById('prompt-template');
const copyPromptBtn = document.getElementById('copy-prompt');

const PROMPT_TEMPLATE = `You are an expert software engineering tutor. Create a 5-topic study plan in JSON format:
{
  "planTitle": "string",
  "totalDays": 5,
  "generatedAt": "ISO date",
  "topics": [
    {
      "id": 1,
      "title": "string",
      "durationHours": 2,
      "objectives": ["objective 1", "objective 2"],
      "resources": [{"title": "resource name", "url": "https://..."}],
      "practicePrompt": "coding exercise"
    }
  ]
}`;

promptTemplateEl.textContent = PROMPT_TEMPLATE;

copyPromptBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(PROMPT_TEMPLATE);
        copyPromptBtn.textContent = '✅ Copied!';
        setTimeout(() => { copyPromptBtn.textContent = 'Copy prompt'; }, 2000);
    } catch { alert('Copy manually.'); }
});

coachForm.addEventListener('submit', (e) => {
    e.preventDefault();
    coachError.textContent = '';
    coachError.style.display = 'none';
    const raw = planInput.value;

    parseBtn.disabled = true;
    parseBtn.textContent = 'Parsing...';

    try {
        const plan = parseStudyPlan(raw);
        saveStudyPlan(plan);
        renderStudyPlan(plan, coachOutput);
    } catch (err) {
        coachError.textContent = err.message;
        coachError.style.display = 'block';
        coachOutput.innerHTML = '';
    } finally {
        parseBtn.disabled = false;
        parseBtn.textContent = 'Parse Plan';
    }
});

clearPlanBtn.addEventListener('click', () => {
    localStorage.removeItem(COACH_STORAGE_KEY);
    planInput.value = '';
    coachOutput.innerHTML = '';
    coachError.textContent = '';
});

try {
    const raw = localStorage.getItem(COACH_STORAGE_KEY);
    if (raw) {
        const plan = parseStudyPlan(raw);
        renderStudyPlan(plan, coachOutput);
        planInput.value = JSON.stringify(plan, null, 2);
    }
} catch { /* Silently skip */ }