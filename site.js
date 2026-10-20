(() => {
  'use strict';
  const petSamples = {
    momo: {name:'Momo',caption:'Ready for a sniffari',steps:'2,480',mood:'Tail-wagging',emoji:'🐕'},
    luna: {name:'Luna',caption:'On window-watch duty',steps:'1,126',mood:'Purr-fectly calm',emoji:'🐈'},
    pip: {name:'Pip',caption:'A tiny hop at a time',steps:'860',mood:'Bunny business',emoji:'🐇'}
  };
  const storySamples = {
    profiles:{icon:'🐾',kicker:'MAKE IT YOURS',title:'A spot for every pet.',copy:'Add pet profiles in the dashboard and switch between them. They stay saved in this browser on this device.'},
    activity:{icon:'✨',kicker:'A DASHBOARD PREVIEW',title:'See the story in a glance.',copy:'The dashboard shows sample activity and alerts so you can explore the layout. Values are examples, not device readings.'},
    install:{icon:'📲',kicker:'READY WHEN YOU ARE',title:'Take the demo with you.',copy:'Install SmartPet on a supported browser. The app shell can open offline after your first visit; saved profiles stay on this device.'}
  };
  const $ = (selector) => document.querySelector(selector);
  document.querySelectorAll('.pet-choice').forEach((button) => button.addEventListener('click', () => {
    const pet = petSamples[button.dataset.pet];
    document.querySelectorAll('.pet-choice').forEach((item) => {const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
    $('#sample-card').dataset.theme=button.dataset.pet;
    $('#sample-avatar').textContent=pet.emoji; $('#sample-name').textContent=pet.name; $('#sample-caption').textContent=pet.caption;
    $('#sample-steps').textContent=pet.steps; $('#sample-mood').textContent=pet.mood;
  }));
  document.querySelectorAll('.story-tab').forEach((button) => button.addEventListener('click', () => {
    const story=storySamples[button.dataset.story];
    document.querySelectorAll('.story-tab').forEach((item)=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-selected',String(active));});
    $('#story-icon').textContent=story.icon; $('#story-kicker').textContent=story.kicker; $('#story-panel-title').textContent=story.title; $('#story-panel-copy').textContent=story.copy;
  }));
  const menuButton=$('#menu-button');
  menuButton.addEventListener('click',()=>{const nav=document.querySelector('.site-nav');const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
  document.querySelectorAll('.site-nav a').forEach((link)=>link.addEventListener('click',()=>{document.querySelector('.site-nav').classList.remove('open');menuButton.setAttribute('aria-expanded','false');}));
  const dialog=$('#install-dialog'); let installPrompt=null;
  window.addEventListener('beforeinstallprompt',(event)=>{event.preventDefault();installPrompt=event;$('#install-open').classList.add('install-ready');});
  $('#install-open').addEventListener('click',async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;}else dialog.showModal();});
  $('#install-close').addEventListener('click',()=>dialog.close());
  $('#install-confirm').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',(event)=>{if(event.target===dialog)dialog.close();});
  if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
})();
