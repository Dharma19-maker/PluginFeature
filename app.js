/* =====================================================================
   Plugins & Features Status — tracker, dashboard and plugin-wise report
   ---------------------------------------------------------------------
   STORAGE
   - By default every change is saved in this browser (localStorage).
     That means each person's browser keeps its own copy.
   - To let a whole team edit the SAME data, set CONFIG.apiUrl to an
     endpoint you host (for example an ASP.NET Core Web API):
        GET  {apiUrl}  -> returns JSON array of rows
        PUT  {apiUrl}  -> body is the full JSON array of rows; save it
     Each row: { id, module, feature, status, developer }
   ===================================================================== */

const CONFIG = {
  apiUrl: "",                 // e.g. "https://yourserver/api/features"  (leave "" for browser-only)
  storageKey: "pluginFeatureTracker.v1",
  saveDelayMs: 600,
};

/* Status options, in order, with the value used for "average completion".
   A range counts as its middle value; Not Yet Started counts as 0. */
const STATUSES = [
  { label: "Not Yet Started", value: 0,    cls: "st-none" },
  { label: "60%",             value: 0.60, cls: "st-60" },
  { label: "60-70%",          value: 0.65, cls: "st-60" },
  { label: "70%",             value: 0.70, cls: "st-70" },
  { label: "70-80%",          value: 0.75, cls: "st-70" },
  { label: "80-90%",          value: 0.85, cls: "st-80" },
  { label: "90%",             value: 0.90, cls: "st-90" },
  { label: "100%",            value: 1.00, cls: "st-100" },
];
const STATUS_BY_LABEL = Object.fromEntries(STATUSES.map(s => [s.label, s]));

/* Original data from Plugins_and_Features-Status.xlsx, grouped by plugin. */
const SEED = [
  ["Employee Management", [["New", "90%"], ["Search", "90%"], ["My Details", "60%"], ["My Notification History", "60%"], ["SPOC Search", "60%"], ["Request For Role", "80-90%"], ["Roles to Approve", "80-90%"], ["Add Department", "70%"], ["Add Position", "70%"], ["Request for Airports", "60%"]]],
  ["Hazard Management", [["New", "80-90%"], ["Reported as Draft", "80-90%"], ["Dashboard", "Not Yet Started"], ["Assigned to me", "80-90%"], ["Search/Track Hazard", "80-90%"], ["Hazard Log", "80-90%"]]],
  ["Incident Management", [["New", "80-90%"], ["Reported as Draft", "80-90%"], ["Dashboard", "Not Yet Started"], ["Assigned to me", "80-90%"], ["Search/Track Incident", "80-90%"], ["DGCA Occurrence Report", "80-90%"], ["Runway Incursion/Excursion DGCA Report", "80-90%"], ["Wildlife(Bird/Animal)Strike DGCA Report", "80-90%"], ["Dangerous Goods Occurrence Report", "80-90%"], ["Ground Occurrence Report", "80-90%"], ["Safety Occurrence Report Form", "80-90%"]]],
  ["Equipment Management", [["New", "Not Yet Started"], ["Search", "Not Yet Started"]]],
  ["Investigation Management", [["Search", "80-90%"], ["Dashboard", "Not Yet Started"]]],
  ["Entities", [["New", "90%"], ["Search", "90%"], ["Pending For Approval", "60%"], ["Pending Entity Employee Approval For Aviio Access", "60%"], ["Pending Documents", "60%"], ["Pending Approval Surrender List", "60%"], ["Entity Expired Documents", "60%"], ["Entity/SPOC Surrender", "60%"], ["ADID Tracking", "60%"]]],
  ["Risk Assessment", [["New", "80-90%"], ["Search", "80-90%"], ["Dashboard", "Not Yet Started"], ["Assigned Risk Assessment", "80-90%"]]],
  ["Loss/Damage/Surrender", [["Request For Loss/Damage/Surrender", "80-90%"], ["List Of Requested Permit", "80-90%"], ["Permit Search", "80-90%"], ["Search/Track", "80-90%"]]],
  ["ADP Violations", [["New", "80-90%"], ["Configure Offence", "80-90%"], ["Search/Track Violations", "80-90%"], ["ADPSuspendedList", "80-90%"], ["ADPReports", "80-90%"]]],
  ["Airside Driving Permit", [["Request Permit", "80-90%"], ["Assigned to me", "80-90%"], ["Generate Permit", "80-90%"], ["My Permit Status", "80-90%"], ["Dashboard", "80-90%"], ["Renew Permit", "80-90%"], ["Payments", "80-90%"], ["Search/Track Permit", "80-90%"], ["Payments History", "80-90%"], ["ADP Reports", "80-90%"], ["Schedule Trainings", "80-90%"], ["View Scheduled Trainings", "80-90%"], ["Training Certificate", "80-90%"], ["Reports", "80-90%"], ["ADP Authority Signature", "80-90%"]]],
  ["AEQP", [["Request Permit", "80-90%"], ["Assigned to me", "80-90%"], ["Generate Permit", "80-90%"], ["Search / Track Permit", "80-90%"], ["Dashboard", "80-90%"], ["Renew Permit", "80-90%"], ["Add Equipment", "80-90%"], ["Payments", "80-90%"], ["Payments History", "80-90%"], ["Reports", "80-90%"], ["AEQP Authority Signature", "80-90%"]]],
  ["Airside Vehicle Permit", [["Request Permit", "80-90%"], ["Assigned to me", "80-90%"], ["Generate Permit", "80-90%"], ["Search / Track Permit", "80-90%"], ["Dashboard", "80-90%"], ["Vehicle Inspection", "80-90%"], ["Renew Permit", "80-90%"], ["Payments", "80-90%"], ["Add Vehicle", "80-90%"], ["Payments History", "80-90%"], ["Reports", "80-90%"], ["AVP Authority Signature", "80-90%"]]],
  ["Course Details", [["Create Course", "70-80%"], ["Course Search", "70-80%"], ["Configure Course Material", "70-80%"], ["Questions Config for Course", "70-80%"], ["Configuration", "70-80%"]]],
  ["eLearning", [["View Schedule Course", "60-70%"], ["Schedule Online Course", "60-70%"], ["Course Calendar", "60-70%"], ["My Course", "60-70%"], ["Grant Access on Course", "60-70%"], ["Assigned to me", "60-70%"], ["Application Status", "60-70%"], ["Question Bank", "60-70%"], ["Schedule Adhoc Training", "60-70%"], ["Adhoc Training", "60-70%"], ["Certificates", "60-70%"], ["View Completed Adhoc Training", "60-70%"], ["View Scheduled Adhoc Training", "60-70%"], ["Examination Pattern", "60-70%"], ["Feedback Search", "60-70%"], ["Nominated Employees for Course Search/Track", "60-70%"], ["New Course Request", "60-70%"]]],
  ["Online Test", [["Schedule Online Test", "Not Yet Started"], ["Online Test Calendar", "Not Yet Started"], ["Online Test Registration Data", "Not Yet Started"], ["My Online Test", "Not Yet Started"], ["Certificates", "Not Yet Started"], ["Online Test History", "Not Yet Started"], ["Onlinetest Revaluation", "Not Yet Started"], ["Onlinetest Revaluation History", "Not Yet Started"], ["Background Mapping", "Not Yet Started"], ["Onlinetest Background Mapping History", "Not Yet Started"]]],
  ["Aviation Inspection", [["Inspections", "Not Yet Started"], ["Search/Track", "Not Yet Started"]]],
  ["Entity Employees", [["New Employee", "80-90%"], ["Search", "80-90%"], ["My Details", "Not Yet Started"], ["My Company", "Not Yet Started"], ["Add Sub Contractor", "Not Yet Started"], ["My Notification History", "Not Yet Started"], ["DD Uploads", "Not Yet Started"], ["Entity/SPOC Surrender", "Not Yet Started"], ["ADID Tracking", "Not Yet Started"], ["SPOC Extension Confirmation", "Not Yet Started"]]],
  ["Project/Sites", [["New Project", "Not Yet Started"], ["Search Project", "Not Yet Started"], ["Reported As Draft", "Not Yet Started"]]],
  ["Safety Policy", [["Safety Policy", "Not Yet Started"]]],
  ["Voluntary Safety Reporting", [["Create", "80-90%"], ["Search/Track", "80-90%"], ["Assigned to me", "80-90%"], ["Dashboards", "80-90%"]]],
  ["Classroom Training", [["View Scheduled Classroom Trainings", "Not Yet Started"], ["Course Calendar", "Not Yet Started"], ["Schedule Classroom Course", "Not Yet Started"], ["My Classroom Trainings", "Not Yet Started"]]],
  ["Temporary Permits", [["Request Permit", "80-90%"], ["Search/Track Permit", "80-90%"], ["Generate Permit", "80-90%"], ["Payment", "80-90%"], ["Bulk Payments", "80-90%"], ["Payments History", "80-90%"]]],
  ["CAPA", [["Create CAPA", "80-90%"], ["Assigned CAPAS", "80-90%"], ["Assigned By Me", "80-90%"], ["Search/Track CAPA", "80-90%"]]],
  ["Work Permit", [["Request Work Permit", "80-90%"], ["Search/Track Work permit", "80-90%"], ["Draft/Reassigned Work Permits", "80-90%"], ["Checklist Item Configuration", "Not Yet Started"], ["Configure Workpermittype based Checklist", "Not Yet Started"], ["Assigned to me", "80-90%"], ["Assigned WorkPermits To PE/PM", "80-90%"], ["Work Permit Requestor Closure", "80-90%"], ["Assigned WorkPermits To Department SPOCs", "80-90%"], ["WorkPermit Blacklist", "80-90%"], ["WorkPermit Extension", "80-90%"], ["WorkPermit NCR Form", "80-90%"], ["HandOver and TakenOver", "80-90%"], ["AMC KPIs Search", "80-90%"], ["Assigned Work Permits To Duty Managers", "80-90%"], ["Assigned Work Permits To Work Area Managers", "80-90%"], ["Assigned Work Permits To Safety Managers", "80-90%"], ["Assigned Work Permits To Work Area Heads", "80-90%"], ["Add Work Permit Type Configuration", "Not Yet Started"], ["Work Permit Checklist Configuration", "Not Yet Started"]]],
  ["AEP Violations", [["New", "80-90%"], ["AEPSuspendedList", "80-90%"], ["Search/Track Violations", "80-90%"], ["Configure Offence", "80-90%"]]],
  ["AVP Violations", [["New", "80-90%"], ["AVPSuspendedList", "80-90%"], ["Search/Track Violations", "80-90%"], ["Configure Offence", "80-90%"]]],
  ["Breath Analyser", [["Roster Upload Form", "80-90%"], ["View Roster", "80-90%"], ["Alcohol Test", "80-90%"], ["View Test Details", "80-90%"], ["Dashboard", "80-90%"], ["Add Work Shifts", "80-90%"]]],
  ["Digital Inspection", [["Reported as Draft", "80-90%"], ["Search", "80-90%"], ["Assigned To Me", "80-90%"], ["Configure Inspection", "80-90%"], ["Configure Checklist", "80-90%"], ["Configure Checklist Item", "80-90%"], ["Create Schedule", "80-90%"], ["Scheduled Digital Inspections", "80-90%"], ["Configure Inspectors Group", "80-90%"], ["Configure Assets Group", "80-90%"]]],
  ["AEP", [["New", "80-90%"], ["Search", "80-90%"], ["Generate Permit", "80-90%"], ["Dashboard", "80-90%"], ["Renew Permit", "80-90%"], ["Reported as Draft", "80-90%"], ["Assigned To Me", "80-90%"], ["Payments History", "80-90%"], ["Upload Signature", "80-90%"], ["Reports", "80-90%"], ["TAEP Authority Signature", "80-90%"], ["Add Aadhar Blacklist", "80-90%"]]],
  ["Project/Activity Details", [["Create", "80-90%"], ["Search/Track", "80-90%"], ["View All Activities", "80-90%"]]],
  ["Observation Reporting", [["Create", "Not Yet Started"], ["Search/Track", "Not Yet Started"], ["Assigned to me", "Not Yet Started"]]],
  ["Quality", [["New Request Terminal", "80-90%"], ["Pending Tasks", "80-90%"], ["Search/Track Request", "80-90%"], ["New Request Airlines", "80-90%"], ["New Request Quality", "80-90%"]]],
  ["Log Book Management", [["New Log Request", "Not Yet Started"], ["Drafted Logs", "Not Yet Started"], ["Search/Track", "Not Yet Started"], ["Logs in Pipeline", "Not Yet Started"], ["Log Book", "Not Yet Started"], ["Pipeline Rejected Logs", "Not Yet Started"]]],
  ["Payments", [["Pending Approval for DD's", "80-90%"], ["Bulk Upload", "80-90%"], ["Permit Configuration", "Not Yet Started"], ["Monthly Payment Configuration", "Not Yet Started"]]],
  ["Slot Booking Management", [["Request New Slot", "70-80%"], ["Assigned to me", "70-80%"], ["Search", "70-80%"], ["Reported as Draft", "70-80%"], ["Checklist Configuration", "Not Yet Started"], ["View Boarding Pass", "70-80%"], ["Add Airports", "70-80%"]]],
  ["Aircraft Registration Details", [["New Aircraft", "70-80%"], ["Search Aircraft", "70-80%"], ["Add Aircraft Tail No", "70-80%"]]],
  ["Non Scheduled Operators", [["Pending GA Registration Details", "80-90%"], ["Approved GA Registration Details", "80-90%"]]],
  ["Frequent Passengers", [["Passenger List", "80-90%"], ["Add Passenger", "80-90%"]]],
  ["Emergency Management", [["Create Event Type", "80-90%"], ["Create Subevent Type", "80-90%"], ["Configure Emergency Template", "80-90%"], ["Emergency Requests", "80-90%"], ["Emergency Updates", "80-90%"], ["Search /Track", "80-90%"], ["Configure Contact Groups", "80-90%"], ["Configure Severity", "80-90%"], ["Configure Adhoc User", "80-90%"]]],
  ["SRI", [["Scan boarding pass with handheld scanner", "80-90%"], ["SRI Search", "80-90%"], ["Scan Boarding Pass Using Camera", "80-90%"]]],
  ["TCEP", [["New", "80-90%"], ["Search", "80-90%"], ["Reported As Draft", "80-90%"], ["Generate Permit", "80-90%"], ["Dashboards", "80-90%"]]],
  ["Helicopter Registration Details", [["New", "80-90%"], ["Search", "80-90%"]]],
  ["CEP", [["New", "70-80%"], ["Search", "70-80%"], ["Reported As Draft", "70-80%"], ["Assigned to me", "70-80%"], ["Generate Permit", "70-80%"], ["Renewal Permit", "70-80%"], ["Pending Payment", "70-80%"], ["Dashboards", "70-80%"]]],
  ["Cargo Surrender", [["New", "70-80%"], ["Search", "70-80%"], ["List Of Requested Permits", "70-80%"]]],
  ["Loss/Damage/Surrender", [["Request For Loss/Damage/Surrender", "80-90%"], ["List Of Requested Permit", "80-90%"], ["Permit Search", "80-90%"], ["Search/Track", "80-90%"]]],
  ["Wild Life Activities", [["Activity", "Not Yet Started"], ["Dispersal", "Not Yet Started"], ["Data Correction", "Not Yet Started"], ["Reports", "Not Yet Started"]]],
  ["Events & Scheduling", [["Schedule", "Not Yet Started"], ["Calendar", "Not Yet Started"], ["Reports", "Not Yet Started"], ["CheckList", "Not Yet Started"]]],
  ["Permit Training", [["New Schedule Training", "80-90%"], ["View Schedule Training", "80-90%"], ["New Training", "80-90%"], ["Search/Track", "80-90%"]]],
  ["WildLife Management", [["Species Master", "Not Yet Started"], ["Configure Categories", "Not Yet Started"], ["Strike Incident Log", "Not Yet Started"], ["Log New Incident", "Not Yet Started"], ["Inventory Dashboard", "Not Yet Started"], ["Receive Stock", "Not Yet Started"], ["Log Activity", "Not Yet Started"], ["Inspection Schedule", "Not Yet Started"], ["Risk Zone Map", "Not Yet Started"], ["Enhanced GPS Map", "Not Yet Started"], ["Risk Dashboard", "Not Yet Started"]]],
  ["Enity Registration", [["Login Screen", "80-90%"]]],
  ["VSR Without Login", [["Login Screen", "80-90%"]]]
];

/* ------------------------------------------------------------------ */
/* State + storage                                                     */
/* ------------------------------------------------------------------ */
let rows = [];
let nextId = 1;
let saveTimer = null;

function seedRows() {
  const out = [];
  let id = 1;
  for (const [module, features] of SEED) {
    for (const [feature, status] of features) {
      out.push({ id: id++, module, feature, status, developer: "" });
    }
  }
  return out;
}

async function loadRows() {
  if (CONFIG.apiUrl) {
    try {
      const res = await fetch(CONFIG.apiUrl, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      if (Array.isArray(data) && data.length) return normalise(data);
    } catch (e) {
      setSaveState("Couldn't load from server, showing local copy", "error");
    }
  }
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG.storageKey) || "null");
    if (Array.isArray(saved) && saved.length) return normalise(saved);
  } catch (e) { /* ignore broken storage */ }
  return seedRows();
}

function normalise(list) {
  return list.map((r, i) => ({
    id: Number(r.id) || i + 1,
    module: String(r.module ?? "").trim(),
    feature: String(r.feature ?? "").trim(),
    status: String(r.status ?? "").trim(),
    developer: String(r.developer ?? "").trim(),
  }));
}

function scheduleSave() {
  setSaveState("Saving…", "saving");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveRows, CONFIG.saveDelayMs);
}

async function saveRows() {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(rows));
  } catch (e) { /* storage may be full or blocked */ }
  if (CONFIG.apiUrl) {
    try {
      const res = await fetch(CONFIG.apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });
      if (!res.ok) throw new Error(res.status);
    } catch (e) {
      setSaveState("Saved in this browser only (server save failed)", "error");
      return;
    }
  }
  setSaveState(CONFIG.apiUrl ? "Saved" : "Saved in this browser", "");
}

function setSaveState(text, cls) {
  const el = document.getElementById("saveState");
  el.textContent = text;
  el.className = "save-state " + (cls || "");
}

/* ------------------------------------------------------------------ */
/* Calculations                                                        */
/* ------------------------------------------------------------------ */
const statusValue = s => (STATUS_BY_LABEL[s] ? STATUS_BY_LABEL[s].value : 0);
const isDone = s => s === "100%";
const isNotStarted = s => s === "Not Yet Started";
const isInProgress = s => STATUS_BY_LABEL[s] && !isDone(s) && !isNotStarted(s);

function overall() {
  const list = rows.filter(r => r.feature || r.module);
  const total = list.length;
  const avg = total ? list.reduce((a, r) => a + statusValue(r.status), 0) / total : 0;
  return {
    total,
    notStarted: list.filter(r => isNotStarted(r.status)).length,
    inProgress: list.filter(r => isInProgress(r.status)).length,
    done: list.filter(r => isDone(r.status)).length,
    avg,
  };
}

function byStatus() {
  const total = rows.length || 1;
  return STATUSES.map(s => {
    const count = rows.filter(r => r.status === s.label).length;
    return { label: s.label, count, share: count / total };
  });
}

function byModule() {
  const map = new Map();
  for (const r of rows) {
    const key = r.module || "(No plugin)";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  return [...map.entries()].map(([module, list]) => {
    const devs = [...new Set(list.map(r => r.developer).filter(Boolean))];
    return {
      module,
      total: list.length,
      notStarted: list.filter(r => isNotStarted(r.status)).length,
      inProgress: list.filter(r => isInProgress(r.status)).length,
      done: list.filter(r => isDone(r.status)).length,
      avg: list.reduce((a, r) => a + statusValue(r.status), 0) / list.length,
      devs: devs.join(", "),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const $ = sel => document.querySelector(sel);
const pct = n => Math.round(n * 100) + "%";
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const statusClass = s => (STATUS_BY_LABEL[s] ? STATUS_BY_LABEL[s].cls : "st-blank");

const tooltip = document.getElementById("tooltip");
function showTip(e, text) {
  tooltip.textContent = text;
  tooltip.hidden = false;
  tooltip.style.left = e.clientX + 12 + "px";
  tooltip.style.top = e.clientY + 12 + "px";
}
function hideTip() { tooltip.hidden = true; }

/* Horizontal bar chart in plain SVG. items: [{label, value, text, tip}] */
function barChart(container, items, { max, onLabelClick } = {}) {
  const labelW = Math.min(260, 16 + 7 * Math.max(4, ...items.map(d => d.label.length)));
  const valueW = 16 + 7 * Math.max(3, ...items.map(d => d.text.length));
  const rowH = 26, barH = 16, top = 4;
  const W = Math.max(360, container.clientWidth || 760);
  const plotW = W - labelW - valueW;
  const H = top + items.length * rowH + 4;
  const most = max ?? Math.max(1e-9, ...items.map(d => d.value));

  let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">`;
  svg += `<line x1="${labelW}" x2="${labelW}" y1="${top}" y2="${H - 4}" stroke="#d0d5dd"/>`;
  items.forEach((d, i) => {
    const y = top + i * rowH;
    const len = Math.max(0, (plotW * d.value) / most);
    const cls = onLabelClick ? "label-link" : "";
    svg += `<text x="${labelW - 8}" y="${y + barH / 2 + 4}" text-anchor="end" class="${cls}" data-i="${i}">${esc(d.label)}</text>`;
    if (len > 0) {
      svg += `<rect class="bar-rect" data-i="${i}" x="${labelW}" y="${y}" width="${len}" height="${barH}" rx="${Math.min(4, len / 2)}"/>`;
    }
    svg += `<text class="val" x="${labelW + len + 6}" y="${y + barH / 2 + 4}">${esc(d.text)}</text>`;
  });
  svg += `</svg>`;
  container.innerHTML = svg;

  container.querySelectorAll(".bar-rect").forEach(el => {
    const d = items[+el.dataset.i];
    el.addEventListener("mousemove", e => showTip(e, d.tip || `${d.label}: ${d.text}`));
    el.addEventListener("mouseleave", hideTip);
    if (onLabelClick) el.addEventListener("click", () => onLabelClick(d));
  });
  if (onLabelClick) {
    container.querySelectorAll(".label-link").forEach(el => {
      el.addEventListener("click", () => onLabelClick(items[+el.dataset.i]));
    });
  }
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */
function renderDashboard() {
  const o = overall();
  $("#kpis").innerHTML = [
    ["Total features", o.total],
    ["Not started", o.notStarted],
    ["In progress", o.inProgress],
    ["Completed (100%)", o.done],
  ].map(([label, value]) => `<div class="kpi"><div class="label">${label}</div><div class="value">${value}</div></div>`).join("")
    + `<div class="kpi"><div class="label">Overall completion</div><div class="value">${pct(o.avg)}</div>
       <div class="bar"><span style="width:${pct(o.avg)}"></span></div></div>`;

  const st = byStatus().sort((a, b) => b.count - a.count);
  barChart($("#statusChart"), st.map(s => ({
    label: s.label, value: s.count, text: `${s.count} · ${pct(s.share)}`,
    tip: `${s.label}: ${s.count} features (${pct(s.share)})`,
  })), { onLabelClick: d => openFeatures({ status: d.label }) });

  const mods = byModule().sort((a, b) => b.avg - a.avg || a.module.localeCompare(b.module));
  const toItem = m => ({
    label: m.module, value: m.avg, text: pct(m.avg),
    tip: `${m.module}: ${pct(m.avg)} · ${m.total} features, ${m.notStarted} not started`,
  });
  barChart($("#moduleChart"), mods.map(toItem), { max: 1, onLabelClick: d => openFeatures({ module: d.label }) });

  const low = [...mods].sort((a, b) => a.avg - b.avg || b.total - a.total).slice(0, 10);
  barChart($("#lowChart"), low.map(toItem), { max: 1, onLabelClick: d => openFeatures({ module: d.label }) });
}

/* ------------------------------------------------------------------ */
/* Plugin-wise report                                                  */
/* ------------------------------------------------------------------ */
let reportSort = { key: null, dir: 1 };   // null = original order

function renderReport() {
  const q = $("#reportSearch").value.trim().toLowerCase();
  let list = byModule();
  if (q) list = list.filter(m => m.module.toLowerCase().includes(q) || m.devs.toLowerCase().includes(q));
  if (reportSort.key) {
    const k = reportSort.key;
    list.sort((a, b) => {
      const x = a[k], y = b[k];
      return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * reportSort.dir;
    });
  }
  document.querySelectorAll("#reportTable th[data-sort]").forEach(th => {
    th.classList.toggle("sorted-asc", th.dataset.sort === reportSort.key && reportSort.dir === 1);
    th.classList.toggle("sorted-desc", th.dataset.sort === reportSort.key && reportSort.dir === -1);
  });

  $("#reportTable tbody").innerHTML = list.map(m => `
    <tr>
      <td><span class="module-link" data-module="${esc(m.module)}">${esc(m.module)}</span></td>
      <td class="num"><div class="progress"><span>${pct(m.avg)}</span><div class="track"><div class="fill" style="width:${pct(m.avg)}"></div></div></div></td>
      <td class="num">${m.total}</td>
      <td class="num">${m.notStarted}</td>
      <td class="num">${m.inProgress}</td>
      <td class="num">${m.done}</td>
      <td>${m.devs ? esc(m.devs) : '<span class="unassigned">Unassigned</span>'}</td>
    </tr>`).join("");
  $("#reportCount").textContent = `${list.length} plugins`;
}

/* ------------------------------------------------------------------ */
/* Features (editable)                                                 */
/* ------------------------------------------------------------------ */
function refreshFilters() {
  const modules = [...new Set(rows.map(r => r.module).filter(Boolean))];
  const fm = $("#filterModule");
  const cur = fm.value;
  fm.innerHTML = `<option value="">All plugins</option>` + modules.map(m => `<option>${esc(m)}</option>`).join("");
  fm.value = modules.includes(cur) ? cur : "";
  $("#moduleList").innerHTML = modules.map(m => `<option value="${esc(m)}">`).join("");
}

function statusSelect(value) {
  const known = STATUS_BY_LABEL[value];
  const opts = (known || !value ? "" : `<option selected>${esc(value)}</option>`)
    + `<option value=""${value ? "" : " selected"}>— Select —</option>`
    + STATUSES.map(s => `<option${s.label === value ? " selected" : ""}>${s.label}</option>`).join("");
  return `<select class="status ${statusClass(value)}" data-field="status">${opts}</select>`;
}

function renderFeatures() {
  const q = $("#featSearch").value.trim().toLowerCase();
  const fm = $("#filterModule").value;
  const fs = $("#filterStatus").value;
  const list = rows.filter(r =>
    (!fm || r.module === fm) &&
    (!fs || r.status === fs) &&
    (!q || `${r.module} ${r.feature} ${r.developer}`.toLowerCase().includes(q)));

  $("#featTable tbody").innerHTML = list.map(r => `
    <tr data-id="${r.id}">
      <td><input data-field="module" list="moduleList" value="${esc(r.module)}" placeholder="Plugin name" /></td>
      <td><input data-field="feature" value="${esc(r.feature)}" placeholder="Feature name" /></td>
      <td>${statusSelect(r.status)}</td>
      <td><input data-field="developer" value="${esc(r.developer)}" placeholder="Add developer" /></td>
      <td class="col-del"><button class="del-btn" title="Delete this feature" aria-label="Delete">✕</button></td>
    </tr>`).join("");
  $("#featCount").textContent = `${list.length} of ${rows.length} features`;
}

function openFeatures({ module = "", status = "" } = {}) {
  $("#featSearch").value = "";
  $("#filterModule").value = module;
  $("#filterStatus").value = status;
  switchView("features");
}

/* ------------------------------------------------------------------ */
/* Views + events                                                      */
/* ------------------------------------------------------------------ */
let currentView = "dashboard";
function switchView(view) {
  currentView = view;
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === view));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));
  render();
}

function render() {
  if (currentView === "dashboard") renderDashboard();
  if (currentView === "report") renderReport();
  if (currentView === "features") renderFeatures();
}

function wireEvents() {
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (currentView === "dashboard") renderDashboard(); }, 150);
  });

  document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => switchView(t.dataset.view)));

  // Report
  $("#reportSearch").addEventListener("input", renderReport);
  document.querySelectorAll("#reportTable th[data-sort]").forEach(th => th.addEventListener("click", () => {
    const k = th.dataset.sort;
    reportSort = reportSort.key === k ? { key: k, dir: -reportSort.dir } : { key: k, dir: k === "module" || k === "devs" ? 1 : -1 };
    renderReport();
  }));
  $("#reportTable tbody").addEventListener("click", e => {
    const link = e.target.closest(".module-link");
    if (link) openFeatures({ module: link.dataset.module });
  });

  // Features filters
  $("#filterStatus").innerHTML = `<option value="">All statuses</option>` + STATUSES.map(s => `<option>${s.label}</option>`).join("");
  ["#featSearch", "#filterModule", "#filterStatus"].forEach(sel => $(sel).addEventListener("input", renderFeatures));

  // Inline edits (no re-render while typing, so focus is kept)
  const tbody = $("#featTable tbody");
  tbody.addEventListener("input", e => {
    const field = e.target.dataset.field;
    if (!field) return;
    const id = Number(e.target.closest("tr").dataset.id);
    const row = rows.find(r => r.id === id);
    if (!row) return;
    row[field] = e.target.value;
    if (field === "status") e.target.className = `status ${statusClass(e.target.value)}`;
    scheduleSave();
  });
  tbody.addEventListener("change", e => {
    if (e.target.dataset.field === "module") refreshFilters();
  });
  tbody.addEventListener("click", e => {
    if (!e.target.closest(".del-btn")) return;
    const tr = e.target.closest("tr");
    const row = rows.find(r => r.id === Number(tr.dataset.id));
    if (!row) return;
    if (!confirm(`Delete "${row.feature || "this feature"}" from ${row.module || "the list"}?`)) return;
    rows = rows.filter(r => r !== row);
    refreshFilters();
    renderFeatures();
    scheduleSave();
  });

  $("#btnAdd").addEventListener("click", () => {
    const module = $("#filterModule").value;
    const row = { id: nextId++, module, feature: "", status: "Not Yet Started", developer: "" };
    rows.push(row);
    $("#featSearch").value = "";
    $("#filterStatus").value = "";
    renderFeatures();
    scheduleSave();
    const tr = document.querySelector(`#featTable tr[data-id="${row.id}"]`);
    if (tr) {
      tr.scrollIntoView({ block: "center" });
      tr.querySelector(module ? '[data-field="feature"]' : '[data-field="module"]').focus();
    }
  });

  // Export / import / reset
  $("#btnExportCsv").addEventListener("click", exportCsv);
  $("#fileImport").addEventListener("change", importCsv);
  $("#btnReset").addEventListener("click", () => {
    if (!confirm("Discard all changes and reload the original data from the Excel file?")) return;
    rows = seedRows();
    nextId = rows.length + 1;
    refreshFilters();
    render();
    scheduleSave();
  });
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */
const CSV_HEAD = ["Module Name", "Feature", "Development completed (%)", "Developer Name"];

function exportCsv() {
  const cell = v => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [CSV_HEAD.join(",")].concat(rows.map(r => [r.module, r.feature, r.status, r.developer].map(cell).join(",")));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Plugins_and_Features-Status_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function parseCsv(text) {
  const out = [];
  let row = [], cur = "", quoted = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); out.push(row); row = []; cur = "";
    } else cur += c;
  }
  if (cur || row.length) { row.push(cur); out.push(row); }
  return out;
}

function importCsv(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = parseCsv(reader.result).filter(r => r.some(c => c.trim()));
    if (data.length < 2) { alert("That file has no rows."); return; }
    const head = data[0].map(h => h.trim().toLowerCase());
    const col = name => head.findIndex(h => h.includes(name));
    const iM = col("module"), iF = col("feature"), iS = col("completed"), iD = col("developer");
    if (iM < 0 || iF < 0) { alert("Couldn't find the 'Module Name' and 'Feature' columns in that CSV."); return; }
    if (!confirm(`Replace the current ${rows.length} features with ${data.length - 1} from "${file.name}"?`)) return;
    rows = data.slice(1).map((r, i) => ({
      id: i + 1,
      module: (r[iM] || "").trim(),
      feature: (r[iF] || "").trim(),
      status: iS >= 0 ? normaliseStatus(r[iS]) : "",
      developer: iD >= 0 ? (r[iD] || "").trim() : "",
    }));
    nextId = rows.length + 1;
    refreshFilters();
    render();
    scheduleSave();
  };
  reader.readAsText(file);
  e.target.value = "";
}

/* Turns 0.6 / "0.6" / "60 %" into "60%" so Excel exports import cleanly. */
function normaliseStatus(v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (STATUS_BY_LABEL[s]) return s;
  const n = Number(s.replace("%", "").trim());
  if (!isNaN(n)) {
    const p = n <= 1 ? Math.round(n * 100) : Math.round(n);
    if (STATUS_BY_LABEL[p + "%"]) return p + "%";
  }
  const lower = s.toLowerCase();
  const hit = STATUSES.find(x => x.label.toLowerCase() === lower);
  return hit ? hit.label : s;
}

/* ------------------------------------------------------------------ */
/* Start                                                               */
/* ------------------------------------------------------------------ */
(async function init() {
  rows = await loadRows();
  nextId = Math.max(0, ...rows.map(r => r.id)) + 1;
  wireEvents();
  refreshFilters();
  render();
  setSaveState(CONFIG.apiUrl ? "Saved" : "Saved in this browser", "");
})();
