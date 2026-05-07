// ========== STATE ==========
let previewMode = 'cv';

// ========== TAB SWITCHING ==========
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-form').forEach(tf => tf.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('panel-' + tab.dataset.tab);
    if (panel) panel.classList.add('active');
    const tf = document.querySelector(`.tab-form[data-tab="${tab.dataset.tab}"]`);
    if (tf) tf.classList.add('active');
  });
});

document.querySelectorAll('.tab-form').forEach(tf => {
  tf.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-form').forEach(t => t.classList.remove('active'));
    tf.classList.add('active');
    const panel = document.getElementById('panel-' + tf.dataset.tab);
    if (panel) panel.classList.add('active');
    const st = document.querySelector(`.tab[data-tab="${tf.dataset.tab}"]`);
    if (st) st.classList.add('active');
  });
});

// ========== SIDEBAR TOGGLE (mobile) ==========
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ========== PREVIEW SWITCHING ==========
function switchPreview(mode) {
  previewMode = mode;
  document.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.preview-frame').forEach(f => f.classList.remove('active'));
  document.querySelector(`.preview-tab[onclick*="${mode}"]`).classList.add('active');
  document.getElementById('preview-' + mode).classList.add('active');
}

function showScoreTab() {
  switchPreview('score');
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
}

// ========== LIVE PREVIEW ==========
document.addEventListener('input', () => updatePreview());
document.addEventListener('change', () => updatePreview());
let previewTimeout;
function scheduleUpdate() {
  clearTimeout(previewTimeout);
  previewTimeout = setTimeout(updatePreview, 100);
}

function updatePreview() {
  const name = document.getElementById('fullname').value || 'VOTRE NOM';
  const title = document.getElementById('title').value || 'Titre Professionnel';
  const email = document.getElementById('email').value || 'email@example.com';
  const phone = document.getElementById('phone').value || '+33 6 00 00 00 00';
  const address = document.getElementById('address').value || 'Ville, Pays';
  const linkedin = document.getElementById('linkedin').value || 'linkedin';
  const website = document.getElementById('website').value || 'siteweb.com';
  const summary = document.getElementById('summary').value || 'Votre résumé professionnel...';
  const showPhoto = document.getElementById('show-photo-cv').checked;

  document.getElementById('cv-name').textContent = name;
  document.getElementById('cv-title').textContent = title;
  document.getElementById('cv-email').textContent = email;
  document.getElementById('cv-phone').textContent = phone;
  document.getElementById('cv-address').textContent = address;
  document.getElementById('cv-linkedin').textContent = linkedin;
  document.getElementById('cv-website').textContent = website;
  document.getElementById('cv-summary').textContent = summary;

  document.getElementById('cv-photo').classList.toggle('show', showPhoto && document.getElementById('cv-photo').children.length > 0);

  renderExperience();
  renderEducation();
  renderProjects();
  renderSkills();
  renderLanguages();
  renderCertifications();
  updateScore();
  updateScoreSidebar();
}

// ========== PHOTO ==========
document.getElementById('photo').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const container = document.getElementById('cv-photo');
    container.innerHTML = `<img src="${ev.target.result}" alt="Photo">`;
    container.classList.add('show');
    if (!document.getElementById('show-photo-cv').checked) container.classList.remove('show');
  };
  reader.readAsDataURL(file);
});

// ========== SKILLS ==========
function addSkill() {
  const list = document.getElementById('skills-list');
  const div = document.createElement('div');
  div.className = 'skill-entry';
  div.innerHTML = `
    <input type="text" class="skill-name" placeholder="Compétence">
    <select class="skill-level">
      <option value="1">1 - Débutant</option>
      <option value="2">2 - Élémentaire</option>
      <option value="3" selected>3 - Intermédiaire</option>
      <option value="4">4 - Avancé</option>
      <option value="5">5 - Expert</option>
    </select>
    <button class="btn-remove small" onclick="removeEntry(this)">×</button>`;
  list.appendChild(div);
  bindInputs(div);
  updatePreview();
}

function renderSkills() {
  const container = document.getElementById('cv-skills');
  container.innerHTML = '';
  const items = [];
  document.querySelectorAll('#skills-list .skill-entry').forEach(entry => {
    const name = entry.querySelector('.skill-name').value.trim();
    const level = parseInt(entry.querySelector('.skill-level').value) || 0;
    if (name) items.push({ name, level });
  });
  if (items.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = '<div class="cv-skills-list">' + items.map(s =>
    `<span class="cv-skill-tag">${esc(s)}</span>`
  ).join('') + '</div>';
}

// ========== LANGUAGES ==========
function addLanguage() {
  const list = document.getElementById('languages-list');
  const div = document.createElement('div');
  div.className = 'skill-entry';
  div.innerHTML = `
    <input type="text" class="lang-name" placeholder="Langue">
    <select class="lang-level">
      <option value="Débutant">Débutant</option>
      <option value="Intermédiaire" selected>Intermédiaire</option>
      <option value="Courant">Courant</option>
      <option value="Natif">Natif</option>
    </select>
    <button class="btn-remove small" onclick="removeEntry(this)">×</button>`;
  list.appendChild(div);
  bindInputs(div);
  updatePreview();
}

function renderLanguages() {
  const container = document.getElementById('cv-languages');
  container.innerHTML = '';
  document.querySelectorAll('#languages-list .skill-entry').forEach(entry => {
    const name = entry.querySelector('.lang-name').value.trim();
    const lvl = entry.querySelector('.lang-level').value;
    if (name) container.innerHTML += `<div class="cv-lang-item"><strong>${esc(name)}</strong> <span class="lvl">${esc(lvl)}</span></div>`;
  });
}

// ========== EXPERIENCE ==========
function addExperience() {
  const list = document.getElementById('experience-list');
  const div = document.createElement('div');
  div.className = 'entry';
  div.innerHTML = `
    <div class="field"><label>Poste</label><input type="text" class="exp-title" placeholder="Développeur Senior"></div>
    <div class="field"><label>Entreprise</label><input type="text" class="exp-company" placeholder="Tech Corp"></div>
    <div class="field-row">
      <div class="field"><label>Début</label><input type="month" class="exp-start"></div>
      <div class="field"><label>Fin</label><input type="month" class="exp-end"><label class="toggle" style="margin-top:4px"><input type="checkbox" class="exp-current"><span class="toggle-slider"></span><span style="font-size:0.78rem;font-weight:500;color:var(--text-secondary)">Poste actuel</span></label></div>
    </div>
    <div class="field"><label>Description</label><textarea class="exp-desc" rows="3" placeholder="Décrivez vos responsabilités et réalisations..."></textarea></div>
    <button class="btn-remove" onclick="removeEntry(this)">Supprimer</button>`;
  list.appendChild(div);
  bindInputs(div);
  updatePreview();
}

function renderExperience() {
  const container = document.getElementById('cv-experience');
  container.innerHTML = '';
  document.querySelectorAll('#experience-list .entry').forEach(entry => {
    const title = entry.querySelector('.exp-title').value.trim();
    const company = entry.querySelector('.exp-company').value.trim();
    const start = entry.querySelector('.exp-start').value;
    const end = entry.querySelector('.exp-end').value;
    const current = entry.querySelector('.exp-current').checked;
    const desc = entry.querySelector('.exp-desc').value.trim();
    if (!title && !company) return;
    container.innerHTML += `
      <div class="cv-item">
        <div class="cv-item-header">
          <span class="cv-item-title">${esc(title) || 'Poste'}</span>
          <span class="cv-item-date">${fmtDate(start)} - ${current ? 'Présent' : fmtDate(end)}</span>
        </div>
        <div class="cv-item-sub">${esc(company) || 'Entreprise'}</div>
        ${desc ? `<div class="cv-item-desc">${esc(desc)}</div>` : ''}
      </div>`;
  });
}

// ========== EDUCATION ==========
function addEducation() {
  const list = document.getElementById('education-list');
  const div = document.createElement('div');
  div.className = 'entry';
  div.innerHTML = `
    <div class="field"><label>Diplôme</label><input type="text" class="edu-degree" placeholder="Master en Informatique"></div>
    <div class="field"><label>Établissement</label><input type="text" class="edu-school" placeholder="Université Paris-Saclay"></div>
    <div class="field-row">
      <div class="field"><label>Début</label><input type="month" class="edu-start"></div>
      <div class="field"><label>Fin</label><input type="month" class="edu-end"></div>
    </div>
    <div class="field"><label>Description</label><textarea class="edu-desc" rows="2" placeholder="Mentions, spécialités..."></textarea></div>
    <button class="btn-remove" onclick="removeEntry(this)">Supprimer</button>`;
  list.appendChild(div);
  bindInputs(div);
  updatePreview();
}

function renderEducation() {
  const container = document.getElementById('cv-education');
  container.innerHTML = '';
  document.querySelectorAll('#education-list .entry').forEach(entry => {
    const degree = entry.querySelector('.edu-degree').value.trim();
    const school = entry.querySelector('.edu-school').value.trim();
    const start = entry.querySelector('.edu-start').value;
    const end = entry.querySelector('.edu-end').value;
    const desc = entry.querySelector('.edu-desc').value.trim();
    if (!degree && !school) return;
    container.innerHTML += `
      <div class="cv-item">
        <div class="cv-item-header">
          <span class="cv-item-title">${esc(degree) || 'Diplôme'}</span>
          <span class="cv-item-date">${fmtDate(start)} - ${fmtDate(end)}</span>
        </div>
        <div class="cv-item-sub">${esc(school) || 'Établissement'}</div>
        ${desc ? `<div class="cv-item-desc">${esc(desc)}</div>` : ''}
      </div>`;
  });
}

// ========== PROJECTS ==========
function addProject() {
  const list = document.getElementById('projects-list');
  const div = document.createElement('div');
  div.className = 'entry';
  div.innerHTML = `
    <div class="field"><label>Nom du projet</label><input type="text" class="proj-name" placeholder="Application E-commerce"></div>
    <div class="field"><label>Technologies</label><input type="text" class="proj-tech" placeholder="React, Node.js, MongoDB"></div>
    <div class="field"><label>Lien (optionnel)</label><input type="url" class="proj-url" placeholder="github.com/jeandupont/projet"></div>
    <div class="field"><label>Description</label><textarea class="proj-desc" rows="2" placeholder="Description du projet et de vos contributions..."></textarea></div>
    <button class="btn-remove" onclick="removeEntry(this)">Supprimer</button>`;
  list.appendChild(div);
  bindInputs(div);
  updatePreview();
}

function renderProjects() {
  const container = document.getElementById('cv-projects');
  container.innerHTML = '';
  document.querySelectorAll('#projects-list .entry').forEach(entry => {
    const name = entry.querySelector('.proj-name').value.trim();
    const tech = entry.querySelector('.proj-tech').value.trim();
    const url = entry.querySelector('.proj-url').value.trim();
    const desc = entry.querySelector('.proj-desc').value.trim();
    if (!name) return;
    container.innerHTML += `
      <div class="cv-item">
        <div class="cv-item-header">
          <span class="cv-item-title">${esc(name)}</span>
          ${url ? `<a href="${esc(url)}" target="_blank" style="font-size:0.78rem;color:var(--primary-light);text-decoration:none">${esc(url)}</a>` : ''}
        </div>
        ${tech ? `<div class="cv-item-sub">${esc(tech)}</div>` : ''}
        ${desc ? `<div class="cv-item-desc">${esc(desc)}</div>` : ''}
      </div>`;
  });
}

// ========== CERTIFICATIONS ==========
function addCertification() {
  const list = document.getElementById('certifications-list');
  const div = document.createElement('div');
  div.className = 'entry';
  div.innerHTML = `
    <div class="field"><label>Certification</label><input type="text" class="cert-name" placeholder="AWS Certified Developer"></div>
    <div class="field"><label>Organisme</label><input type="text" class="cert-org" placeholder="Amazon Web Services"></div>
    <div class="field-row">
      <div class="field"><label>Date d'obtention</label><input type="month" class="cert-date"></div>
    </div>
    <button class="btn-remove" onclick="removeEntry(this)">Supprimer</button>`;
  list.appendChild(div);
  bindInputs(div);
  updatePreview();
}

function renderCertifications() {
  const container = document.getElementById('cv-certifications');
  container.innerHTML = '';
  document.querySelectorAll('#certifications-list .entry').forEach(entry => {
    const name = entry.querySelector('.cert-name').value.trim();
    const org = entry.querySelector('.cert-org').value.trim();
    const date = entry.querySelector('.cert-date').value;
    if (!name && !org) return;
    container.innerHTML += `
      <div class="cv-item">
        <div class="cv-item-header">
          <span class="cv-item-title">${esc(name) || 'Certification'}</span>
          ${date ? `<span class="cv-item-date">${fmtDate(date)}</span>` : ''}
        </div>
        ${org ? `<div class="cv-item-sub">${esc(org)}</div>` : ''}
      </div>`;
  });
}

// ========== REMOVE ENTRY ==========
function removeEntry(btn) {
  const entry = btn.closest('.entry, .skill-entry');
  if (entry) entry.remove();
  updatePreview();
}

// ========== BIND INPUTS ==========
function bindInputs(el) {
  el.querySelectorAll('input, select, textarea').forEach(inp => {
    inp.addEventListener('input', scheduleUpdate);
    inp.addEventListener('change', scheduleUpdate);
  });
}

// ========== HELPERS ==========
function fmtDate(val) {
  if (!val) return '';
  const [y, m] = val.split('-');
  const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
  return months[parseInt(m)-1] + ' ' + y;
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ========== TEMPLATE CUSTOMIZATION ==========
document.getElementById('primary-color').addEventListener('input', function() {
  document.querySelector(':root').style.setProperty('--primary', this.value);
  updateCVColors();
});

document.getElementById('accent-color').addEventListener('input', function() {
  document.querySelector(':root').style.setProperty('--primary-light', this.value);
  updateCVColors();
});

function updateCVColors() {
  const primary = document.getElementById('primary-color').value;
  const accent = document.getElementById('accent-color').value;
  document.querySelectorAll('.cv-header h1, .cv-body h2, .cv-skill-tag').forEach(el => el.style.color = primary);
  document.querySelectorAll('.cv-header, .cv-body h2').forEach(el => el.style.borderColor = primary);
  document.querySelectorAll('.cv-item-sub').forEach(el => el.style.color = accent);
}

document.getElementById('font-family').addEventListener('change', function() {
  document.getElementById('cv-content').style.fontFamily = this.value;
});

document.getElementById('cv-layout').addEventListener('change', function() {
  const cv = document.getElementById('cv-content');
  if (this.value === 'two') cv.classList.add('two-column');
  else cv.classList.remove('two-column');
});

document.getElementById('show-photo-cv').addEventListener('change', function() {
  const p = document.getElementById('cv-photo');
  p.classList.toggle('show', this.checked && p.children.length > 0);
});

// ========== CV SCORE ==========
function updateScore() {
  const cats = {
    personal: evalPersonal(),
    summary: evalSummary(),
    experience: evalExperience(),
    education: evalEducation(),
    skills: evalSkills(),
    languages: evalLanguages(),
    certifications: evalCertifications(),
    ats: evalATS()
  };

  // Weights: personal 10%, summary 15%, experience 25%, education 15%, skills 20%, languages 5%, certifications 5%, ats 5%
  const weights = { personal: 10, summary: 15, experience: 25, education: 15, skills: 20, languages: 5, certifications: 5, ats: 5 };
  let total = 0;
  for (const [k, v] of Object.entries(cats)) {
    total += v.pct * (weights[k] / 100);
  }

  const score = Math.round(total);
  const arc = document.getElementById('score-arc');
  const circum = 2 * Math.PI * 54;
  arc.setAttribute('stroke-dasharray', (score / 100 * circum) + ' ' + circum);

  document.getElementById('score-number').textContent = score;
  document.getElementById('score-badge').textContent = score;

  let grade, color;
  if (score >= 85) { grade = 'Excellent'; color = '#38a169'; }
  else if (score >= 70) { grade = 'Très bien'; color = '#3182ce'; }
  else if (score >= 50) { grade = 'Bien'; color = '#d69e2e'; }
  else if (score >= 30) { grade = 'À améliorer'; color = '#dd6b20'; }
  else { grade = 'Incomplet'; color = '#e53e3e'; }

  document.getElementById('score-grade').textContent = grade;
  document.getElementById('score-grade').style.color = color;
  arc.setAttribute('stroke', color);
  document.querySelector('.ring-fill').setAttribute('stroke', color);

  const tips = [];
  const totalPct = Math.round(total);

  if (totalPct >= 80) {
    document.getElementById('score-summary-text').textContent = 'Excellent CV ! Il est prêt à être envoyé.';
  } else if (totalPct >= 60) {
    document.getElementById('score-summary-text').textContent = 'Bon CV. Quelques améliorations peuvent encore être apportées.';
  } else {
    document.getElementById('score-summary-text').textContent = 'Votre CV a besoin de plus de contenu pour être efficace.';
  }

  for (const [k, v] of Object.entries(cats)) {
    const pctEl = document.getElementById('sc-' + k);
    const barEl = document.getElementById('sc-bar-' + k);
    const detailEl = document.getElementById('scd-' + k);
    if (pctEl) pctEl.textContent = Math.round(v.pct) + '%';
    if (barEl) barEl.style.width = v.pct + '%';
    if (detailEl) detailEl.textContent = v.msg;
    if (v.tips) tips.push(...v.tips);
  }

  const tipsList = document.getElementById('score-tips-list');
  tipsList.innerHTML = tips.map(t => `<li>${t}</li>`).join('');
  document.getElementById('score-tips').style.display = tips.length ? 'block' : 'none';
}

function updateScoreSidebar() {
  const score = document.getElementById('score-number').textContent;
  const arc = document.querySelector('.ring-fill');
  const circum = 2 * Math.PI * 15.9155;
  arc.setAttribute('stroke-dasharray', (parseInt(score) / 100 * circum) + ' ' + circum);
}

function evalPersonal() {
  const name = document.getElementById('fullname').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const addr = document.getElementById('address').value.trim();
  let score = 0, max = 4, tips = [];
  if (name) score++; else tips.push('Ajoutez votre nom complet');
  if (email && email.includes('@')) score++; else tips.push('Ajoutez un email valide');
  if (phone && phone.length >= 8) score++; else tips.push('Ajoutez votre numéro de téléphone');
  if (addr) score++; else tips.push('Ajoutez votre ville/pays');
  const pct = (score / max) * 100;
  return { pct, msg: `${score}/${max} champs remplis`, tips };
}

function evalSummary() {
  const s = document.getElementById('summary').value.trim();
  if (!s) return { pct: 0, msg: 'Résumé manquant', tips: ['Ajoutez un résumé professionnel de 2-3 phrases'] };
  if (s.length < 50) return { pct: 40, msg: 'Trop court (' + s.length + ' car.)', tips: ['Développez votre résumé (50+ caractères)'] };
  if (s.length < 100) return { pct: 70, msg: 'Résumé correct (' + s.length + ' car.)', tips: ['Ajoutez des mots-clés liés à votre domaine'] };
  return { pct: 100, msg: 'Résumé de qualité (' + s.length + ' car.)', tips: [] };
}

function evalExperience() {
  const entries = document.querySelectorAll('#experience-list .entry');
  if (entries.length === 0) return { pct: 0, msg: 'Aucune expérience', tips: ['Ajoutez au moins une expérience professionnelle'] };
  let score = 0, max = 0;
  let descTotal = 0;
  entries.forEach(e => {
    max += 3;
    const title = e.querySelector('.exp-title').value.trim();
    const company = e.querySelector('.exp-company').value.trim();
    const desc = e.querySelector('.exp-desc').value.trim();
    if (title) score++;
    if (company) score++;
    if (desc) { score++; descTotal += desc.length; }
  });
  const pct = Math.min(100, (score / max) * 100);
  const tips = [];
  if (entries.length < 2) tips.push('Ajoutez 2+ expériences pour un CV plus solide');
  if (descTotal < 100) tips.push('Détaillez davantage vos descriptions d\'expérience');
  document.querySelectorAll('#experience-list .entry .exp-current').forEach(c => {
    if (c.checked) tips.push('Pensez à décrire vos réalisations chiffrées');
  });
  if (!tips.length) tips.push('Bon contenu expérience');
  return { pct, msg: `${entries.length} entrée(s), ${score}/${max} champs`, tips };
}

function evalEducation() {
  const entries = document.querySelectorAll('#education-list .entry');
  if (entries.length === 0) return { pct: 0, msg: 'Aucune formation', tips: ['Ajoutez votre formation'] };
  let score = 0, max = entries.length * 2;
  entries.forEach(e => {
    if (e.querySelector('.edu-degree').value.trim()) score++;
    if (e.querySelector('.edu-school').value.trim()) score++;
  });
  const pct = (score / max) * 100;
  return { pct, msg: `${entries.length} entrée(s), ${score}/${max} champs`, tips: [] };
}

function evalSkills() {
  const entries = document.querySelectorAll('#skills-list .skill-entry');
  const names = [];
  entries.forEach(e => {
    const n = e.querySelector('.skill-name').value.trim();
    if (n) names.push({ name: n, level: parseInt(e.querySelector('.skill-level').value) });
  });
  if (names.length === 0) return { pct: 0, msg: 'Aucune compétence', tips: ['Ajoutez au moins 5 compétences techniques'] };
  if (names.length < 3) return { pct: 30, msg: names.length + ' compétence(s)', tips: ['Ajoutez 5+ compétences pertinentes'] };
  if (names.length < 6) return { pct: 60, msg: names.length + ' compétences', tips: ['Ajoutez encore quelques compétences'] };
  if (names.length < 10) return { pct: 85, msg: names.length + ' compétences', tips: [] };
  return { pct: 100, msg: names.length + ' compétences', tips: [] };
}

function evalLanguages() {
  const entries = document.querySelectorAll('#languages-list .skill-entry');
  const names = [];
  entries.forEach(e => {
    const n = e.querySelector('.lang-name').value.trim();
    if (n) names.push(n);
  });
  if (names.length === 0) return { pct: 0, msg: 'Aucune langue', tips: ['Ajoutez au moins une langue (anglais recommandé)'] };
  if (names.length === 1) return { pct: 60, msg: '1 langue', tips: ['Ajoutez une deuxième langue si possible'] };
  return { pct: 100, msg: names.length + ' langues', tips: [] };
}

function evalCertifications() {
  const entries = document.querySelectorAll('#certifications-list .entry');
  const names = [];
  entries.forEach(e => {
    if (e.querySelector('.cert-name').value.trim()) names.push(e);
  });
  if (names.length === 0) return { pct: 0, msg: 'Aucune certification', tips: ['Ajoutez des certifications si vous en avez'] };
  if (names.length === 1) return { pct: 60, msg: '1 certification', tips: [] };
  return { pct: 100, msg: names.length + ' certifications', tips: [] };
}

function evalATS() {
  let score = 0, max = 5, tips = [];
  const layout = document.getElementById('cv-layout').value;
  if (layout === 'single') { score++; } else { tips.push('Utilisez le mode colonne unique pour une meilleure compatibilité ATS'); }

  const font = document.getElementById('font-family').value;
  if (font.includes('Arial') || font.includes('Times')) { score++; } else { tips.push('Utilisez Arial ou Times New Roman pour les ATS'); }

  const skills = document.querySelectorAll('#skills-list .skill-entry .skill-name');
  let hasKeywords = false;
  skills.forEach(s => {
    const v = s.value.toLowerCase();
    if (['javascript','python','java','react','node','sql','html','css','php','ruby','go','rust','aws','docker','kubernetes','git','agile','scrum','typescript','angular','vue','mongodb','postgresql','mysql','redis','graphql','rest','api','machine learning','data','devops','ci/cd','terraform','ansible','linux','windows','c++','c#','.net','flutter','swift','kotlin','django','flask','spring','express','next','nuxt','sass','less','bootstrap','tailwind','redux','webpack','babel','jest','mocha','cypress','selenium','jenkins','github','gitlab','bitbucket','jira','confluence','figma','sketch','photoshop','illustrator','xd','seo','analytics','salesforce','sap','oracle','tableau','power bi','excel','word','powerpoint','outlook','teams','slack','zoom'].some(k => v.includes(k))) {
      hasKeywords = true;
    }
  });
  if (hasKeywords) { score++; } else { tips.push('Ajoutez des mots-clés techniques reconnus par les ATS'); }

  const summary = document.getElementById('summary').value.toLowerCase();
  if (summary.length > 50 && hasKeywords) { score++; } else { tips.push('Intégrez des mots-clés de votre domaine dans le résumé'); }

  const currentEntries = document.querySelectorAll('#experience-list .entry .exp-current:checked');
  if (currentEntries.length > 0) score++;

  const pct = (score / max) * 100;
  return { pct, msg: `${score}/${max} critères`, tips };
}

// ========== COVER LETTER ==========
function generateCoverLetter() {
  const name = document.getElementById('fullname').value.trim() || 'Votre Nom';
  const title = document.getElementById('title').value.trim() || 'Candidat';
  const email = document.getElementById('email').value.trim() || 'email@example.com';
  const phone = document.getElementById('phone').value.trim() || '';
  const address = document.getElementById('address').value.trim() || '';
  const linkedin = document.getElementById('linkedin').value.trim() || '';
  const website = document.getElementById('website').value.trim() || '';

  const jobTitle = document.getElementById('job-title').value.trim() || '[Intitulé du poste]';
  const company = document.getElementById('job-company').value.trim() || '[Nom de l\'entreprise]';
  const recruiter = document.getElementById('job-recruiter').value.trim() || '';

  const experienceEntries = [];
  document.querySelectorAll('#experience-list .entry').forEach(e => {
    const t = e.querySelector('.exp-title').value.trim();
    const c = e.querySelector('.exp-company').value.trim();
    const d = e.querySelector('.exp-desc').value.trim();
    if (t || c) experienceEntries.push({ title: t, company: c, desc: d });
  });

  const skillNames = [];
  document.querySelectorAll('#skills-list .skill-entry').forEach(e => {
    const n = e.querySelector('.skill-name').value.trim();
    if (n) skillNames.push(n);
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const salutation = recruiter ? `Madame, Monsieur${recruiter ? ' ' + recruiter : ''}` : 'Madame, Monsieur,';

  const expText = experienceEntries.length > 0
    ? `Fort${experienceEntries.length > 1 ? 's' : ''} d${experienceEntries.length > 1 ? '\'une expérience solide de' : 'e'} ${experienceEntries.map(e => e.title).join(', ')} au sein de ${experienceEntries.map(e => e.company).join(', ')}, j\'ai développé des compétences approfondies qui correspondent parfaitement aux exigences de ce poste.`
    : '';

  const skillsText = skillNames.length > 0
    ? `Je maîtrise notamment les technologies et outils suivants : ${skillNames.join(', ')}.`
    : '';

  const closure = `Je me tiens à votre disposition pour un entretien afin de vous exposer plus en détail mes motivations et mon parcours. Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`;

  let letter = `<div class="cl-header">
    <div class="cl-name">${esc(name)}</div>
    <div class="cl-contact">${esc(email)}${phone ? ' | ' + esc(phone) : ''}${address ? ' | ' + esc(address) : ''}${linkedin ? '<br>' + esc(linkedin) : ''}${website ? ' | ' + esc(website) : ''}</div>
    <div class="cl-date">${esc(dateStr)}</div>
  </div>
  <div class="cl-recipient">
    ${esc(company)}<br>
    À l'attention du service des ressources humaines
  </div>
  <div class="cl-subject">Objet : Candidature au poste de ${esc(jobTitle)}</div>
  <div class="cl-body">
    <p>${esc(salutation)}</p>
    <p>Actuellement à la recherche d'une nouvelle opportunité professionnelle, je me permets de vous adresser ma candidature pour le poste de ${esc(jobTitle)} au sein de ${esc(company)}. ${esc(expText)}</p>
    <p>${esc(skillsText)} Passionné par les défis techniques et animé par une volonté constante d'apprendre et de progresser, je suis convaincu de pouvoir apporter une contribution significative à votre équipe.</p>
    <p>${esc(closure)}</p>
  </div>
  <div class="cl-signature">
    ${esc(name)}
  </div>`;

  document.getElementById('cover-letter-content').innerHTML = letter;
  document.querySelector('.cover-form').style.display = 'none';
  document.getElementById('cover-result').style.display = 'block';
}

// ========== PDF EXPORT ==========
function exportPDF() {
  const element = document.getElementById('cv-content');
  generatePDF(element, 'CV_' + (document.getElementById('fullname').value || 'candidat').replace(/\s+/g, '_') + '.pdf');
}

function exportCoverPDF() {
  const content = document.getElementById('cover-letter-content');
  const wrapper = document.createElement('div');
  wrapper.style.background = 'white';
  wrapper.style.padding = '0';
  wrapper.style.fontFamily = 'Arial, sans-serif';
  wrapper.style.maxWidth = '210mm';
  wrapper.style.margin = '0 auto';
  wrapper.innerHTML = content.innerHTML;
  generatePDF(wrapper, 'Lettre_Motivation_' + (document.getElementById('fullname').value || 'candidat').replace(/\s+/g, '_') + '.pdf');
}

function generatePDF(element, filename) {
  const btn = document.querySelector('.preview-actions button');
  if (btn) { btn.textContent = ' Génération...'; btn.disabled = true; }

  const opt = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    if (btn) { btn.textContent = ' PDF'; btn.disabled = false; }
  }).catch(() => {
    if (btn) { btn.textContent = ' PDF'; btn.disabled = false; }
  });
}

function printCV() {
  window.print();
}

// ========== RESET ==========
function resetAll() {
  if (!confirm('Réinitialiser toutes les données ?')) return;

  document.querySelectorAll('#panel-personal input, #panel-personal textarea').forEach(el => {
    if (el.type === 'file') el.value = '';
    else el.value = '';
  });

  ['experience-list', 'education-list', 'projects-list', 'skills-list', 'languages-list', 'certifications-list'].forEach(id => {
    const list = document.getElementById(id);
    list.innerHTML = '';
  });

  addExperience();
  addEducation();
  addSkill();
  addLanguage();
  addCertification();

  document.getElementById('primary-color').value = '#1a365d';
  document.getElementById('accent-color').value = '#2b6cb0';
  document.querySelector(':root').style.setProperty('--primary', '#1a365d');
  document.querySelector(':root').style.setProperty('--primary-light', '#2b6cb0');
  document.getElementById('font-family').value = 'Arial, Helvetica, sans-serif';
  document.getElementById('cv-content').style.fontFamily = '';
  document.getElementById('cv-layout').value = 'single';
  document.getElementById('cv-content').classList.remove('two-column');
  document.getElementById('show-photo-cv').checked = true;
  document.getElementById('cv-photo').innerHTML = '';
  document.getElementById('cv-photo').classList.remove('show');

  document.getElementById('cover-result').style.display = 'none';
  document.querySelector('.cover-form').style.display = 'block';

  document.getElementById('job-title').value = '';
  document.getElementById('job-company').value = '';
  document.getElementById('job-description').value = '';
  document.getElementById('job-recruiter').value = '';

  updatePreview();
}

// ========== INIT ==========
addExperience();
addEducation();
addSkill();
addLanguage();
addCertification();
updatePreview();
