/* JalRakshak Water Intelligence — database-only implementation.
 * Only VERIFIED sensor_data rows with complete source/evidence metadata are
 * used for readings, charts, trends, screening and exports. No generated data.
 */
(() => {
  const API = window.JALRAKSHAK_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8080/api`;
  const state = {
    initialized: false,
    loading: false,
    locations: [],
    records: [],
    recordsByLocation: new Map(),
    map: null,
    markers: new Map(),
    selectedId: null,
    chart: null,
    filtered: [],
    apiError: ''
  };
  const $ = id => document.getElementById(id);
  const METRICS = [
    ['ph', 'pH', '', 2],
    ['turbidity', 'Turbidity', 'NTU', 2],
    ['dissolvedOxygen', 'Dissolved oxygen', 'mg/L', 2],
    ['bod', 'BOD', 'mg/L', 2],
    ['cod', 'COD', 'mg/L', 2],
    ['tds', 'TDS', 'mg/L', 1],
    ['temperature', 'Temperature', '°C', 1],
    ['conductivity', 'Conductivity', 'µS/cm', 1]
  ];

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
  const finite = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  const num = (value, digits=2) => finite(value) ? Number(value).toFixed(digits) : '—';
  const dateValue = value => value ? new Date(value) : null;
  const dateText = value => {
    const date = value instanceof Date ? value : dateValue(value);
    return date && Number.isFinite(date.getTime()) ? date.toLocaleString() : 'Date not recorded';
  };
  const locationType = location => String(location.waterSourceType || 'Waterbody').replaceAll('_', ' ');
  const safeHttpUrl = value => {
    try { const url = new URL(String(value || '').trim()); return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) ? url.href : ''; }
    catch (_) { return ''; }
  };
  const hasEvidence = row => String(row.verificationStatus || '').toUpperCase() === 'VERIFIED' &&
    Boolean(String(row.sourceName || '').trim()) && Boolean(safeHttpUrl(row.sourceUrl)) &&
    Boolean(String(row.sampleMethod || '').trim()) && Boolean(String(row.evidenceReference || '').trim());

  async function getJson(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${url}`);
    return response.json();
  }

  async function init(force=false) {
    if (state.loading) return;
    if (state.initialized && !force) return;
    state.loading = true;
    state.initialized = true;
    bindControls();
    setText('wbDirectoryCaption', 'Loading monitoring locations from the database…');
    try {
      const [locations, verifiedRows] = await Promise.all([
        getJson(`${API}/locations`),
        getJson(`${API}/sensor-data/verified`)
      ]);
      state.locations = Array.isArray(locations) ? locations.filter(x => x && Number.isFinite(Number(x.locationId))) : [];
      state.records = Array.isArray(verifiedRows) ? verifiedRows.filter(hasEvidence).filter(r => r.recordedAt) : [];
      state.records.sort((a,b) => new Date(a.recordedAt) - new Date(b.recordedAt));
      state.recordsByLocation = new Map();
      state.records.forEach(record => {
        const key = Number(record.locationId);
        if (!state.recordsByLocation.has(key)) state.recordsByLocation.set(key, []);
        state.recordsByLocation.get(key).push(record);
      });
      state.apiError = '';
      state.locations.sort((a,b) => String(a.locationName || '').localeCompare(String(b.locationName || '')));
      state.filtered = state.locations.slice();
      if (state.map) { state.map.remove(); state.map = null; state.markers.clear(); }
      setText('wbTotalCount', state.locations.length);
      setText('waterbodyNavCount', state.locations.length);
      setText('wbMapCount', state.locations.length);
      setText('wbVerifiedCount', new Set(state.records.map(r => Number(r.locationId))).size);
      const newest = state.records.length ? state.records[state.records.length - 1] : null;
      setText('wbLatestTimestamp', newest ? dateText(newest.recordedAt) : 'No verified records');
      if (!state.locations.length) {
        setText('wbDirectoryCaption', 'No monitoring locations were returned by the database.');
        setHtml('wbDirectoryBody', '<tr><td colspan="8">No locations found in /api/locations.</td></tr>');
        setHtml('wbSelectedProfile', emptyProfile('No database locations are available.'));
        return;
      }
      if (!state.map) createMap();
      applyFilters();
      const params = new URLSearchParams(window.location.search);
      const requested = Number(params.get('locationId'));
      const initial = state.locations.find(x => Number(x.locationId) === requested) || state.locations[0];
      if (initial) selectSite(Number(initial.locationId), false);
      if (!state.records.length) {
        setText('wbHistorySummary', 'No VERIFIED sensor observations with complete source and evidence metadata were returned. No readings or safety conclusions will be generated.');
      }
    } catch (error) {
      console.error('Database-backed Water Intelligence failed:', error);
      state.apiError = error.message;
      state.locations = [];
      state.records = [];
      state.filtered = [];
      state.recordsByLocation.clear();
      if (state.map) { state.map.remove(); state.map = null; state.markers.clear(); }
      const mapElement = $('waterbodyMap');
      if (mapElement) mapElement.innerHTML = '<div class="wb-map-fallback"><strong>Database unavailable</strong><p>No static or generated locations are displayed.</p></div>';
      setText('wbTotalCount', '—');
      setText('waterbodyNavCount', '—');
      setText('wbMapCount', '—');
      setText('wbVerifiedCount', '—');
      setText('wbLatestTimestamp', 'Unavailable');
      setText('wbDirectoryCaption', `Could not load database data: ${error.message}`);
      setHtml('wbDirectoryBody', `<tr><td colspan="8">Database request failed. ${esc(error.message)}. No fallback or synthetic readings are shown.</td></tr>`);
      setHtml('wbSelectedProfile', emptyProfile('Database data could not be loaded. Check that Spring Boot is running and the API is reachable.'));
      setText('wbHistorySummary', 'No history is displayed because the database request failed.');
      setHtml('wbCauseAnalysis', '<p class="wb-muted">No analysis is available until verified database records load successfully.</p>');
      clearChart();
    } finally {
      state.loading = false;
    }
  }

  function bindControls() {
    if (state.controlsBound) return;
    state.controlsBound = true;
    $('wbSearch')?.addEventListener('input', applyFilters);
    $('wbTypeFilter')?.addEventListener('change', applyFilters);
    $('wbDataFilter')?.addEventListener('change', applyFilters);
    $('wbResetFilters')?.addEventListener('click', () => {
      if ($('wbSearch')) $('wbSearch').value = '';
      if ($('wbTypeFilter')) $('wbTypeFilter').value = 'ALL';
      if ($('wbDataFilter')) $('wbDataFilter').value = 'ALL';
      applyFilters();
    });
    $('wbRefreshData')?.addEventListener('click', () => init(true));
  }

  function createMap() {
    if (!$('waterbodyMap')) return;
    if (!window.L) {
      $('waterbodyMap').innerHTML = '<div class="wb-map-fallback"><strong>Map library unavailable</strong><p>Database directory and profiles remain available below.</p></div>';
      return;
    }
    state.map = L.map('waterbodyMap', { preferCanvas:true, scrollWheelZoom:true }).setView([22.8,79.2],4.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:18, attribution:'&copy; OpenStreetMap contributors'
    }).addTo(state.map);
    state.locations.forEach(location => {
      const lat = Number(location.latitude), lon = Number(location.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      const rows = state.recordsByLocation.get(Number(location.locationId)) || [];
      const markerColor = rows.length ? '#16866f' : '#64748b';
      const icon = L.divIcon({ className:'wb-marker-shell', html:`<span class="wb-map-marker" style="--marker-color:${markerColor}"></span>`, iconSize:[20,20], iconAnchor:[10,10] });
      const marker = L.marker([lat,lon], { icon, title:location.locationName || 'Waterbody' }).addTo(state.map);
      marker.bindTooltip(`${esc(location.locationName)} · ${rows.length} verified record(s)`);
      marker.bindPopup(`<strong>${esc(location.locationName)}</strong><br>${esc(location.city || '')}, ${esc(location.state || '')}<br>Verified database records: ${rows.length}<br><button class="wb-popup-select" onclick="window.selectJalRakshakWaterbody(${Number(location.locationId)})">View database profile</button>`);
      marker.on('click', () => selectSite(Number(location.locationId), false));
      state.markers.set(Number(location.locationId), marker);
    });
    const group = L.featureGroup([...state.markers.values()]);
    if (group.getLayers().length) state.map.fitBounds(group.getBounds().pad(0.08), { maxZoom:5 });
  }

  function applyFilters() {
    const query = ($('wbSearch')?.value || '').trim().toLowerCase();
    const type = $('wbTypeFilter')?.value || 'ALL';
    const dataFilter = $('wbDataFilter')?.value || 'ALL';
    state.filtered = state.locations.filter(location => {
      const haystack = `${location.locationName || ''} ${location.city || ''} ${location.state || ''} ${location.waterSourceType || ''}`.toLowerCase();
      const rows = state.recordsByLocation.get(Number(location.locationId)) || [];
      return (!query || haystack.includes(query)) &&
        (type === 'ALL' || String(location.waterSourceType || '').toUpperCase() === type) &&
        (dataFilter === 'ALL' || (dataFilter === 'HAS_DATA' ? rows.length > 0 : rows.length === 0));
    });
    setText('wbResultCount', `${state.filtered.length} location(s)`);
    setText('wbDirectoryCaption', `Showing ${state.filtered.length} of ${state.locations.length} locations returned by the database.`);
    const noResults = $('wbNoResults');
    if (noResults) noResults.hidden = state.filtered.length > 0;
    renderDirectory();
    const allowed = new Set(state.filtered.map(x => Number(x.locationId)));
    state.markers.forEach((marker,id) => {
      if (!state.map) return;
      if (allowed.has(id)) { if (!state.map.hasLayer(marker)) marker.addTo(state.map); }
      else if (state.map.hasLayer(marker)) state.map.removeLayer(marker);
    });
  }

  function renderDirectory() {
    const body = $('wbDirectoryBody');
    if (!body) return;
    if (!state.filtered.length) {
      body.innerHTML = '<tr><td colspan="8">No locations match these filters.</td></tr>';
      return;
    }
    body.innerHTML = state.filtered.map(location => {
      const id = Number(location.locationId);
      const rows = state.recordsByLocation.get(id) || [];
      const latest = rows.length ? rows[rows.length - 1] : null;
      const drink = drinkingScreen(latest);
      const swim = swimmingScreen(latest);
      return `<tr class="${id === state.selectedId ? 'wb-row-selected' : ''}">
        <td><strong>${esc(location.locationName)}</strong><small>${esc(location.city || 'City not recorded')}</small></td>
        <td>${esc([location.city,location.state].filter(Boolean).join(', ') || '—')}</td>
        <td><span class="wb-type-chip">${esc(locationType(location))}</span></td>
        <td><span class="wb-caution">${rows.length} verified</span></td>
        <td><span class="wb-caution">${esc(drink.short)}</span></td>
        <td><span class="wb-caution">${esc(swim.short)}</span></td>
        <td>${latest ? esc(dateText(latest.recordedAt)) : '—'}</td>
        <td><button class="wb-view-button" data-location-id="${id}" type="button">Explore <i class="bi bi-arrow-up-right"></i></button></td>
      </tr>`;
    }).join('');
    body.querySelectorAll('[data-location-id]').forEach(button => button.addEventListener('click', () => selectSite(Number(button.dataset.locationId), true)));
  }

  function latestRecord(locationId) {
    const rows = state.recordsByLocation.get(Number(locationId)) || [];
    return rows.length ? rows[rows.length - 1] : null;
  }

  function isStale(record) {
    const date = record && dateValue(record.recordedAt);
    return !date || !Number.isFinite(date.getTime()) || (Date.now() - date.getTime()) > 30 * 86400000;
  }

  function drinkingScreen(record) {
    if (!record) return { short:'No verified data', status:'NO VERIFIED DATABASE READINGS', detail:'No VERIFIED sensor record with complete source/evidence metadata exists for this location.' };
    if (isStale(record)) return { short:'Stale data', status:'STALE DATA — NO CURRENT CONCLUSION', detail:'The latest verified reading is more than 30 days old. It cannot support a current drinking-water decision.' };
    const checks = [
      { label:'pH', value:record.ph, pass:v => v >= 6.5 && v <= 8.5, range:'6.5–8.5' },
      { label:'TDS', value:record.tds, pass:v => v <= 500, range:'≤ 500 mg/L (screening reference)' },
      { label:'Turbidity', value:record.turbidity, pass:v => v <= 1, range:'≤ 1 NTU (screening reference)' }
    ];
    const available = checks.filter(c => finite(c.value));
    if (!available.length) return { short:'Insufficient parameters', status:'CANNOT ASSESS', detail:'The latest verified database record does not contain pH, TDS or turbidity values needed for a basic screening.' };
    const failed = available.filter(c => !c.pass(Number(c.value)));
    const missing = checks.filter(c => !finite(c.value));
    if (failed.length) return {
      short:'Screening concern', status:'POTENTIAL CONCERN — NOT CLEARED FOR DRINKING',
      detail:`Available screening indicators outside the reference range: ${failed.map(c => `${c.label} (${num(c.value)}; reference ${c.range})`).join(', ')}. ${missing.length ? `Missing values: ${missing.map(c=>c.label).join(', ')}. ` : ''}This is a preliminary screen, not a potability determination.`
    };
    return {
      short:'Not certified', status:'NOT CERTIFIED FOR DRINKING',
      detail:`No exceedance was found in the ${available.map(c=>c.label).join(', ')} values recorded in this sample. ${missing.length ? `Not recorded in this sample: ${missing.map(c=>c.label).join(', ')}. ` : ''}This is not proof of drinking-water safety. The database does not currently contain E. coli/total-coliform results or the full BIS IS 10500 chemical panel (for example nitrate, fluoride, arsenic and other contaminants). Do not drink untreated surface water.`
    };
  }

  function swimmingScreen(record) {
    if (!record) return { short:'No verified data', status:'NO VERIFIED DATABASE READINGS', detail:'No VERIFIED sensor record with complete source/evidence metadata exists for this location.' };
    if (isStale(record)) return { short:'Stale data', status:'STALE DATA — NO CURRENT CONCLUSION', detail:'The latest verified reading is more than 30 days old. It cannot support a current swimming or bathing decision.' };
    const checks = [
      { label:'pH', value:record.ph, pass:v => v >= 6.5 && v <= 8.5, range:'6.5–8.5' },
      { label:'Dissolved oxygen', value:record.dissolvedOxygen, pass:v => v >= 5, range:'≥ 5 mg/L (screening reference)' },
      { label:'BOD', value:record.bod, pass:v => v <= 3, range:'≤ 3 mg/L (screening reference)' }
    ];
    const available = checks.filter(c => finite(c.value));
    if (!available.length) return { short:'Insufficient parameters', status:'CANNOT ASSESS', detail:'The latest verified database record does not contain pH, dissolved oxygen or BOD values needed for a basic screening.' };
    const failed = available.filter(c => !c.pass(Number(c.value)));
    const missing = checks.filter(c => !finite(c.value));
    if (failed.length) return {
      short:'Screening concern', status:'NOT RECOMMENDED — SCREENING CONCERN',
      detail:`Available screening indicators outside the reference range: ${failed.map(c => `${c.label} (${num(c.value)}; reference ${c.range})`).join(', ')}. ${missing.length ? `Missing values: ${missing.map(c=>c.label).join(', ')}. ` : ''}Avoid swimming pending current official advice and confirmatory testing.`
    };
    return {
      short:'Not cleared', status:'NOT CLEARED FOR SWIMMING',
      detail:`No exceedance was found in the ${available.map(c=>c.label).join(', ')} values recorded in this sample. ${missing.length ? `Not recorded in this sample: ${missing.map(c=>c.label).join(', ')}. ` : ''}The database does not currently contain E. coli/fecal-coliform or other microbiological bathing-water results, so swimming suitability cannot be confirmed. Check current local authority advisories.`
    };
  }

  function selectSite(id, fly=true) {
    const location = state.locations.find(item => Number(item.locationId) === Number(id));
    if (!location) return;
    state.selectedId = Number(location.locationId);
    const rows = state.recordsByLocation.get(state.selectedId) || [];
    const latest = rows.length ? rows[rows.length - 1] : null;
    const previous = rows.length > 1 ? rows[rows.length - 2] : null;
    const drink = drinkingScreen(latest);
    const swim = swimmingScreen(latest);
    const dataRows = latest ? `
      <div class="wb-profile-stats">
        ${metricCard('pH', latest.ph, '', 2)}
        ${metricCard('Turbidity', latest.turbidity, 'NTU', 2)}
        ${metricCard('Dissolved O₂', latest.dissolvedOxygen, 'mg/L', 2)}
        ${metricCard('BOD', latest.bod, 'mg/L', 2)}
        ${metricCard('TDS', latest.tds, 'mg/L', 1)}
        ${metricCard('COD', latest.cod, 'mg/L', 2)}
      </div>
      <div class="wb-data-provenance"><strong>Verified database record #${esc(latest.sensorDataId)}</strong><span>Sample date: ${esc(dateText(latest.recordedAt))}</span><span>Source: ${esc(latest.sourceName)}</span><span>Method: ${esc(latest.sampleMethod)}</span><span>Evidence: ${esc(latest.evidenceReference)}</span><span>Verified by: ${esc(latest.verifiedBy || 'Administrator')}</span><span>Verified at: ${esc(dateText(latest.verifiedAt))}</span><a href="${esc(safeHttpUrl(latest.sourceUrl))}" target="_blank" rel="noopener noreferrer">Open source record</a></div>` : `
      <div class="wb-no-verified-data"><strong>No verified sensor readings are available for this location.</strong><p>Unverified and rejected rows are intentionally excluded from this profile, chart and safety screening. Review the Data Source & Verification queue and approve a record only after checking its source evidence.</p></div>`;
    $('wbSelectedProfile').innerHTML = `
      <div class="wb-profile-title"><span class="wb-risk wb-risk-neutral">${rows.length} verified record(s)</span><span class="wb-score">${latest ? esc(dateText(latest.recordedAt)) : '—'}</span></div>
      <h2>${esc(location.locationName || 'Unnamed location')}</h2>
      <p class="wb-location-line"><i class="bi bi-geo-alt"></i> ${esc([location.city,location.state].filter(Boolean).join(', ') || 'Location details unavailable')} <span>·</span> ${esc(locationType(location))}</p>
      ${dataRows}
      <div class="wb-safety-block"><div class="wb-safety-icon"><i class="bi bi-cup-straw"></i></div><div><strong>Drinking-water screening: ${esc(drink.status)}</strong><span>${esc(drink.detail)}</span></div></div>
      <div class="wb-safety-block"><div class="wb-safety-icon recreation"><i class="bi bi-water"></i></div><div><strong>Swimming / bathing screening: ${esc(swim.status)}</strong><span>${esc(swim.detail)}</span></div></div>
      <div class="wb-profile-actions"><button class="btn btn-primary" id="wbFocusMap" type="button"><i class="bi bi-crosshair"></i> Locate on map</button><button class="btn btn-outline-secondary" id="wbExportSite" type="button" ${latest ? '' : 'disabled'}><i class="bi bi-download"></i> Export verified records</button></div>
      <p class="wb-data-label"><i class="bi bi-database-check"></i> Database-only profile · unverified/demo readings are excluded</p>`;
    renderHistory(location, rows);
    renderObservedIndicators(location, latest, previous);
    renderDirectory();
    $('wbFocusMap')?.addEventListener('click', () => {
      const marker = state.markers.get(state.selectedId);
      if (marker && state.map) { state.map.setView(marker.getLatLng(), 10, { animate:true }); marker.openPopup(); }
    });
    $('wbExportSite')?.addEventListener('click', () => exportProfile(location, rows, drink, swim));
    if (fly && state.map) {
      const marker = state.markers.get(state.selectedId);
      if (marker) { state.map.flyTo(marker.getLatLng(), 8, { duration:.65 }); marker.openPopup(); }
    }
  }

  function metricCard(label, value, unit, digits) {
    return `<div><span>${esc(label)}</span><strong>${num(value,digits)} ${esc(unit)}</strong></div>`;
  }

  function renderHistory(location, rows) {
    const canvas = $('wbHistoryChart');
    if (!canvas || !window.Chart) return;
    clearChart();
    const valid = rows.filter(r => r.recordedAt && (finite(r.turbidity) || finite(r.bod)));
    if (!valid.length) {
      canvas.style.display = 'none';
      setText('wbHistorySummary', 'No verified turbidity or BOD history is recorded for this location. No synthetic series has been substituted.');
      return;
    }
    canvas.style.display = 'block';
    const labels = valid.map(r => dateText(r.recordedAt));
    state.chart = new Chart(canvas, {
      type:'line',
      data:{ labels, datasets:[
        { label:'Turbidity (NTU)', data:valid.map(r=>finite(r.turbidity)?Number(r.turbidity):null), borderColor:'#2879c7', backgroundColor:'rgba(40,121,199,.10)', fill:true, tension:.2, spanGaps:false, yAxisID:'y' },
        { label:'BOD (mg/L)', data:valid.map(r=>finite(r.bod)?Number(r.bod):null), borderColor:'#d97724', backgroundColor:'rgba(217,119,36,.08)', fill:false, tension:.2, spanGaps:false, yAxisID:'y1' }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false}, plugins:{legend:{position:'bottom'},tooltip:{callbacks:{afterBody:items=>{const record=valid[items[0]?.dataIndex];return record?`Database record #${record.sensorDataId} · VERIFIED · ${record.sourceName}`:'';}}}}, scales:{y:{beginAtZero:true,title:{display:true,text:'Turbidity (NTU)'}},y1:{beginAtZero:true,position:'right',grid:{drawOnChartArea:false},title:{display:true,text:'BOD (mg/L)'}}}}
    });
    const oldest = valid[0], newest = valid[valid.length-1];
    const turbidityDelta = deltaBetween(oldest.turbidity, newest.turbidity);
    const bodDelta = deltaBetween(oldest.bod, newest.bod);
    setText('wbHistorySummary', `${location.locationName}: ${valid.length} verified database observations from ${dateText(oldest.recordedAt)} to ${dateText(newest.recordedAt)}. Turbidity change: ${turbidityDelta}; BOD change: ${bodDelta}. These are measured-record comparisons, not causal findings.`);
  }

  function deltaBetween(first, last) {
    if (!finite(first) || !finite(last)) return 'not available';
    const change = Number(last) - Number(first);
    return `${change > 0 ? '+' : ''}${change.toFixed(2)}`;
  }

  function renderObservedIndicators(location, latest, previous) {
    const box = $('wbCauseAnalysis');
    if (!box) return;
    if (!latest) {
      box.innerHTML = '<p class="wb-muted">No verified database observations are available. No pollution-driver inference is produced.</p>';
      return;
    }
    const observations = [];
    const add = (label, text) => observations.push(`<article class="wb-cause-item"><span><i class="bi bi-clipboard-data"></i></span><div><strong>${esc(label)}</strong><p>${esc(text)}</p></div></article>`);
    if (finite(latest.ph) && (Number(latest.ph)<6.5 || Number(latest.ph)>8.5)) add('pH outside screening range', `Recorded pH is ${num(latest.ph)}; the screening reference used here is 6.5–8.5.`);
    if (finite(latest.turbidity) && Number(latest.turbidity)>1) add('Turbidity above drinking-water screening reference', `Recorded turbidity is ${num(latest.turbidity)} NTU. This is a screening flag only; it does not establish the cause.`);
    if (finite(latest.tds) && Number(latest.tds)>500) add('TDS above drinking-water acceptable reference', `Recorded TDS is ${num(latest.tds,1)} mg/L. Further laboratory assessment is required.`);
    if (finite(latest.dissolvedOxygen) && Number(latest.dissolvedOxygen)<5) add('Low dissolved oxygen screening indicator', `Recorded dissolved oxygen is ${num(latest.dissolvedOxygen)} mg/L; the bathing-water screening reference used here is at least 5 mg/L.`);
    if (finite(latest.bod) && Number(latest.bod)>3) add('BOD above bathing-water screening reference', `Recorded BOD is ${num(latest.bod)} mg/L; the screening reference used here is at most 3 mg/L.`);
    if (previous) {
      if (finite(previous.turbidity) && finite(latest.turbidity)) add('Recorded turbidity comparison', `Change between the previous and latest verified samples: ${deltaBetween(previous.turbidity,latest.turbidity)} NTU.`);
      if (finite(previous.bod) && finite(latest.bod)) add('Recorded BOD comparison', `Change between the previous and latest verified samples: ${deltaBetween(previous.bod,latest.bod)} mg/L.`);
    }
    if (!observations.length) add('No screening flags in available fields', 'No exceedance was detected among the parameters recorded in this sample. Missing parameters and microbiological results prevent a safety clearance.');
    const description = String(location.description || '').trim();
    if (description) add('Database location description', description);
    box.innerHTML = observations.join('');
  }

  function clearChart() {
    if (state.chart) { state.chart.destroy(); state.chart = null; }
  }

  function exportProfile(location, rows, drinking, swimming) {
    if (!rows.length) return;
    const payload = {
      exportType:'JalRakshak verified database observations',
      generatedAt:new Date().toISOString(),
      location,
      records:rows,
      screening:{ drinkingWater:drinking, swimming:swimming },
      note:'Only VERIFIED database rows with complete source and evidence metadata are included. Screening is not a drinking-water or bathing-water certificate.'
    };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `jalrakshak-verified-${Number(location.locationId)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function emptyProfile(message) { return `<div class="wb-empty"><i class="bi bi-database-x"></i><p>${esc(message)}</p></div>`; }
  function setText(id, value) { const el=$(id); if(el) el.textContent=String(value ?? ''); }
  function setHtml(id, value) { const el=$(id); if(el) el.innerHTML=value; }

  window.selectJalRakshakWaterbody = id => selectSite(Number(id), true);
  window.initializeWaterbodyIntelligence = init;
  document.addEventListener('DOMContentLoaded', () => {
    if ($('waterbodiesPage') && $('waterbodiesPage').classList.contains('active-page')) init();
  });
})();
