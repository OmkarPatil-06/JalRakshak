/* JalRakshak UX layer: quick actions, keyboard command palette, and accessible toasts. */
(() => {
  'use strict';
  const destinations = [
    { page:'dashboard', label:'Dashboard overview', icon:'bi-grid-1x2-fill', hint:'Home' },
    { page:'waterAnalysis', label:'Water quality analysis', icon:'bi-bar-chart-line-fill', hint:'Trends & parameters' },
    { page:'map', label:'Monitoring map', icon:'bi-geo-alt-fill', hint:'Locations' },
    { page:'waterbodies', label:'Waterbody Intelligence', icon:'bi-water', hint:'Database monitoring locations' },
    { page:'alerts', label:'Alerts management', icon:'bi-exclamation-triangle-fill', hint:'Review risks' },
    { page:'responses', label:'Response management', icon:'bi-clipboard-check-fill', hint:'Track actions' },
    { page:'citizenReports', label:'Citizen reports', icon:'bi-people-fill', hint:'Community reports' },
    { page:'reports', label:'Reports & exports', icon:'bi-file-earmark-bar-graph-fill', hint:'Generate reports' },
    { page:'settings', label:'Settings', icon:'bi-gear-fill', hint:'Preferences' },
    { page:'help', label:'Help & support', icon:'bi-life-preserver', hint:'Troubleshooting' }
  ];
  let palette, input, toastRegion;
  function el(tag, cls, text) { const n=document.createElement(tag); if(cls)n.className=cls; if(text!==undefined)n.textContent=text; return n; }
  function toast(message, icon='bi-check-circle-fill') {
    if (!toastRegion) { toastRegion=el('div','jr-toast-region'); toastRegion.setAttribute('aria-live','polite'); document.body.appendChild(toastRegion); }
    const item=el('div','jr-toast'); const ico=el('i'); ico.className='bi '+icon; ico.setAttribute('aria-hidden','true'); item.append(ico,el('div','',message)); toastRegion.appendChild(item);
    window.setTimeout(()=>{ item.style.opacity='0'; item.style.transform='translateY(6px)'; window.setTimeout(()=>item.remove(),220); },3600);
  }
  function go(page) {
    if (typeof window.showPage === 'function') window.showPage(page);
    else document.querySelector(`[data-page="${page}"]`)?.click();
    closePalette();
  }
  function closePalette() { if (palette) { palette.remove(); palette=null; input=null; } }
  function openPalette() {
    if (palette) { input?.focus(); return; }
    const backdrop=el('div','jr-palette-backdrop'); backdrop.setAttribute('role','presentation');
    const dialog=el('div','jr-palette'); dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true'); dialog.setAttribute('aria-label','Quick navigation');
    const search=el('div','jr-palette-search'); const icon=el('i'); icon.className='bi bi-search'; icon.setAttribute('aria-hidden','true');
    input=el('input'); input.type='search'; input.placeholder='Search pages and actions…'; input.setAttribute('aria-label','Search pages'); input.autocomplete='off';
    const esc=el('button','icon-button','Esc'); esc.type='button'; esc.style.padding='5px 9px'; esc.addEventListener('click',closePalette); search.append(icon,input,esc);
    const list=el('div','jr-palette-list');
    function render(q='') { list.replaceChildren(); const query=q.trim().toLowerCase(); const rows=destinations.filter(d=>(d.label+' '+d.hint+' '+d.page).toLowerCase().includes(query));
      if(!rows.length){list.appendChild(el('div','p-3 text-secondary','No matching pages. Try “map”, “alerts”, or “reports”.'));return;}
      rows.forEach(d=>{const b=el('button','jr-palette-item');b.type='button';const i=el('i');i.className='bi '+d.icon;const title=el('span','',d.label);const hint=el('small','',d.hint);b.append(i,title,hint);b.addEventListener('click',()=>go(d.page));list.appendChild(b);}); }
    input.addEventListener('input',()=>render(input.value)); backdrop.addEventListener('click',e=>{if(e.target===backdrop)closePalette();});
    const footer=el('div','jr-palette-footer'); footer.append(el('span','','Enter to open · Esc to close'),el('span','','JalRakshak quick navigation'));
    dialog.append(search,list,footer); backdrop.appendChild(dialog); document.body.appendChild(backdrop); palette=backdrop; render(); input.focus();
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=list.querySelector('button');if(first)first.click();}if(e.key==='Escape')closePalette();});
  }
  function addQuickbar() {
    const container=document.querySelector('.page-container'); if(!container||document.querySelector('.jr-quickbar'))return;
    const bar=el('div','jr-quickbar'); bar.setAttribute('aria-label','Quick actions');
    bar.appendChild(el('span','jr-quickbar-label','Quick access'));
    const actions=[['map','bi-geo-alt','Open monitoring map'],['waterbodies','bi-water','Waterbody intelligence'],['citizenReports','bi-plus-circle','Citizen report'],['reports','bi-file-earmark-bar-graph','Create report']];
    actions.forEach(([page,icon,label])=>{const b=el('button','jr-quick-action');b.type='button';const i=el('i');i.className='bi '+icon;i.setAttribute('aria-hidden','true');b.append(i,document.createTextNode(label));b.addEventListener('click',()=>go(page));bar.appendChild(b);});
    bar.appendChild(el('span','jr-quick-spacer'));
    const chip=el('span','jr-live-chip');chip.append(el('span','jr-live-dot'),document.createTextNode('Workspace ready'));bar.appendChild(chip);
    container.insertBefore(bar,container.firstElementChild);
  }
  function setup() {
    addQuickbar();
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette();}if(e.key==='Escape')closePalette();});
    const title=document.querySelector('.page-heading h1'); if(title&&!title.dataset.jrTitleObserver){title.dataset.jrTitleObserver='1';const observer=new MutationObserver(()=>{const bar=document.querySelector('.jr-quickbar');if(bar)bar.querySelector('.jr-live-chip')?.setAttribute('title','Use Ctrl+K to jump to any page');});observer.observe(title,{childList:true,subtree:true,characterData:true});}
    const refresh=document.getElementById('refreshButton'); if(refresh)refresh.title='Refresh current data (or press Ctrl+R)';
    if(refresh && !document.getElementById('jrCommandButton')) { const command=el('button','icon-button'); command.id='jrCommandButton'; command.type='button'; command.title='Quick navigation (Ctrl+K)'; command.setAttribute('aria-label','Open quick navigation'); const ci=el('i'); ci.className='bi bi-search'; command.appendChild(ci); command.addEventListener('click',openPalette); refresh.parentNode.insertBefore(command,refresh); }
    document.querySelectorAll('.nav-item').forEach(a=>{a.addEventListener('dblclick',e=>{e.preventDefault();openPalette();});});
    document.addEventListener('click',e=>{const button=e.target.closest('#viewAllAlertsButton');if(button)toast('Opening alerts management.','bi-exclamation-triangle');});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
  window.JalRakshakUX={toast,openPalette,navigate:go};
})();
