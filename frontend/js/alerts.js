/* =========================================================
   JALRAKSHAK - ALERT MANAGEMENT
   Loads, filters and displays water-quality alerts.
   Main application navigation is handled by app.js.
   ========================================================= */

const ALERTS_API_URL = window.location.protocol + "//" + window.location.hostname + ":8080/api/alerts";
const ALERTS_LOCATIONS_API_URL = window.location.protocol + "//" + window.location.hostname + ":8080/api/locations";

const AlertsState = {
    alerts: [],
    locations: [],
    status: "ALL",
    severity: "ALL"
};

document.addEventListener("DOMContentLoaded", () => {
    initializeAlertsPage();
});

function initializeAlertsPage() {
    const refreshButton = document.getElementById("alertsRefreshButton");
    const statusFilter = document.getElementById("alertStatusFilter");
    const severityFilter = document.getElementById("alertSeverityFilter");
    const clearButton = document.getElementById("clearAlertFiltersButton");

    if (refreshButton) {
        refreshButton.addEventListener("click", loadAlerts);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            AlertsState.status = statusFilter.value || "ALL";
            renderAlerts();
        });
    }

    if (severityFilter) {
        severityFilter.addEventListener("change", () => {
            AlertsState.severity = severityFilter.value || "ALL";
            renderAlerts();
        });
    }

    if (clearButton) {
        clearButton.addEventListener("click", () => {
            AlertsState.status = "ALL";
            AlertsState.severity = "ALL";
            if (statusFilter) statusFilter.value = "ALL";
            if (severityFilter) severityFilter.value = "ALL";
            renderAlerts();
        });
    }

    loadAlerts();
}

async function loadAlerts() {
    const tableBody = document.getElementById("allAlertsTableBody");
    const refreshButton = document.getElementById("alertsRefreshButton");

    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.innerHTML =
            '<i class="bi bi-arrow-repeat"></i> Loading...';
    }

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="loading-state">
                        <i class="bi bi-arrow-repeat"></i>
                        Loading alerts...
                    </div>
                </td>
            </tr>`;
    }

    try {
        const [alertsResponse, locationsResponse] = await Promise.all([
            fetch(ALERTS_API_URL),
            fetch(ALERTS_LOCATIONS_API_URL)
        ]);

        if (!alertsResponse.ok) {
            throw new Error(`Alerts API failed: HTTP ${alertsResponse.status}`);
        }

        if (!locationsResponse.ok) {
            throw new Error(`Locations API failed: HTTP ${locationsResponse.status}`);
        }

        const alertsData = await alertsResponse.json();
        const locationsData = await locationsResponse.json();

        AlertsState.alerts = Array.isArray(alertsData)
            ? alertsData
            : Array.isArray(alertsData.content) ? alertsData.content : [];

        AlertsState.locations = Array.isArray(locationsData)
            ? locationsData
            : Array.isArray(locationsData.content) ? locationsData.content : [];

        renderAlertSummary();
        renderAlerts();

        if (typeof window.updateAlertBadge === "function") {
            const openCount = AlertsState.alerts.filter(
                alert => String(alert.status || "").toUpperCase() === "OPEN"
            ).length;
            window.updateAlertBadge(openCount);
        }
    } catch (error) {
        console.error("Failed to load alerts:", error);
        renderAlertError("Unable to load alerts. Make sure the Spring Boot backend is running.");
        if (typeof showToast === "function") {
            showToast("Unable to load alerts.", "error");
        }
    } finally {
        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.innerHTML =
                '<i class="bi bi-arrow-clockwise"></i> Refresh Alerts';
        }
    }
}

function renderAlertSummary() {
    const alerts = AlertsState.alerts;

    setText("totalAlertCount", alerts.length);
    setText(
        "openAlertCount",
        alerts.filter(a => normalize(a.status) === "OPEN").length
    );
    setText(
        "highAlertCount",
        alerts.filter(a => normalize(a.severity) === "HIGH").length
    );
    setText(
        "mediumAlertCount",
        alerts.filter(a => normalize(a.severity) === "MEDIUM").length
    );
    setText(
        "lowAlertCount",
        alerts.filter(a => normalize(a.severity) === "LOW").length
    );
}

function renderAlerts() {
    const tableBody = document.getElementById("allAlertsTableBody");
    if (!tableBody) return;

    const filtered = AlertsState.alerts.filter(alert => {
        const statusMatches =
            AlertsState.status === "ALL" ||
            normalize(alert.status) === normalize(AlertsState.status);

        const severityMatches =
            AlertsState.severity === "ALL" ||
            normalize(alert.severity) === normalize(AlertsState.severity);

        return statusMatches && severityMatches;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="bi bi-check-circle"></i>
                        No alerts match the selected filters.
                    </div>
                </td>
            </tr>`;
        return;
    }

    filtered.sort((a, b) => {
        const dateA = new Date(a.detectedAt || 0).getTime();
        const dateB = new Date(b.detectedAt || 0).getTime();
        return dateB - dateA;
    });

    tableBody.innerHTML = filtered.map(createAlertRow).join("");
}

function createAlertRow(alert) {
    const location = AlertsState.locations.find(
        item => Number(item.locationId) === Number(alert.locationId)
    );

    const severity = normalize(alert.severity) || "UNKNOWN";
    const status = normalize(alert.status) || "UNKNOWN";
    const priority = Number(alert.priorityScore);

    return `
        <tr>
            <td>#${escapeHtml(alert.alertId)}</td>
            <td>
                <div class="alert-table-title">
                    ${escapeHtml(alert.alertType || "Water Quality Alert")}
                </div>
                <div class="alert-table-message">
                    ${escapeHtml(alert.message || "No message available.")}
                </div>
            </td>
            <td>
                ${escapeHtml(
                    location
                        ? (location.locationName || `Location ${location.locationId}`)
                        : `Location ${alert.locationId ?? "Unknown"}`
                )}
            </td>
            <td>
                <span class="severity-badge ${severity.toLowerCase()}">
                    ${escapeHtml(severity)}
                </span>
            </td>
            <td>
                <strong>${Number.isFinite(priority) ? priority.toFixed(1) : "—"}</strong>
            </td>
            <td>
                <span class="status-badge ${status.toLowerCase()}">
                    ${escapeHtml(formatStatus(status))}
                </span>
            </td>
            <td>${escapeHtml(formatDateTime(alert.detectedAt))}</td>
        </tr>`;
}

function renderAlertError(message) {
    const tableBody = document.getElementById("allAlertsTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="7">
                <div class="error-state">
                    <i class="bi bi-exclamation-triangle"></i>
                    ${escapeHtml(message)}
                </div>
            </td>
        </tr>`;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function normalize(value) {
    return String(value ?? "").trim().toUpperCase();
}

function formatStatus(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.loadAlerts = loadAlerts;
window.refreshAlerts = loadAlerts;
window.filterAlertsByStatus = value => {
    AlertsState.status = value || "ALL";
    const select = document.getElementById("alertStatusFilter");
    if (select) select.value = AlertsState.status;
    renderAlerts();
};
window.filterAlertsBySeverity = value => {
    AlertsState.severity = value || "ALL";
    const select = document.getElementById("alertSeverityFilter");
    if (select) select.value = AlertsState.severity;
    renderAlerts();
};
