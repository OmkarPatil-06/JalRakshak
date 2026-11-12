
// ============================================================
// JalRakshak - Response Management
// Response + Alert + User + Location Linking
// ============================================================

const RESPONSE_API_URL = window.location.protocol + "//" + window.location.hostname + ":8080/api/responses";
const ALERT_API_URL = window.location.protocol + "//" + window.location.hostname + ":8080/api/alerts";
const USER_API_URL = window.location.protocol + "//" + window.location.hostname + ":8080/api/users";
const LOCATION_API_URL = window.location.protocol + "//" + window.location.hostname + ":8080/api/locations";


// ============================================================
// STATE
// ============================================================

const ResponseManagementState = {

    responses: [],
    alerts: [],
    users: [],
    locations: [],

    filteredResponses: [],

    dataLoaded: false
};


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    initializeResponseManagement();

});


function initializeResponseManagement() {

    console.log("Response Management initialized.");

    const refreshButton =
        document.getElementById("refreshResponsesButton");

    const createButton =
        document.getElementById("createResponseButton");

    const searchInput =
        document.getElementById("responseSearchInput");

    const statusFilter =
        document.getElementById("responseStatusFilter");


    // Refresh
    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadResponseManagementData
        );

    }

    if (createButton) {
        createButton.addEventListener("click", openCreateResponseDialog);
    }


    // Search
    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyResponseFilters
        );

    }


    // Status filter
    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyResponseFilters
        );

    }


    // Initial load
    loadResponseManagementData();

}


// ============================================================
// LOAD ALL REQUIRED DATA
// ============================================================

async function loadResponseManagementData() {

    showResponseLoading();

    try {

        console.log("Loading Response Management data...");


        // ----------------------------------------------------
        // Load Responses
        // ----------------------------------------------------

        const responsesResponse =
            await fetch(RESPONSE_API_URL);

        if (!responsesResponse.ok) {

            throw new Error(
                `Responses API failed: HTTP ${responsesResponse.status}`
            );

        }

        const responsesData =
            await responsesResponse.json();


        ResponseManagementState.responses =
            Array.isArray(responsesData)
                ? responsesData
                : responsesData.content || [];


        // ----------------------------------------------------
        // Load Alerts
        // ----------------------------------------------------

        const alertsResponse =
            await fetch(ALERT_API_URL);

        if (!alertsResponse.ok) {

            throw new Error(
                `Alerts API failed: HTTP ${alertsResponse.status}`
            );

        }

        const alertsData =
            await alertsResponse.json();


        ResponseManagementState.alerts =
            Array.isArray(alertsData)
                ? alertsData
                : alertsData.content || [];


        // ----------------------------------------------------
        // Load Users
        // ----------------------------------------------------

        const usersResponse =
            await fetch(USER_API_URL);

        if (!usersResponse.ok) {

            throw new Error(
                `Users API failed: HTTP ${usersResponse.status}`
            );

        }

        const usersData =
            await usersResponse.json();


        ResponseManagementState.users =
            Array.isArray(usersData)
                ? usersData
                : usersData.content || [];


        // ----------------------------------------------------
        // Load Locations
        // ----------------------------------------------------

        const locationsResponse =
            await fetch(LOCATION_API_URL);

        if (!locationsResponse.ok) {

            throw new Error(
                `Locations API failed: HTTP ${locationsResponse.status}`
            );

        }

        const locationsData =
            await locationsResponse.json();


        ResponseManagementState.locations =
            Array.isArray(locationsData)
                ? locationsData
                : locationsData.content || [];


        ResponseManagementState.dataLoaded = true;


        console.log(
            "Responses:",
            ResponseManagementState.responses
        );

        console.log(
            "Alerts:",
            ResponseManagementState.alerts
        );

        console.log(
            "Users:",
            ResponseManagementState.users
        );

        console.log(
            "Locations:",
            ResponseManagementState.locations
        );


        applyResponseFilters();


    } catch (error) {

        console.error(
            "Failed to load Response Management data:",
            error
        );

        showResponseError(
            "Unable to load Response Management data."
        );

        updateResponseSummary([]);

    }

}


// ============================================================
// FIND ALERT
// ============================================================

function findAlertById(alertId) {

    return ResponseManagementState.alerts.find(
        alert =>
            Number(alert.alertId) === Number(alertId)
    );

}


// ============================================================
// FIND USER
// ============================================================

function findUserById(userId) {

    return ResponseManagementState.users.find(
        user =>
            Number(user.userId) === Number(userId)
    );

}


// ============================================================
// FIND LOCATION
// ============================================================

function findLocationById(locationId) {

    return ResponseManagementState.locations.find(
        location =>
            Number(location.locationId) === Number(locationId)
    );

}


// ============================================================
// GET LOCATION FOR RESPONSE
// ============================================================

function getResponseLocation(response) {

    const alert =
        findAlertById(response.alertId);


    if (!alert) {

        return {
            name: "Unknown Location",
            city: ""
        };

    }


    const location =
        findLocationById(alert.locationId);


    if (!location) {

        return {
            name: `Location #${alert.locationId}`,
            city: ""
        };

    }


    return {

        name:
            location.locationName ||
            `Location #${location.locationId}`,

        city:
            location.city || ""

    };

}


// ============================================================
// GET ASSIGNED USER
// ============================================================

function getResponseUser(response) {

    const user =
        findUserById(response.userId);


    if (!user) {

        return {
            name: `User #${response.userId}`,
            role: ""
        };

    }


    return {

        name:
            user.fullName ||
            `User #${user.userId}`,

        role:
            user.role || ""

    };

}


// ============================================================
// GET ALERT
// ============================================================

function getResponseAlert(response) {

    return findAlertById(
        response.alertId
    );

}


// ============================================================
// FILTER RESPONSES
// ============================================================

function applyResponseFilters() {

    const searchInput =
        document.getElementById(
            "responseSearchInput"
        );


    const statusFilter =
        document.getElementById(
            "responseStatusFilter"
        );


    const searchText =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "ALL";


    ResponseManagementState.filteredResponses =
        ResponseManagementState.responses.filter(
            response => {

                const alert =
                    getResponseAlert(response);

                const location =
                    getResponseLocation(response);

                const user =
                    getResponseUser(response);

                const status =
                    getResponseStatus(response);


                const searchableText = [

                    response.responseId,

                    response.alertId,

                    response.actionTaken,

                    response.responseNotes,

                    response.userId,

                    user.name,

                    user.role,

                    location.name,

                    location.city,

                    alert?.severity,

                    alert?.priorityScore,

                    alert?.status

                ]
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    searchText === "" ||
                    searchableText.includes(
                        searchText
                    );


                const matchesStatus =
                    selectedStatus === "ALL" ||
                    status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderResponses(
        ResponseManagementState.filteredResponses
    );


    updateResponseSummary(
        ResponseManagementState.responses
    );

}


// ============================================================
// RENDER RESPONSE TABLE
// ============================================================

function renderResponses(responses) {

    const tableBody =
        document.getElementById(
            "responsesTableBody"
        );


    if (!tableBody) {

        return;

    }


    if (
        !responses ||
        responses.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="response-empty">

                    <i class="bi bi-inbox"></i>

                    <div>
                        No responses found.
                    </div>

                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        responses
            .map(
                response =>
                    createResponseRow(response)
            )
            .join("");

}


// ============================================================
// CREATE RESPONSE ROW
// ============================================================

function createResponseRow(response) {

    const responseId =
        response.responseId;


    const alertId =
        response.alertId;


    const action =
        response.actionTaken ||
        "No action specified";


    const status =
        getResponseStatus(response);


    const assignedAt =
        response.assignedAt;


    const location =
        getResponseLocation(response);


    const user =
        getResponseUser(response);


    const alert =
        getResponseAlert(response);


    const severity =
        alert?.severity || "N/A";


    return `

        <tr>

            <!-- RESPONSE ID -->
            <td>

                <span class="response-id">

                    #${escapeHtml(
                        String(responseId)
                    )}

                </span>

            </td>


            <!-- ALERT -->
            <td>

                <div class="response-alert">

                    <strong>
                        Alert #${escapeHtml(
                            String(alertId)
                        )}
                    </strong>

                    <small>
                        ${escapeHtml(
                            alert?.alertType ||
                            "Water Quality Alert"
                        )}
                    </small>

                </div>

            </td>


            <!-- LOCATION -->
            <td>

                <div class="response-location">

                    <i class="bi bi-geo-alt-fill"></i>

                    <div>

                        <strong>
                            ${escapeHtml(
                                location.name
                            )}
                        </strong>

                        ${
                            location.city
                                ? `
                                    <small>
                                        ${escapeHtml(
                                            location.city
                                        )}
                                    </small>
                                  `
                                : ""
                        }

                    </div>

                </div>

            </td>


            <!-- ACTION -->
            <td>

                <div class="response-action-text">

                    ${escapeHtml(action)}

                </div>

            </td>


            <!-- ASSIGNED USER -->
            <td>

                <div class="response-user">

                    <i class="bi bi-person-fill"></i>

                    <div>

                        <strong>
                            ${escapeHtml(
                                user.name
                            )}
                        </strong>

                        ${
                            user.role
                                ? `
                                    <small>
                                        ${escapeHtml(
                                            user.role
                                        )}
                                    </small>
                                  `
                                : ""
                        }

                    </div>

                </div>

            </td>


            <!-- STATUS -->
            <td>

                ${createStatusBadge(status)}

            </td>


            <!-- CREATED / ASSIGNED -->
            <td>

                <span class="response-date">

                    ${formatResponseDate(
                        assignedAt
                    )}

                </span>

            </td>


            <!-- ACTION BUTTON -->
            <td>

                <div class="d-flex gap-1 flex-wrap">
                    <button class="response-action-button" type="button"
                            onclick="viewResponse(${responseId})" title="View response details">
                        <i class="bi bi-eye-fill"></i> View
                    </button>
                    <button class="response-action-button" type="button"
                            onclick="editResponse(${responseId})" title="Edit or complete response">
                        <i class="bi bi-pencil-square"></i> Edit
                    </button>
                </div>

            </td>

        </tr>

    `;

}


// ============================================================
// STATUS BADGE
// ============================================================

function createStatusBadge(status) {

    const normalizedStatus =
        normalizeStatus(status);


    let icon =
        "bi-clock-fill";


    if (
        normalizedStatus ===
        "IN_PROGRESS"
    ) {

        icon =
            "bi-arrow-repeat";

    }


    else if (
        normalizedStatus ===
        "COMPLETED"
    ) {

        icon =
            "bi-check-circle-fill";

    }


    else if (
        normalizedStatus ===
        "CANCELLED"
    ) {

        icon =
            "bi-x-circle-fill";

    }


    return `

        <span
            class="response-status-badge ${normalizedStatus.toLowerCase()}"
        >

            <i class="bi ${icon}"></i>

            ${formatStatusText(
                normalizedStatus
            )}

        </span>

    `;

}


// ============================================================
// SUMMARY CARDS
// ============================================================

function updateResponseSummary(responses) {

    const total =
        responses.length;


    const pending =
        responses.filter(
            response =>
                getResponseStatus(response) ===
                "PENDING"
        ).length;


    const inProgress =
        responses.filter(
            response =>
                getResponseStatus(response) ===
                "IN_PROGRESS"
        ).length;


    const completed =
        responses.filter(
            response =>
                getResponseStatus(response) ===
                "COMPLETED"
        ).length;


    updateElement(
        "totalResponseCount",
        total
    );


    updateElement(
        "pendingResponseCount",
        pending
    );


    updateElement(
        "inProgressResponseCount",
        inProgress
    );


    updateElement(
        "completedResponseCount",
        completed
    );

}


// ============================================================
// STATUS
// ============================================================

function getResponseStatus(response) {

    return normalizeStatus(
        response?.responseStatus
    );

}


function normalizeStatus(status) {

    if (!status) {

        return "PENDING";

    }


    const normalized =
        String(status)
            .trim()
            .toUpperCase()
            .replace(
                /[\s-]+/g,
                "_"
            );


    const validStatuses = [

        "PENDING",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED"

    ];


    if (
        validStatuses.includes(
            normalized
        )
    ) {

        return normalized;

    }


    return "PENDING";

}


function formatStatusText(status) {

    return status
        .replace(
            /_/g,
            " "
        )
        .toLowerCase()
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


// ============================================================
// VIEW RESPONSE
// ============================================================

function viewResponse(responseId) {

    const response =
        ResponseManagementState.responses.find(
            item =>
                Number(item.responseId) ===
                Number(responseId)
        );


    if (!response) {

        alert(
            "Response details not found."
        );

        return;

    }


    const alert =
        getResponseAlert(response);


    const location =
        getResponseLocation(response);


    const user =
        getResponseUser(response);


    const notes =
        response.responseNotes ||
        "No notes available.";


    const completedAt =
        response.completedAt;


    alert(

        `Response #${response.responseId}\n\n` +

        `Alert ID: ${response.alertId}\n` +

        `Location: ${location.name}\n` +

        `City: ${location.city || "N/A"}\n\n` +

        `Action: ${response.actionTaken}\n` +

        `Assigned To: ${user.name}\n` +

        `Role: ${user.role || "N/A"}\n\n` +

        `Status: ${formatStatusText(
            getResponseStatus(response)
        )}\n` +

        `Severity: ${
            alert?.severity || "N/A"
        }\n` +

        `Priority Score: ${
            alert?.priorityScore ?? "N/A"
        }\n\n` +

        `Assigned At: ${
            formatResponseDate(
                response.assignedAt
            )
        }\n` +

        `Completed At: ${
            formatResponseDate(
                completedAt
            )
        }\n\n` +

        `Notes:\n${notes}`

    );

}


// ============================================================
// DATE FORMAT
// ============================================================

function formatResponseDate(dateValue) {

    if (!dateValue) {

        return "Not completed";

    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

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


// ============================================================
// LOADING / ERROR STATES
// ============================================================

function showResponseLoading() {

    const tableBody =
        document.getElementById(
            "responsesTableBody"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="response-loading"
            >

                <i class="bi bi-arrow-repeat"></i>

                Loading response data...

            </td>

        </tr>

    `;

}


function showResponseError(message) {

    const tableBody =
        document.getElementById(
            "responsesTableBody"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="response-error"
            >

                <i class="bi bi-exclamation-triangle-fill"></i>

                ${escapeHtml(message)}

            </td>

        </tr>

    `;

}


// ============================================================
// UTILITY
// ============================================================

function updateElement(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.initializeResponseManagement =
    initializeResponseManagement;

window.loadResponses =
    loadResponseManagementData;

window.loadResponseManagementData =
    loadResponseManagementData;

window.viewResponse =
    viewResponse;



/* ============================================================
   CREATE RESPONSE
   ============================================================ */

function openCreateResponseDialog() {
    if (!ResponseManagementState.dataLoaded) {
        showResponseError("Response data is still loading. Please try again.");
        return;
    }

    const existing = document.getElementById("createResponseDialog");
    if (existing) existing.remove();

    const locations = [...ResponseManagementState.locations].sort((a, b) =>
        String(a.locationName || "").localeCompare(String(b.locationName || ""))
    );
    if (locations.length === 0) {
        showResponseError("No waterbodies were returned by the database. Check /api/locations.");
        return;
    }

    const dialog = document.createElement("dialog");
    dialog.id = "createResponseDialog";
    dialog.className = "jr-response-dialog";

    const locationOptions = locations.map(location => `
        <option value="${escapeHtml(location.locationId)}">
            ${escapeHtml(location.locationName || `Location ${location.locationId}`)}${location.city ? ` — ${escapeHtml(location.city)}` : ""}
        </option>
    `).join("");

    const userOptions = ResponseManagementState.users.map(user => `
        <option value="${escapeHtml(user.userId)}">
            ${escapeHtml(user.fullName || `User ${user.userId}`)}
        </option>
    `).join("");

    dialog.innerHTML = `
        <form method="dialog" class="jr-response-form" id="createResponseForm">
            <div class="jr-response-form-header">
                <div><span>JALRAKSHAK</span><h3>Create Response Action</h3></div>
                <button type="button" class="jr-dialog-close" id="closeResponseDialog" aria-label="Close">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <label>Waterbody / Monitoring Location
                <select id="newResponseLocation" required>${locationOptions}</select>
            </label>
            <label>Open Alert for Selected Waterbody
                <select id="newResponseAlert" required></select>
            </label>
            <p id="responseAlertHint" class="text-muted small" aria-live="polite"></p>
            <label>Assigned Officer <span class="text-muted">(optional)</span>
                <select id="newResponseUser"><option value="">Unassigned</option>${userOptions}</select>
            </label>
            <label>Action Taken
                <input id="newResponseAction" maxlength="255" placeholder="e.g. Field inspection requested" required>
            </label>
            <label>Status
                <select id="newResponseStatus">
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </label>
            <label>Notes
                <textarea id="newResponseNotes" maxlength="500" placeholder="Add response notes"></textarea>
            </label>
            <div class="jr-response-form-actions">
                <button type="button" class="btn btn-outline-secondary" id="cancelResponseDialog">Cancel</button>
                <button type="submit" class="btn btn-danger" id="saveResponseButton">
                    <i class="bi bi-check2-circle"></i> Save Response
                </button>
            </div>
        </form>`;

    document.body.appendChild(dialog);

    const locationSelect = dialog.querySelector("#newResponseLocation");
    const alertSelect = dialog.querySelector("#newResponseAlert");
    const alertHint = dialog.querySelector("#responseAlertHint");
    const saveButton = dialog.querySelector("#saveResponseButton");

    const populateAlertsForLocation = () => {
        const locationId = Number(locationSelect.value);
        const openAlerts = ResponseManagementState.alerts.filter(alert =>
            Number(alert.locationId) === locationId &&
            String(alert.status || "").trim().toUpperCase() === "OPEN"
        );

        alertSelect.innerHTML = openAlerts.length
            ? openAlerts.map(alert => `
                <option value="${escapeHtml(alert.alertId)}">
                    #${escapeHtml(alert.alertId)} — ${escapeHtml(alert.alertType || "Water Quality Alert")} — ${escapeHtml(alert.severity || "UNKNOWN")}
                </option>`).join("")
            : '<option value="">No open alert for this waterbody</option>';

        alertSelect.disabled = openAlerts.length === 0;
        saveButton.disabled = openAlerts.length === 0;
        alertHint.textContent = openAlerts.length
            ? `${openAlerts.length} open alert(s) available for this waterbody.`
            : "There is no open alert for this waterbody. Create an alert first, then return here to assign a response.";
    };

    locationSelect.addEventListener("change", populateAlertsForLocation);
    populateAlertsForLocation();

    const close = () => {
        if (dialog.open) dialog.close();
        dialog.remove();
    };
    dialog.querySelectorAll("#closeResponseDialog, #cancelResponseDialog")
        .forEach(button => button.addEventListener("click", close));

    dialog.querySelector("#createResponseForm").addEventListener("submit", async event => {
        event.preventDefault();
        const alertId = Number(alertSelect.value);
        const selectedAlert = ResponseManagementState.alerts.find(a => Number(a.alertId) === alertId);
        const userValue = dialog.querySelector("#newResponseUser").value;
        const actionTaken = dialog.querySelector("#newResponseAction").value.trim();
        const responseStatus = dialog.querySelector("#newResponseStatus").value;
        const responseNotes = dialog.querySelector("#newResponseNotes").value.trim();

        if (!selectedAlert || Number(selectedAlert.locationId) !== Number(locationSelect.value)) {
            showResponseError("Select an open alert belonging to the chosen waterbody.");
            return;
        }
        if (!actionTaken) {
            showResponseError("Please enter the action taken.");
            return;
        }

        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 19);
        const payload = {
            alertId,
            userId: userValue ? Number(userValue) : null,
            actionTaken,
            responseNotes,
            responseStatus,
            assignedAt: localDateTime,
            completedAt: responseStatus === "COMPLETED" ? localDateTime : null
        };

        saveButton.disabled = true;
        try {
            const response = await fetch(RESPONSE_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const body = await response.text().catch(() => "");
                let message = body;
                try { const parsed = JSON.parse(body); message = parsed.detail || parsed.message || body; } catch (_) {}
                throw new Error(message || `Create response failed: HTTP ${response.status}`);
            }
            close();
            if (typeof showToast === "function") showToast("Response action created successfully.", "success");
            await loadResponseManagementData();
            if (typeof window.loadAlerts === "function") await window.loadAlerts();
        } catch (error) {
            console.error("Unable to create response:", error);
            showResponseError(error.message || "Unable to create response. Check the backend log.");
            saveButton.disabled = false;
        }
    });

    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
}

