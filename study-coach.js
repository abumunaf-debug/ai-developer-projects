// study-coach.js
export const COACH_STORAGE_KEY = 'ai-study-coach-plan-v1';

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function parseStudyPlan(raw) {
    if (!raw || typeof raw !== 'string' || raw.trim() === '') {
        throw new Error('Please paste a JSON study plan first.');
    }

    let data;
    try {
        data = JSON.parse(raw);
    } catch {
        throw new Error('Invalid JSON. Generate a new plan.');
    }

    if (typeof data !== 'object' || Array.isArray(data) || data === null) {
        throw new Error('Plan must be a JSON object.');
    }

    if (typeof data.planTitle !== 'string' || data.planTitle.trim() === '') {
        throw new Error('Missing planTitle.');
    }

    if (!Array.isArray(data.topics) || data.topics.length === 0) {
        throw new Error('Plan must have at least one topic.');
    }

    data.topics.forEach((topic, index) => {
        const pos = `Topic ${index + 1}`;
        if (typeof topic.id !== 'number') throw new Error(`${pos} missing id.`);
        if (typeof topic.title !== 'string' || topic.title.trim() === '') throw new Error(`${pos} missing title.`);
        if (typeof topic.durationHours !== 'number' || topic.durationHours <= 0) throw new Error(`${pos} must have positive durationHours.`);
        if (!Array.isArray(topic.objectives) || topic.objectives.length === 0) throw new Error(`${pos} must have at least one objective.`);
        if (!Array.isArray(topic.resources)) throw new Error(`${pos} must have a resources array.`);
        
        topic.resources.forEach((r, i) => {
            if (typeof r.title !== 'string' || r.title.trim() === '') throw new Error(`${pos} resource ${i+1} missing title.`);
            if (typeof r.url !== 'string' || r.url.trim() === '') throw new Error(`${pos} resource ${i+1} missing URL.`);
            try { new URL(r.url); } catch { throw new Error(`${pos} resource ${i+1} invalid URL.`); }
        });
    });

    return data;
}

export function renderStudyPlan(plan, containerEl) {
    if (!containerEl || !plan || !plan.topics) {
        containerEl.innerHTML = '<p class="error">Cannot render plan.</p>';
        return;
    }

    const topicsHtml = plan.topics.map(topic => {
        const objectivesHtml = (topic.objectives || []).map(obj => `<li>${escapeHtml(obj)}</li>`).join('');
        const resourcesHtml = (topic.resources || []).map(r => {
            const safeUrl = r.url && r.url.startsWith('http') ? escapeHtml(r.url) : '#';
            return `<li><a href="${safeUrl}" target="_blank">${escapeHtml(r.title)}</a></li>`;
        }).join('');
        const practiceHtml = topic.practicePrompt ? `<p class="practice-prompt"><strong>Practice:</strong> ${escapeHtml(topic.practicePrompt)}</p>` : '';

        return `
            <article class="topic-card">
                <header class="topic-header">
                    <span class="topic-id">Topic ${escapeHtml(String(topic.id))}</span>
                    <h3>${escapeHtml(topic.title)}</h3>
                    <span class="duration">${topic.durationHours}h</span>
                </header>
                <section><h4>Objectives</h4><ul>${objectivesHtml}</ul></section>
                ${resourcesHtml ? `<section><h4>Resources</h4><ul>${resourcesHtml}</ul></section>` : ''}
                ${practiceHtml}
            </article>
        `;
    }).join('');

    containerEl.innerHTML = `
        <div class="plan-header">
            <h2>${escapeHtml(plan.planTitle)}</h2>
            <p>${plan.topics.length} topics · ${plan.totalDays || plan.topics.length} days</p>
        </div>
        <div class="topics-grid">${topicsHtml}</div>
    `;
}

export function saveStudyPlan(plan) {
    localStorage.setItem(COACH_STORAGE_KEY, JSON.stringify(plan));
}