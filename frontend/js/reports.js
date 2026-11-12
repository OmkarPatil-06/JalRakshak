const REPORTS_API_BASE_URL = window.location.protocol + "//" + window.location.hostname + ":8080/api";

let reportsLocations = [];
let reportsSensorData = [];
let reportsAlerts = [];
let reportsResponses = [];
let reportsCitizenReports = [];

document.addEventListener("DOMContentLoaded", () => {
    initializeReportsPage();
});

function initializeReportsPage() {

    const refreshButton =
        document.getElementById("reportsRefreshButton");

    const waterQualityButton =
        document.getElementById("generateWaterQualityReportButton");

    const alertButton =
        document.getElementById("generateAlertReportButton");

    const responseButton =
        document.getElementById("generateResponseReportButton");

    const citizenButton =
        document.getElementById("generateCitizenReportButton");


    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            refreshReports
        );
    }


    /*
     * STEP 3
     * Water Quality Report
     */
    if (waterQualityButton) {
        waterQualityButton.addEventListener(
            "click",
            generateWaterQualityReport
        );
    }


    if (responseButton) {
        responseButton.addEventListener("click", generateResponseReport);
    }

    if (citizenButton) {
        citizenButton.addEventListener("click", generateCitizenReport);
    }

    if (alertButton) {
        alertButton.addEventListener("click", generateAlertReport);
    }

    loadReportsOverview();
};


/* =========================================================
   LOAD REPORT OVERVIEW
   ========================================================= */

async function loadReportsOverview() {

    try {

        const [
            locations,
            sensorData,
            alerts,
            citizenReports,
            responses
        ] = await Promise.all([

            fetchReportData("/locations"),

            fetchReportData("/sensor-data/verified"),

            fetchReportData("/alerts"),

            fetchReportData("/citizen-reports"),

            fetchReportData("/responses")

        ]);


        reportsLocations =
            Array.isArray(locations)
                ? locations
                : [];

        reportsSensorData =
            Array.isArray(sensorData)
                ? sensorData
                : [];

        reportsAlerts =
            Array.isArray(alerts)
                ? alerts
                : [];

        reportsResponses =
            Array.isArray(responses)
                ? responses
                : [];

        reportsCitizenReports =
            Array.isArray(citizenReports)
                ? citizenReports
                : [];


        const totalLocations =
            reportsLocations.length;

        const totalSensorReadings =
            reportsSensorData.length;

        const totalAlerts =
            reportsAlerts.length;

        const highSeverityAlerts =
            reportsAlerts.filter(
                alert =>
                    String(alert.severity)
                        .toUpperCase() === "HIGH"
            ).length;

        const totalCitizenReports =
            Array.isArray(citizenReports)
                ? citizenReports.length
                : 0;

        const totalResponses =
            Array.isArray(responses)
                ? responses.length
                : 0;


        updateReportStatistic(
            "reportTotalLocations",
            totalLocations
        );

        updateReportStatistic(
            "reportTotalSensorReadings",
            totalSensorReadings
        );

        updateReportStatistic(
            "reportTotalAlerts",
            totalAlerts
        );

        updateReportStatistic(
            "reportHighSeverityAlerts",
            highSeverityAlerts
        );

        updateReportStatistic(
            "reportCitizenReports",
            totalCitizenReports
        );

        updateReportStatistic(
            "reportResponseActions",
            totalResponses
        );


        populateReportLocationDropdown(
            reportsLocations
        );


        console.log(
            "Reports overview loaded successfully."
        );

    } catch (error) {

        console.error(
            "Error loading Reports overview:",
            error
        );

    }
}


/* =========================================================
   API HELPER
   ========================================================= */

async function fetchReportData(endpoint) {

    const response =
        await fetch(
            REPORTS_API_BASE_URL + endpoint
        );


    if (!response.ok) {

        throw new Error(
            `API request failed: ${response.status} ${endpoint}`
        );

    }


    return await response.json();
}


/* =========================================================
   UPDATE SUMMARY STATISTIC
   ========================================================= */

function updateReportStatistic(
    elementId,
    value
) {

    const element =
        document.getElementById(elementId);


    if (!element) {
        return;
    }


    element.textContent = value;
}


/* =========================================================
   LOCATION DROPDOWN
   ========================================================= */

function populateReportLocationDropdown(
    locations
) {

    const select =
        document.getElementById(
            "reportLocationSelect"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">Select location</option>`;


    if (!Array.isArray(locations)) {
        return;
    }


    locations.forEach(location => {

        const option =
            document.createElement("option");


        option.value =
            location.locationId;


        option.textContent =
            location.locationName ||
            `Location ${location.locationId}`;


        select.appendChild(option);

    });
}


/* =========================================================
   REFRESH REPORTS
   ========================================================= */

async function refreshReports() {

    const button =
        document.getElementById(
            "reportsRefreshButton"
        );


    if (button) {

        button.disabled = true;

        button.innerHTML =
            `<i class="bi bi-arrow-repeat"></i> Refreshing...`;

    }


    try {

        await loadReportsOverview();

    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML =
                `<i class="bi bi-arrow-clockwise"></i> Refresh Reports`;

        }

    }
}


/* =========================================================
   STEP 3
   GENERATE WATER QUALITY REPORT
   ========================================================= */

function generateWaterQualityReport() {

    const locationSelect =
        document.getElementById("reportLocationSelect");

    const periodSelect =
        document.getElementById("reportPeriodSelect");

    if (!locationSelect) {
        console.error("reportLocationSelect not found.");
        return;
    }

    const selectedLocationId =
        locationSelect.value;

    const selectedPeriod =
        periodSelect
            ? periodSelect.value
            : "latest";

    if (!selectedLocationId) {

        showReportMessage(
            "Please select a monitoring location first.",
            "warning"
        );

        return;
    }

    /*
     * Find the selected monitoring location.
     */
    const location =
        reportsLocations.find(
            item =>
                String(item.locationId) ===
                String(selectedLocationId)
        );

    if (!location) {

        showReportMessage(
            "Selected monitoring location could not be found.",
            "error"
        );

        return;
    }

    /*
     * Find sensor readings belonging
     * to the selected location.
     */
    let locationSensorData =
        reportsSensorData.filter(
            reading =>
                String(reading.locationId) ===
                String(selectedLocationId)
        );

    if (locationSensorData.length === 0) {
        renderWaterQualityUnavailableReport(location, selectedPeriod);
        return;
    }

    /*
     * Sort readings from newest to oldest.
     *
     * Your backend uses:
     * recordedAt
     */
    locationSensorData.sort(
        (a, b) => {

            const dateA =
                new Date(a.recordedAt);

            const dateB =
                new Date(b.recordedAt);

            return dateB - dateA;
        }
    );

    /*
     * Latest Reading:
     * Use only the newest available reading.
     */
    if (selectedPeriod === "latest") {

        const latestReading =
            locationSensorData[0];

        renderWaterQualityReport(
            location,
            latestReading,
            [latestReading],
            selectedPeriod
        );

        return;
    }

    /*
     * 7 / 30 / 90 day reports.
     *
     * The HTML sends:
     *
     * "7"
     * "30"
     * "90"
     */
    const numberOfDays =
        Number(selectedPeriod);

    let filteredReadings =
        locationSensorData;

    if (!isNaN(numberOfDays)) {

        /*
         * Use the newest available sensor
         * reading as the reference date.
         */
        const latestDate =
            new Date(
                locationSensorData[0].recordedAt
            );

        const startDate =
            new Date(latestDate);

        startDate.setDate(
            startDate.getDate() -
            numberOfDays
        );

        filteredReadings =
            locationSensorData.filter(
                reading => {

                    const readingDate =
                        new Date(
                            reading.recordedAt
                        );

                    return (
                        !isNaN(
                            readingDate.getTime()
                        ) &&
                        readingDate >= startDate &&
                        readingDate <= latestDate
                    );
                }
            );
    }

    /*
     * Safety fallback.
     */
    if (filteredReadings.length === 0) {

        filteredReadings = [
            locationSensorData[0]
        ];
    }

    /*
     * Because the array is already sorted
     * newest → oldest, the first reading
     * is the latest reading for the report.
     */
    const latestReading =
        filteredReadings[0];

    renderWaterQualityReport(
        location,
        latestReading,
        filteredReadings,
        selectedPeriod
    );
}



// Alert ----------------------------------------------------------------------

function generateAlertReport() {

    const locationSelect =
        document.getElementById("reportLocationSelect");

    const periodSelect =
        document.getElementById("reportPeriodSelect");

    if (!locationSelect) {

        console.error(
            "reportLocationSelect not found."
        );

        return;
    }

    const selectedLocationId =
        locationSelect.value;

    const selectedPeriod =
        periodSelect
            ? periodSelect.value
            : "latest";

    if (!selectedLocationId) {

        showReportMessage(
            "Please select a monitoring location first.",
            "warning"
        );

        return;
    }

    /*
     * Find the selected monitoring location.
     */
    const location =
        reportsLocations.find(
            item =>
                String(item.locationId) ===
                String(selectedLocationId)
        );

    if (!location) {

        showReportMessage(
            "Selected monitoring location could not be found.",
            "error"
        );

        return;
    }

    /*
     * Find alerts belonging
     * to the selected location.
     */
    let locationAlerts =
        reportsAlerts.filter(
            alert =>
                String(alert.locationId) ===
                String(selectedLocationId)
        );

    /*
     * Sort alerts from newest to oldest.
     *
     * Backend field:
     * detectedAt
     */
    locationAlerts.sort(
        (a, b) => {

            const dateA =
                new Date(a.detectedAt);

            const dateB =
                new Date(b.detectedAt);

            return dateB - dateA;
        }
    );

    /*
     * If there are no alerts,
     * show an informative message.
     */
    if (locationAlerts.length === 0) {
        renderAlertReport(location, [], selectedPeriod);
        return;
    }

    /*
     * Latest Reading:
     * Use the newest alert only.
     */
    if (selectedPeriod === "latest") {

        const latestAlert =
            locationAlerts[0];

        renderAlertReport(
            location,
            [latestAlert],
            selectedPeriod
        );

        return;
    }

    /*
     * 7 / 30 / 90 day reports.
     */
    const numberOfDays =
        Number(selectedPeriod);

    let filteredAlerts =
        locationAlerts;

    if (!isNaN(numberOfDays)) {

        /*
         * Use the newest available alert
         * as the reference date.
         */
        const latestDate =
            new Date(
                locationAlerts[0].detectedAt
            );

        const startDate =
            new Date(latestDate);

        startDate.setDate(
            startDate.getDate() -
            numberOfDays
        );

        filteredAlerts =
            locationAlerts.filter(
                alert => {

                    const alertDate =
                        new Date(
                            alert.detectedAt
                        );

                    return (
                        !isNaN(
                            alertDate.getTime()
                        ) &&
                        alertDate >= startDate &&
                        alertDate <= latestDate
                    );
                }
            );
    }

    /*
     * Safety fallback.
     */
    if (filteredAlerts.length === 0) {

        filteredAlerts = [
            locationAlerts[0]
        ];
    }

    /*
     * Render the alert report.
     */
    renderAlertReport(
        location,
        filteredAlerts,
        selectedPeriod
    );
}


/* =========================================================
   RENDER WATER QUALITY REPORT
   ========================================================= */

function renderWaterQualityUnavailableReport(location, selectedPeriod) {
    const container = document.getElementById("reportPreviewContainer");
    const status = document.querySelector(".report-preview-status");
    if (!container) return;
    if (status) status.textContent = "Water Quality Report — Insufficient Data";
    container.innerHTML = `
        <div class="generated-report-card">
            <div class="generated-report-header">
                <div>
                    <span class="report-small-label">JALRAKSHAK REPORT</span>
                    <h3>Water Quality Report</h3>
                    <p>Monitoring Location: <strong>${escapeReportHtml(getLocationName(location))}</strong></p>
                </div>
                <span class="report-period-badge">${escapeReportHtml(formatReportPeriod(selectedPeriod))}</span>
            </div>
            <div class="alert alert-warning mt-3">
                <strong>INSUFFICIENT DATA</strong>
                <p class="mb-0">No water-quality measurements are currently stored for this monitoring location. This is not a pass or fail assessment and must not be interpreted as safe or polluted.</p>
            </div>
            <div class="report-summary-grid">
                <div><span>Stored readings</span><strong>0</strong></div>
                <div><span>Assessment</span><strong>Unavailable</strong></div>
                <div><span>Data source</span><strong>None recorded</strong></div>
            </div>
        </div>`;
}

function renderWaterQualityReport(
    location,
    reading,
    allReadings,
    selectedPeriod
) {

    const container =
        document.getElementById(
            "reportPreviewContainer"
        );


    const status =
        document.querySelector(
            ".report-preview-status"
        );


    if (!container) {
        return;
    }


    if (status) {
        status.textContent =
            "Water Quality Report";
    }


    const anomaly =
        calculateAnomalyStatus(
            reading
        );


    const readingDate =
        getSensorReadingDate(
            reading
        );


    container.innerHTML = `

        <div class="water-quality-report">

            <div class="water-quality-report-header">

                <div>

                    <span class="report-small-label">
                        JALRAKSHAK REPORT
                    </span>

                    <h3>
                        Water Quality Report
                    </h3>

                    <p>
                        Monitoring Location:
                        <strong>
                            ${escapeHtml(
                                getLocationName(location)
                            )}
                        </strong>
                    </p>

                </div>


                <div class="water-quality-report-status">

                    <span class="report-status-label">
                        ${anomaly.label}
                    </span>

                </div>

            </div>


            <div class="water-quality-location-info">

                <div class="report-info-item">

                    <span>Location</span>

                    <strong>
                        ${escapeHtml(
                            getLocationName(location)
                        )}
                    </strong>

                </div>


                <div class="report-info-item">

                    <span>City</span>

                    <strong>
                        ${escapeHtml(
                            location.city ||
                            location.locationCity ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="report-info-item">

                    <span>Report Period</span>

                    <strong>
                        ${formatReportPeriod(
                            selectedPeriod
                        )}
                    </strong>

                </div>


                <div class="report-info-item">

                    <span>Sensor Readings</span>

                    <strong>
                        ${allReadings.length}
                    </strong>

                </div>

            </div>


            <div class="water-quality-section">

                <div class="water-quality-section-title">

                    <div>

                        <span class="report-section-kicker">
                            LATEST READING
                        </span>

                        <h4>
                            Water Quality Parameters
                        </h4>

                    </div>

                    <span class="report-reading-time">
                        ${formatDateTime(
                            readingDate
                        )}
                    </span>

                </div>


                <div class="water-quality-parameter-grid">

                    ${createParameterCard(
                        "pH",
                        getReadingValue(
                            reading,
                            "ph"
                        ),
                        "",
                        "bi-droplet"
                    )}

                    ${createParameterCard(
                        "TDS",
                        getReadingValue(
                            reading,
                            "tds"
                        ),
                        "mg/L",
                        "bi-water"
                    )}

                    ${createParameterCard(
                        "Turbidity",
                        getReadingValue(
                            reading,
                            "turbidity"
                        ),
                        "NTU",
                        "bi-cloud-haze"
                    )}

                    ${createParameterCard(
                        "Dissolved Oxygen",
                        getReadingValue(
                            reading,
                            "dissolvedOxygen"
                        ),
                        "mg/L",
                        "bi-wind"
                    )}

                    ${createParameterCard(
                        "Temperature",
                        getReadingValue(
                            reading,
                            "temperature"
                        ),
                        "°C",
                        "bi-thermometer-half"
                    )}

                    ${createParameterCard(
                        "Conductivity",
                        getReadingValue(
                            reading,
                            "conductivity"
                        ),
                        "µS/cm",
                        "bi-lightning"
                    )}

                    ${createParameterCard(
                        "BOD",
                        getReadingValue(
                            reading,
                            "bod"
                        ),
                        "mg/L",
                        "bi-activity"
                    )}

                    ${createParameterCard(
                        "COD",
                        getReadingValue(
                            reading,
                            "cod"
                        ),
                        "mg/L",
                        "bi-beaker"
                    )}

                </div>

            </div>


            <div class="water-quality-analysis">

                <div class="water-quality-analysis-icon">

                    <i class="bi bi-shield-check"></i>

                </div>


                <div>

                    <span class="report-section-kicker">
                        QUALITY ANALYSIS
                    </span>

                    <h4>
                        ${anomaly.title}
                    </h4>

                    <p>
                        ${anomaly.message}
                    </p>

                </div>

            </div>


            <div class="water-quality-report-footer">

                <span>
                    JalRakshak Water Monitoring System
                </span>

                <span>
                    Report generated from available sensor data
                </span>

            </div>

        </div>
    `;
}




function renderAlertReport(
    location,
    alerts,
    selectedPeriod
) {

    const previewContainer =
        document.getElementById(
            "reportPreviewContainer"
        );

    if (!previewContainer) {

        console.error(
            "reportPreviewContainer not found."
        );

        return;
    }

    alerts = Array.isArray(alerts) ? alerts : [];

    /*
     * Calculate alert statistics.
     */
    const totalAlerts =
        alerts.length;

    const highAlerts =
        alerts.filter(
            alert =>
                String(alert.severity)
                    .toUpperCase() === "HIGH"
        ).length;

    const mediumAlerts =
        alerts.filter(
            alert =>
                String(alert.severity)
                    .toUpperCase() === "MEDIUM"
        ).length;

    const lowAlerts =
        alerts.filter(
            alert =>
                String(alert.severity)
                    .toUpperCase() === "LOW"
        ).length;

    const openAlerts =
        alerts.filter(
            alert =>
                String(alert.status)
                    .toUpperCase() === "OPEN"
        ).length;

    const resolvedAlerts =
        alerts.filter(
            alert =>
                String(alert.status)
                    .toUpperCase() === "RESOLVED"
        ).length;

    /*
     * Report period.
     */
    const periodLabel =
        formatReportPeriod(
            selectedPeriod
        );

    /*
     * Location information.
     */
    const locationName =
        location.locationName ||
        "Unknown Location";

    const city =
        location.city ||
        location.locationCity ||
        "—";

    /*
     * Build alert rows.
     */
    const alertRows =
        alerts.length === 0
            ? `<tr><td colspan="7" class="text-center">No alerts are recorded for this monitoring location.</td></tr>`
            : alerts.map(
            (alert, index) => {

                const severity =
                    String(
                        alert.severity ||
                        "UNKNOWN"
                    ).toUpperCase();

                const status =
                    String(
                        alert.status ||
                        "UNKNOWN"
                    ).toUpperCase();

                const detectedAt =
                    alert.detectedAt
                        ? formatReportDate(
                            alert.detectedAt
                        )
                        : "—";

                const priorityScore =
                    alert.priorityScore !==
                    undefined &&
                    alert.priorityScore !== null
                        ? Number(
                            alert.priorityScore
                        ).toFixed(1)
                        : "—";

                const alertType =
                    alert.alertType ||
                    "—";

                const message =
                    alert.message ||
                    "No alert message available.";

                return `
                    <tr>
                        <td>${index + 1}</td>

                        <td>
                            ${escapeReportHtml(
                                alertType
                            )}
                        </td>

                        <td>
                            ${escapeReportHtml(
                                detectedAt
                            )}
                        </td>

                        <td>
                            <span class="report-alert-severity severity-${severity.toLowerCase()}">
                                ${escapeReportHtml(
                                    severity
                                )}
                            </span>
                        </td>

                        <td>
                            <span class="report-alert-status status-${status.toLowerCase()}">
                                ${escapeReportHtml(
                                    status
                                )}
                            </span>
                        </td>

                        <td>
                            ${priorityScore}
                        </td>

                        <td>
                            ${escapeReportHtml(
                                message
                            )}
                        </td>
                    </tr>
                `;
            }
        ).join("");

    /*
     * Generate the complete report.
     */
    previewContainer.innerHTML = `

        <div class="alert-report">

            <div class="report-header">

                <div>
                    <h2>
                        JalRakshak Alert Report
                    </h2>

                    <p>
                        Water Quality Alert Monitoring
                        and Response Summary
                    </p>
                </div>

                <div class="report-header-badge">
                    ALERT REPORT
                </div>

            </div>


            <div class="report-info-grid">

                <div class="report-info-card">

                    <span class="report-info-label">
                        Monitoring Location
                    </span>

                    <strong>
                        ${escapeReportHtml(
                            locationName
                        )}
                    </strong>

                </div>


                <div class="report-info-card">

                    <span class="report-info-label">
                        City
                    </span>

                    <strong>
                        ${escapeReportHtml(
                            city
                        )}
                    </strong>

                </div>


                <div class="report-info-card">

                    <span class="report-info-label">
                        Report Period
                    </span>

                    <strong>
                        ${escapeReportHtml(
                            periodLabel
                        )}
                    </strong>

                </div>


                <div class="report-info-card">

                    <span class="report-info-label">
                        Total Alerts
                    </span>

                    <strong>
                        ${totalAlerts}
                    </strong>

                </div>

            </div>


            <div class="report-summary-section">

                <h3>
                    Alert Summary
                </h3>


                <div class="report-summary-grid">

                    <div class="report-summary-card high">

                        <span>
                            High Severity
                        </span>

                        <strong>
                            ${highAlerts}
                        </strong>

                    </div>


                    <div class="report-summary-card medium">

                        <span>
                            Medium Severity
                        </span>

                        <strong>
                            ${mediumAlerts}
                        </strong>

                    </div>


                    <div class="report-summary-card low">

                        <span>
                            Low Severity
                        </span>

                        <strong>
                            ${lowAlerts}
                        </strong>

                    </div>


                    <div class="report-summary-card open">

                        <span>
                            Open Alerts
                        </span>

                        <strong>
                            ${openAlerts}
                        </strong>

                    </div>


                    <div class="report-summary-card resolved">

                        <span>
                            Resolved Alerts
                        </span>

                        <strong>
                            ${resolvedAlerts}
                        </strong>

                    </div>

                </div>

            </div>


            <div class="report-alert-table-section">

                <h3>
                    Alert Details
                </h3>

                <div class="report-table-wrapper">

                    <table class="report-alert-table">

                        <thead>

                            <tr>

                                <th>#</th>

                                <th>Alert Type</th>

                                <th>Detected At</th>

                                <th>Severity</th>

                                <th>Status</th>

                                <th>Priority Score</th>

                                <th>Message</th>

                            </tr>

                        </thead>

                        <tbody>

                            ${alertRows}

                        </tbody>

                    </table>

                </div>

            </div>


            <div class="report-footer">

                <span>
                    Generated by JalRakshak
                </span>

                <span>
                    AI-Based Water Quality
                    Anomaly Detection System
                </span>

            </div>

        </div>
    `;
}

/* =========================================================
   PARAMETER CARD
   ========================================================= */

function createParameterCard(
    name,
    value,
    unit,
    icon
) {

    const displayValue =
        value === null ||
        value === undefined ||
        value === ""
            ? "—"
            : value;


    return `

        <div class="water-quality-parameter-card">

            <div class="parameter-icon">

                <i class="bi ${icon}"></i>

            </div>


            <div class="parameter-content">

                <span class="parameter-name">
                    ${name}
                </span>

                <div class="parameter-value">

                    <strong>
                        ${escapeHtml(
                            String(displayValue)
                        )}
                    </strong>

                    <span>
                        ${unit}
                    </span>

                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   ANOMALY STATUS
   ========================================================= */

function calculateAnomalyStatus(
    reading
) {

    const pH =
        toNumber(
            getReadingValue(
                reading,
                "ph"
            )
        );


    const tds =
        toNumber(
            getReadingValue(
                reading,
                "tds"
            )
        );


    const turbidity =
        toNumber(
            getReadingValue(
                reading,
                "turbidity"
            )
        );


    const dissolvedOxygen =
        toNumber(
            getReadingValue(
                reading,
                "dissolvedOxygen"
            )
        );


    const bod =
        toNumber(
            getReadingValue(
                reading,
                "bod"
            )
        );


    const cod =
        toNumber(
            getReadingValue(
                reading,
                "cod"
            )
        );


    let abnormalParameters = 0;


    /*
     * These are demo/anomaly-detection
     * thresholds for the report UI.
     *
     * They are NOT presented as
     * regulatory drinking-water limits.
     */

    if (!isNaN(pH) && (pH < 6.5 || pH > 8.5)) {
        abnormalParameters++;
    }


    if (!isNaN(tds) && tds > 1000) {
        abnormalParameters++;
    }


    if (!isNaN(turbidity) && turbidity > 5) {
        abnormalParameters++;
    }


    if (
        !isNaN(dissolvedOxygen) &&
        dissolvedOxygen < 5
    ) {
        abnormalParameters++;
    }


    if (!isNaN(bod) && bod > 5) {
        abnormalParameters++;
    }


    if (!isNaN(cod) && cod > 50) {
        abnormalParameters++;
    }


    if (abnormalParameters >= 3) {

        return {

            label: "ANOMALY DETECTED",

            title: "Multiple abnormal parameters detected",

            message:
                `${abnormalParameters} monitored parameters are outside the demo analysis thresholds. ` +
                `This reading should be reviewed together with the corresponding alert and response records.`

        };

    }


    if (abnormalParameters > 0) {

        return {

            label: "REVIEW REQUIRED",

            title: "Parameter variation detected",

            message:
                `${abnormalParameters} monitored parameter(s) show values outside the demo analysis thresholds. ` +
                `Further review may be required.`

        };

    }


    return {

        label: "NORMAL RANGE",

        title: "No abnormal parameter detected",

        message:
            "The available monitored parameters are within the demo analysis thresholds for this report."

    };
}


/* =========================================================
   GET READING VALUE
   ========================================================= */

function getReadingValue(
    reading,
    fieldName
) {

    if (!reading) {
        return null;
    }


    /*
     * Handles common naming variations
     * without changing backend code.
     */

    const possibleFields = {

        ph: [
            "ph",
            "pH",
            "PH"
        ],

        tds: [
            "tds",
            "TDS"
        ],

        turbidity: [
            "turbidity"
        ],

        dissolvedOxygen: [
            "dissolvedOxygen",
            "dissolved_oxygen",
            "DO"
        ],

        temperature: [
            "temperature"
        ],

        conductivity: [
            "conductivity"
        ],

        bod: [
            "bod",
            "BOD"
        ],

        cod: [
            "cod",
            "COD"
        ]

    };


    const fields =
        possibleFields[fieldName] ||
        [fieldName];


    for (const field of fields) {

        if (
            reading[field] !== undefined &&
            reading[field] !== null
        ) {

            return reading[field];

        }

    }


    return null;
}


/* =========================================================
   GET LOCATION NAME
   ========================================================= */

function getLocationName(
    location
) {

    return (
        location.locationName ||
        location.name ||
        `Location ${location.locationId}`
    );
}


/* =========================================================
   SENSOR READING DATE
   ========================================================= */

function getSensorReadingDate(
    reading
) {

    return (
        reading.recordedAt ||
        reading.timestamp ||
        reading.createdAt ||
        null
    );
}


/* =========================================================
   FORMAT DATE/TIME
   ========================================================= */

function formatDateTime(
    dateValue
) {

    if (!dateValue) {
        return "Date unavailable";
    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {
        return String(dateValue);
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
   FORMAT REPORT PERIOD
   ========================================================= */

function formatReportPeriod(
    period
) {

    const periodMap = {

        latest: "Latest Reading",

        "7": "Last 7 Days",

        "30": "Last 30 Days",

        "90": "Last 90 Days"

    };

    return (
        periodMap[String(period)] ||
        "Latest Reading"
    );
}



function formatReportDate(
    dateValue
) {

    if (!dateValue) {
        return "—";
    }

    const date =
        new Date(dateValue);

    if (isNaN(date.getTime())) {
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




function escapeReportHtml(value) {

    if (value === null || value === undefined) {
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
   NUMBER HELPER
   ========================================================= */

function toNumber(
    value
) {

    const number =
        Number(value);


    return number;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showReportMessage(
    message,
    type
) {

    const container =
        document.getElementById(
            "reportPreviewContainer"
        );


    const status =
        document.querySelector(
            ".report-preview-status"
        );


    if (!container) {
        return;
    }


    if (status) {

        status.textContent =
            type === "error"
                ? "Error"
                : "Report Preview";

    }


    let icon =
        "bi-info-circle";


    if (type === "warning") {
        icon = "bi-exclamation-triangle";
    }


    if (type === "error") {
        icon = "bi-x-circle";
    }


    container.innerHTML = `

        <div class="report-empty-state">

            <div class="report-empty-icon">

                <i class="bi ${icon}"></i>

            </div>

            <h4>
                ${escapeHtml(message)}
            </h4>

            <p>
                Select a monitoring location and try again.
            </p>

        </div>

    `;
}


/* =========================================================
   RESPONSE REPORT
   ========================================================= */

function generateResponseReport() {
    const locationSelect = document.getElementById("reportLocationSelect");
    const periodSelect = document.getElementById("reportPeriodSelect");
    const selectedLocationId = locationSelect ? locationSelect.value : "";
    const selectedPeriod = periodSelect ? periodSelect.value : "latest";

    if (!selectedLocationId) {
        showReportMessage("Please select a monitoring location first.", "warning");
        return;
    }

    const location = reportsLocations.find(
        item => String(item.locationId) === String(selectedLocationId)
    );

    if (!location) {
        showReportMessage("Selected monitoring location could not be found.", "error");
        return;
    }

    let responses = reportsResponses.filter(response => {
        const alert = reportsAlerts.find(
            item => Number(item.alertId) === Number(response.alertId)
        );
        return alert && Number(alert.locationId) === Number(selectedLocationId);
    });

    responses.sort((a, b) =>
        new Date(b.assignedAt || 0) - new Date(a.assignedAt || 0)
    );

    if (responses.length === 0) {
        renderResponseReport(location, [], selectedPeriod);
        return;
    }

    if (selectedPeriod === "latest") {
        responses = [responses[0]];
    } else {
        const days = Number(selectedPeriod);
        if (Number.isFinite(days)) {
            const latest = new Date(responses[0].assignedAt || Date.now());
            const start = new Date(latest);
            start.setDate(start.getDate() - days);
            responses = responses.filter(item => {
                const date = new Date(item.assignedAt || 0);
                return !Number.isNaN(date.getTime()) &&
                    date >= start && date <= latest;
            });
        }
    }

    renderResponseReport(location, responses, selectedPeriod);
}

function renderResponseReport(location, responses, selectedPeriod) {
    const container = document.getElementById("reportPreviewContainer");
    const status = document.querySelector(".report-preview-status");
    if (!container) return;

    if (status) status.textContent = "Response Report";

    const count = statusName => responses.filter(
        item => String(item.responseStatus).toUpperCase() === statusName
    ).length;

    const rows = responses.length ? responses.map(item => `
        <tr>
            <td>#${escapeReportHtml(item.responseId)}</td>
            <td>${escapeReportHtml(item.actionTaken || "—")}</td>
            <td>${escapeReportHtml(String(item.responseStatus || "UNKNOWN").replace(/_/g, " "))}</td>
            <td>${escapeReportHtml(formatDateTime(item.assignedAt))}</td>
            <td>${escapeReportHtml(item.responseNotes || "—")}</td>
        </tr>
    `).join("") : `<tr><td colspan="5" class="text-center">No response actions are recorded for this monitoring location.</td></tr>`;

    container.innerHTML = `
        <div class="generated-report-card">
            <div class="generated-report-header">
                <div>
                    <span class="report-small-label">JALRAKSHAK REPORT</span>
                    <h3>Response Management Report</h3>
                    <p>Monitoring Location:
                        <strong>${escapeReportHtml(getLocationName(location))}</strong>
                    </p>
                </div>
                <span class="report-period-badge">${escapeReportHtml(formatReportPeriod(selectedPeriod))}</span>
            </div>
            <div class="report-summary-grid">
                <div><span>Total Actions</span><strong>${responses.length}</strong></div>
                <div><span>Pending</span><strong>${count("PENDING")}</strong></div>
                <div><span>In Progress</span><strong>${count("IN_PROGRESS")}</strong></div>
                <div><span>Completed</span><strong>${count("COMPLETED")}</strong></div>
            </div>
            <div class="table-responsive">
                <table class="table report-data-table">
                    <thead><tr>
                        <th>ID</th><th>Action</th><th>Status</th><th>Assigned At</th><th>Notes</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
}


/* =========================================================
   CITIZEN REPORT SUMMARY
   ========================================================= */

function generateCitizenReport() {
    const locationSelect = document.getElementById("reportLocationSelect");
    const periodSelect = document.getElementById("reportPeriodSelect");
    const selectedLocationId = locationSelect ? locationSelect.value : "";
    const selectedPeriod = periodSelect ? periodSelect.value : "latest";

    if (!selectedLocationId) {
        showReportMessage("Please select a monitoring location first.", "warning");
        return;
    }

    const location = reportsLocations.find(
        item => String(item.locationId) === String(selectedLocationId)
    );

    if (!location) {
        showReportMessage("Selected monitoring location could not be found.", "error");
        return;
    }

    let reports = reportsCitizenReports.filter(
        report => Number(report.locationId) === Number(selectedLocationId)
    );

    reports.sort((a, b) =>
        new Date(b.reportedAt || 0) - new Date(a.reportedAt || 0)
    );

    if (selectedPeriod !== "latest") {
        const days = Number(selectedPeriod);
        if (Number.isFinite(days) && reports.length) {
            const latest = new Date(reports[0].reportedAt || Date.now());
            const start = new Date(latest);
            start.setDate(start.getDate() - days);
            reports = reports.filter(item => {
                const date = new Date(item.reportedAt || 0);
                return !Number.isNaN(date.getTime()) &&
                    date >= start && date <= latest;
            });
        }
    } else if (reports.length) {
        reports = [reports[0]];
    }

    renderCitizenReport(location, reports, selectedPeriod);
}

function renderCitizenReport(location, reports, selectedPeriod) {
    const container = document.getElementById("reportPreviewContainer");
    const status = document.querySelector(".report-preview-status");
    if (!container) return;

    if (status) status.textContent = "Citizen Report Summary";

    const count = statusName => reports.filter(
        item => String(item.status).toUpperCase() === statusName
    ).length;

    const rows = reports.length
        ? reports.map(item => `
            <tr>
                <td>#${escapeReportHtml(item.reportId)}</td>
                <td>${escapeReportHtml(item.reportType || "—")}</td>
                <td>${escapeReportHtml(item.priority || "—")}</td>
                <td>${escapeReportHtml(String(item.status || "UNKNOWN").replace(/_/g, " "))}</td>
                <td>${escapeReportHtml(formatDateTime(item.reportedAt))}</td>
                <td>${escapeReportHtml(item.description || "—")}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="6" class="text-center">No citizen reports for this location.</td></tr>`;

    container.innerHTML = `
        <div class="generated-report-card">
            <div class="generated-report-header">
                <div>
                    <span class="report-small-label">JALRAKSHAK REPORT</span>
                    <h3>Citizen Report Summary</h3>
                    <p>Monitoring Location:
                        <strong>${escapeReportHtml(getLocationName(location))}</strong>
                    </p>
                </div>
                <span class="report-period-badge">${escapeReportHtml(formatReportPeriod(selectedPeriod))}</span>
            </div>
            <div class="report-summary-grid">
                <div><span>Total Reports</span><strong>${reports.length}</strong></div>
                <div><span>Submitted</span><strong>${count("SUBMITTED")}</strong></div>
                <div><span>Under Review</span><strong>${count("UNDER_REVIEW")}</strong></div>
                <div><span>Resolved</span><strong>${count("RESOLVED")}</strong></div>
            </div>
            <div class="table-responsive">
                <table class="table report-data-table">
                    <thead><tr>
                        <th>ID</th><th>Type</th><th>Priority</th><th>Status</th><th>Reported At</th><th>Description</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
}


/* =========================================================
   OTHER REPORT PREVIEWS
   ========================================================= */


function showReportPreview(
    reportName
) {

    const container =
        document.getElementById(
            "reportPreviewContainer"
        );


    const status =
        document.querySelector(
            ".report-preview-status"
        );


    if (!container) {
        return;
    }


    if (status) {
        status.textContent = "Preview";
    }


    container.innerHTML = `

        <div class="report-empty-state">

            <div class="report-empty-icon">

                <i class="bi bi-file-earmark-check"></i>

            </div>

            <h4>
                ${escapeHtml(reportName)}
            </h4>

            <p>
                This report will be connected
                to detailed backend data in
                the next development phase.
            </p>

        </div>

    `;
}