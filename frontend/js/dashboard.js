/* =========================================================
   JALRAKSHAK DASHBOARD
   ========================================================= */

const DashboardState = {
    stats: null,
    alerts: [],
    locations: [],
    sensorReadings: []
};


/* =========================================================
   INITIALIZE DASHBOARD
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("Dashboard JS initialized.");

    loadDashboardStats();
    loadRecentAlerts();
    loadLocations();

});


/* =========================================================
   LOAD DASHBOARD STATISTICS
   ========================================================= */

async function loadDashboardStats() {

    console.log("Loading dashboard statistics...");

    try {

        const response = await fetch(
            window.location.protocol + "//" + window.location.hostname + ":8080/api/dashboard/stats"
        );

        if (!response.ok) {

            throw new Error(
                "Dashboard stats request failed: " +
                response.status
            );
        }

        const data = await response.json();

        console.log(
            "Dashboard statistics received:",
            data
        );

        DashboardState.stats = data;


        /* -------------------------------------------------
           UPDATE STAT CARDS
           ------------------------------------------------- */

        updateElement(
            "totalLocations",
            getValue(
                data,
                "totalLocations",
                0
            )
        );


        updateElement(
            "totalSensorReadings",
            getValue(
                data,
                "totalSensorReadings",
                0
            )
        );


        updateElement(
            "totalAlerts",
            getValue(
                data,
                "totalAlerts",
                0
            )
        );


        updateElement(
            "openAlerts",
            getValue(
                data,
                "openAlerts",
                0
            )
        );


        updateElement(
            "highSeverityAlerts",
            getValue(
                data,
                "highSeverityAlerts",
                0
            )
        );


        updateElement(
            "totalCitizenReports",
            getValue(
                data,
                "totalCitizenReports",
                0
            )
        );


        updateElement(
            "pendingResponses",
            getValue(
                data,
                "pendingResponses",
                0
            )
        );


        updateElement(
            "inProgressResponses",
            getValue(
                data,
                "inProgressResponses",
                0
            )
        );


        /* Update alert badge */

        if (
            typeof updateAlertBadge === "function"
        ) {

            updateAlertBadge(
                getValue(
                    data,
                    "openAlerts",
                    0
                )
            );
        }


    } catch (error) {

        console.error(
            "Error loading dashboard statistics:",
            error
        );

        showDashboardError(
            "Unable to load dashboard statistics."
        );
    }
}


/* =========================================================
   LOAD RECENT ALERTS
   ========================================================= */

async function loadRecentAlerts() {

    console.log("Loading recent alerts...");

    try {

        const response = await fetch(
            window.location.protocol + "//" + window.location.hostname + ":8080/api/alerts"
        );

        if (!response.ok) {

            throw new Error(
                "Alerts request failed: " +
                response.status
            );
        }

        const data = await response.json();

        console.log(
            "Alerts received:",
            data
        );

        DashboardState.alerts =
            Array.isArray(data)
                ? data
                : [];


        /* Sort newest first */

        DashboardState.alerts.sort(
            function (a, b) {

                return new Date(
                    b.detectedAt || 0
                ) -
                new Date(
                    a.detectedAt || 0
                );
            }
        );


        displayRecentAlerts(
            DashboardState.alerts.slice(0, 5)
        );


    } catch (error) {

        console.error(
            "Error loading alerts:",
            error
        );

        displayRecentAlerts([]);
    }
}


/* =========================================================
   DISPLAY RECENT ALERTS
   ========================================================= */

function displayRecentAlerts(alerts) {

    const tableBody =
        document.getElementById(
            "alertsTableBody"
        );

    if (!tableBody) {

        console.warn(
            "alertsTableBody not found."
        );

        return;
    }


    tableBody.innerHTML = "";


    if (
        !alerts ||
        alerts.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No alerts available.
                </td>
            </tr>
        `;

        return;
    }


    alerts.forEach(
        function (alert) {

            const row =
                document.createElement("tr");


            const severity =
                alert.severity || "UNKNOWN";


            const status =
                alert.status || "UNKNOWN";


            const priority =
                alert.priorityScore !== undefined
                    ? alert.priorityScore
                    : "—";


            const message =
                alert.message || "No message";


            const detectedAt =
                formatDashboardDate(
                    alert.detectedAt
                );


            const location =
                alert.locationId
                    ? "Location " +
                      alert.locationId
                    : "Unknown";


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHtml(location)}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(
                        alert.alertType ||
                        "Water Quality Anomaly"
                    )}
                </td>

                <td>
                    <span class="severity-badge ${getSeverityClass(severity)}">
                        ${escapeHtml(severity)}
                    </span>
                </td>

                <td>
                    <strong>
                        ${escapeHtml(String(priority))}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(message)}
                </td>

                <td>
                    ${escapeHtml(detectedAt)}
                </td>

            `;


            tableBody.appendChild(row);

        }
    );
}


/* =========================================================
   LOAD LOCATIONS
   ========================================================= */

async function loadLocations() {

    console.log("Loading monitoring locations...");

    try {

        const response = await fetch(
            window.location.protocol + "//" + window.location.hostname + ":8080/api/locations"
        );

        if (!response.ok) {

            throw new Error(
                "Locations request failed: " +
                response.status
            );
        }

        const data = await response.json();

        console.log(
            "Locations received:",
            data
        );

        DashboardState.locations =
            Array.isArray(data)
                ? data
                : [];


        displayLocations(
            DashboardState.locations
        );


    } catch (error) {

        console.error(
            "Error loading locations:",
            error
        );

        displayLocations([]);
    }
}


/* =========================================================
   DISPLAY LOCATIONS
   ========================================================= */

function displayLocations(locations) {

    const container =
        document.getElementById(
            "locationsContainer"
        );

    if (!container) {

        console.warn(
            "locationsContainer not found."
        );

        return;
    }


    container.innerHTML = "";


    if (
        !locations ||
        locations.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <p>No monitoring locations available.</p>
            </div>
        `;

        return;
    }


    locations.forEach(
        function (location) {

            const card =
                document.createElement("div");

            card.className =
                "location-card";


            card.innerHTML = `

                <div class="location-icon">
                    <i class="bi bi-geo-alt-fill"></i>
                </div>

                <div class="location-info">

                    <h4>
                        ${escapeHtml(
                            location.locationName ||
                            "Unknown Location"
                        )}
                    </h4>

                    <p>
                        ${escapeHtml(
                            location.city ||
                            "Unknown City"
                        )}
                        ${
                            location.state
                                ? ", " +
                                  escapeHtml(
                                      location.state
                                  )
                                : ""
                        }
                    </p>

                    <span class="location-type">
                        ${
                            escapeHtml(
                                location.waterSourceType ||
                                "WATER SOURCE"
                            )
                        }
                    </span>

                </div>

            `;


            container.appendChild(card);

        }
    );
}


/* =========================================================
   HELPER — GET VALUE
   ========================================================= */

function getValue(
    object,
    property,
    defaultValue
) {

    if (
        object &&
        object[property] !== undefined &&
        object[property] !== null
    ) {

        return object[property];
    }

    return defaultValue;
}


/* =========================================================
   HELPER — UPDATE ELEMENT
   ========================================================= */

function updateElement(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );

    if (!element) {

        console.warn(
            "Element not found:",
            elementId
        );

        return;
    }

    element.textContent = value;
}


/* =========================================================
   HELPER — SEVERITY CLASS
   ========================================================= */

function getSeverityClass(
    severity
) {

    switch (
        String(severity).toUpperCase()
    ) {

        case "HIGH":
            return "severity-high";

        case "MEDIUM":
            return "severity-medium";

        case "LOW":
            return "severity-low";

        default:
            return "severity-unknown";
    }
}


/* =========================================================
   HELPER — DATE FORMAT
   ========================================================= */

function formatDashboardDate(
    value
) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "—";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   HELPER — ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   DASHBOARD ERROR
   ========================================================= */

function showDashboardError(
    message
) {

    console.error(
        "Dashboard:",
        message
    );

    const elements =
        document.querySelectorAll(
            ".dashboard-error"
        );

    elements.forEach(
        function (element) {

            element.textContent =
                message;

        }
    );
}


/* =========================================================
   REFRESH DASHBOARD
   ========================================================= */

async function refreshDashboard() {

    console.log(
        "Refreshing dashboard..."
    );

    await Promise.all([
        loadDashboardStats(),
        loadRecentAlerts(),
        loadLocations()
    ]);

    console.log(
        "Dashboard refresh completed."
    );
}


/* =========================================================
   GLOBAL EXPORTS
   ========================================================= */

window.DashboardState =
    DashboardState;

window.loadDashboardStats =
    loadDashboardStats;

window.loadRecentAlerts =
    loadRecentAlerts;

window.loadLocations =
    loadLocations;

window.refreshDashboard =
    refreshDashboard;