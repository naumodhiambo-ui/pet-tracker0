(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const authView = $('#auth-view');
  const dashboardView = $('#dashboard-view');
  const authForm = $('#auth-form');
  const tokenKey = 'smartpet.local.demo.open';
  const petsKey = 'smartpet.demo.pets';
  let pets = [];
  let activePet = null;
  let deferredInstall = null;
  let toastTimer;

  const seedPet = () => ({
    id: 'demo-momo', name: 'Momo', breed: 'Mixed breed', age_years: 2,
    device: {id:'demo-device',device_code:'DEMO-ONLY',name:'Example tracker',battery_pct:84,last_seen_at:new Date().toISOString(),is_active:true}
  });
  function loadPets() {
    try {
      const saved = JSON.parse(localStorage.getItem(petsKey));
      return Array.isArray(saved) ? saved : [seedPet()];
    } catch (_) { return [seedPet()]; }
  }
  function savePets() { localStorage.setItem(petsKey, JSON.stringify(pets)); }

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    sessionStorage.setItem(tokenKey, 'open');
    await showDashboard();
  });

  function closeDashboard() {
    sessionStorage.removeItem(tokenKey);
    dashboardView.classList.add('hidden');
    authView.classList.remove('hidden');
    $('#logout-button').classList.add('hidden');
  }
  $('#logout-button').textContent = 'Close demo';
  $('#logout-button').addEventListener('click', closeDashboard);

  async function showDashboard() {
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    $('#logout-button').classList.remove('hidden');
    setConnection('Local demo', false);
    pets = loadPets();
    $('#greeting').textContent = 'Your local demo dashboard';
    const selectedId = sessionStorage.getItem('smartpet.active.pet');
    activePet = pets.find((pet) => pet.id === selectedId) || pets[0] || null;
    if (activePet) sessionStorage.setItem('smartpet.active.pet', activePet.id);
    renderPets();
    await loadPetData();
  }

  function showNotice(message) {
    const notice = $('#notice');
    notice.textContent = message;
    notice.classList.remove('hidden');
  }
  function hideNotice() { $('#notice').classList.add('hidden'); }

  function renderPets() {
    const list = $('#pet-list');
    list.replaceChildren();
    if (!pets.length) {
      const empty = document.createElement('div'); empty.className = 'empty-state';
      const title = document.createElement('h3'); title.textContent = 'Add your first pet';
      const desc = document.createElement('p'); desc.textContent = 'Pet profiles are saved only in this browser.';
      empty.append(title, desc); list.append(empty); return;
    }
    for (const pet of pets) {
      const card = document.createElement('div'); card.className = 'pet-card';
      const main = document.createElement('div'); main.className = 'pet-main';
      const avatar = document.createElement('div'); avatar.className = 'pet-avatar'; avatar.textContent = '🐾';
      const info = document.createElement('div');
      const name = document.createElement('div'); name.className = 'pet-name'; name.textContent = pet.name;
      const meta = document.createElement('div'); meta.className = 'pet-meta'; meta.textContent = [pet.breed, pet.age_years != null ? `${pet.age_years} years` : ''].filter(Boolean).join(' · ') || 'Local pet profile';
      info.append(name, meta); main.append(avatar, info); card.append(main);
      const select = document.createElement('button'); select.className = 'pet-select'; select.type = 'button';
      select.textContent = activePet?.id === pet.id ? 'Selected' : 'View';
      select.setAttribute('aria-pressed', String(activePet?.id === pet.id));
      select.addEventListener('click', async () => { activePet = pet; sessionStorage.setItem('smartpet.active.pet', pet.id); renderPets(); await loadPetData(); });
      card.append(select); list.append(card);
    }
  }

  async function loadPetData() {
    hideNotice();
    if (!activePet) { renderNoPet(); return; }
    renderSummary({
      device: activePet.device || null,
      latest: activePet.device ? {heart_rate:82,temperature:38.3,steps:1240,battery_pct:activePet.device.battery_pct,latitude:null,longitude:null,recorded_at:new Date().toISOString()} : null
    });
    renderAlerts([{id:'demo-alert',title:'Sample update',message:'This example alert is for demonstration only; it did not come from a tracker.',is_read:false,created_at:new Date().toISOString()}]);
  }

  function renderNoPet() {
    $('#device-status').textContent = 'No pet selected';
    $('#device-status').className = 'status-badge status-muted';
    const content = $('#device-content'); content.replaceChildren();
    const empty = document.createElement('div'); empty.className = 'empty-state';
    const icon = document.createElement('span'); icon.className = 'empty-icon'; icon.textContent = '⌁';
    const title = document.createElement('h3'); title.textContent = pets.length ? 'Choose a pet profile' : 'Create a pet profile first';
    const p = document.createElement('p'); p.textContent = 'This browser-only demo does not connect a tracker.';
    empty.append(icon,title,p); content.append(empty);
    $('#data-label').textContent = 'Demo only';
    $('#telemetry-content').classList.remove('hidden');
    $('#telemetry-metrics').classList.add('hidden');
    $('#telemetry-content').textContent = 'Add or select a pet to see example readings.';
    $('#alert-list').textContent = 'No sample alerts.';
    $('#alert-count').textContent = '0';
  }

  function metric(label, value, unit) {
    const box = document.createElement('div'); box.className = 'metric';
    const l = document.createElement('div'); l.className = 'metric-label'; l.textContent = label;
    const v = document.createElement('div'); v.className = 'metric-value'; v.textContent = value == null ? '—' : String(value);
    if (unit && value != null) { const u = document.createElement('span'); u.className = 'metric-unit'; u.textContent = unit; v.append(u); }
    box.append(l,v); return box;
  }

  function renderSummary(summary) {
    const device = summary.device;
    const content = $('#device-content'); content.replaceChildren();
    $('#device-status').textContent = device ? 'Demo tracker' : 'Not connected';
    $('#device-status').className = `status-badge ${device ? 'status-warn' : 'status-muted'}`;
    if (device) {
      content.append(metric('Example device', device.name, ''), metric('Sample battery', device.battery_pct, '%'), metric('Tracker connection', 'Simulation only', ''));
      const actions = document.createElement('div'); actions.className = 'device-actions';
      for (const label of ['Simulate locate','Simulate summon']) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'button button-secondary'; button.textContent = label;
        button.addEventListener('click', () => showToast('Demo only — nothing was sent to a tracker.'));
        actions.append(button);
      }
      content.append(actions);
    } else {
      const empty = document.createElement('div'); empty.className = 'empty-state';
      const title = document.createElement('h3'); title.textContent = 'No tracker connected';
      const p = document.createElement('p'); p.textContent = 'Device pairing is not available in this browser-only demo.';
      empty.append(title,p); content.append(empty);
    }
    $('#data-label').textContent = 'Sample data';
    const metrics = $('#telemetry-metrics'); metrics.replaceChildren();
    $('#telemetry-content').classList.add('hidden'); metrics.classList.remove('hidden');
    const latest = summary.latest;
    if (!latest) { $('#telemetry-content').classList.remove('hidden'); metrics.classList.add('hidden'); $('#telemetry-content').textContent = 'No sample readings available.'; return; }
    metrics.append(metric('Sample heart rate', latest.heart_rate, 'bpm'),metric('Sample temperature', latest.temperature, '°C'),metric('Example steps', latest.steps, ''),metric('Sample battery', latest.battery_pct, '%'));
    const stamp = document.createElement('div'); stamp.className = 'metric-label'; stamp.textContent = 'Illustrative values · not measured'; stamp.style.gridColumn = '1 / -1'; metrics.append(stamp);
  }

  function renderAlerts(alerts) {
    const list = $('#alert-list'); list.replaceChildren();
    $('#alert-count').textContent = '0';
    for (const alert of alerts) {
      const item = document.createElement('article'); item.className = 'alert-item';
      const title = document.createElement('div'); title.className = 'alert-title'; title.textContent = alert.title;
      const message = document.createElement('div'); message.className = 'alert-message'; message.textContent = alert.message;
      const time = document.createElement('div'); time.className = 'alert-time'; time.textContent = 'Example alert';
      item.append(title,message,time); list.append(item);
    }
  }

  function showPairForm() { showToast('Device pairing is not available in the standalone demo. No device code was saved.'); }
  $('#pair-button').addEventListener('click', showPairForm);
  $('#cancel-pair').addEventListener('click', () => $('#pair-form').classList.add('hidden'));
  $('#pair-form').addEventListener('submit', (event) => { event.preventDefault(); showPairForm(); event.currentTarget.reset(); event.currentTarget.classList.add('hidden'); });

  $('#add-pet-button').addEventListener('click', () => { $('#pet-form').classList.remove('hidden'); $('#pet-form').elements.name.focus(); });
  $('#cancel-pet').addEventListener('click', () => $('#pet-form').classList.add('hidden'));
  $('#pet-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const button = event.submitter; button.disabled = true;
    const newPet = {id:`local-${Date.now()}`,name:form.get('name').trim(),breed:form.get('breed').trim() || null,age_years:null,device:null};
    pets.push(newPet); savePets(); activePet = newPet; sessionStorage.setItem('smartpet.active.pet', newPet.id); renderPets(); event.currentTarget.reset(); event.currentTarget.classList.add('hidden'); showToast('Pet profile saved in this browser.'); await loadPetData(); button.disabled = false;
  });
  $('#refresh-button').addEventListener('click', async () => { $('#refresh-button').disabled = true; try { await showDashboard(); } finally { $('#refresh-button').disabled = false; } });

  function showToast(message) {
    const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
  }
  function setConnection(label, online) {
    const status = $('#connection'); status.classList.toggle('online', online);
    status.setAttribute('aria-label', label); status.replaceChildren(document.createElement('i'), document.createTextNode(` ${label}`));
  }
  setConnection('Ready to open local demo', false);
  window.addEventListener('online', () => { if (!token()) setConnection('Ready to open local demo', false); });
  window.addEventListener('offline', () => { if (!token()) setConnection('Offline · local demo available', false); });
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstall = event; $('#install-button').classList.remove('hidden'); });
  $('#install-button').addEventListener('click', async () => {
    if (!deferredInstall) { showToast('Use your browser menu and choose Install app or Add to Home Screen.'); return; }
    deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('#install-button').classList.add('hidden');
  });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }
  if (token()) showDashboard();
})();
