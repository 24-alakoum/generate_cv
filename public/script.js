// ========== AUTH STATE ==========
let API = '';
let TOKEN = localStorage.getItem('cvpro_token');
let USER = JSON.parse(localStorage.getItem('cvpro_user') || 'null');
let currentCVId = null;

function isLoggedIn() { return !!TOKEN; }

function apiHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (TOKEN) h['Authorization'] = 'Bearer ' + TOKEN;
  return h;
}

async function apiCall(method, path, body) {
  try {
    const res = await fetch(API + '/api' + path, {
      method, headers: apiHeaders(),
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) { throw new Error(data.error || 'Erreur serveur'); }
    return data;
  } catch (e) {
    if (e.message.includes('token') || e.message.includes('Authentification')) {
      logout();
    }
    throw e;
  }
}

// ========== AUTH ==========
function showAuthForm(form) {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById('form-' + form).classList.add('active');
  document.getElementById('login-error').textContent = '';
  document.getElementById('register-error').textContent = '';
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  if (!email || !password) { errEl.textContent = 'Remplissez tous les champs'; return; }

  try {
    const data = await apiCall('POST', '/auth/login', { email, password });
    TOKEN = data.token;
    USER = data.user;
    localStorage.setItem('cvpro_token', TOKEN);
    localStorage.setItem('cvpro_user', JSON.stringify(USER));
    enterApp();
  } catch (e) {
    errEl.textContent = e.message;
  }
}

async function register() {
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const errEl = document.getElementById('register-error');
  if (!name || !email || !password) { errEl.textContent = 'Remplissez tous les champs'; return; }
  if (password.length < 6) { errEl.textContent = 'Mot de passe trop court (6+ caractères)'; return; }

  try {
    const data = await apiCall('POST', '/auth/register', { name, email, password });
    TOKEN = data.token;
    USER = data.user;
    localStorage.setItem('cvpro_token', TOKEN);
    localStorage.setItem('cvpro_user', JSON.stringify(USER));
    enterApp();
  } catch (e) {
    errEl.textContent = e.message;
  }
}

function logout() {
  TOKEN = null;
  USER = null;
  localStorage.removeItem('cvpro_token');
  localStorage.removeItem('cvpro_user');
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-overlay').style.display = 'flex';
}

function enterApp() {
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('user-initial').textContent = (USER.name || 'U')[0].toUpperCase();
  document.getElementById('user-name-display').textContent = USER.name || 'Utilisateur';
  document.getElementById('admin-btn').style.display = USER.role === 'admin' ? 'block' : 'none';
  updateCredits();
  loadCVList();
}

function toggleUserMenu() {
  document.getElementById('user-menu').classList.toggle('show');
}

// Close user menu on click outside
document.addEventListener('click', (e) => {
  const menu = document.getElementById('user-menu');
  const userBtn = document.querySelector('.topbar-user');
  if (menu && userBtn && !userBtn.contains(e.target)) {
    menu.classList.remove('show');
  }
});

function updateCredits() {
  const count = document.getElementById('credits-count');
  if (count && USER) count.textContent = USER.credits || 0;
  const dash = document.getElementById('dash-credits');
  if (dash) dash.textContent = USER.credits || 0;
}

// ========== DASHBOARD ==========
function showDashboard() {
  document.getElementById('dashboard-view').style.display = 'block';
  document.getElementById('admin-view').style.display = 'none';
  document.getElementById('form-col').style.display = 'none';
  document.getElementById('preview-col').style.display = 'none';
  loadCVList();
}

function closeDashboard() {
  document.getElementById('dashboard-view').style.display = 'none';
  document.getElementById('form-col').style.display = 'block';
  document.getElementById('preview-col').style.display = 'flex';
}

async function loadCVList() {
  const grid = document.getElementById('cv-list');
  if (!grid) return;
  try {
    const cvs = await apiCall('GET', '/cvs');
    if (cvs.length === 0) {
      grid.innerHTML = `<div class="dash-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <h3>Aucun CV pour le moment</h3>
        <p>Créez votre premier CV</p>
        <button class="btn-primary" onclick="closeDashboard()">Créer un CV</button>
      </div>`;
      return;
    }
    grid.innerHTML = cvs.map(cv => `
      <div class="dash-card" onclick="loadCV('${cv.id}')">
        <h3>${cv.name}</h3>
        <p>Template: ${cv.template}</p>
        <div class="dash-meta"><span>${cv.created_at}</span></div>
        <div class="dash-actions">
          <button class="btn-sm" onclick="event.stopPropagation();loadCV('${cv.id}')">Ouvrir</button>
          <button class="btn-sm ghost" onclick="event.stopPropagation();deleteCV('${cv.id}')" style="color:#e53e3e">Supprimer</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    showToast('Erreur chargement CVs', 'error');
  }
}

async function loadCV(id) {
  try {
    const cv = await apiCall('GET', '/cvs/' + id);
    currentCVId = id;
    // Restore form data from cv.data
    if (cv.data) {
      // Reset and fill
      resetAllSilent();
      setTimeout(() => {
        const data = cv.data;
        for (const [field, val] of Object.entries(data.fields || {})) {
          const el = document.getElementById(field);
          if (el) el.value = val || '';
        }
        // Restore entries
        if (data.entries) {
          for (const [key, items] of Object.entries(data.entries)) {
            const listId = key + '-list';
            const list = document.getElementById(listId);
            if (!list) continue;
            list.innerHTML = '';
            items.forEach(item => {
              const fn = window['add' + key.charAt(0).toUpperCase() + key.slice(1)];
              if (fn) fn();
              const entries = list.querySelectorAll('.entry, .skill-entry');
              const last = entries[entries.length - 1];
              if (!last) return;
              Object.entries(item).forEach(([cls, val]) => {
                const el = last.querySelector('.' + cls);
                if (el) {
                  if (el.type === 'checkbox') el.checked = !!val;
                  else el.value = val || '';
                }
              });
            });
          }
        }
        updatePreview();
        closeDashboard();
      }, 100);
    }
  } catch (e) {
    showToast('Erreur chargement CV', 'error');
  }
}

async function deleteCV(id) {
  if (!confirm('Supprimer ce CV ?')) return;
  try {
    await apiCall('DELETE', '/cvs/' + id);
    loadCVList();
    showToast('CV supprimé', 'success');
  } catch (e) {
    showToast('Erreur suppression', 'error');
  }
}

async function saveCV() {
  if (!USER) return;
  const name = prompt('Nom du CV:', 'Mon CV');
  if (!name) return;

  // Collect all data
  const data = collectFormData();

  try {
    const result = await apiCall('POST', '/cvs', { name, data, template: document.getElementById('cv-template').value });
    currentCVId = result.id;
    USER.credits = result.credits || USER.credits;
    localStorage.setItem('cvpro_user', JSON.stringify(USER));
    updateCredits();
    showToast('CV sauvegardé ✓', 'success');
  } catch (e) {
    if (e.message.includes('Crédits')) {
      showToast('Crédits insuffisants', 'error');
      setTimeout(showPaymentModal, 500);
    } else {
      showToast('Erreur: ' + e.message, 'error');
    }
  }
}

function collectFormData() {
  const fields = {};
  ['fullname','title','email','phone','address','linkedin','website','summary'].forEach(id => {
    fields[id] = document.getElementById(id).value;
  });
  const entries = {};
  const sections = {
    experience: ['exp-title','exp-company','exp-start','exp-end','exp-current','exp-desc'],
    education: ['edu-degree','edu-school','edu-start','edu-end','edu-desc'],
    projects: ['proj-name','proj-tech','proj-url','proj-desc'],
    skills: ['skill-name','skill-level'],
    languages: ['lang-name','lang-level'],
    certifications: ['cert-name','cert-org','cert-date']
  };
  for (const [key, cls] of Object.entries(sections)) {
    entries[key] = [];
    document.querySelectorAll('#' + key + '-list > .entry, #' + key + '-list > .skill-entry').forEach(el => {
      const item = {};
      cls.forEach(c => {
        const inp = el.querySelector('.' + c);
        if (inp) item[c] = inp.type === 'checkbox' ? inp.checked : inp.value;
      });
      entries[key].push(item);
    });
  }
  return { fields, entries };
}

function resetAllSilent() {
  document.querySelectorAll('#panel-personal input, #panel-personal textarea').forEach(el => { el.value = ''; });
  ['experience-list','education-list','projects-list','skills-list','languages-list','certifications-list'].forEach(id => {
    document.getElementById(id).innerHTML = '';
  });
  document.getElementById('cv-photo').innerHTML = '';
}

// ========== ADMIN ==========
async function showAdmin() {
  document.getElementById('admin-view').style.display = 'block';
  document.getElementById('dashboard-view').style.display = 'none';
  document.getElementById('form-col').style.display = 'none';
  document.getElementById('preview-col').style.display = 'none';
  document.getElementById('user-menu').classList.remove('show');
  loadAdminData();
}

function closeAdmin() {
  document.getElementById('admin-view').style.display = 'none';
  document.getElementById('form-col').style.display = 'block';
  document.getElementById('preview-col').style.display = 'flex';
}

async function loadAdminData() {
  try {
    const stats = await apiCall('GET', '/admin/dashboard');
    const statsEl = document.getElementById('admin-stats');
    statsEl.innerHTML = `
      <div class="admin-stat"><div class="num">${stats.users.total}</div><div class="label">Utilisateurs</div></div>
      <div class="admin-stat"><div class="num">${stats.users.today}</div><div class="label">Aujourd'hui</div></div>
      <div class="admin-stat"><div class="num">${stats.cvs.total}</div><div class="label">CVs générés</div></div>
      <div class="admin-stat"><div class="num">${stats.cvs.today}</div><div class="label">CVs aujourd'hui</div></div>
      <div class="admin-stat"><div class="num">${stats.payments.total}</div><div class="label">Paiements</div></div>
      <div class="admin-stat"><div class="num">${stats.payments.revenue/100}€</div><div class="label">Revenus</div></div>
      <div class="admin-stat"><div class="num">${stats.coverLetters}</div><div class="label">Lettres</div></div>
      <div class="admin-stat"><div class="num">${Math.round(stats.credits.avg||0)}</div><div class="label">Crédits moyen</div></div>
    `;

    // Users table
    const users = await apiCall('GET', '/admin/users');
    document.getElementById('admin-users').innerHTML = users.length ? `
      <table><tr><th>Email</th><th>Nom</th><th>Crédits</th><th>Inscription</th></tr>
      ${users.map(u => `<tr><td>${u.email}</td><td>${u.name}</td><td>${u.credits}</td><td>${u.created_at}</td></tr>`).join('')}
      </table>` : '<p>Aucun utilisateur</p>';

    // Payments table
    const payments = await apiCall('GET', '/admin/payments');
    document.getElementById('admin-payments').innerHTML = payments.length ? `
      <table><tr><th>Utilisateur</th><th>Montant</th><th>Crédits</th><th>Date</th></tr>
      ${payments.map(p => `<tr><td>${p.user_email}</td><td>${p.amount/100}€</td><td>${p.credits}</td><td>${p.created_at}</td></tr>`).join('')}
      </table>` : '<p>Aucun paiement</p>';

  } catch (e) {
    showToast('Erreur chargement admin', 'error');
  }
}

// ========== PAYMENT ==========
function showPaymentModal() {
  document.getElementById('payment-overlay').style.display = 'flex';
  document.getElementById('modal-credits').textContent = USER.credits || 0;

  const plansEl = document.getElementById('plans-list');
  const plans = { starter: { name: 'Starter', credits: 5, price: '4,99' }, pro: { name: 'Pro', credits: 15, price: '9,99' }, unlimited: { name: 'Illimité', credits: 50, price: '19,99' } };
  plansEl.innerHTML = Object.entries(plans).map(([key, p]) => `
    <div class="plan-card" onclick="buyPlan('${key}')">
      <div class="plan-name">${p.name}</div>
      <div class="plan-credits">${p.credits}</div>
      <div class="plan-price">${p.price}€ <small>HT</small></div>
    </div>
  `).join('');
}

function closePaymentModal(e) {
  if (e && e.target !== document.getElementById('payment-overlay')) return;
  document.getElementById('payment-overlay').style.display = 'none';
}

async function buyPlan(plan) {
  try {
    const result = await apiCall('POST', '/payment/checkout', { plan });
    if (result.url) {
      window.location.href = result.url;
    } else if (result.success) {
      USER.credits = result.credits;
      localStorage.setItem('cvpro_user', JSON.stringify(USER));
      updateCredits();
      document.getElementById('modal-credits').textContent = USER.credits;
      showToast(result.message, 'success');
      setTimeout(closePaymentModal, 1000);
    }
  } catch (e) {
    showToast('Erreur paiement: ' + e.message, 'error');
  }
}

// ========== TOAST ==========
function showToast(msg, type) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast ' + (type || 'info');
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ========== INIT AUTH ==========
if (isLoggedIn() && USER) {
  document.addEventListener('DOMContentLoaded', () => {
    enterApp();
  });
}

// ========== NAV ==========
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    link.classList.add('active');
    const panel = document.getElementById('panel-' + link.dataset.tab);
    if (panel) panel.classList.add('active');
    if (window.innerWidth <= 600) document.getElementById('topnav').classList.remove('open');
  });
});

function toggleMobileNav() {
  document.getElementById('topnav').classList.toggle('open');
}

// ========== VIEWS ==========
function showTab(view) {
  document.querySelectorAll('.pv-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.pv-tab').forEach(t => t.classList.remove('active'));
  const page = document.getElementById('page-' + view);
  if (page) page.classList.add('active');
  const tab = document.querySelector('.pv-tab[data-view="' + view + '"]');
  if (tab) tab.classList.add('active');
}

document.querySelectorAll('.pv-tab').forEach(tab => {
  tab.addEventListener('click', () => showTab(tab.dataset.view));
});

// ========== LOCAL STORAGE ==========
const STORAGE_KEY = 'cvpro_data';

function saveState() {
  const data = { fields: {}, entries: {}, prefs: {}, photo: null };

  // Simple fields
  ['fullname','title','email','phone','address','linkedin','website','summary'].forEach(id => {
    data.fields[id] = document.getElementById(id).value;
  });

  // Dynamic entries
  const sections = {
    experience: { list: 'experience-list', cls: ['exp-title','exp-company','exp-start','exp-end','exp-current','exp-desc'] },
    education: { list: 'education-list', cls: ['edu-degree','edu-school','edu-start','edu-end','edu-desc'] },
    projects: { list: 'projects-list', cls: ['proj-name','proj-tech','proj-url','proj-desc'] },
    skills: { list: 'skills-list', cls: ['skill-name','skill-level'] },
    languages: { list: 'languages-list', cls: ['lang-name','lang-level'] },
    certifications: { list: 'certifications-list', cls: ['cert-name','cert-org','cert-date'] }
  };

  data.entries = {};
  for (const [key, cfg] of Object.entries(sections)) {
    data.entries[key] = [];
    document.querySelectorAll('#' + cfg.list + ' > .entry, #' + cfg.list + ' > .skill-entry').forEach(el => {
      const item = {};
      cfg.cls.forEach(c => {
        const input = el.querySelector('.' + c);
        if (input) item[c] = input.type === 'checkbox' ? input.checked : input.value;
      });
      data.entries[key].push(item);
    });
  }

  // Photo (base64)
  const photoImg = document.querySelector('#cv-photo img');
  if (photoImg) data.photo = photoImg.src;

  // Cover letter fields
  ['job-title','job-company','job-description','job-recruiter'].forEach(id => {
    data.fields[id] = document.getElementById(id).value;
  });

  // Analysis field
  data.fields['analysis-offer'] = document.getElementById('analysis-offer').value;

  // Preferences
  data.prefs = {
    primaryColor: document.getElementById('primary-color').value,
    accentColor: document.getElementById('accent-color').value,
    bgColor: document.getElementById('bg-color').value,
    fontFamily: document.getElementById('font-family').value,
    cvLayout: document.getElementById('cv-layout').value,
    cvTemplate: document.getElementById('cv-template').value,
    showPhoto: document.getElementById('show-photo-cv').checked,
    darkMode: document.body.classList.contains('dark')
  };

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
}

function loadState() {
  let data;
  try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch(e) {}
  if (!data) return;

  // Restore fields
  if (data.fields) {
    for (const [id, val] of Object.entries(data.fields)) {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    }
  }

  // Restore entries
  if (data.entries) {
    const addFns = {
      experience: addExperience, education: addEducation, projects: addProject,
      skills: addSkill, languages: addLanguage, certifications: addCertification
    };
    const listIds = {
      experience: 'experience-list', education: 'education-list', projects: 'projects-list',
      skills: 'skills-list', languages: 'languages-list', certifications: 'certifications-list'
    };

    for (const [key, items] of Object.entries(data.entries)) {
      const list = document.getElementById(listIds[key]);
      list.innerHTML = '';
      if (items.length === 0) { addFns[key](); continue; }
      items.forEach(item => {
        // Call add function then set values
        addFns[key]();
        const entries = list.querySelectorAll('.entry, .skill-entry');
        const last = entries[entries.length - 1];
        if (!last) return;
        Object.entries(item).forEach(([cls, val]) => {
          const el = last.querySelector('.' + cls);
          if (el) {
            if (el.type === 'checkbox') el.checked = !!val;
            else el.value = val || '';
          }
        });
      });
    }
  }

  // Restore photo
  if (data.photo) {
    const c = document.getElementById('cv-photo');
    c.innerHTML = '<img src="' + data.photo + '" alt="Photo">';
  }

  // Restore preferences
  if (data.prefs) {
    const p = data.prefs;
    if (p.primaryColor) {
      document.getElementById('primary-color').value = p.primaryColor;
      document.querySelector(':root').style.setProperty('--primary', p.primaryColor);
    }
    if (p.accentColor) {
      document.getElementById('accent-color').value = p.accentColor;
      document.querySelector(':root').style.setProperty('--accent', p.accentColor);
      document.querySelector(':root').style.setProperty('--primary-light', p.accentColor);
    }
    if (p.bgColor) {
      document.getElementById('bg-color').value = p.bgColor;
      document.querySelector(':root').style.setProperty('--bg', p.bgColor);
      document.body.style.background = p.bgColor;
      document.querySelector('.preview-col').style.background = p.bgColor;
    }
    if (p.fontFamily) {
      document.getElementById('font-family').value = p.fontFamily;
      document.getElementById('cv-content').style.fontFamily = p.fontFamily;
    }
    if (p.cvLayout) {
      document.getElementById('cv-layout').value = p.cvLayout;
      document.getElementById('cv-content').classList.toggle('two-column', p.cvLayout === 'two');
    }
    if (p.cvTemplate) {
      document.getElementById('cv-template').value = p.cvTemplate;
      applyTemplate(p.cvTemplate);
    }
    if (p.showPhoto !== undefined) {
      document.getElementById('show-photo-cv').checked = p.showPhoto;
    }
    if (p.darkMode) {
      document.body.classList.add('dark');
    }
  }
}

// ========== DARK MODE ==========
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  saveState();
}

// ========== TEMPLATES ==========
document.getElementById('cv-template').addEventListener('change', function() {
  applyTemplate(this.value);
  saveState();
});

function applyTemplate(tpl) {
  const cv = document.getElementById('cv-content');
  cv.className = cv.className
    .replace(/professional|modern|classic|minimal/g, '')
    .replace(/\s+/g, ' ').trim();
  if (tpl !== 'professional') cv.classList.add(tpl);
  // Re-apply two-column
  if (document.getElementById('cv-layout').value === 'two') cv.classList.add('two-column');
  applyColors();
}

// ========== FORM EVENTS ==========
document.addEventListener('input', scheduleUpdate);
document.addEventListener('change', scheduleUpdate);

let updateTimer;
function scheduleUpdate() {
  clearTimeout(updateTimer);
  updateTimer = setTimeout(() => {
    updatePreview();
    saveState();
  }, 80);
}

function updatePreview() {
  const fields = {
    fullname: 'VOTRE NOM', title: 'Titre Professionnel',
    email: 'email@example.com', phone: '+33 6 00 00 00 00',
    address: 'Ville, Pays', linkedin: 'linkedin', website: 'siteweb.com',
    summary: 'Votre résumé professionnel...'
  };
  for (const [id, fallback] of Object.entries(fields)) {
    const el = document.getElementById(id);
    document.getElementById('cv-' + id).textContent = el.value.trim() || fallback;
  }

  const show = document.getElementById('show-photo-cv').checked;
  const p = document.getElementById('cv-photo');
  p.classList.toggle('show', show && p.children.length > 0);

  renderExperience();
  renderEducation();
  renderProjects();
  renderSkills();
  renderLanguages();
  renderCertifications();
  updateScore();
  updateBadges();
}

// ========== PHOTO ==========
document.getElementById('photo').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    const c = document.getElementById('cv-photo');
    c.innerHTML = '<img src="' + ev.target.result + '" alt="Photo">';
    c.classList.toggle('show', document.getElementById('show-photo-cv').checked);
  };
  r.readAsDataURL(file);
});

// ========== DYNAMIC ENTRIES ==========
function createEntry(html) {
  const d = document.createElement('div');
  d.className = 'entry';
  d.innerHTML = html;
  bindInputs(d);
  return d;
}

function removeEntry(btn) {
  const e = btn.closest('.entry, .skill-entry');
  if (e) e.remove();
  scheduleUpdate();
}

function bindInputs(el) {
  el.querySelectorAll('input, select, textarea').forEach(i => {
    i.addEventListener('input', scheduleUpdate);
    i.addEventListener('change', scheduleUpdate);
  });
}

// Experience
function addExperience() {
  const list = document.getElementById('experience-list');
  list.appendChild(createEntry(`
    <div class="field"><label>Poste</label><input type="text" class="exp-title" placeholder="Développeur Senior"></div>
    <div class="field"><label>Entreprise</label><input type="text" class="exp-company" placeholder="Tech Corp"></div>
    <div class="field-row">
      <div class="field"><label>Début</label><input type="month" class="exp-start"></div>
      <div class="field"><label>Fin</label><input type="month" class="exp-end"><label class="toggle" style="margin-top:4px"><input type="checkbox" class="exp-current"><span class="toggle-slider"></span><span style="font-size:0.75rem;font-weight:500;color:var(--text2);margin-left:6px">Actuel</span></label></div>
    </div>
    <div class="field"><label>Description</label><textarea class="exp-desc" rows="3" placeholder="Réalisations, responsabilités..."></textarea></div>
    <button class="btn-remove" onclick="removeEntry(this)">Supprimer</button>
  `));
  scheduleUpdate();
}

function renderExperience() {
  const c = document.getElementById('cv-experience'); c.innerHTML = '';
  document.querySelectorAll('#experience-list .entry').forEach(e => {
    const title = e.querySelector('.exp-title').value.trim();
    const company = e.querySelector('.exp-company').value.trim();
    const start = e.querySelector('.exp-start').value;
    const end = e.querySelector('.exp-end').value;
    const cur = e.querySelector('.exp-current').checked;
    const desc = e.querySelector('.exp-desc').value.trim();
    if (!title && !company) return;
    c.innerHTML +=
      '<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">' + esc(title||'Poste') +
      '</span><span class="cv-item-date">' + fmtDate(start) + ' - ' + (cur?'Présent':fmtDate(end)) +
      '</span></div><div class="cv-item-sub">' + esc(company||'Entreprise') + '</div>' +
      (desc ? '<div class="cv-item-desc">' + esc(desc) + '</div>' : '') + '</div>';
  });
}

// Education
function addEducation() {
  document.getElementById('education-list').appendChild(createEntry(`
    <div class="field"><label>Diplôme</label><input type="text" class="edu-degree" placeholder="Master en Informatique"></div>
    <div class="field"><label>Établissement</label><input type="text" class="edu-school" placeholder="Université Paris-Saclay"></div>
    <div class="field-row"><div class="field"><label>Début</label><input type="month" class="edu-start"></div><div class="field"><label>Fin</label><input type="month" class="edu-end"></div></div>
    <div class="field"><label>Description</label><textarea class="edu-desc" rows="2" placeholder="Mentions, spécialités..."></textarea></div>
    <button class="btn-remove" onclick="removeEntry(this)">Supprimer</button>
  `));
  scheduleUpdate();
}

function renderEducation() {
  const c = document.getElementById('cv-education'); c.innerHTML = '';
  document.querySelectorAll('#education-list .entry').forEach(e => {
    const deg = e.querySelector('.edu-degree').value.trim();
    const sch = e.querySelector('.edu-school').value.trim();
    const start = e.querySelector('.edu-start').value;
    const end = e.querySelector('.edu-end').value;
    const desc = e.querySelector('.edu-desc').value.trim();
    if (!deg && !sch) return;
    c.innerHTML +=
      '<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">' + esc(deg||'Diplôme') +
      '</span><span class="cv-item-date">' + fmtDate(start) + ' - ' + fmtDate(end) +
      '</span></div><div class="cv-item-sub">' + esc(sch||'Établissement') + '</div>' +
      (desc ? '<div class="cv-item-desc">' + esc(desc) + '</div>' : '') + '</div>';
  });
}

// Projects
function addProject() {
  document.getElementById('projects-list').appendChild(createEntry(`
    <div class="field"><label>Nom du projet</label><input type="text" class="proj-name" placeholder="Application E-commerce"></div>
    <div class="field"><label>Technologies</label><input type="text" class="proj-tech" placeholder="React, Node.js, MongoDB"></div>
    <div class="field"><label>Lien</label><input type="url" class="proj-url" placeholder="github.com/user/projet"></div>
    <div class="field"><label>Description</label><textarea class="proj-desc" rows="2" placeholder="Description et contributions..."></textarea></div>
    <button class="btn-remove" onclick="removeEntry(this)">Supprimer</button>
  `));
  scheduleUpdate();
}

function renderProjects() {
  const c = document.getElementById('cv-projects'); c.innerHTML = '';
  document.querySelectorAll('#projects-list .entry').forEach(e => {
    const n = e.querySelector('.proj-name').value.trim();
    const t = e.querySelector('.proj-tech').value.trim();
    const u = e.querySelector('.proj-url').value.trim();
    const d = e.querySelector('.proj-desc').value.trim();
    if (!n) return;
    c.innerHTML +=
      '<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">' + esc(n) + '</span>' +
      (u ? '<a href="' + esc(u) + '" target="_blank" style="font-size:0.76rem;color:var(--accent);text-decoration:none">' + esc(u) + '</a>' : '') +
      '</div>' + (t ? '<div class="cv-item-sub">' + esc(t) + '</div>' : '') +
      (d ? '<div class="cv-item-desc">' + esc(d) + '</div>' : '') + '</div>';
  });
}

// Skills
function addSkill(val) {
  const list = document.getElementById('skills-list');
  const d = document.createElement('div');
  d.className = 'skill-entry';
  d.innerHTML =
    '<input type="text" class="skill-name" placeholder="Compétence" value="' + esc(val||'') + '">' +
    '<select class="skill-level"><option value="1">1</option><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option><option value="5">5</option></select>' +
    '<button class="btn-remove small" onclick="removeEntry(this)">×</button>';
  list.appendChild(d);
  bindInputs(d);
  scheduleUpdate();
}

function renderSkills() {
  const c = document.getElementById('cv-skills'); c.innerHTML = '';
  const items = [];
  document.querySelectorAll('#skills-list .skill-entry').forEach(e => {
    const n = e.querySelector('.skill-name').value.trim();
    if (n) items.push(n);
  });
  if (!items.length) { c.innerHTML = ''; return; }
  c.innerHTML = '<div class="cv-skills">' + items.map(s =>
    '<span class="cv-skill">' + esc(s) + '</span>'
  ).join('') + '</div>';
}

// Languages
function addLanguage() {
  const list = document.getElementById('languages-list');
  const d = document.createElement('div');
  d.className = 'skill-entry';
  d.innerHTML =
    '<input type="text" class="lang-name" placeholder="Langue">' +
    '<select class="lang-level"><option>Débutant</option><option selected>Intermédiaire</option><option>Courant</option><option>Natif</option></select>' +
    '<button class="btn-remove small" onclick="removeEntry(this)">×</button>';
  list.appendChild(d);
  bindInputs(d);
  scheduleUpdate();
}

function renderLanguages() {
  const c = document.getElementById('cv-languages'); c.innerHTML = '';
  document.querySelectorAll('#languages-list .skill-entry').forEach(e => {
    const n = e.querySelector('.lang-name').value.trim();
    const l = e.querySelector('.lang-level').value;
    if (n) c.innerHTML += '<div class="cv-lang"><strong>' + esc(n) + '</strong> <span class="lvl">' + esc(l) + '</span></div>';
  });
}

// Certifications
function addCertification() {
  document.getElementById('certifications-list').appendChild(createEntry(`
    <div class="field"><label>Certification</label><input type="text" class="cert-name" placeholder="AWS Certified Developer"></div>
    <div class="field"><label>Organisme</label><input type="text" class="cert-org" placeholder="Amazon Web Services"></div>
    <div class="field-row"><div class="field"><label>Date</label><input type="month" class="cert-date"></div></div>
    <button class="btn-remove" onclick="removeEntry(this)">Supprimer</button>
  `));
  scheduleUpdate();
}

function renderCertifications() {
  const c = document.getElementById('cv-certifications'); c.innerHTML = '';
  document.querySelectorAll('#certifications-list .entry').forEach(e => {
    const n = e.querySelector('.cert-name').value.trim();
    const o = e.querySelector('.cert-org').value.trim();
    const d = e.querySelector('.cert-date').value;
    if (!n && !o) return;
    c.innerHTML +=
      '<div class="cv-item"><div class="cv-item-header"><span class="cv-item-title">' + esc(n||'Certification') + '</span>' +
      (d ? '<span class="cv-item-date">' + fmtDate(d) + '</span>' : '') +
      '</div>' + (o ? '<div class="cv-item-sub">' + esc(o) + '</div>' : '') + '</div>';
  });
}

// ========== HELPERS ==========
function fmtDate(v) {
  if (!v) return '';
  const [y,m] = v.split('-');
  return ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'][parseInt(m)-1] + ' ' + y;
}
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ========== BADGES ==========
function updateBadges() {
  const counts = {
    experience: '#experience-list .entry',
    education: '#education-list .entry',
    projects: '#projects-list .entry',
    skills: '#skills-list .skill-entry',
    languages: '#languages-list .skill-entry',
    certifications: '#certifications-list .entry'
  };
  for (const [key, sel] of Object.entries(counts)) {
    const el = document.getElementById('badge-' + key);
    if (el) {
      const n = document.querySelectorAll(sel).length;
      el.textContent = n;
      el.classList.toggle('active', n > 0);
    }
  }
  const p = document.getElementById('badge-personal');
  if (p) {
    const filled = ['fullname','email','phone','address'].filter(id => document.getElementById(id).value.trim()).length;
    p.textContent = filled >= 3 ? '✓' : '○';
    p.classList.toggle('active', filled >= 3);
  }
}

// ========== TEMPLATE ==========
document.getElementById('primary-color').addEventListener('input', function() {
  document.querySelector(':root').style.setProperty('--primary', this.value);
  applyColors();
});
document.getElementById('accent-color').addEventListener('input', function() {
  document.querySelector(':root').style.setProperty('--accent', this.value);
  document.querySelector(':root').style.setProperty('--primary-light', this.value);
  applyColors();
});
document.getElementById('bg-color').addEventListener('input', function() {
  document.querySelector(':root').style.setProperty('--bg', this.value);
  document.querySelector('.preview-col').style.background = this.value;
  document.body.style.background = this.value;
});

function applyColors() {
  const p = document.getElementById('primary-color').value;
  document.querySelectorAll('.cv-header h1, .cv-body h2, .cv-skill').forEach(el => el.style.color = p);
  document.querySelectorAll('.cv-header, .cv-body h2').forEach(el => el.style.borderColor = p);
}

document.getElementById('font-family').addEventListener('change', function() {
  document.getElementById('cv-content').style.fontFamily = this.value;
});
document.getElementById('cv-layout').addEventListener('change', function() {
  document.getElementById('cv-content').classList.toggle('two-column', this.value === 'two');
});
document.getElementById('show-photo-cv').addEventListener('change', function() {
  const p = document.getElementById('cv-photo');
  p.classList.toggle('show', this.checked && p.children.length > 0);
});

// ========== SCORE ==========
function updateScore() {
  const cats = {
    personal: evalCat(0, 4, () => {
      let s = 0;
      if (document.getElementById('fullname').value.trim()) s++;
      if (document.getElementById('email').value.includes('@')) s++;
      if (document.getElementById('phone').value.trim().length >= 8) s++;
      if (document.getElementById('address').value.trim()) s++;
      return { s, tips: s < 4 ? ['Remplissez tous les champs d\'informations personnelles'] : [] };
    }),
    summary: evalCat(0, 100, () => {
      const l = document.getElementById('summary').value.trim().length;
      if (l === 0) return { s: 0, tips: ['Ajoutez un résumé professionnel'] };
      if (l < 50) return { s: 30, tips: ['Développez votre résumé (50+ caractères)'] };
      if (l < 100) return { s: 70, tips: ['Ajoutez des mots-clés de votre domaine'] };
      return { s: 100 };
    }),
    experience: evalCat(0, 3, () => {
      const entries = document.querySelectorAll('#experience-list .entry');
      let score = 0, tips = [];
      entries.forEach(e => { if (e.querySelector('.exp-title').value.trim()) score++; if (e.querySelector('.exp-company').value.trim()) score++; if (e.querySelector('.exp-desc').value.trim().length > 20) score++; });
      const max = entries.length * 3 || 1;
      if (entries.length === 0) tips.push('Ajoutez au moins une expérience');
      else if (entries.length < 2) tips.push('Ajoutez 2+ expériences pour un CV plus solide');
      if (score < max) tips.push('Détaillez vos expériences avec des descriptions');
      return { s: Math.round(score / max * 100), tips };
    }),
    education: evalCat(0, 2, () => {
      const entries = document.querySelectorAll('#education-list .entry');
      let s = 0;
      entries.forEach(e => { if (e.querySelector('.edu-degree').value.trim()) s++; if (e.querySelector('.edu-school').value.trim()) s++; });
      const max = entries.length * 2 || 1;
      if (entries.length === 0) return { s: 0, tips: ['Ajoutez votre formation'] };
      return { s: Math.round(s / max * 100), tips: [] };
    }),
    skills: evalCat(0, 10, () => {
      const n = document.querySelectorAll('#skills-list .skill-entry .skill-name').length;
      const filled = document.querySelectorAll('#skills-list .skill-entry .skill-name').filter(el => el.value.trim()).length;
      if (filled === 0) return { s: 0, tips: ['Ajoutez au moins 5 compétences'] };
      if (filled < 3) return { s: 20, tips: ['Ajoutez 5+ compétences pertinentes'] };
      if (filled < 6) return { s: 50, tips: ['Ajoutez encore quelques compétences'] };
      if (filled < 10) return { s: 80, tips: ['Essayez d\'atteindre 10 compétences'] };
      return { s: 100, tips: [] };
    }),
    languages: evalCat(0, 2, () => {
      const n = document.querySelectorAll('#languages-list .skill-entry .lang-name').filter(el => el.value.trim()).length;
      if (n === 0) return { s: 0, tips: ['Ajoutez au moins l\'anglais'] };
      if (n === 1) return { s: 60, tips: ['Ajoutez une deuxième langue si possible'] };
      return { s: 100, tips: [] };
    }),
    certifications: evalCat(0, 3, () => {
      const n = document.querySelectorAll('#certifications-list .entry .cert-name').filter(el => el.value.trim()).length;
      if (n === 0) return { s: 0, tips: ['Ajoutez des certifications si vous en avez'] };
      return { s: Math.min(100, n * 33), tips: [] };
    }),
    ats: evalCat(0, 5, () => {
      let s = 0, tips = [];
      if (document.getElementById('cv-layout').value === 'single') s++; else tips.push('Préférez la colonne unique pour les ATS');
      const font = document.getElementById('font-family').value;
      if (font.includes('Arial') || font.includes('Times')) s++; else tips.push('Utilisez Arial ou Times New Roman pour les ATS');
      const skills = [...document.querySelectorAll('#skills-list .skill-entry .skill-name')].map(el => el.value.toLowerCase());
      const tech = ['javascript','python','java','react','node','sql','html','css','php','ruby','go','rust','aws','docker','kubernetes','git','typescript','angular','vue','mongodb','postgresql','mysql','redis','graphql','rest','api','machine learning','data','devops','ci/cd','terraform','linux','c++','c#','.net','flutter','swift','kotlin','django','flask','spring','express','next','nuxt','react native','tailwind','bootstrap','redux','jest','cypress','selenium','jenkins','github actions','gitlab','jira','figma','seo','agile','scrum','sap','oracle','tableau','power bi','excel'];
      if (skills.some(s => tech.some(t => s.includes(t)))) s++; else tips.push('Ajoutez des mots-clés techniques reconnus');
      const summary = document.getElementById('summary').value.toLowerCase();
      if (summary.length > 50 && tech.some(t => summary.includes(t))) s++; else tips.push('Intégrez des mots-clés dans votre résumé');
      const current = document.querySelectorAll('#experience-list .entry .exp-current:checked');
      if (current.length > 0 || document.querySelectorAll('#experience-list .entry').length >= 2) s++;
      return { s: Math.round(s / 5 * 100), tips };
    })
  };

  const weights = { personal: 10, summary: 15, experience: 25, education: 15, skills: 20, languages: 5, certifications: 5, ats: 5 };
  let total = 0, allTips = [];
  for (const [k, v] of Object.entries(cats)) {
    total += v.s * (weights[k] / 100);
    if (v.tips) allTips.push(...v.tips);

    // Update breakdown
    document.querySelector('#score-breakdown .s-item[data-cat="' + k + '"] .pct').textContent = v.s + '%';
    document.querySelector('#score-breakdown .s-item[data-cat="' + k + '"] .s-fill').style.width = v.s + '%';
    document.querySelector('#score-breakdown .s-item[data-cat="' + k + '"] .s-item-d').textContent = v.tips && v.tips.length && v.s < 100 ? v.tips[0] : (v.s >= 100 ? 'Parfait' : '');
  }

  const score = Math.round(total);
  const circum = 2 * Math.PI * 54;
  document.getElementById('score-arc').setAttribute('stroke-dasharray', (score / 100 * circum) + ' ' + circum);
  document.getElementById('score-number').textContent = score;
  document.getElementById('pv-score-num').textContent = score;

  let grade, color;
  if (score >= 85) { grade = 'Excellent'; color = '#38a169'; }
  else if (score >= 70) { grade = 'Très bien'; color = '#3182ce'; }
  else if (score >= 50) { grade = 'Bien'; color = '#d69e2e'; }
  else if (score >= 30) { grade = 'À améliorer'; color = '#dd6b20'; }
  else { grade = 'Incomplet'; color = '#e53e3e'; }

  document.getElementById('score-grade').textContent = grade;
  document.getElementById('score-grade').style.color = color;
  document.getElementById('score-arc').setAttribute('stroke', color);

  if (score >= 80) document.getElementById('score-summary-text').textContent = 'Excellent CV — prêt à envoyer !';
  else if (score >= 60) document.getElementById('score-summary-text').textContent = 'Bon CV, quelques améliorations possibles.';
  else document.getElementById('score-summary-text').textContent = 'Ajoutez plus de contenu pour un CV efficace.';

  const tipsEl = document.getElementById('score-tips-list');
  tipsEl.innerHTML = allTips.slice(0, 5).map(t => '<li>' + t + '</li>').join('');
  document.getElementById('score-tips').style.display = allTips.length ? 'block' : 'none';
}

function evalCat(min, max, fn) {
  const r = fn();
  return { ...r, s: Math.max(min, Math.min(max, r.s)) };
}

// ========== ANALYSIS ==========
const TECH_KEYWORDS = [
  'javascript','js','typescript','ts','python','java','c++','c#','csharp','php','ruby','go','golang','rust','swift','kotlin','scala','dart',
  'react','react native','angular','vue','vuejs','next.js','nextjs','nuxt','svelte','jquery','node','node.js','nodejs','express','django','flask','spring','spring boot','laravel','symfony','asp.net','rails','fastapi',
  'html','html5','css','css3','sass','scss','less','tailwind','bootstrap','material ui','chakra ui','styled components',
  'sql','mysql','postgresql','postgres','mongodb','redis','sqlite','mariadb','oracle','sql server','firebase','supabase','dynamodb','cassandra','elasticsearch',
  'graphql','rest','rest api','grpc','soap','apollo','prisma','typeorm','sequelize','mongoose',
  'aws','amazon web services','azure','gcp','google cloud','cloud','docker','kubernetes','k8s','terraform','ansible','jenkins','ci/cd','github actions','gitlab ci','circleci','travis','heroku','netlify','vercel','digitalocean',
  'git','github','gitlab','bitbucket','svn','linux','unix','windows','bash','powershell','shell','nginx','apache',
  'redux','redux toolkit','mobx','zustand','context api','vuex','pinia','ngrx','rxjs',
  'jest','mocha','chai','cypress','playwright','selenium','testing library','vitest','pytest','junit','phpunit','rspec',
  'webpack','vite','babel','esbuild','rollup','parcel','gulp','grunt','npm','yarn','pnpm',
  'figma','sketch','adobe xd','photoshop','illustrator','canva','zeplin','invision',
  'agile','scrum','kanban','jira','confluence','trello','asana','notion','slack','teams','discord',
  'machine learning','ml','deep learning','ai','artificial intelligence','data science','data analysis','tensorflow','pytorch','keras','nlp','computer vision','pandas','numpy','scikit-learn','jupyter',
  'devops','sre','monitoring','grafana','prometheus','datadog','new relic','sentry','logstash','kibana',
  'microservices','serverless','lambda','ec2','s3','rds','api gateway','cloudfront','route53','iam','vpc','cloudformation','cdk',
  'oauth','jwt','openid','saml','ssl','tls','cors','csrf','xss','sqli','owasp','security','authentication','authorization',
  'redux','mobx','rxjs','graphql','apollo','prisma','typeorm','sequelize','mongoose','redis','kafka','rabbitmq','pub/sub','grpc','rest','soap','jms','amqp','mqtt',
  'responsive','mobile first','cross-platform','pwa','spa','ssr','ssg','seo','a11y','i18n','l10n','performance','optimization','web vitals','lighthouse'
];

function runAnalysis() {
  const offer = document.getElementById('analysis-offer').value.toLowerCase();
  if (!offer.trim()) { alert('Collez d\'abord une offre d\'emploi.'); return; }

  const userSkills = [...document.querySelectorAll('#skills-list .skill-entry .skill-name')].map(el => el.value.toLowerCase().trim()).filter(Boolean);
  const found = new Set();
  TECH_KEYWORDS.forEach(kw => { if (offer.includes(kw)) found.add(kw); });

  const matched = [], missing = [];
  found.forEach(kw => {
    if (userSkills.some(s => s.includes(kw) || kw.includes(s))) matched.push(kw);
    else missing.push(kw);
  });

  document.getElementById('analysis-result').style.display = 'block';

  const matchEl = document.getElementById('analysis-match');
  matchEl.innerHTML = matched.length ? matched.map(k => '<span class="match">' + k + '</span>').join('') : '<span style="font-size:0.85rem;color:var(--text3)">Aucun mot-clé commun détecté</span>';

  const missEl = document.getElementById('analysis-miss');
  missEl.innerHTML = missing.length ? missing.map(k => '<span class="miss" onclick="addMissingSkill(\'' + esc(k) + '\')">+' + k + '</span>').join('') : '<span style="font-size:0.85rem;color:var(--text3)">Tous les mots-clés sont dans votre CV ✓</span>';

  const pct = found.size ? Math.round(matched.length / found.size * 100) : 0;
  const sumEl = document.getElementById('analysis-summary');
  const total = found.size;
  sumEl.style.background = pct >= 60 ? '#c6f6d5' : pct >= 30 ? '#fefcbf' : '#fed7d7';
  sumEl.style.color = pct >= 60 ? '#22543d' : pct >= 30 ? '#744210' : '#9b2c2c';
  sumEl.textContent = 'Correspondance : ' + matched.length + '/' + total + ' mots-clés (' + pct + '%)';

  showTab('analysis');
}

function addMissingSkill(name) {
  addSkill(name);
}

// ========== COVER LETTER ==========
function generateCoverLetter() {
  const name = document.getElementById('fullname').value.trim() || 'Votre Nom';
  const title = document.getElementById('title').value.trim() || 'Candidat';
  const email = document.getElementById('email').value.trim() || 'email@example.com';
  const phone = document.getElementById('phone').value.trim() || '';
  const addr = document.getElementById('address').value.trim() || '';
  const linkedin = document.getElementById('linkedin').value.trim() || '';
  const website = document.getElementById('website').value.trim() || '';

  const jobTitle = document.getElementById('job-title').value.trim() || '[Poste]';
  const company = document.getElementById('job-company').value.trim() || '[Entreprise]';
  const recruiter = document.getElementById('job-recruiter').value.trim();
  const offer = document.getElementById('job-description').value.toLowerCase();

  // Extract keywords from offer
  const offerKeywords = [];
  TECH_KEYWORDS.forEach(kw => { if (offer.includes(kw)) offerKeywords.push(kw); });

  const userSkills = [...document.querySelectorAll('#skills-list .skill-entry .skill-name')].map(el => el.value.trim()).filter(Boolean);

  const matchedSkills = userSkills.filter(s => offerKeywords.some(k => s.toLowerCase().includes(k) || k.includes(s.toLowerCase())));
  const missingSkills = offerKeywords.filter(k => !userSkills.some(s => s.toLowerCase().includes(k) || k.includes(s.toLowerCase())));

  const expEntries = [];
  document.querySelectorAll('#experience-list .entry').forEach(e => {
    const t = e.querySelector('.exp-title').value.trim();
    const c = e.querySelector('.exp-company').value.trim();
    if (t || c) expEntries.push({ title: t, company: c });
  });

  const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
  const salutation = recruiter ? 'Madame, Monsieur ' + recruiter + ',' : 'Madame, Monsieur,';

  const expText = expEntries.length > 0
    ? '<p>Fort d\'une expérience en tant que ' + expEntries.map(e => esc(e.title)).join(', ') + (expEntries[0] && expEntries[0].company ? ' au sein de ' + esc(expEntries[0].company) : '') + ', j\'ai développé des compétences solides qui correspondent aux exigences du poste de ' + esc(jobTitle) + '.</p>'
    : '<p>Particulièrement motivé par cette opportunité, je suis convaincu de pouvoir apporter une contribution significative à votre équipe.</p>';

  const skillsText = matchedSkills.length > 0
    ? '<p>Parmi mes compétences clés, je maîtrise notamment : <strong>' + matchedSkills.map(s => esc(s)).join(', ') + '</strong>. Ces atouts me permettront d\'être immédiatement opérationnel pour ce poste.</p>'
    : '';

  const missingText = missingSkills.length > 0 && matchedSkills.length > 0
    ? '<p>Je suis également en cours de renforcement sur ' + missingSkills.slice(0, 3).map(s => esc(s)).join(', ') + ', et je suis convaincu de pouvoir monter en compétence rapidement.</p>'
    : '';

  const letter = '<div class="cl-header"><div class="cl-name">' + esc(name) + '</div><div class="cl-info">' + esc(email) + (phone ? ' | ' + esc(phone) : '') + (addr ? ' | ' + esc(addr) : '') + '<br>' + esc(linkedin || '') + (website ? ' | ' + esc(website) : '') + '</div><div style="margin-top:4px;font-size:0.78rem;color:var(--text3)">' + esc(today) + '</div></div>' +
    '<div style="margin:16px 0"><strong>' + esc(company) + '</strong><br>Service des Ressources Humaines</div>' +
    '<div class="cl-subject">Objet : Candidature au poste de ' + esc(jobTitle) + '</div>' +
    '<div class="cl-body"><p>' + esc(salutation) + '</p>' +
    '<p>Actuellement à la recherche d\'une nouvelle opportunité professionnelle, je me permets de vous adresser ma candidature pour le poste de <strong>' + esc(jobTitle) + '</strong> au sein de <strong>' + esc(company) + '</strong>.</p>' +
    expText + skillsText + missingText +
    '<p>Je serais ravi de pouvoir vous rencontrer pour vous exposer plus en détail ma motivation et mon parcours. Dans l\'attente de votre retour, je vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.</p></div>' +
    '<div style="margin-top:24px"><strong>' + esc(name) + '</strong></div>';

  document.getElementById('cover-letter-content').innerHTML = letter;
  document.getElementById('cover-form-card').style.display = 'none';
  document.getElementById('cover-result').style.display = 'block';
  showTab('cover');
}

function backToCoverForm() {
  document.getElementById('cover-result').style.display = 'none';
  document.getElementById('cover-form-card').style.display = 'block';
}

// ========== PDF ==========
function exportPDF() {
  const el = document.getElementById('cv-content');
  const name = document.getElementById('fullname').value.trim() || 'candidat';
  genPDF(el, 'CV_' + name.replace(/\s+/g, '_') + '.pdf');
}

function exportCoverPDF() {
  const content = document.getElementById('cover-letter-content');
  const w = document.createElement('div');
  w.style.cssText = 'background:white;padding:40px;font-family:Arial,sans-serif;max-width:210mm;margin:0 auto';
  w.innerHTML = content.innerHTML;
  document.body.appendChild(w);
  genPDF(w, 'Lettre_Motivation_' + (document.getElementById('fullname').value.trim() || 'candidat').replace(/\s+/g, '_') + '.pdf');
  setTimeout(() => w.remove(), 1000);
}

function genPDF(el, filename) {
  const btn = document.querySelector('.top-action[title="Exporter PDF"]');
  if (btn) { btn.innerHTML = '...'; btn.style.opacity = '0.6'; }
  html2pdf().set({
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(el).save().then(() => {
    if (btn) { btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="12" y2="12"/><line x1="15" y1="15" x2="12" y2="12"/></svg>'; btn.style.opacity = '1'; }
  }).catch(() => {
    if (btn) { btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="12" y2="12"/><line x1="15" y1="15" x2="12" y2="12"/></svg>'; btn.style.opacity = '1'; }
  });
}

// ========== RESET ==========
function resetAll() {
  if (!confirm('Réinitialiser toutes les données ?')) return;
  document.querySelectorAll('#panel-personal input, #panel-personal textarea').forEach(el => { if (el.type !== 'file') el.value = ''; else el.value = ''; });
  ['experience-list','education-list','projects-list','skills-list','languages-list','certifications-list'].forEach(id => { document.getElementById(id).innerHTML = ''; });
  addExperience(); addEducation(); addProject(); addSkill(); addLanguage(); addCertification();
  document.getElementById('primary-color').value = '#1a365d';
  document.getElementById('accent-color').value = '#2b6cb0';
  document.getElementById('bg-color').value = '#f0f4f8';
  document.querySelector(':root').style.setProperty('--primary', '#1a365d');
  document.querySelector(':root').style.setProperty('--accent', '#2b6cb0');
  document.querySelector(':root').style.setProperty('--bg', '#f0f4f8');
  document.body.style.background = '#f0f4f8';
  document.querySelector('.preview-col').style.background = '#f0f4f8';
  document.getElementById('font-family').value = 'Arial, Helvetica, sans-serif';
  document.getElementById('cv-content').style.fontFamily = '';
  document.getElementById('cv-layout').value = 'single';
  document.getElementById('cv-content').classList.remove('two-column');
  document.getElementById('cv-template').value = 'professional';
  document.getElementById('cv-content').className = '';
  document.getElementById('show-photo-cv').checked = false;
  document.getElementById('cv-photo').innerHTML = '';
  document.getElementById('cv-photo').classList.remove('show');
  document.body.classList.remove('dark');
  backToCoverForm();
  document.getElementById('job-title').value = '';
  document.getElementById('job-company').value = '';
  document.getElementById('job-description').value = '';
  document.getElementById('job-recruiter').value = '';
  document.getElementById('analysis-offer').value = '';
  document.getElementById('analysis-result').style.display = 'none';
  try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
  updatePreview();
}

// ========== INIT ==========
// Build score breakdown
const CAT_NAMES = {
  personal:'Infos personnelles', summary:'Résumé', experience:'Expérience',
  education:'Formation', skills:'Compétences', languages:'Langues',
  certifications:'Certifications', ats:'Compatibilité ATS'
};
const grid = document.getElementById('score-breakdown');
for (const [k, name] of Object.entries(CAT_NAMES)) {
  grid.innerHTML +=
    '<div class="s-item" data-cat="' + k + '"><div class="s-item-h"><span>' + name + '</span><span class="pct">0%</span></div>' +
    '<div class="s-bar"><div class="s-fill" style="width:0%"></div></div><div class="s-item-d"></div></div>';
}

// Load saved data first
loadState();

// If no saved data, add default empty entries
const hasEntries = document.querySelectorAll('#experience-list .entry').length > 0;
if (!hasEntries) {
  addExperience(); addEducation(); addProject(); addSkill(); addLanguage(); addCertification();
}
updatePreview();
