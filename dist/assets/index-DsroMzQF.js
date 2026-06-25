(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function r(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(n){if(n.ep)return;n.ep=!0;const o=r(n);fetch(n.href,o)}})();const v="ai-study-coach-plan-v1";function c(t){return typeof t!="string"?"":t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function $(t){if(!t||typeof t!="string"||t.trim()==="")throw new Error("Please paste a JSON study plan first.");let e;try{e=JSON.parse(t)}catch{throw new Error("Invalid JSON. Generate a new plan.")}if(typeof e!="object"||Array.isArray(e)||e===null)throw new Error("Plan must be a JSON object.");if(typeof e.planTitle!="string"||e.planTitle.trim()==="")throw new Error("Missing planTitle.");if(!Array.isArray(e.topics)||e.topics.length===0)throw new Error("Plan must have at least one topic.");return e.topics.forEach((r,a)=>{const n=`Topic ${a+1}`;if(typeof r.id!="number")throw new Error(`${n} missing id.`);if(typeof r.title!="string"||r.title.trim()==="")throw new Error(`${n} missing title.`);if(typeof r.durationHours!="number"||r.durationHours<=0)throw new Error(`${n} must have positive durationHours.`);if(!Array.isArray(r.objectives)||r.objectives.length===0)throw new Error(`${n} must have at least one objective.`);if(!Array.isArray(r.resources))throw new Error(`${n} must have a resources array.`);r.resources.forEach((o,i)=>{if(typeof o.title!="string"||o.title.trim()==="")throw new Error(`${n} resource ${i+1} missing title.`);if(typeof o.url!="string"||o.url.trim()==="")throw new Error(`${n} resource ${i+1} missing URL.`);try{new URL(o.url)}catch{throw new Error(`${n} resource ${i+1} invalid URL.`)}})}),e}function T(t,e){if(!e||!t||!t.topics){e.innerHTML='<p class="error">Cannot render plan.</p>';return}const r=t.topics.map(a=>{const n=(a.objectives||[]).map(l=>`<li>${c(l)}</li>`).join(""),o=(a.resources||[]).map(l=>`<li><a href="${l.url&&l.url.startsWith("http")?c(l.url):"#"}" target="_blank">${c(l.title)}</a></li>`).join(""),i=a.practicePrompt?`<p class="practice-prompt"><strong>Practice:</strong> ${c(a.practicePrompt)}</p>`:"";return`
            <article class="topic-card">
                <header class="topic-header">
                    <span class="topic-id">Topic ${c(String(a.id))}</span>
                    <h3>${c(a.title)}</h3>
                    <span class="duration">${a.durationHours}h</span>
                </header>
                <section><h4>Objectives</h4><ul>${n}</ul></section>
                ${o?`<section><h4>Resources</h4><ul>${o}</ul></section>`:""}
                ${i}
            </article>
        `}).join("");e.innerHTML=`
        <div class="plan-header">
            <h2>${c(t.planTitle)}</h2>
            <p>${t.topics.length} topics · ${t.totalDays||t.topics.length} days</p>
        </div>
        <div class="topics-grid">${r}</div>
    `}function I(t){localStorage.setItem(v,JSON.stringify(t))}const k="tasks-v1";let s=[],u="all";const O=document.getElementById("task-form"),y=document.getElementById("task-input"),E=document.getElementById("task-list"),P=document.getElementById("task-count"),w=document.getElementById("form-error"),L=document.querySelectorAll(".filter-btn"),B=document.getElementById("clear-completed");function C(t){return typeof t!="string"?"":t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function x(){try{const t=localStorage.getItem(k);if(t){const e=JSON.parse(t);Array.isArray(e)&&(s=e)}}catch{s=[]}}function g(){localStorage.setItem(k,JSON.stringify(s))}function A(t){const e=t.trim();if(!e)throw new Error("Task title cannot be blank");if(e.length>200)throw new Error("Title must be 200 characters or less");const r={id:Date.now(),title:e,completed:!1,createdAt:new Date().toISOString()};return s.push(r),g(),d(),s}function H(t){const e=s.find(r=>r.id===t);e&&(e.completed=!e.completed,g(),d())}function j(t){s=s.filter(e=>e.id!==t),g(),d()}function N(){s=s.filter(t=>!t.completed),g(),d()}function M(){return u==="active"?s.filter(t=>!t.completed):u==="completed"?s.filter(t=>t.completed):s}function d(){const t=M();t.length===0?E.innerHTML=`<li style="color:#6b7280; justify-content:center; border:none; background:transparent;">No ${u!=="all"?u:""} tasks</li>`:E.innerHTML=t.map(r=>`
            <li data-id="${r.id}" class="${r.completed?"completed":""}">
                <input type="checkbox" ${r.completed?"checked":""} class="task-checkbox" />
                <span class="task-text">${C(r.title)}</span>
                <button class="delete-btn" aria-label="Delete task">✕</button>
            </li>
        `).join("");const e={total:s.length,active:s.filter(r=>!r.completed).length};P.textContent=`${e.active} active · ${e.total} total`,L.forEach(r=>r.classList.toggle("active",r.dataset.filter===u))}O.addEventListener("submit",t=>{t.preventDefault(),w.textContent="";try{A(y.value),y.value="",y.focus()}catch(e){w.textContent=e.message}});E.addEventListener("click",t=>{const e=t.target.closest("li");if(!e)return;const r=Number(e.dataset.id);if(t.target.classList.contains("delete-btn")){j(r);return}t.target.classList.contains("task-checkbox")&&H(r)});L.forEach(t=>t.addEventListener("click",()=>{u=t.dataset.filter,d()}));B.addEventListener("click",N);x();d();const J=document.getElementById("coach-form"),b=document.getElementById("plan-input"),m=document.getElementById("parse-btn"),D=document.getElementById("clear-plan"),p=document.getElementById("coach-error"),f=document.getElementById("coach-output"),R=document.getElementById("prompt-template"),h=document.getElementById("copy-prompt"),S=`You are an expert software engineering tutor. Create a 5-topic study plan in JSON format:
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
}`;R.textContent=S;h.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(S),h.textContent="✅ Copied!",setTimeout(()=>{h.textContent="Copy prompt"},2e3)}catch{alert("Copy manually.")}});J.addEventListener("submit",t=>{t.preventDefault(),p.textContent="",p.style.display="none";const e=b.value;m.disabled=!0,m.textContent="Parsing...";try{const r=$(e);I(r),T(r,f)}catch(r){p.textContent=r.message,p.style.display="block",f.innerHTML=""}finally{m.disabled=!1,m.textContent="Parse Plan"}});D.addEventListener("click",()=>{localStorage.removeItem(v),b.value="",f.innerHTML="",p.textContent=""});try{const t=localStorage.getItem(v);if(t){const e=$(t);T(e,f),b.value=JSON.stringify(e,null,2)}}catch{}
