// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// Live preview update
document.addEventListener('input', updatePreview);
document.addEventListener('change', updatePreview);

function updatePreview() {
  const name = document.getElementById('fullname').value || 'VOTRE NOM';
  const title = document.getElementById('title').value || 'Titre Professionnel';
  const email = document.getElementById('email').value || 'email@example.com';
  const phone = document.getElementById('phone').value || '+33 6 00 00 00 00';
  const address = document.getElementById('address').value || 'Ville, Pays';
  const linkedin = document.getElementById('linkedin').value || 'linkedin';
  const website = document.getElementById('website').value || 'siteweb.com';
  const summary = document.getElementById('summary').value || 'Votre résumé professionnel...';

  document.getElementById('cv-name').textContent = name;
  document.getElementById('cv-title').textContent = title;
  document.getElementById('cv-email').textContent = email;
  document.getElementById('cv-phone').textContent = phone;
  document.getElementById('cv-address').textContent = address;
  document.getElementById('cv-linkedin').textContent = linkedin;
  document.getElementById('cv-website').textContent = website;
  document.getElementById('cv-summary').textContent = summary;

  renderSkills();
  renderLanguages();
  renderExperience();
  renderEducation();
  renderCertifications();
}

// Photo upload
document.getElementById('photo').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const container = document.getElementById('cv-photo');
    container.innerHTML = `<img src="${ev.target.result}" alt="Photo">`;
  };
  reader.readAsDataURL(file);
});

// Skills
function addSkill() {
  const list = document.getElementById('skills-list');
  const idx = list.children.length;
  const div = document.createElement('div');
  div.className = 'skill-entry';
  div.dataset.index = idx;
  div.innerHTML = `
    <input type="text" class="skill-name" placeholder="Compétence">
    <select class="skill-level">
      <option value="1">1 - Débutant</option>
      <option value="2">2 - Élémentaire</option>
      <option value="3" selected>3 - Intermédiaire</option>
      <option value="4">4 - Avancé</option>
      <option value="5">5 - Expert</option>
    </select>
    <button class="btn-remove small" onclick="removeEntry(this, 'skills')">×</button>`;
  list.appendChild(div);
  div.querySelectorAll('input, select').forEach(el => el.addEventListener('input', updatePreview));
  updatePreview();
}

function renderSkills() {
  const container = document.getElementById('cv-skills');
  container.innerHTML = '';
  document.querySelectorAll('#skills-list .skill-entry').forEach(entry => {
    const name = entry.querySelector('.skill-name').value;
    const level = parseInt(entry.querySelector('.skill-level').value) || 0;
    if (!name) return;
    const pct = (level / 5) * 100;
    container.innerHTML += `
      <div class="skill-bar">
        <span class="skill-label">${escapeHtml(name)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>`;
  });
}

// Languages
function addLanguage() {
  const list = document.getElementById('languages-list');
  const div = document.createElement('div');
  div.className = 'skill-entry';
  div.dataset.index = list.children.length;
  div.innerHTML = `
    <input type="text" class="lang-name" placeholder="Langue">
    <select class="lang-level">
      <option value="Débutant">Débutant</option>
      <option value="Intermédiaire" selected>Intermédiaire</option>
      <option value="Courant">Courant</option>
      <option value="Natif">Natif</option>
    </select>
    <button class="btn-remove small" onclick="removeEntry(this, 'languages')">×</button>`;
  list.appendChild(div);
  div.querySelectorAll('input, select').forEach(el => el.addEventListener('input', updatePreview));
  updatePreview();
}

function renderLanguages() {
  const container = document.getElementById('cv-languages');
  container.innerHTML = '';
  document.querySelectorAll('#languages-list .skill-entry').forEach(entry => {
    const name = entry.querySelector('.lang-name').value;
    const lvl = entry.querySelector('.lang-level').value;
    if (!name) return;
    container.innerHTML += `<div class="lang-item"><span class="lang-name">${escapeHtml(name)}</span><span class="lang-lvl">${escapeHtml(lvl)}</span></div>`;
  });
}

// Experience
function addExperience() {
  const list = document.getElementById('experience-list');
  const idx = list.children.length;
  const div = document.createElement('div');
  div.className = 'entry';
  div.dataset.index = idx;
  div.innerHTML = `
    <div class="form-group"><label>Poste</label><input type="text" class="exp-title" placeholder="Développeur Senior"></div>
    <div class="form-group"><label>Entreprise</label><input type="text" class="exp-company" placeholder="Tech Corp"></div>
    <div class="form-row">
      <div class="form-group"><label>Date début</label><input type="month" class="exp-start"></div>
      <div class="form-group">
        <label>Date fin</label>
        <input type="month" class="exp-end">
        <label class="checkbox-label"><input type="checkbox" class="exp-current"> Poste actuel</label>
      </div>
    </div>
    <div class="form-group"><label>Description</label><textarea class="exp-desc" rows="3" placeholder="Décrivez vos responsabilités..."></textarea></div>
    <button class="btn-remove" onclick="removeEntry(this, 'experience')">Supprimer</button>`;
  list.appendChild(div);
  div.querySelectorAll('input, select, textarea').forEach(el => el.addEventListener('input', updatePreview));
  updatePreview();
}

function renderExperience() {
  const container = document.getElementById('cv-experience');
  container.innerHTML = '';
  document.querySelectorAll('#experience-list .entry').forEach(entry => {
    const title = entry.querySelector('.exp-title').value;
    const company = entry.querySelector('.exp-company').value;
    const start = entry.querySelector('.exp-start').value;
    const end = entry.querySelector('.exp-end').value;
    const current = entry.querySelector('.exp-current').checked;
    const desc = entry.querySelector('.exp-desc').value;
    if (!title && !company) return;
    const dateStr = formatDate(start) + ' - ' + (current ? 'Présent' : formatDate(end));
    container.innerHTML += `
      <div class="cv-item">
        <div class="cv-item-header">
          <span class="cv-item-title">${escapeHtml(title) || 'Poste'}</span>
          <span class="cv-item-date">${dateStr}</span>
        </div>
        <div class="cv-item-sub">${escapeHtml(company) || 'Entreprise'}</div>
        ${desc ? `<div class="cv-item-desc">${escapeHtml(desc)}</div>` : ''}
      </div>`;
  });
}

// Education
function addEducation() {
  const list = document.getElementById('education-list');
  const idx = list.children.length;
  const div = document.createElement('div');
  div.className = 'entry';
  div.dataset.index = idx;
  div.innerHTML = `
    <div class="form-group"><label>Diplôme</label><input type="text" class="edu-degree" placeholder="Master en Informatique"></div>
    <div class="form-group"><label>Établissement</label><input type="text" class="edu-school" placeholder="Université Paris-Saclay"></div>
    <div class="form-row">
      <div class="form-group"><label>Date début</label><input type="month" class="edu-start"></div>
      <div class="form-group"><label>Date fin</label><input type="month" class="edu-end"></div>
    </div>
    <div class="form-group"><label>Description</label><textarea class="edu-desc" rows="2" placeholder="Mentions, spécialités..."></textarea></div>
    <button class="btn-remove" onclick="removeEntry(this, 'education')">Supprimer</button>`;
  list.appendChild(div);
  div.querySelectorAll('input, textarea').forEach(el => el.addEventListener('input', updatePreview));
  updatePreview();
}

function renderEducation() {
  const container = document.getElementById('cv-education');
  container.innerHTML = '';
  document.querySelectorAll('#education-list .entry').forEach(entry => {
    const degree = entry.querySelector('.edu-degree').value;
    const school = entry.querySelector('.edu-school').value;
    const start = entry.querySelector('.edu-start').value;
    const end = entry.querySelector('.edu-end').value;
    const desc = entry.querySelector('.edu-desc').value;
    if (!degree && !school) return;
    container.innerHTML += `
      <div class="cv-item">
        <div class="cv-item-header">
          <span class="cv-item-title">${escapeHtml(degree) || 'Diplôme'}</span>
          <span class="cv-item-date">${formatDate(start)} - ${formatDate(end)}</span>
        </div>
        <div class="cv-item-sub">${escapeHtml(school) || 'Établissement'}</div>
        ${desc ? `<div class="cv-item-desc">${escapeHtml(desc)}</div>` : ''}
      </div>`;
  });
}

// Certifications
function addCertification() {
  const list = document.getElementById('certifications-list');
  const idx = list.children.length;
  const div = document.createElement('div');
  div.className = 'entry';
  div.dataset.index = idx;
  div.innerHTML = `
    <div class="form-group"><label>Nom de la certification</label><input type="text" class="cert-name" placeholder="AWS Certified Developer"></div>
    <div class="form-group"><label>Organisme</label><input type="text" class="cert-org" placeholder="Amazon Web Services"></div>
    <div class="form-row">
      <div class="form-group"><label>Date d'obtention</label><input type="month" class="cert-date"></div>
    </div>
    <button class="btn-remove" onclick="removeEntry(this, 'certifications')">Supprimer</button>`;
  list.appendChild(div);
  div.querySelectorAll('input').forEach(el => el.addEventListener('input', updatePreview));
  updatePreview();
}

function renderCertifications() {
  const container = document.getElementById('cv-certifications');
  container.innerHTML = '';
  document.querySelectorAll('#certifications-list .entry').forEach(entry => {
    const name = entry.querySelector('.cert-name').value;
    const org = entry.querySelector('.cert-org').value;
    const date = entry.querySelector('.cert-date').value;
    if (!name && !org) return;
    container.innerHTML += `
      <div class="cv-item">
        <div class="cv-item-header">
          <span class="cv-item-title">${escapeHtml(name) || 'Certification'}</span>
          ${date ? `<span class="cv-item-date">${formatDate(date)}</span>` : ''}
        </div>
        ${org ? `<div class="cv-item-sub">${escapeHtml(org)}</div>` : ''}
      </div>`;
  });
}

// Remove entry
function removeEntry(btn, section) {
  const entry = btn.closest('.entry, .skill-entry');
  entry.remove();
  updatePreview();
}

// Helpers
function formatDate(val) {
  if (!val) return '';
  const [y, m] = val.split('-');
  const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
  return months[parseInt(m)-1] + ' ' + y;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Template customization
document.getElementById('primary-color').addEventListener('input', function() {
  document.querySelector(':root').style.setProperty('--primary', this.value);
  document.querySelectorAll('.cv-header').forEach(h => h.style.background = this.value);
  document.querySelectorAll('.cv-body h3').forEach(h => {
    h.style.color = this.value;
    h.style.borderBottomColor = this.value;
  });
  document.querySelectorAll('.bar-fill').forEach(b => b.style.background = this.value);
});

document.getElementById('font-family').addEventListener('change', function() {
  document.getElementById('cv-content').style.fontFamily = this.value;
});

// Export PDF
function exportPDF() {
  const element = document.getElementById('cv-content');
  const btn = document.querySelector('.preview-toolbar button');
  const origText = btn.textContent;
  btn.textContent = 'Génération...';
  btn.disabled = true;

  const opt = {
    margin:       0,
    filename:     'CV_' + (document.getElementById('fullname').value || 'candidat').replace(/\s+/g, '_') + '.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    btn.textContent = origText;
    btn.disabled = false;
  }).catch(() => {
    btn.textContent = origText;
    btn.disabled = false;
  });
}

// Reset all
function resetAll() {
  if (!confirm('Voulez-vous vraiment réinitialiser toutes les données ?')) return;
  document.querySelectorAll('#tab-personal input, #tab-personal textarea').forEach(el => {
    if (el.type === 'file') el.value = '';
    else el.value = '';
  });
  document.querySelectorAll('#experience-list .entry:not(:first-child), #education-list .entry:not(:first-child), #skills-list .skill-entry:not(:first-child), #languages-list .skill-entry:not(:first-child), #certifications-list .entry:not(:first-child)').forEach(el => el.remove());

  document.querySelectorAll('#experience-list .entry:first-child input, #experience-list .entry:first-child textarea').forEach(el => el.value = '');
  document.querySelectorAll('#education-list .entry:first-child input, #education-list .entry:first-child textarea').forEach(el => el.value = '');
  document.querySelectorAll('#skills-list .skill-entry:first-child input').forEach(el => el.value = '');
  document.querySelectorAll('#skills-list .skill-entry:first-child select').forEach(el => el.value = '3');
  document.querySelectorAll('#languages-list .skill-entry:first-child input').forEach(el => el.value = '');
  document.querySelectorAll('#languages-list .skill-entry:first-child select').forEach(el => el.value = 'Intermédiaire');
  document.querySelectorAll('#certifications-list .entry:first-child input').forEach(el => el.value = '');

  document.querySelector('#primary-color').value = '#2563eb';
  document.querySelector('#font-family').value = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  document.querySelector(':root').style.setProperty('--primary', '#2563eb');
  document.getElementById('cv-content').style.fontFamily = '';

  document.getElementById('cv-photo').innerHTML = '';
  updatePreview();
}

// Init
updatePreview();
