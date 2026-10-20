(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const authView = $('#auth-view');
  const dashboardView = $('#dashboard-view');
  const authForm = $('#auth-form');
  const apiInput = $('#api-url');
  const tokenKey = 'smartpet.session.token';
  const apiKey = 'smartpet.api.url';
  let authMode = 'login';
  let pets = [];
  let activePet = null;
  let deferredInstall = null;
  let toastTimer;

  apiInput.value = localStorage.getItem(apiKey) || `${location.protocol}//${location.hostname}:8000`;
  apiInput.addEventListener('change', () => localStorage.setItem(apiKey, apiInput.value.trim().replace(/\/$/, '')));
  const apiBase = () => (apiInput.value.trim() || `${location.protocol}//${location.hostname}:8000`).replace(/\/$/, '');
  const token = () => sessionStorage.getItem(tokenKey);

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    if (token()) headers.set('Authorization', `Bearer ${token()}`);
    let response;
    try {
      response = await fetch(`${apiBase()}${path}`, {...options, headers, cache: 'no-store'});
    } catch (_) {
      throw new Error('Cannot reach the SmartPet API. Check its address, that the backend is running, and its CORS configuration.');
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) signOut(false);
      const detail = body.detail;
      throw new Error(typeof detail === 'string' ? detail : `Request failed (${response.status}).`);
    }
    return body;
  }

  function setAuthMode(mode) {
    authMode = mode;
    const isSignup = mode === 'signup';
    $('#login-tab').classList.toggle('active', !isSignup);
    $('#signup-tab').classList.toggle('active', isSignup);
    $('#login-tab').setAttribute('aria-selected', String(!isSignup));
    $('#signup-tab').setAttribute('aria-selected', String(isSignup));
    $('#name-fields').classList.toggle('hidden', !isSignup);
    for (const input of $('#name-fields').querySelectorAll('input')) input.required = isSignup;
    authForm.elements.password.autocomplete = isSignup ? 'new-password' : 'current-password';
    $('#auth-submit').innerHTML = isSignup ? 'Create account <span aria-hidden="true">→</span>' : 'Sign in <span aria-hidden="true">→</span>';
    $('#auth-error').classList.add('hidden');
  }
  $('#login-tab').addEventListener('click', () => setAuthMode('login'));
  $('#signup-tab').addEventListener('click', () => setAuthMode('signup'));

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(authForm);
    const submit = $('#auth-submit');
    const error = $('#auth-error');
    submit.disabled = true;
    error.classList.add('hidden');
    try {
      if (authMode === 'signup') {
        await request('/signup', {method:'POST', body:JSON.stringify({first_name:form.get('first_name').trim(),last_name:form.get('last_name').trim(),email:form.get('email').trim(),password:form.get('password')})});
        setAuthMode('login');
        showToast('Account created. Sign in to continue.');
      } else {
        const result = await request('/signin', {method:'POST', body:JSON.stringify({email:form.get('email').trim(),password:form.get('password')})});
        sessionStorage.setItem(tokenKey, result.access_token);
        await showDashboard();
      }
    } catch (err) {
      error.textContent = err.message;
      error.classList.remove('hidden');
    } finally { submit.disabled = false; }
  });

  function signOut(showMessage = true) {
    sessionStorage.removeItem(tokenKey);
    pets = [];
    activePet = null;
    dashboardView.classList.add('hidden');
    authView.classList.remove('hidden');
    $('#logout-button').classList.add('hidden');
    $('#auth-error').classList.add('hidden');
    if (showMessage) showToast('You are signed out.');
  }
  $('#logout-button').addEventListener('click', () => signOut());

  async function showDashboard() {
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    $('#logout-button').classList.remove('hidden');
    setConnection(navigator.onLine ? 'Connecting…' : 'Offline', navigator.onLine);
    try {
      const [me, petRows] = await Promise.all([request('/api/me'), request('/api/pets')]);
      setConnection('API connected', true);
      pets = petRows;
      $('#greeting').textContent = `Welcome back${me.first_name ? `, ${me.first_name}` : ''}.`;
      activePet = pets.find((pet) => pet.id === sessionStorage.getItem('smartpet.active.pet')) || pets[0] || null;
      if (activePet) sessionStorage.setItem('smartpet.active.pet', activePet.id);
      else sessionStorage.removeItem('smartpet.active.pet');
      renderPets();
      await loadPetData();
    } catch (err) {
      if (!token()) return;
      setConnection(navigator.onLine ? 'API unavailable' : 'Offline', false);
      showNotice(err.message);
    }
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
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const title = document.createElement('h3'); title.textContent = 'Add your first pet';
      const desc = document.createElement('p'); desc.textContent = 'Create a profile to start organizing SmartPet activity.';
      empty.append(title, desc); list.append(empty); return;
    }
    for (const pet of pets) {
      const card = document.createElement('div'); card.className = 'pet-card';
      const main = document.createElement('div'); main.className = 'pet-main';
      const avatar = document.createElement('div'); avatar.className = 'pet-avatar'; avatar.textContent = '🐾';
      const info = document.createElement('div');
      const name = document.createElement('div'); name.className = 'pet-name'; name.textContent = pet.name;
      const meta = document.createElement('div'); meta.className = 'pet-meta'; meta.textContent = [pet.breed, pet.age_years != null ? `${pet.age_years} years` : ''].filter(Boolean).join(' · ') || 'Pet profile';
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
    $('#device-content').innerHTML = '<div class="skeleton"></div>';
    $('#telemetry-metrics').classList.add('hidden');
    $('#telemetry-content').classList.remove('hidden');
    $('#telemetry-content').innerHTML = '<div class="skeleton"></div>';
    try {
      const [summary, alerts] = await Promise.all([
        request(`/api/pets/${encodeURIComponent(activePet.id)}/summary`),
        request(`/api/pets/${encodeURIComponent(activePet.id)}/alerts`)
      ]);
      renderSummary(summary);
      renderAlerts(alerts);
    } catch (err) { showNotice(err.message); renderNoPet(); }
  }

  function renderNoPet() {
    $('#device-status').textContent = 'No pet selected';
    $('#device-status').className = 'status-badge status-muted';
    const content = $('#device-content'); content.replaceChildren();
    const empty = document.createElement('div'); empty.className = 'empty-state';
    const icon = document.createElement('span'); icon.className = 'empty-icon'; icon.textContent = '⌁';
    const title = document.createElement('h3'); title.textContent = pets.length ? 'Choose a pet profile' : 'Create a pet profile first';
    const p = document.createElement('p'); p.textContent = 'Tracker and telemetry details are linked to a pet.';
    empty.append(icon,title,p); content.append(empty);
    $('#telemetry-content').textContent = 'Choose or create a pet profile to view activity.';
    $('#alert-list').textContent = 'No pet selected.';
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
    if (!device) {
      $('#device-status').textContent = 'Not paired'; $('#device-status').className = 'status-badge status-muted';
      const empty = document.createElement('div'); empty.className = 'empty-state';
      const icon = document.createElement('span'); icon.className = 'empty-icon'; icon.textContent = '⌁';
      const title = document.createElement('h3'); title.textContent = 'Connect a tracker';
      const p = document.createElement('p'); p.textContent = 'Pair a device to view battery, last check-in and telemetry.';
      const button = document.createElement('button'); button.className = 'button button-secondary'; button.type = 'button'; button.textContent = 'Pair tracker'; button.addEventListener('click', showPairForm);
      empty.append(icon,title,p,button); content.append(empty);
    } else {
      const online = !!device.last_seen_at && (Date.now() - Date.parse(device.last_seen_at) < 5 * 60 * 1000);
      $('#device-status').textContent = !device.is_active ? 'Inactive' : online ? 'Recently seen' : 'No recent check-in';
      $('#device-status').className = `status-badge ${device.is_active && online ? 'status-good' : 'status-warn'}`;
      content.append(metric('Tracker name', device.name || device.device_code, ''), metric('Battery', device.battery_pct, '%'), metric('Last check-in', device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Not yet seen', ''));
      if (device.is_active) {
        const actions = document.createElement('div'); actions.className = 'device-actions';
        for (const [command,label] of [['locate','Request location'],['summon','Summon']]) {
          const button = document.createElement('button'); button.type = 'button'; button.className = 'button button-secondary'; button.textContent = label;
          button.addEventListener('click', () => sendCommand(device.id, command)); actions.append(button);
        }
        content.append(actions);
      }
    }
    const latest = summary.latest;
    const metrics = $('#telemetry-metrics'); metrics.replaceChildren();
    if (!latest) {
      $('#data-label').textContent = 'Waiting for data';
      $('#telemetry-content').textContent = 'No telemetry received yet. Demo mode is not enabled in this PWA; connect the simulator or a provisioned tracker.';
      return;
    }
    $('#data-label').textContent = 'Backend history';
    $('#telemetry-content').classList.add('hidden'); metrics.classList.remove('hidden');
    metrics.append(metric('Heart rate', latest.heart_rate, 'bpm'),metric('Temperature', latest.temperature, '°C'),metric('Steps', latest.steps, ''),metric('Battery', latest.battery_pct ?? device?.battery_pct, '%'));
    const lat = Number(latest.latitude), lon = Number(latest.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const link = document.createElement('a'); link.className = 'map-link'; link.href = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lon)}#map=16/${encodeURIComponent(lat)}/${encodeURIComponent(lon)}`; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = `View last coordinates (${lat.toFixed(5)}, ${lon.toFixed(5)}) ↗`; metrics.append(link);
    }
    const stamp = document.createElement('div'); stamp.className = 'metric-label'; stamp.textContent = latest.recorded_at ? `Recorded ${new Date(latest.recorded_at).toLocaleString()}` : 'Timestamp unavailable'; stamp.style.gridColumn = '1 / -1'; metrics.append(stamp);
  }

  function renderAlerts(alerts) {
    const list = $('#alert-list'); list.replaceChildren();
    $('#alert-count').textContent = String(alerts.filter((alert) => !alert.is_read).length);
    if (!alerts.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No alerts yet.'; list.append(p); return; }
    for (const alert of alerts.slice(0,5)) {
      const item = document.createElement('article'); item.className = 'alert-item';
      const title = document.createElement('div'); title.className = 'alert-title'; title.textContent = `${alert.is_read ? '' : '● '}${alert.title}`;
      const message = document.createElement('div'); message.className = 'alert-message'; message.textContent = alert.message;
      const time = document.createElement('div'); time.className = 'alert-time'; time.textContent = new Date(alert.created_at).toLocaleString();
      item.append(title,message,time); list.append(item);
    }
  }

  async function sendCommand(deviceId, command) {
    try {
      const result = await request(`/api/pets/${encodeURIComponent(activePet.id)}/devices/${encodeURIComponent(deviceId)}/commands?command=${encodeURIComponent(command)}`, {method:'POST'});
      showToast(`${result.command} command accepted for publishing. Device receipt or execution is not confirmed.`);
    } catch (err) { showToast(err.message); }
  }

  function showPairForm() { $('#pair-form').classList.remove('hidden'); }
  $('#pair-button').addEventListener('click', showPairForm);
  $('#cancel-pair').addEventListener('click', () => $('#pair-form').classList.add('hidden'));
  $('#pair-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!activePet) return showToast('Create or select a pet profile first.');
    const button = event.submitter; button.disabled = true;
    try {
      await request(`/api/pets/${encodeURIComponent(activePet.id)}/devices`, {method:'POST',body:JSON.stringify({device_code:new FormData(event.currentTarget).get('device_code').trim(),name:'SmartPet Tracker'})});
      event.currentTarget.reset(); event.currentTarget.classList.add('hidden'); showToast('Tracker paired.'); await loadPetData();
    } catch (err) { showToast(err.message); }
    finally { button.disabled = false; }
  });

  $('#add-pet-button').addEventListener('click', () => { $('#pet-form').classList.remove('hidden'); $('#pet-form').elements.name.focus(); });
  $('#cancel-pet').addEventListener('click', () => $('#pet-form').classList.add('hidden'));
  $('#pet-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const button = event.submitter; button.disabled = true;
    try {
      const newPet = await request('/api/pets', {method:'POST',body:JSON.stringify({name:form.get('name').trim(),breed:form.get('breed').trim() || null})});
      pets.push(newPet); activePet = newPet; sessionStorage.setItem('smartpet.active.pet', newPet.id); renderPets(); event.currentTarget.reset(); event.currentTarget.classList.add('hidden'); showToast('Pet profile added.'); await loadPetData();
    } catch (err) { showToast(err.message); }
    finally { button.disabled = false; }
  });
  $('#refresh-button').addEventListener('click', async () => { $('#refresh-button').disabled = true; try { await showDashboard(); } finally { $('#refresh-button').disabled = false; } });

  function showToast(message) {
    const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
  }

  function setConnection(label, online) {
    const status = $('#connection');
    status.classList.toggle('online', online);
    status.setAttribute('aria-label', label);
    status.replaceChildren(document.createElement('i'), document.createTextNode(` ${label}`));
  }
  setConnection(navigator.onLine ? 'Network online' : 'Offline', navigator.onLine);
  window.addEventListener('online', () => setConnection('Network online', true));
  window.addEventListener('offline', () => setConnection('Offline', false));
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstall = event; $('#install-button').classList.remove('hidden'); });
  $('#install-button').addEventListener('click', async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('#install-button').classList.add('hidden');
  });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }
  if (token()) showDashboard();
})();
