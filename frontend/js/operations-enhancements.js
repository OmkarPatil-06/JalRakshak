/* ============================================================
   JALRAKSHAK — OPERATIONS ENHANCEMENTS
   DB-backed create/edit workflows for all locations returned
   by /api/locations. No synthetic records are generated here.
   ============================================================ */
(() => {
  "use strict";

  const API = `${window.location.protocol}//${window.location.hostname}:8080/api`;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
  const nowSql = () => {
    const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return d.toISOString().slice(0,19);
  };
  async function request(path, options={}) {
    const res = await fetch(API + path, {
      ...options,
      headers: { "Content-Type":"application/json", ...(options.headers || {}) }
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let detail = body;
      try { const parsed = JSON.parse(body); detail = parsed.detail || parsed.message || body; } catch (_) {}
      throw new Error(detail || `Request failed (${res.status})`);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  function toast(message, type="info") {
    if (typeof window.showToast === "function") window.showToast(message, type);
    else window.alert(message);
  }
  function locationOptions(locations, selected="") {
    return locations.map(l => `<option value="${esc(l.locationId)}" ${String(l.locationId)===String(selected)?"selected":""}>${esc(l.locationName)} — ${esc(l.city || "")}, ${esc(l.state || "")}</option>`).join("");
  }
  async function getLocations() {
    const rows = await request("/locations");
    if (!Array.isArray(rows) || !rows.length) throw new Error("No monitoring locations were found in the database. Add location records before creating an alert.");
    return rows;
  }
  function openDialog(id, title, inner, submitLabel, onSubmit) {
    document.getElementById(id)?.remove();
    const dialog = document.createElement("dialog");
    dialog.id = id;
    dialog.className = "jr-response-dialog";
    dialog.innerHTML = `
      <form method="dialog" class="jr-response-form" id="${id}Form">
        <div class="jr-response-form-header">
          <div><span>JALRAKSHAK</span><h3>${esc(title)}</h3></div>
          <button type="button" class="jr-dialog-close" data-close><i class="bi bi-x-lg"></i></button>
        </div>
        ${inner}
        <div class="jr-response-form-actions">
          <button type="button" class="btn btn-outline-secondary" data-close>Cancel</button>
          <button type="submit" class="btn btn-danger">${esc(submitLabel)}</button>
        </div>
      </form>`;
    document.body.appendChild(dialog);
    const close = () => { if (dialog.open) dialog.close(); dialog.remove(); };
    dialog.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", close));
    dialog.querySelector("form").addEventListener("submit", async event => {
      event.preventDefault();
      const submit = dialog.querySelector('button[type="submit"]');
      submit.disabled = true;
      try { await onSubmit(dialog, close); }
      catch (e) { console.error(e); toast(e.message || "Unable to save changes.", "error"); }
      finally { if (dialog.isConnected) submit.disabled = false; }
    });
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open","");
    return dialog;
  }

  // Alert creation is location-first; sensor reading is optional for
  // locations without stored readings (requires SQL migration below).
  async function openCreateAlert() {
    try {
      const [locations, readings] = await Promise.all([
        getLocations(),
        request("/sensor-data/verified").catch(() => [])
      ]);
      const inner = `
        <label>Waterbody / Monitoring location
          <select id="jrAlertLocation" required>${locationOptions(locations)}</select>
        </label>
        <label>Related sensor reading <span class="text-muted">(optional)</span>
          <select id="jrAlertSensor"><option value="">No linked reading / manual alert</option>
          ${(Array.isArray(readings)?readings:[]).map(r=>`<option value="${esc(r.sensorDataId)}" data-location="${esc(r.locationId)}">Reading #${esc(r.sensorDataId)} · Location #${esc(r.locationId)} · ${esc(r.recordedAt || "")}</option>`).join("")}
          </select>
        </label>
        <label>Alert type
          <select id="jrAlertType" required>
            <option value="Water Quality Concern">Water Quality Concern</option>
            <option value="Water Quality Anomaly">Water Quality Anomaly</option>
            <option value="Citizen Report Escalation">Citizen Report Escalation</option>
            <option value="Field Inspection Required">Field Inspection Required</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>Severity
          <select id="jrAlertSeverity" required>
            <option value="LOW">Low</option><option value="MEDIUM" selected>Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
          </select>
        </label>
        <label>Priority score <span class="text-muted">(optional, 0–100)</span>
          <input id="jrAlertPriority" type="number" min="0" max="100" step="0.1" placeholder="Leave blank if not assessed">
        </label>
        <label>Description / evidence
          <textarea id="jrAlertMessage" maxlength="500" required placeholder="Describe the observed issue and supporting evidence."></textarea>
        </label>`;
      const dialog = openDialog("jrCreateAlertDialog","Create Alert",inner,"Save Alert",async (d,close)=>{
        const locId = Number($("jrAlertLocation").value);
        const selectedSensor = $("jrAlertSensor").value;
        if (selectedSensor) {
          const opt = $("jrAlertSensor").selectedOptions[0];
          if (Number(opt.dataset.location) !== locId) throw new Error("Choose a sensor reading belonging to the selected location.");
        }
        const priority = $("jrAlertPriority").value.trim();
        const payload = {
          locationId: locId,
          sensorDataId: selectedSensor ? Number(selectedSensor) : null,
          alertType: $("jrAlertType").value,
          severity: $("jrAlertSeverity").value,
          priorityScore: priority === "" ? null : Number(priority),
          message: $("jrAlertMessage").value.trim(),
          detectedAt: nowSql(),
          status: "OPEN"
        };
        if (!payload.message) throw new Error("Enter the alert evidence or description.");
        await request("/alerts",{method:"POST",body:JSON.stringify(payload)});
        close(); toast("Alert saved to the database.","success");
        if (typeof window.loadAlerts==="function") await window.loadAlerts();
        if (typeof window.loadResponseManagementData==="function") await window.loadResponseManagementData();
        if (typeof window.loadAlerts==="function") await window.loadAlerts();
      });
      const loc = dialog.querySelector("#jrAlertLocation");
      const sensor = dialog.querySelector("#jrAlertSensor");
      loc.addEventListener("change",()=>Array.from(sensor.options).forEach(o=>{
        if (!o.value) return;
        o.hidden = Number(o.dataset.location)!==Number(loc.value);
      }));
      loc.dispatchEvent(new Event("change"));
    } catch(e) { console.error(e); toast(e.message || "Could not open alert form.","error"); }
  }

  // Edit/complete existing response action.
  async function editResponse(responseId) {
    try {
      const [response, users] = await Promise.all([
        request(`/responses/${responseId}`),
        request("/users").catch(()=>[])
      ]);
      if (!response) throw new Error("Response record not found.");
      const userOptions = (Array.isArray(users)?users:[]).map(u=>
        `<option value="${esc(u.userId)}" ${Number(u.userId)===Number(response.userId)?"selected":""}>${esc(u.fullName || `User ${u.userId}`)}</option>`
      ).join("");
      const inner = `
        <div class="alert alert-light">Response #${esc(response.responseId)} · Alert #${esc(response.alertId)}</div>
        <label>Assigned officer
          <select id="jrEditResponseUser"><option value="">Unassigned</option>${userOptions}</select>
        </label>
        <label>Action taken
          <input id="jrEditResponseAction" maxlength="255" required value="${esc(response.actionTaken || "")}">
        </label>
        <label>Status
          <select id="jrEditResponseStatus">
            ${["PENDING","IN_PROGRESS","COMPLETED","CANCELLED"].map(s=>`<option value="${s}" ${String(response.responseStatus).toUpperCase()===s?"selected":""}>${s.replace(/_/g," ")}</option>`).join("")}
          </select>
        </label>
        <label>Completion / investigation notes
          <textarea id="jrEditResponseNotes" maxlength="500">${esc(response.responseNotes || "")}</textarea>
        </label>`;
      openDialog("jrEditResponseDialog","Edit Response #"+responseId,inner,"Update Response",async (d,close)=>{
        const status=$("jrEditResponseStatus").value;
        const payload={
          ...response,
          userId:$("jrEditResponseUser").value ? Number($("jrEditResponseUser").value) : null,
          actionTaken:$("jrEditResponseAction").value.trim(),
          responseStatus:status,
          responseNotes:$("jrEditResponseNotes").value.trim(),
          completedAt:status==="COMPLETED" ? (response.completedAt || nowSql()) : null
        };
        if (!payload.actionTaken) throw new Error("Action taken is required.");
        await request(`/responses/${responseId}`,{method:"PUT",body:JSON.stringify(payload)});
        close(); toast(status==="COMPLETED"?"Response marked completed.":"Response updated.","success");
        if (typeof window.loadResponseManagementData==="function") await window.loadResponseManagementData();
      });
    } catch(e) { console.error(e); toast(e.message || "Unable to edit response.","error"); }
  }

  // Citizen report creation for every DB-backed location.
  async function openCreateCitizenReport() {
    try {
      const locations = await getLocations();
      const inner = `
        <label>Waterbody / Monitoring location
          <select id="jrCitizenLocation" required>${locationOptions(locations)}</select>
        </label>
        <label>Report category
          <select id="jrCitizenType" required>
            <option value="Unusual Water Colour">Unusual Water Colour</option>
            <option value="Unusual Odour">Unusual Odour</option>
            <option value="Visible Waste / Dumping">Visible Waste / Dumping</option>
            <option value="Fish / Aquatic Life Concern">Fish / Aquatic Life Concern</option>
            <option value="Foam / Oil Layer">Foam / Oil Layer</option>
            <option value="Other Observation">Other Observation</option>
          </select>
        </label>
        <label>Priority
          <select id="jrCitizenPriority"><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select>
        </label>
        <label>Description <textarea id="jrCitizenDescription" maxlength="1000" required placeholder="Describe what you observed, when, and where. Avoid including private information."></textarea></label>
        <label>Reporter name <span class="text-muted">(optional)</span><input id="jrCitizenName" maxlength="100" placeholder="Leave blank for anonymous submission"></label>
        <p class="text-muted small mb-0">This creates a citizen observation for review. It is not automatically treated as a verified pollution incident.</p>`;
      openDialog("jrCreateCitizenReportDialog","Create Citizen Report",inner,"Submit Report",async (d,close)=>{
        const location=locations.find(l=>Number(l.locationId)===Number($("jrCitizenLocation").value));
        const description=$("jrCitizenDescription").value.trim();
        if (!description) throw new Error("Please describe the observation.");
        const payload={
          userId:null,
          locationId:Number(location.locationId),
          reportType:$("jrCitizenType").value,
          description,
          latitude:location.latitude ?? null,
          longitude:location.longitude ?? null,
          status:"SUBMITTED",
          priority:$("jrCitizenPriority").value,
          reportedAt:nowSql(),
          resolvedAt:null
        };
        await request("/citizen-reports",{method:"POST",body:JSON.stringify(payload)});
        close(); toast("Citizen report submitted for review.","success");
        if (typeof window.loadCitizenReports==="function") await window.loadCitizenReports();
      });
    } catch(e) { console.error(e); toast(e.message || "Could not open citizen report form.","error"); }
  }

  document.addEventListener("DOMContentLoaded",()=>{
    $("createAlertButton")?.addEventListener("click",openCreateAlert);
    $("createCitizenReportButton")?.addEventListener("click",openCreateCitizenReport);
  });
  window.editResponse = editResponse;
  window.openCreateAlert = openCreateAlert;
  window.openCreateCitizenReport = openCreateCitizenReport;
})();
