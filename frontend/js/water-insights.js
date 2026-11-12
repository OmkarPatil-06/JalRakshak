/* JalRakshak: database-backed waterbody history, trend estimates and provenance.
 * Forecasts are transparent linear extrapolations, not a trained/validated AI model.
 */
(() => {
  const API = `${window.location.protocol}//${window.location.hostname}:8080/api`;
  const $ = id => document.getElementById(id);
  const state = { locations: [], records: [], historyChart: null, predictionChart: null, initialized: false, reviewRecord: null, allRecords: [], verificationListenersAttached: false };
  const metrics = {
    ph: { label: 'pH', unit: '', digits: 2 },
    dissolvedOxygen: { label: 'Dissolved oxygen', unit: 'mg/L', digits: 2 },
    bod: { label: 'BOD', unit: 'mg/L', digits: 2 },
    cod: { label: 'COD', unit: 'mg/L', digits: 2 },
    turbidity: { label: 'Turbidity', unit: 'NTU', digits: 2 },
    tds: { label: 'TDS', unit: 'mg/L', digits: 1 },
    temperature: { label: 'Temperature', unit: '°C', digits: 1 },
    conductivity: { label: 'Conductivity', unit: '', digits: 1 }
  };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateOf = r => r.recordedAt ? new Date(r.recordedAt) : null;
  const fmtDate = v => { const d = v instanceof Date ? v : new Date(v); return Number.isNaN(d.getTime()) ? 'Date not recorded' : d.toLocaleString(); };
  const fmt = (v, digits=2) => v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? '—' : Number(v).toFixed(digits);
  const safeUrl = value => { try { const u = new URL(value); return ['http:','https:'].includes(u.protocol) ? u.href : ''; } catch (_) { return ''; } };

  async function getJson(url) {
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${url}`);
    return response.json();
  }

  async function initialize() {
    if (state.initialized) return;
    state.initialized = true;
    $('wiRefresh')?.addEventListener('click', loadSelected);
    $('wiLocation')?.addEventListener('change', loadSelected);
    $('wiHistoryMetric')?.addEventListener('change', renderHistory);
    try {
      state.locations = await getJson(`${API}/locations`);
      const select = $('wiLocation');
      if (!Array.isArray(state.locations) || !state.locations.length) {
        select.innerHTML = '<option value="">No waterbodies returned by the API</option>';
        setMessage('wiHistoryMessage', 'No waterbody records were returned by /api/locations.');
        initializeVerificationManagement();
        return;
      }
      select.innerHTML = '<option value="">Choose a waterbody…</option>' + state.locations
        .slice().sort((a,b) => String(a.locationName).localeCompare(String(b.locationName)))
        .map(l => `<option value="${Number(l.locationId)}">${esc(l.locationName)}${l.city ? ` — ${esc(l.city)}` : ''}</option>`).join('');
      const params = new URLSearchParams(window.location.search);
      const requested = params.get('locationId');
      if (requested && state.locations.some(l => String(l.locationId) === requested)) select.value = requested;
      else if (state.locations.length === 1) select.value = String(state.locations[0].locationId);
      if (select.value) await loadSelected();
      initializeVerificationManagement();
    } catch (error) {
      console.error('Waterbody history initialization failed:', error);
      $('wiLocation').innerHTML = '<option value="">Could not load waterbodies</option>';
      setMessage('wiHistoryMessage', `Could not load /api/locations. ${error.message}`);
      initializeVerificationManagement();
    }
  }

  async function loadSelected() {
    const id = $('wiLocation')?.value;
    if (!id) {
      state.records = [];
      renderAll();
      setMessage('wiHistoryMessage', 'Choose a waterbody to load recorded observations.');
      return;
    }
    setMessage('wiHistoryMessage', 'Loading verified database observations…');
    try {
      const data = await getJson(`${API}/sensor-data/location/${encodeURIComponent(id)}/verified`);
      state.records = Array.isArray(data) ? data.filter(r => r && r.recordedAt && String(r.verificationStatus || '').toUpperCase() === 'VERIFIED' && r.sourceName && safeUrl(r.sourceUrl) && r.sampleMethod && r.evidenceReference).sort((a,b) => new Date(a.recordedAt)-new Date(b.recordedAt)) : [];
      renderAll();
    } catch (error) {
      console.error('Sensor history request failed:', error);
      state.records = [];
      renderAll();
      setMessage('wiHistoryMessage', `Could not load sensor history. ${error.message}`);
    }
  }

  function renderAll() {
    const rows = state.records;
    const latest = rows.length ? rows[rows.length-1] : null;
    const verified = rows.filter(r => String(r.verificationStatus || '').toUpperCase() === 'VERIFIED').length;
    $('wiRecordCount').textContent = String(rows.length);
    $('wiLatestDate').textContent = latest ? fmtDate(latest.recordedAt) : '—';
    $('wiVerifiedCount').textContent = String(verified);
    $('wiPredictionState').textContent = rows.length >= 3 ? 'Assessing data' : 'Insufficient data';
    renderHistory();
    renderPredictions();
    renderProvenance();
    renderObservations();
  }

  function renderHistory() {
    const rows = state.records;
    const key = $('wiHistoryMetric')?.value || 'ph';
    const valid = rows.filter(r => r[key] !== null && r[key] !== undefined && Number.isFinite(Number(r[key])));
    const canvas = $('wiHistoryChart');
    if (!canvas || !window.Chart) { setMessage('wiHistoryMessage', 'Chart library unavailable. The observations table remains available below.'); return; }
    if (state.historyChart) state.historyChart.destroy();
    if (!valid.length) { state.historyChart = null; canvas.style.display='none'; setMessage('wiHistoryMessage', `No verified ${metrics[key].label} values exist for this waterbody.`); return; }
    canvas.style.display='block';
    state.historyChart = new Chart(canvas, { type:'line', data:{ labels:valid.map(r=>fmtDate(r.recordedAt)), datasets:[{label:`${metrics[key].label}${metrics[key].unit ? ` (${metrics[key].unit})` : ''}`,data:valid.map(r=>Number(r[key])),borderColor:'#167d8d',backgroundColor:'rgba(22,125,141,.12)',fill:true,tension:.2,pointRadius:3}]}, options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:true},tooltip:{callbacks:{afterBody:(items)=>{const r=valid[items[0]?.dataIndex];return r ? `Record #${r.sensorDataId ?? '—'} · ${String(r.verificationStatus||'UNVERIFIED').toUpperCase()}` : '';}}}},scales:{x:{ticks:{maxTicksLimit:7}},y:{title:{display:true,text:metrics[key].unit || metrics[key].label}}}} });
    setMessage('wiHistoryMessage', `${valid.length} recorded ${metrics[key].label} observation(s). These are VERIFIED database entries with source and evidence metadata.`);
  }

  function linearProjection(records, key) {
    const pts = records.filter(r => r.recordedAt && r[key] !== null && r[key] !== undefined && Number.isFinite(Number(r[key])))
      .map(r => ({ t:new Date(r.recordedAt).getTime(), y:Number(r[key]) })).filter(p=>Number.isFinite(p.t));
    const uniqueDates = new Set(pts.map(p=>new Date(p.t).toISOString().slice(0,10)));
    if (pts.length < 3 || uniqueDates.size < 3) return null;
    const origin = pts[0].t, xs = pts.map(p=>(p.t-origin)/86400000), ys=pts.map(p=>p.y);
    const mx=xs.reduce((a,b)=>a+b,0)/xs.length, my=ys.reduce((a,b)=>a+b,0)/ys.length;
    const denom=xs.reduce((a,x)=>a+(x-mx)**2,0);
    if (!denom) return null;
    const slope=xs.reduce((a,x,i)=>a+(x-mx)*(ys[i]-my),0)/denom;
    const latest=pts[pts.length-1], latestX=(latest.t-origin)/86400000;
    const predicted=latest.y+slope*7;
    const mean=ys.reduce((a,b)=>a+b,0)/ys.length;
    const ssTot=ys.reduce((a,y)=>a+(y-mean)**2,0);
    const intercept=my-slope*mx;
    const ssRes=xs.reduce((a,x,i)=>a+(ys[i]-(intercept+slope*x))**2,0);
    const r2=ssTot===0 ? 0 : Math.max(0,Math.min(1,1-ssRes/ssTot));
    return { count:pts.length, latest:latest.y, predicted, slope, r2, latestDate:new Date(latest.t), forecastDate:new Date(latest.t+7*86400000) };
  }

  function renderPredictions() {
    const keys=['bod','cod','turbidity','dissolvedOxygen','tds','ph'];
    const projections=keys.map(key=>({key,...(linearProjection(state.records,key)||{})})).filter(x=>x.predicted!==undefined);
    const box=$('wiPredictionSummary');
    if (!projections.length) {
      box.innerHTML='<strong>Not enough data to estimate a trend.</strong><p>For each parameter, add at least three valid observations on three distinct dates. The application will not invent missing readings or fill gaps with synthetic values.</p>';
      $('wiPredictionState').textContent='Insufficient data';
      if(state.predictionChart){state.predictionChart.destroy();state.predictionChart=null;}
      return;
    }
    $('wiPredictionState').textContent=`${projections.length} parameters`;
    const ageDays = Math.floor((Date.now() - projections[0].latestDate.getTime()) / 86400000);
    const freshnessWarning = ageDays > 30 ? `<p class="wi-stale-warning">Latest observation is ${ageDays} days old. The projection is anchored to the last sample date and must not be treated as a current forecast.</p>` : '';
    box.innerHTML=`<div class="wi-forecast-date">Projection target: ${esc(fmtDate(projections[0].forecastDate))}</div>${freshnessWarning}<div class="wi-forecast-grid">${projections.map(p=>{
      const m=metrics[p.key], delta=p.predicted-p.latest;
      const direction=Math.abs(delta)<Math.max(.01,Math.abs(p.latest)*.02)?'Approximately stable':delta>0?'Projected increase':'Projected decrease';
      const caution=p.key==='dissolvedOxygen'?(delta<0?'Potentially concerning direction; confirm with sampling.':'Direction alone does not establish water quality.'):(['bod','cod','turbidity','tds'].includes(p.key)&&delta>0?'Potentially concerning direction; confirm with sampling.':'Direction alone does not establish water quality.');
      return `<div class="wi-forecast-item"><span>${esc(m.label)}</span><strong>${fmt(p.predicted,m.digits)} ${esc(m.unit)}</strong><small>${direction} · from ${fmt(p.latest,m.digits)}</small><small>${esc(caution)}</small><small>Trend fit R² ${p.r2.toFixed(2)} · ${p.count} records</small></div>`;
    }).join('')}</div>`;
    const labels=projections.map(p=>p.key.toUpperCase());
    if (window.Chart && $('wiPredictionChart')) {
      if(state.predictionChart)state.predictionChart.destroy();
      state.predictionChart=new Chart($('wiPredictionChart'),{type:'bar',data:{labels,datasets:[{label:'Estimated 7-day change (%)',data:projections.map(p=>p.latest===0?0:((p.predicted-p.latest)/Math.abs(p.latest))*100),backgroundColor:'#d99a43'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'},tooltip:{callbacks:{afterBody:()=> 'Percent change is used because the parameters have different measurement units.'}}},scales:{y:{beginAtZero:false,title:{display:true,text:'Change (%)'}}}}});
    }
  }

  function renderProvenance() {
    const body=$('wiProvenanceBody');
    if(!state.records.length){body.innerHTML='<tr><td colspan="6">No VERIFIED sensor records with complete source/evidence metadata are available for this waterbody.</td></tr>';return;}
    body.innerHTML=state.records.slice().reverse().slice(0,50).map(r=>{
      const rawStatus=String(r.verificationStatus||'UNVERIFIED').toUpperCase();
      const status=['VERIFIED','REJECTED','PENDING'].includes(rawStatus)?rawStatus:'UNVERIFIED';
      const source=r.sourceName?.trim()?esc(r.sourceName):'<span class="wi-unrecorded">Source not recorded</span>';
      const url=safeUrl(r.sourceUrl);
      const evidence=esc(r.evidenceReference||'');
      return `<tr><td>${esc(fmtDate(r.recordedAt))}</td><td>${source}${url?`<br><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open source</a>`:''}</td><td>${r.sampleMethod?esc(r.sampleMethod):'<span class="wi-unrecorded">Not recorded</span>'}</td><td><span class="wi-verification ${status==='VERIFIED'?'is-verified':status==='REJECTED'?'is-rejected':'is-unverified'}">${status}</span></td><td>${r.verifiedBy?esc(r.verifiedBy):'—'}<br><small>${r.verifiedAt?esc(fmtDate(r.verifiedAt)):'—'}</small></td><td>${evidence||'—'}</td></tr>`;
    }).join('');
  }

  function renderObservations() {
    const body=$('wiObservationsBody');
    if(!state.records.length){body.innerHTML='<tr><td colspan="7">No VERIFIED database observations are available for this waterbody.</td></tr>';return;}
    body.innerHTML=state.records.slice().reverse().slice(0,50).map(r=>`<tr><td>${esc(fmtDate(r.recordedAt))}</td><td>${fmt(r.ph)}</td><td>${fmt(r.dissolvedOxygen)}</td><td>${fmt(r.bod)}</td><td>${fmt(r.cod)}</td><td>${fmt(r.turbidity)}</td><td>${fmt(r.tds,1)}</td></tr>`).join('');
  }

  async function authorizedFetch(url, options={}) {
    const headers={ ...(options.headers||{}), 'Accept':'application/json' };
    if(options.body) headers['Content-Type']='application/json';
    const response=await fetch(url,{...options,headers});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(payload.message || `Request failed (HTTP ${response.status}).`);
    return payload;
  }
  function initializeVerificationManagement() {
    const msg=$('wiVerifierAccessMessage');
    if(msg) msg.textContent='Direct administrator mode is active. Verification actions are saved to the database and attributed to Administrator (direct access).';
    if($('wiReviewPanel')) $('wiReviewPanel').hidden=false;
    if($('wiVerifierAdminPanel')) $('wiVerifierAdminPanel').hidden=true;
    loadReviewQueue();
    if(state.verificationListenersAttached)return;
    state.verificationListenersAttached=true;
    $('wiApproveRecord')?.addEventListener('click',()=>submitReview('VERIFIED'));
    $('wiRejectRecord')?.addEventListener('click',()=>submitReview('REJECTED'));
    $('wiCancelReview')?.addEventListener('click',()=>{$('wiReviewForm').hidden=true;state.reviewRecord=null;});
  }
  async function loadReviewQueue() {
    const body=$('wiReviewQueueBody'); if(!body)return;
    body.innerHTML='<tr><td colspan="5">Loading sensor records…</td></tr>';
    try {
      const records=await authorizedFetch(`${API}/sensor-data`);
      state.allRecords=Array.isArray(records)?records.slice().sort((a,b)=>new Date(b.recordedAt||0)-new Date(a.recordedAt||0)):[];
      const locationMap=new Map(state.locations.map(l=>[Number(l.locationId),l.locationName]));
      if(!state.allRecords.length){body.innerHTML='<tr><td colspan="5">No sensor records found.</td></tr>';return;}
      body.innerHTML=state.allRecords.map(r=>{
        const status=String(r.verificationStatus||'UNVERIFIED').toUpperCase();
        const needsReview=status!=='VERIFIED';
        return `<tr><td>#${Number(r.sensorDataId)}</td><td>${esc(locationMap.get(Number(r.locationId))||`Location #${r.locationId}`)}</td><td>${esc(fmtDate(r.recordedAt))}</td><td><span class="wi-verification ${status==='VERIFIED'?'is-verified':'is-unverified'}">${esc(status)}</span></td><td><button class="btn btn-sm btn-outline-primary" type="button" data-review-record="${Number(r.sensorDataId)}">${needsReview?'Review':'View audit'}</button></td></tr>`;
      }).join('');
      body.querySelectorAll('[data-review-record]').forEach(btn=>btn.addEventListener('click',()=>{
        const record=state.allRecords.find(r=>Number(r.sensorDataId)===Number(btn.dataset.reviewRecord));
        if(record)openReviewForm(record);
      }));
    } catch(error){body.innerHTML=`<tr><td colspan="5">${esc(error.message)}</td></tr>`;}
  }
  function openReviewForm(record) {
    state.reviewRecord=record;
    $('wiReviewForm').hidden=false;
    $('wiReviewRecordSummary').textContent=`Record #${record.sensorDataId} · Location #${record.locationId} · ${fmtDate(record.recordedAt)} · pH ${fmt(record.ph)} · DO ${fmt(record.dissolvedOxygen)} · BOD ${fmt(record.bod)} · COD ${fmt(record.cod)}`;
    $('wiSourceName').value=record.sourceName||'';
    $('wiSourceUrl').value=record.sourceUrl||'';
    $('wiSampleMethod').value=record.sampleMethod||'';
    $('wiEvidenceReference').value=record.evidenceReference||'';
    $('wiReviewNotes').value='';
    $('wiReviewFormMessage').textContent='Check the source report against the same waterbody, sampling point, date, parameter, value and unit before approval.';
    $('wiAuditPanel').hidden=true;
    $('wiReviewForm').scrollIntoView({behavior:'smooth',block:'start'});
    loadAudit(record.sensorDataId);
  }
  async function submitReview(status) {
    const record=state.reviewRecord;if(!record)return;
    const data={status,sourceName:$('wiSourceName').value.trim(),sourceUrl:$('wiSourceUrl').value.trim(),sampleMethod:$('wiSampleMethod').value.trim(),evidenceReference:$('wiEvidenceReference').value.trim(),reviewNotes:$('wiReviewNotes').value.trim()};
    if(!data.sourceName||!data.sourceUrl||!data.sampleMethod||!data.evidenceReference){$('wiReviewFormMessage').textContent='Complete all four source and evidence fields before submitting.';return;}
    if(!/^https?:\/\//i.test(data.sourceUrl)){$('wiReviewFormMessage').textContent='The source URL must begin with http:// or https://.';return;}
    $('wiApproveRecord').disabled=$('wiRejectRecord').disabled=true;
    try {
      await authorizedFetch(`${API}/sensor-data/${record.sensorDataId}/verification`,{method:'PUT',body:JSON.stringify(data)});
      $('wiReviewFormMessage').textContent=status==='VERIFIED'?'Record approved as VERIFIED. The reviewer and timestamp were saved.':'Record marked REJECTED. The reviewer and timestamp were saved.';
      await loadReviewQueue(); await loadSelected(); await loadAudit(record.sensorDataId);
    } catch(error){$('wiReviewFormMessage').textContent=error.message;}
    finally{$('wiApproveRecord').disabled=$('wiRejectRecord').disabled=false;}
  }
  async function loadAudit(id) {
    const panel=$('wiAuditPanel'),body=$('wiAuditBody');if(!panel||!body)return;
    panel.hidden=false;body.textContent='Loading review history…';
    try {
      const rows=await authorizedFetch(`${API}/sensor-data/${id}/verification-audit`);
      body.innerHTML=Array.isArray(rows)&&rows.length?rows.map(a=>`<div class="wi-audit-entry"><strong>${esc(a.actionStatus)}</strong><span>${esc(a.reviewedBy)} · ${esc(fmtDate(a.reviewedAt))}</span><p>${esc(a.reviewNotes||'No review notes recorded.')}</p><small>${esc(a.sourceName||'')} · ${esc(a.evidenceReference||'')}</small></div>`).join(''):'No review actions recorded yet.';
    } catch(error){body.textContent=error.message;}
  }

  function setMessage(id, text){const el=$(id);if(el)el.textContent=text;}
  document.addEventListener('DOMContentLoaded',()=>{
    if(!$('waterInsightsPage'))return;
    initialize();
    document.querySelector('[data-page="waterInsights"]')?.addEventListener('click',()=>initialize());
  });
  window.initializeJalRakshakWaterInsights=initialize;
})();
