// ============================================================
// JALRAKSHAK - CITIZEN REPORTS
// Connected to Spring Boot / MySQL
// ============================================================

const CITIZEN_REPORTS_API = window.location.protocol + "//" + window.location.hostname + ":8080/api/citizen-reports";

let citizenReports = [];
let citizenReportLocations = [];
let citizenReportUsers = [];


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    const refreshButton =
        document.getElementById("refreshCitizenReportsButton");

    const searchInput =
        document.getElementById("citizenReportSearchInput");

    const statusFilter =
        document.getElementById("citizenReportStatusFilter");

    const categoryFilter =
        document.getElementById("citizenReportCategoryFilter");

    const clearButton =
        document.getElementById("clearCitizenReportFiltersButton");


    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            loadCitizenReports
        );
    }


    if (searchInput) {
        searchInput.addEventListener(
            "input",
            applyCitizenReportFilters
        );
    }


    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            applyCitizenReportFilters
        );
    }


    if (categoryFilter) {
        categoryFilter.addEventListener(
            "change",
            applyCitizenReportFilters
        );
    }


    if (clearButton) {
        clearButton.addEventListener(
            "click",
            clearCitizenReportFilters
        );
    }


    // Load data when page is opened
    loadCitizenReports();

});


// ============================================================
// LOAD CITIZEN REPORTS
// ============================================================

async function loadCitizenReports() {

    const tableBody =
        document.getElementById(
            "citizenReportsTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="loading-state">
                        <i class="bi bi-arrow-repeat"></i>
                        Loading citizen reports...
                    </div>
                </td>
            </tr>
        `;

    }


    try {

        console.log(
            "Fetching citizen reports..."
        );


        const response =
            await fetch(
                CITIZEN_REPORTS_API
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        citizenReports =
            Array.isArray(data)
                ? data
                : [];


        console.log(
            "Citizen reports received:",
            citizenReports
        );


        /*
         * Load related locations and users.
         * These are used to convert IDs into
         * readable names in the table.
         */
        await loadCitizenReportRelatedData();


        updateCitizenReportSummary();


        applyCitizenReportFilters();


        if (
            typeof showToast === "function"
        ) {

            showToast(
                `${citizenReports.length} citizen report(s) loaded successfully.`,
                "success"
            );

        }


    } catch (error) {

        console.error(
            "Failed to load citizen reports:",
            error
        );


        citizenReports = [];


        updateCitizenReportSummary();


        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="9">
                        <div class="empty-state">
                            <i class="bi bi-exclamation-triangle"></i>
                            <h3>Unable to load reports</h3>
                            <p>
                                Make sure the Spring Boot backend
                                is running.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

        }


        if (
            typeof showToast === "function"
        ) {

            showToast(
                "Unable to load citizen reports.",
                "danger"
            );

        }

    }

}


// ============================================================
// LOAD RELATED LOCATIONS AND USERS
// ============================================================

async function loadCitizenReportRelatedData() {

    try {

        const [
            locationsResponse,
            usersResponse
        ] = await Promise.all([

            fetch(
                window.location.protocol + "//" + window.location.hostname + ":8080/api/locations"
            ),

            fetch(
                window.location.protocol + "//" + window.location.hostname + ":8080/api/users"
            )

        ]);


        if (locationsResponse.ok) {

            citizenReportLocations =
                await locationsResponse.json();

        } else {

            citizenReportLocations = [];

        }


        if (usersResponse.ok) {

            citizenReportUsers =
                await usersResponse.json();

        } else {

            citizenReportUsers = [];

        }


        console.log(
            "Citizen report locations:",
            citizenReportLocations
        );


        console.log(
            "Citizen report users loaded."
        );


    } catch (error) {

        console.warn(
            "Could not load related citizen report data:",
            error
        );


        citizenReportLocations = [];

        citizenReportUsers = [];

    }

}


// ============================================================
// UPDATE SUMMARY CARDS
// ============================================================

function updateCitizenReportSummary() {

    const total =
        citizenReports.length;


    /*
     * Backend status:
     * SUBMITTED
     * UNDER_REVIEW
     * RESOLVED
     * REJECTED
     */

    const submitted =
        citizenReports.filter(
            report =>
                String(report.status)
                    .toUpperCase() === "SUBMITTED"
        ).length;


    const underReview =
        citizenReports.filter(
            report =>
                String(report.status)
                    .toUpperCase() === "UNDER_REVIEW"
        ).length;


    const resolved =
        citizenReports.filter(
            report =>
                String(report.status)
                    .toUpperCase() === "RESOLVED"
        ).length;


    setElementText(
        "totalCitizenReportCount",
        total
    );


    /*
     * The existing UI calls this card
     * "Pending Reports".
     *
     * In our backend, SUBMITTED is the
     * equivalent state awaiting review.
     */
    setElementText(
        "pendingCitizenReportCount",
        submitted
    );


    setElementText(
        "reviewCitizenReportCount",
        underReview
    );


    setElementText(
        "resolvedCitizenReportCount",
        resolved
    );

}


// ============================================================
// FILTER REPORTS
// ============================================================

function applyCitizenReportFilters() {

    const searchInput =
        document.getElementById(
            "citizenReportSearchInput"
        );


    const statusFilter =
        document.getElementById(
            "citizenReportStatusFilter"
        );


    const categoryFilter =
        document.getElementById(
            "citizenReportCategoryFilter"
        );


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
                .trim()
                .toUpperCase()
            : "ALL";


    const selectedCategory =
        categoryFilter
            ? categoryFilter.value
                .trim()
                .toUpperCase()
            : "ALL";


    const filteredReports =
        citizenReports.filter(
            report => {

                const location =
                    getLocationById(
                        report.locationId
                    );


                const user =
                    getUserById(
                        report.userId
                    );


                const locationName =
                    location
                        ? location.locationName || ""
                        : "";


                const city =
                    location
                        ? location.city || ""
                        : "";


                const citizenName =
                    user
                        ? user.fullName || ""
                        : "";


                const searchableText = [

                    report.reportId,

                    report.description,

                    report.reportType,

                    report.priority,

                    report.status,

                    locationName,

                    city,

                    citizenName

                ]
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    searchableText.includes(
                        searchTerm
                    );


                const matchesStatus =
                    selectedStatus === "ALL" ||
                    String(report.status)
                        .toUpperCase() ===
                    selectedStatus;


                /*
                 * Frontend category filter:
                 *
                 * POLLUTED_WATER
                 * UNUSUAL_WATER_COLOR
                 * BAD_WATER_SMELL
                 *
                 * The filter values from the
                 * previous UI may be:
                 *
                 * POLLUTION
                 * COLOR
                 * ODOR
                 * etc.
                 *
                 * Therefore we map the real
                 * backend reportType values.
                 */
                const matchesCategory =
                    selectedCategory === "ALL" ||
                    getReportCategory(
                        report.reportType
                    ) === selectedCategory;


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesCategory
                );

            }
        );


    renderCitizenReports(
        filteredReports
    );


    updateCitizenReportResultCount(
        filteredReports.length
    );

}


// ============================================================
// REPORT CATEGORY MAPPING
// ============================================================

function getReportCategory(
    reportType
) {

    const type =
        String(reportType || "")
            .toUpperCase();


    if (
        type === "POLLUTED_WATER"
    ) {

        return "POLLUTION";

    }


    if (
        type === "UNUSUAL_WATER_COLOR"
    ) {

        return "COLOR";

    }


    if (
        type === "BAD_WATER_SMELL"
    ) {

        return "ODOR";

    }


    if (
        type.includes("WASTE")
    ) {

        return "WASTE";

    }


    if (
        type.includes("HEALTH")
    ) {

        return "HEALTH";

    }


    return "OTHER";

}


// ============================================================
// RENDER TABLE
// ============================================================

function renderCitizenReports(
    reports
) {

    const tableBody =
        document.getElementById(
            "citizenReportsTableBody"
        );


    if (!tableBody) {

        return;

    }


    if (
        !reports ||
        reports.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        <i class="bi bi-inbox"></i>
                        <h3>No citizen reports found</h3>
                        <p>
                            Try changing the search or filters.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        reports
            .map(
                report =>
                    createCitizenReportRow(
                        report
                    )
            )
            .join("");

}


// ============================================================
// CREATE TABLE ROW
// ============================================================

function createCitizenReportRow(
    report
) {

    const location =
        getLocationById(
            report.locationId
        );


    const user =
        getUserById(
            report.userId
        );


    const locationName =
        location
            ? location.locationName
            : `Location #${report.locationId}`;


    const city =
        location
            ? location.city || ""
            : "";


    const citizenName =
        user
            ? user.fullName
            : (report.userId ? `User #${report.userId}` : "Anonymous Citizen");


    const category =
        getReportCategory(
            report.reportType
        );


    const severity =
        String(
            report.priority || "NORMAL"
        ).toUpperCase();


    const status =
        String(
            report.status || "SUBMITTED"
        ).toUpperCase();


    const submittedDate =
        formatCitizenReportDate(
            report.reportedAt
        );


    return `
        <tr>

            <!-- ID -->
            <td>
                <strong>
                    #${escapeHtml(report.reportId)}
                </strong>
            </td>


            <!-- CITIZEN -->
            <td>

                <div class="citizen-report-user">

                    <div class="citizen-report-avatar">
                        <i class="bi bi-person-fill"></i>
                    </div>

                    <div>
                        <strong>
                            ${escapeHtml(citizenName)}
                        </strong>

                        <span>
                            ${report.userId ? `User #${escapeHtml(report.userId)}` : "Anonymous submission"}
                        </span>
                    </div>

                </div>

            </td>


            <!-- REPORT -->
            <td>

                <div class="citizen-report-description">

                    <strong>
                        ${escapeHtml(
                            formatReportType(
                                report.reportType
                            )
                        )}
                    </strong>

                    <p>
                        ${escapeHtml(
                            report.description
                        )}
                    </p>

                </div>

            </td>


            <!-- LOCATION -->
            <td>

                <div class="citizen-report-location">

                    <strong>
                        ${escapeHtml(locationName)}
                    </strong>

                    <span>
                        ${escapeHtml(city)}
                    </span>

                </div>

            </td>


            <!-- CATEGORY -->
            <td>

                <span class="report-category-badge">
                    ${escapeHtml(category)}
                </span>

            </td>


            <!-- SEVERITY -->
            <td>

                <span class="
                    report-severity-badge
                    severity-${severity.toLowerCase()}
                ">
                    ${escapeHtml(severity)}
                </span>

            </td>


            <!-- STATUS -->
            <td>

                <span class="
                    citizen-report-status
                    status-${status.toLowerCase().replace("_", "-")}
                ">
                    ${escapeHtml(
                        formatStatus(status)
                    )}
                </span>

            </td>


            <!-- SUBMITTED -->
            <td>
                ${escapeHtml(submittedDate)}
            </td>


            <!-- ACTION -->
            <td>

                <button
                    class="btn btn-sm btn-outline-danger"
                    onclick="viewCitizenReport(${report.reportId})"
                    title="View Report"
                >
                    <i class="bi bi-eye-fill"></i>
                    View
                </button>

            </td>

        </tr>
    `;

}


// ============================================================
// VIEW REPORT
// ============================================================

function viewCitizenReport(
    reportId
) {

    const report =
        citizenReports.find(
            item =>
                Number(item.reportId) ===
                Number(reportId)
        );


    if (!report) {

        console.warn(
            "Citizen report not found:",
            reportId
        );

        return;

    }


    const location =
        getLocationById(
            report.locationId
        );


    const user =
        getUserById(
            report.userId
        );


    console.log(
        "Citizen report details:",
        {
            report,
            location,
            user
        }
    );


    /*
     * Temporary detail display.
     *
     * In the next step we can replace this
     * with a proper JalRakshak modal.
     */
    alert(

        `Citizen Report #${report.reportId}\n\n` +

        `Citizen: ${
            user
                ? user.fullName
                : `User #${report.userId}`
        }\n\n` +

        `Location: ${
            location
                ? location.locationName
                : `Location #${report.locationId}`
        }\n\n` +

        `Report Type: ${
            formatReportType(
                report.reportType
            )
        }\n\n` +

        `Priority: ${
            report.priority
        }\n\n` +

        `Status: ${
            formatStatus(
                report.status
            )
        }\n\n` +

        `Description:\n${
            report.description
        }\n\n` +

        `Coordinates: ${
            report.latitude
        }, ${
            report.longitude
        }\n\n` +

        `Reported At: ${
            formatCitizenReportDate(
                report.reportedAt
            )
        }`

    );

}


// ============================================================
// CLEAR FILTERS
// ============================================================

function clearCitizenReportFilters() {

    const searchInput =
        document.getElementById(
            "citizenReportSearchInput"
        );


    const statusFilter =
        document.getElementById(
            "citizenReportStatusFilter"
        );


    const categoryFilter =
        document.getElementById(
            "citizenReportCategoryFilter"
        );


    if (searchInput) {

        searchInput.value = "";

    }


    if (statusFilter) {

        statusFilter.value = "ALL";

    }


    if (categoryFilter) {

        categoryFilter.value = "ALL";

    }


    applyCitizenReportFilters();

}


// ============================================================
// GET LOCATION
// ============================================================

function getLocationById(
    locationId
) {

    return citizenReportLocations.find(
        location =>
            Number(location.locationId) ===
            Number(locationId)
    );

}


// ============================================================
// GET USER
// ============================================================

function getUserById(
    userId
) {

    return citizenReportUsers.find(
        user =>
            Number(user.userId) ===
            Number(userId)
    );

}


// ============================================================
// FORMAT REPORT TYPE
// ============================================================

function formatReportType(
    reportType
) {

    if (!reportType) {

        return "Citizen Report";

    }


    return String(reportType)
        .toLowerCase()
        .split("_")
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");

}


// ============================================================
// FORMAT STATUS
// ============================================================

function formatStatus(
    status
) {

    if (!status) {

        return "Unknown";

    }


    return String(status)
        .toLowerCase()
        .split("_")
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatCitizenReportDate(
    dateValue
) {

    if (!dateValue) {

        return "--";

    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;

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
// UPDATE RESULT COUNT
// ============================================================

function updateCitizenReportResultCount(
    count
) {

    const element =
        document.getElementById(
            "citizenReportResultCount"
        );


    if (element) {

        element.textContent =
            `${count} report${
                count === 1 ? "" : "s"
            }`;

    }

}


// ============================================================
// SAFE TEXT
// ============================================================

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// SET ELEMENT TEXT
// ============================================================

function setElementText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent = value;

    }

}


// ============================================================
// GLOBAL REFRESH FUNCTION
// ============================================================

window.refreshCitizenReports =
    loadCitizenReports;


// ============================================================
// GLOBAL VIEW FUNCTION
// ============================================================

window.viewCitizenReport =
    viewCitizenReport;


console.log(
    "JalRakshak Citizen Reports module loaded."
);