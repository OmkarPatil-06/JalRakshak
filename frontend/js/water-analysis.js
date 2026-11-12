// ============================================================
// JalRakshak - Water Analysis
// Step 18.3 - Sensor Data Loading & Health Score Display
// ============================================================

const WaterAnalysisState = {
    locations: [],
    selectedLocationId: null,
    sensorReadings: [],
    latestReading: null,
    chart: null
};


// ------------------------------------------------------------
// Initialize Water Analysis
// ------------------------------------------------------------

function initializeWaterAnalysis() {

    console.log("Water Analysis initialized.");

    loadAnalysisLocations();

    const locationSelect =
        document.getElementById("analysisLocationSelect");

    const loadButton =
        document.getElementById("loadAnalysisButton");


    // Location selection
    if (locationSelect) {

        locationSelect.addEventListener("change", function () {

            WaterAnalysisState.selectedLocationId =
                this.value ? Number(this.value) : null;

            console.log(
                "Selected location:",
                WaterAnalysisState.selectedLocationId
            );
        });
    }


    // Load Analysis button
    if (loadButton) {

        loadButton.addEventListener("click", async function () {

            const locationId =
                WaterAnalysisState.selectedLocationId;

            if (!locationId) {

                if (typeof showToast === "function") {

                    showToast(
                        "Please select a monitoring location first.",
                        "warning"
                    );

                } else {

                    alert(
                        "Please select a monitoring location first."
                    );
                }

                return;
            }


            console.log(
                "Loading analysis for location:",
                locationId
            );

            await loadSensorData(locationId);
        });
    }
}


// ------------------------------------------------------------
// Load Monitoring Locations
// ------------------------------------------------------------

async function loadAnalysisLocations() {

    const locationSelect =
        document.getElementById("analysisLocationSelect");

    if (!locationSelect) {

        console.warn(
            "analysisLocationSelect element was not found."
        );

        return;
    }


    try {

        console.log(
            "Fetching monitoring locations..."
        );

        const locations =
            await apiGet("/locations");

        console.log(
            "Locations received:",
            locations
        );

        WaterAnalysisState.locations =
            Array.isArray(locations)
                ? locations
                : [];

        populateLocationDropdown(
            WaterAnalysisState.locations
        );

    } catch (error) {

        console.error(
            "Failed to load monitoring locations:",
            error
        );

        locationSelect.innerHTML = `
            <option value="">
                Unable to load locations
            </option>
        `;

        if (typeof showToast === "function") {

            showToast(
                "Unable to load monitoring locations.",
                "danger"
            );
        }
    }
}


// ------------------------------------------------------------
// Populate Location Dropdown
// ------------------------------------------------------------

function populateLocationDropdown(locations) {

    const locationSelect =
        document.getElementById("analysisLocationSelect");

    if (!locationSelect) {
        return;
    }


    locationSelect.innerHTML = `
        <option value="">
            Select a monitoring location
        </option>
    `;


    if (!locations.length) {

        locationSelect.innerHTML = `
            <option value="">
                No monitoring locations found
            </option>
        `;

        return;
    }


    locations.forEach(location => {

        const option =
            document.createElement("option");

        option.value =
            location.locationId;

        option.textContent =
            `${location.locationName} — ${location.city}`;

        locationSelect.appendChild(option);
    });


    console.log(
        `${locations.length} monitoring locations added to dropdown.`
    );
}


// ------------------------------------------------------------
// Load Sensor Data
// ------------------------------------------------------------

async function loadSensorData(locationId) {

    try {

        console.log(
            `Fetching sensor data for location ${locationId}...`
        );


        const readings =
            await apiGet(
                `/sensor-data/location/${locationId}/verified`
            );


        console.log(
            "Sensor readings received:",
            readings
        );


        WaterAnalysisState.sensorReadings =
            Array.isArray(readings)
                ? readings
                : [];


        if (!WaterAnalysisState.sensorReadings.length) {

            console.warn(
                "No verified database readings found for this location."
            );

            clearAnalysisValues();

            if (typeof showToast === "function") {

                showToast(
                    "No verified database readings found for this location.",
                    "warning"
                );
            }

            return;
        }


        // Find latest reading
        const latestReading =
            getLatestSensorReading(
                WaterAnalysisState.sensorReadings
            );


        WaterAnalysisState.latestReading =
            latestReading;


        console.log(
            "Latest sensor reading:",
            latestReading
        );


        displayLatestReading(
            latestReading
        );

        // Render Historical Chart
        renderWaterAnalysisChart(
            WaterAnalysisState.sensorReadings
        );


        if (typeof showToast === "function") {

            showToast(
                "Water quality data loaded successfully.",
                "success"
            );
        }


    } catch (error) {

        console.error(
            "Failed to load sensor data:",
            error
        );


        clearAnalysisValues();


        if (typeof showToast === "function") {

            showToast(
                "Unable to load sensor data.",
                "danger"
            );
        }
    }
}


// ------------------------------------------------------------
// Find Latest Sensor Reading
// ------------------------------------------------------------

function getLatestSensorReading(readings) {

    return readings.reduce(
        (latest, current) => {

            if (!latest) {
                return current;
            }


            const latestDate =
                new Date(
                    latest.recordedAt || 0
                );


            const currentDate =
                new Date(
                    current.recordedAt || 0
                );


            return currentDate > latestDate
                ? current
                : latest;

        },
        null
    );
}


// ------------------------------------------------------------
// Display Latest Reading
// ------------------------------------------------------------

function displayLatestReading(reading) {

    if (!reading) {
        return;
    }

    setElementValue(
        "analysisPh",
        reading.ph
    );

    setElementValue(
        "analysisTds",
        reading.tds
    );

    setElementValue(
        "analysisTurbidity",
        reading.turbidity
    );

    setElementValue(
        "analysisDissolvedOxygen",
        reading.dissolvedOxygen
    );

    setElementValue(
        "analysisTemperature",
        reading.temperature
    );

    setElementValue(
        "analysisConductivity",
        reading.conductivity
    );

    setElementValue(
        "analysisBod",
        reading.bod
    );

    setElementValue(
        "analysisCod",
        reading.cod
    );

    // Update parameter status table and badges
    updateParameterStatuses(reading);

    // Calculate and render Overall Water Health Score
    calculateWaterHealth(reading);

    // Recorded timestamp
    const recordedAtElement =
        document.getElementById(
            "analysisRecordedAt"
        );

    if (recordedAtElement) {

        recordedAtElement.textContent =
            formatAnalysisDateTime(
                reading.recordedAt
            );
    }

    console.log(
        "Latest reading displayed successfully."
    );
}


// ------------------------------------------------------------
// Set Element Value
// ------------------------------------------------------------

function setElementValue(elementId, value) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }


    if (
        value === null ||
        value === undefined
    ) {

        element.innerText = "--";

        return;
    }


    element.innerText = value;
}


// ------------------------------------------------------------
// Clear Analysis Values
// ------------------------------------------------------------

function clearAnalysisValues() {

    const elements = [
        "analysisPh",
        "analysisTds",
        "analysisTurbidity",
        "analysisDissolvedOxygen",
        "analysisTemperature",
        "analysisConductivity",
        "analysisBod",
        "analysisCod"
    ];


    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerText = "--";
        }
    });


    const recordedAt = document.getElementById("analysisRecordedAt");
    if (recordedAt) {
        recordedAt.innerText = "No reading selected";
    }

    // Reset the old chart and show the empty state.
    if (WaterAnalysisState.chart) {
        WaterAnalysisState.chart.destroy();
        WaterAnalysisState.chart = null;
    }
    const chartCanvas = document.getElementById("waterAnalysisChart");
    const chartEmpty = document.getElementById("waterAnalysisChartEmpty");
    if (chartCanvas) chartCanvas.style.display = "none";
    if (chartEmpty) chartEmpty.style.display = "flex";

    // Reset Water Health section UI
    setElementValue("analysisWaterHealthScore", "--");
    setElementValue("waterHealthStatus", "No Data");
    setElementValue("waterHealthSummary", "Select a valid location to view health analysis.");
    setElementValue("normalParameterCount", "0");
    setElementValue("warningParameterCount", "0");
    setElementValue("criticalParameterCount", "0");

    // Reset Health Score Ring Graphic
    const circleElement = document.querySelector(".health-score-circle");
    if (circleElement) {
        circleElement.style.background = "#e5e7eb";
    }
}


// ------------------------------------------------------------
// Format Date and Time
// ------------------------------------------------------------

function formatAnalysisDateTime(dateValue) {

    if (!dateValue) {
        return "Unknown time";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


// ------------------------------------------------------------
// Parameter Status
// ------------------------------------------------------------

function updateParameterStatuses(reading) {

    updateParameterStatus(
        "analysisPhStatus",
        reading.ph,
        {
            normal: value => value >= 6.5 && value <= 8.5,
            warning: value =>
                (value >= 6.0 && value < 6.5) ||
                (value > 8.5 && value <= 9.0)
        }
    );


    updateParameterStatus(
        "analysisTdsStatus",
        reading.tds,
        {
            normal: value => value <= 500,
            warning: value => value > 500 && value <= 1000
        }
    );


    updateParameterStatus(
        "analysisTurbidityStatus",
        reading.turbidity,
        {
            normal: value => value <= 5,
            warning: value => value > 5 && value <= 10
        }
    );


    updateParameterStatus(
        "analysisDissolvedOxygenStatus",
        reading.dissolvedOxygen,
        {
            normal: value => value >= 6,
            warning: value => value >= 4 && value < 6
        }
    );


    updateParameterStatus(
        "analysisTemperatureStatus",
        reading.temperature,
        {
            normal: value => value >= 20 && value <= 30,
            warning: value =>
                (value >= 15 && value < 20) ||
                (value > 30 && value <= 35)
        }
    );


    updateParameterStatus(
        "analysisConductivityStatus",
        reading.conductivity,
        {
            normal: value => value <= 500,
            warning: value => value > 500 && value <= 1000
        }
    );


    updateParameterStatus(
        "analysisBodStatus",
        reading.bod,
        {
            normal: value => value <= 3,
            warning: value => value > 3 && value <= 6
        }
    );


    updateParameterStatus(
        "analysisCodStatus",
        reading.cod,
        {
            normal: value => value <= 25,
            warning: value => value > 25 && value <= 50
        }
    );


    updateParameterStatusTable(reading);
}


// ------------------------------------------------------------
// Individual Parameter Status
// ------------------------------------------------------------

function updateParameterStatus(
    elementId,
    value,
    rules
) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }


    if (
        value === null ||
        value === undefined ||
        Number.isNaN(Number(value))
    ) {

        element.textContent =
            "No data";

        element.className =
            "parameter-status status-unknown";

        return;
    }


    const numericValue =
        Number(value);


    let status = "Critical";


    if (rules.normal(numericValue)) {

        status = "Normal";

    } else if (rules.warning(numericValue)) {

        status = "Warning";
    }


    element.textContent =
        status;


    element.className =
        `parameter-status status-${status.toLowerCase()}`;
}


// ------------------------------------------------------------
// Parameter Status Summary
// ------------------------------------------------------------

function updateParameterStatusTable(reading) {

    const container =
        document.getElementById(
            "parameterStatusContainer"
        );

    if (!container) {
        return;
    }


    const parameters = [

        {
            name: "pH",
            value: reading.ph,
            unit: "",
            status: getParameterStatus(
                reading.ph,
                value =>
                    value >= 6.5 &&
                    value <= 8.5,
                value =>
                    (value >= 6.0 &&
                     value < 6.5) ||
                    (value > 8.5 &&
                     value <= 9.0)
            )
        },

        {
            name: "TDS",
            value: reading.tds,
            unit: "mg/L",
            status: getParameterStatus(
                reading.tds,
                value => value <= 500,
                value =>
                    value > 500 &&
                    value <= 1000
            )
        },

        {
            name: "Turbidity",
            value: reading.turbidity,
            unit: "NTU",
            status: getParameterStatus(
                reading.turbidity,
                value => value <= 5,
                value =>
                    value > 5 &&
                    value <= 10
            )
        },

        {
            name: "Dissolved Oxygen",
            value: reading.dissolvedOxygen,
            unit: "mg/L",
            status: getParameterStatus(
                reading.dissolvedOxygen,
                value => value >= 6,
                value =>
                    value >= 4 &&
                    value < 6
            )
        },

        {
            name: "Temperature",
            value: reading.temperature,
            unit: "°C",
            status: getParameterStatus(
                reading.temperature,
                value =>
                    value >= 20 &&
                    value <= 30,
                value =>
                    (value >= 15 &&
                     value < 20) ||
                    (value > 30 &&
                     value <= 35)
            )
        },

        {
            name: "Conductivity",
            value: reading.conductivity,
            unit: "µS/cm",
            status: getParameterStatus(
                reading.conductivity,
                value => value <= 500,
                value =>
                    value > 500 &&
                    value <= 1000
            )
        },

        {
            name: "BOD",
            value: reading.bod,
            unit: "mg/L",
            status: getParameterStatus(
                reading.bod,
                value => value <= 3,
                value =>
                    value > 3 &&
                    value <= 6
            )
        },

        {
            name: "COD",
            value: reading.cod,
            unit: "mg/L",
            status: getParameterStatus(
                reading.cod,
                value => value <= 25,
                value =>
                    value > 25 &&
                    value <= 50
            )
        }

    ];


    container.innerHTML = parameters.map(
        parameter => {

            return `
                <div class="parameter-status-row">

                    <div class="parameter-status-name">
                        ${parameter.name}
                    </div>

                    <div class="parameter-status-value">
                        ${parameter.value ?? "--"}
                        ${parameter.unit}
                    </div>

                    <div class="parameter-status-badge
                        status-${parameter.status.toLowerCase()}">

                        <span class="status-indicator"></span>

                        ${parameter.status}

                    </div>

                </div>
            `;
        }
    ).join("");
}


// ------------------------------------------------------------
// Determine Parameter Status
// ------------------------------------------------------------

function getParameterStatus(
    value,
    normalRule,
    warningRule
) {

    if (
        value === null ||
        value === undefined ||
        Number.isNaN(Number(value))
    ) {

        return "Unknown";
    }


    const numericValue =
        Number(value);


    if (normalRule(numericValue)) {

        return "Normal";

    }


    if (warningRule(numericValue)) {

        return "Warning";
    }


    return "Critical";
}


// ------------------------------------------------------------
// Historical Water Quality Chart
// ------------------------------------------------------------

function renderWaterAnalysisChart(readings) {

    const canvas =
        document.getElementById(
            "waterAnalysisChart"
        );

    const emptyState =
        document.getElementById(
            "waterAnalysisChartEmpty"
        );

    if (!canvas) {
        console.warn(
            "waterAnalysisChart canvas not found."
        );
        return;
    }

    if (!readings || readings.length === 0) {

        if (emptyState) {
            emptyState.style.display = "flex";
        }

        return;
    }


    // Hide empty state and show the chart canvas.
    if (emptyState) {
        emptyState.style.display = "none";
    }
    canvas.style.display = "block";


    // Destroy previous chart
    if (WaterAnalysisState.chart) {

        WaterAnalysisState.chart.destroy();

        WaterAnalysisState.chart = null;
    }


    // Sort readings chronologically
    const sortedReadings =
        [...readings].sort(
            (a, b) =>
                new Date(a.recordedAt) -
                new Date(b.recordedAt)
        );


    const labels =
        sortedReadings.map(
            reading =>
                formatChartDate(
                    reading.recordedAt
                )
        );


    const phData =
        sortedReadings.map(
            reading =>
                Number(reading.ph)
        );


    const turbidityData =
        sortedReadings.map(
            reading =>
                Number(reading.turbidity)
        );


    const dissolvedOxygenData =
        sortedReadings.map(
            reading =>
                Number(reading.dissolvedOxygen)
        );


    WaterAnalysisState.chart =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {
                            label: "pH",

                            data: phData,

                            tension: 0.3,

                            borderWidth: 2,

                            pointRadius: 4,

                            yAxisID: "y"
                        },

                        {
                            label: "Turbidity (NTU)",

                            data: turbidityData,

                            tension: 0.3,

                            borderWidth: 2,

                            pointRadius: 4,

                            yAxisID: "y1"
                        },

                        {
                            label: "Dissolved Oxygen (mg/L)",

                            data: dissolvedOxygenData,

                            tension: 0.3,

                            borderWidth: 2,

                            pointRadius: 4,

                            yAxisID: "y1"
                        }

                    ]
                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    interaction: {
                        mode: "index",
                        intersect: false
                    },


                    plugins: {

                        legend: {
                            display: true
                        },

                        tooltip: {
                            enabled: true
                        }

                    },


                    scales: {

                        y: {

                            type: "linear",

                            position: "left",

                            title: {
                                display: true,
                                text: "pH"
                            },

                            suggestedMin: 4,

                            suggestedMax: 9
                        },


                        y1: {

                            type: "linear",

                            position: "right",

                            title: {
                                display: true,
                                text: "Value"
                            },

                            grid: {
                                drawOnChartArea: false
                            }

                        }

                    }

                }

            }
        );


    console.log(
        "Historical water quality chart rendered."
    );
}


// ------------------------------------------------------------
// Format Chart Date
// ------------------------------------------------------------

function formatChartDate(dateValue) {

    if (!dateValue) {
        return "";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short"
        }
    );
}


// ------------------------------------------------------------
// Overall Water Health Score
// ------------------------------------------------------------

function calculateWaterHealth(reading) {

    if (!reading) {
        return;
    }


    const parameters = [
        {
            name: "pH",
            value: reading.ph,
            normal: value => value >= 6.5 && value <= 8.5,
            warning: value => (value >= 6.0 && value < 6.5) || (value > 8.5 && value <= 9.0)
        },
        {
            name: "TDS",
            value: reading.tds,
            normal: value => value <= 500,
            warning: value => value > 500 && value <= 1000
        },
        {
            name: "Turbidity",
            value: reading.turbidity,
            normal: value => value <= 5,
            warning: value => value > 5 && value <= 10
        },
        {
            name: "Dissolved Oxygen",
            value: reading.dissolvedOxygen,
            normal: value => value >= 6,
            warning: value => value >= 4 && value < 6
        },
        {
            name: "Temperature",
            value: reading.temperature,
            normal: value => value >= 20 && value <= 30,
            warning: value => (value >= 15 && value < 20) || (value > 30 && value <= 35)
        },
        {
            name: "Conductivity",
            value: reading.conductivity,
            normal: value => value <= 500,
            warning: value => value > 500 && value <= 1000
        },
        {
            name: "BOD",
            value: reading.bod,
            normal: value => value <= 3,
            warning: value => value > 3 && value <= 6
        },
        {
            name: "COD",
            value: reading.cod,
            normal: value => value <= 25,
            warning: value => value > 25 && value <= 50
        }
    ];


    let totalScore = 0;
    let validParameters = 0;


    parameters.forEach(parameter => {

        const value = Number(parameter.value);

        if (Number.isNaN(value) || parameter.value === null || parameter.value === undefined) {
            return;
        }

        validParameters++;

        totalScore += calculateParameterScore(parameter);
    });


    if (validParameters === 0) {
        setElementValue("analysisWaterHealthScore", "--");
        setElementValue("waterHealthStatus", "Insufficient Data");
        setElementValue("waterHealthSummary", "The verified database record contains no usable parameter values for a screening score.");
        setElementValue("normalParameterCount", "0");
        setElementValue("warningParameterCount", "0");
        setElementValue("criticalParameterCount", "0");
        return;
    }

    const score = Math.round(totalScore / validParameters);
    updateWaterHealthUI(score, parameters);
}


// ------------------------------------------------------------
// Parameter Score
// ------------------------------------------------------------

function calculateParameterScore(parameter) {

    const value = Number(parameter.value);

    if (parameter.normal(value)) {
        return 100;
    }

    if (parameter.warning(value)) {
        return 65;
    }

    return 20;
}


// ------------------------------------------------------------
// Update Health UI
// ------------------------------------------------------------

function updateWaterHealthUI(
    score,
    parameters
) {

    // Target both direct score span and container text node targets for safety
    const scoreElement = document.getElementById("analysisWaterHealthScore");
    const healthValueContainer = document.querySelector(".health-score-value");
    
    if (scoreElement) {
        scoreElement.innerText = score.toString();
    } else if (healthValueContainer) {
        healthValueContainer.innerHTML = `${score}<small>/100</small>`;
    }

    const statusElement = document.getElementById("waterHealthStatus");
    const summaryElement = document.getElementById("waterHealthSummary");
    const normalElement = document.getElementById("normalParameterCount");
    const warningElement = document.getElementById("warningParameterCount");
    const criticalElement = document.getElementById("criticalParameterCount");


    let normalCount = 0;
    let warningCount = 0;
    let criticalCount = 0;


    parameters.forEach(parameter => {

        const value = Number(parameter.value);

        if (Number.isNaN(value) || parameter.value === null || parameter.value === undefined) {
            return;
        }


        const status = getParameterStatusForHealth(parameter);


        if (status === "Normal") {
            normalCount++;
        } else if (status === "Warning") {
            warningCount++;
        } else {
            criticalCount++;
        }
    });


    if (normalElement) {
        normalElement.innerText = normalCount;
    }

    if (warningElement) {
        warningElement.innerText = warningCount;
    }

    if (criticalElement) {
        criticalElement.innerText = criticalCount;
    }


    let overallStatus;
    let summary;


    if (score >= 80) {

        overallStatus = "Good";
        summary = "The current sensor readings are largely within the configured normal ranges.";

    } else if (score >= 60) {

        overallStatus = "Moderate";
        summary = "Some water quality parameters require attention and continued monitoring.";

    } else {

        overallStatus = "Poor";
        summary = "Multiple water quality parameters are outside configured safety thresholds and require immediate attention.";

    }


    if (statusElement) {
        statusElement.innerText = overallStatus;
    }


    if (summaryElement) {
        summaryElement.innerText = summary;
    }


    // Dynamic Circular Progress Ring Update via Conic Gradient
    const circleElement = document.querySelector(".health-score-circle");
    if (circleElement) {

        let ringColor = "#22c55e"; // Good (Green)
        if (score < 60) {
            ringColor = "#ef4444"; // Poor (Red)
        } else if (score < 80) {
            ringColor = "#f59e0b"; // Moderate (Yellow/Orange)
        }

        circleElement.style.background = `conic-gradient(${ringColor} ${score * 3.6}deg, #e5e7eb ${score * 3.6}deg 360deg)`;
    }


    console.log(
        "Water Health Score updated:",
        score,
        overallStatus
    );
}


// ------------------------------------------------------------
// Health Status
// ------------------------------------------------------------

function getParameterStatusForHealth(parameter) {

    const value = Number(parameter.value);

    if (Number.isNaN(value)) {
        return "Critical";
    }

    if (parameter.normal(value)) {
        return "Normal";
    }

    if (parameter.warning(value)) {
        return "Warning";
    }

    return "Critical";
}


// ------------------------------------------------------------
// Export Functions
// ------------------------------------------------------------

window.initializeWaterAnalysis =
    initializeWaterAnalysis;

window.loadAnalysisLocations =
    loadAnalysisLocations;

window.populateLocationDropdown =
    populateLocationDropdown;

window.loadSensorData =
    loadSensorData;