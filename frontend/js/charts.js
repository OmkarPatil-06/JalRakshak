/* JalRakshak dashboard charts — database-backed verified observations only. */
let waterQualityChart = null;
let waterbodyRiskPieChart = null;

const DASHBOARD_CHART_API = window.JALRAKSHAK_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8080/api`;

async function dashboardChartGet(path) {
    const response = await fetch(`${DASHBOARD_CHART_API}${path}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${path}`);
    return response.json();
}

async function loadWaterQualityChart() {
    try {
        const [locations, verifiedRows] = await Promise.all([
            dashboardChartGet("/locations"),
            dashboardChartGet("/sensor-data/verified")
        ]);
        const safeLocations = Array.isArray(locations) ? locations : [];
        const safeRows = Array.isArray(verifiedRows) ? verifiedRows.filter(row =>
            row && row.recordedAt && String(row.verificationStatus || "").toUpperCase() === "VERIFIED" &&
            row.sourceName && row.sourceUrl && row.sampleMethod && row.evidenceReference
        ) : [];

        const latestByLocation = new Map();
        safeRows.forEach(row => {
            const id = Number(row.locationId);
            const date = new Date(row.recordedAt).getTime();
            if (!Number.isFinite(id) || !Number.isFinite(date)) return;
            const current = latestByLocation.get(id);
            if (!current || date > current.date) latestByLocation.set(id, { date, row });
        });
        const locationMap = new Map(safeLocations.map(location => [Number(location.locationId), location]));
        const newestLocation = [...latestByLocation.entries()].sort((a,b) => b[1].date - a[1].date)[0];

        renderVerifiedCoverageChart(safeLocations, latestByLocation);
        const count = document.getElementById("dashboardWaterbodyCount");
        if (count) count.textContent = `${safeLocations.length} locations`;

        if (!newestLocation) {
            showChartPlaceholder("No VERIFIED sensor records with complete source evidence are available. No synthetic readings are substituted.");
            const title = document.getElementById("chartLocationName");
            if (title) title.textContent = "No verified observations";
            return;
        }

        const locationId = newestLocation[0];
        const location = locationMap.get(locationId) || { locationName: `Location #${locationId}` };
        const records = safeRows.filter(row => Number(row.locationId) === locationId);
        createWaterQualityChart(records, location);
    } catch (error) {
        console.error("Failed to load verified dashboard chart data:", error);
        showChartPlaceholder(`Unable to load verified database readings: ${error.message}`);
        const title = document.getElementById("chartLocationName");
        if (title) title.textContent = "Database unavailable";
        renderVerifiedCoverageChart([], new Map());
    }
}

function createWaterQualityChart(sensorData, location) {
    const canvas = document.getElementById("waterQualityChart");
    if (!canvas || !window.Chart) return;
    if (waterQualityChart) waterQualityChart.destroy();
    const sortedData = [...sensorData].filter(row => row && row.recordedAt)
        .sort((a,b) => new Date(a.recordedAt) - new Date(b.recordedAt));
    if (!sortedData.length) {
        showChartPlaceholder("No verified sensor readings are recorded for this location.");
        return;
    }
    const labels = sortedData.map(row => formatChartDate(row.recordedAt));
    const value = key => sortedData.map(row => {
        const v = row[key];
        return v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
    });
    hideChartPlaceholder();
    waterQualityChart = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels,
            datasets: [
                { label: "pH", data: value("ph"), borderWidth: 2, tension: 0.25, fill: false, yAxisID: "y", spanGaps: false },
                { label: "Turbidity (NTU)", data: value("turbidity"), borderWidth: 2, tension: 0.25, fill: false, yAxisID: "y1", spanGaps: false },
                { label: "Dissolved oxygen (mg/L)", data: value("dissolvedOxygen"), borderWidth: 2, tension: 0.25, fill: false, yAxisID: "y1", spanGaps: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { display: true, position: "top" },
                tooltip: { callbacks: {
                    afterBody: items => {
                        const record = sortedData[items[0]?.dataIndex];
                        return record ? `Database record #${record.sensorDataId} · VERIFIED · ${record.sourceName}` : "";
                    }
                } }
            },
            scales: {
                x: { title: { display: true, text: "Recorded time" }, grid: { display: false } },
                y: { position: "left", title: { display: true, text: "pH" }, suggestedMin: 0, suggestedMax: 14 },
                y1: { position: "right", title: { display: true, text: "Measured value" }, grid: { drawOnChartArea: false }, beginAtZero: true }
            }
        }
    });
    const title = document.getElementById("chartLocationName");
    if (title) title.textContent = `${location.locationName || "Monitoring location"} · verified data`;
}

function renderVerifiedCoverageChart(locations, latestByLocation) {
    const canvas = document.getElementById("waterbodyRiskPie");
    const placeholder = document.getElementById("waterbodyRiskPiePlaceholder");
    if (!canvas || !window.Chart) return;
    if (waterbodyRiskPieChart) { waterbodyRiskPieChart.destroy(); waterbodyRiskPieChart = null; }
    if (!locations.length) {
        canvas.style.display = "none";
        if (placeholder) { placeholder.style.display = "flex"; placeholder.querySelector("p").textContent = "Database locations are unavailable."; }
        return;
    }
    const withVerified = locations.filter(location => latestByLocation.has(Number(location.locationId))).length;
    const withoutVerified = Math.max(0, locations.length - withVerified);
    canvas.style.display = "block";
    if (placeholder) placeholder.style.display = "none";
    waterbodyRiskPieChart = new Chart(canvas, {
        type: "pie",
        data: {
            labels: ["Locations with verified readings", "Locations without verified readings"],
            datasets: [{ data: [withVerified, withoutVerified], backgroundColor: ["#16866f", "#94a3b8"], borderColor: "#ffffff", borderWidth: 2 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { afterLabel: () => "Counts are calculated from /api/locations and VERIFIED sensor_data rows." } } } }
    });
}

function formatChartDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

function showChartPlaceholder(message) {
    const canvas = document.getElementById("waterQualityChart");
    const placeholder = document.getElementById("waterQualityPlaceholder");
    if (waterQualityChart) { waterQualityChart.destroy(); waterQualityChart = null; }
    if (canvas) canvas.style.display = "none";
    if (placeholder) {
        placeholder.style.display = "flex";
        const p = placeholder.querySelector("p");
        if (p) p.textContent = message;
    }
}

function hideChartPlaceholder() {
    const canvas = document.getElementById("waterQualityChart");
    const placeholder = document.getElementById("waterQualityPlaceholder");
    if (canvas) canvas.style.display = "block";
    if (placeholder) placeholder.style.display = "none";
}

async function refreshWaterQualityChart() {
    if (waterQualityChart) { waterQualityChart.destroy(); waterQualityChart = null; }
    await loadWaterQualityChart();
}

window.loadWaterQualityChart = loadWaterQualityChart;
window.createWaterQualityChart = createWaterQualityChart;
window.refreshWaterQualityChart = refreshWaterQualityChart;

document.addEventListener("DOMContentLoaded", () => loadWaterQualityChart());
