// ============================================================
// JALRAKSHAK NOTIFICATION SYSTEM
// ============================================================

const NOTIFICATION_API_BASE_URL =
    window.location.protocol + "//" + window.location.hostname + ":8080/api";

let jalRakshakNotifications = [];

let notificationRefreshInProgress = false;


// ============================================================
// INITIALIZE NOTIFICATION SYSTEM
// ============================================================

function initializeNotifications() {

    const notificationButton =
        document.getElementById(
            "notificationButton"
        );

    const closeNotificationButton =
        document.getElementById(
            "closeNotificationButton"
        );

    const notificationPanel =
        document.getElementById(
            "notificationPanel"
        );


    if (!notificationButton) {

        console.warn(
            "Notification button not found."
        );

        return;
    }


    if (!notificationPanel) {

        console.warn(
            "Notification panel not found."
        );

        return;
    }


    // --------------------------------------------------------
    // OPEN NOTIFICATION PANEL
    // --------------------------------------------------------

    notificationButton.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            toggleNotificationPanel();

        }
    );


    // --------------------------------------------------------
    // CLOSE BUTTON
    // --------------------------------------------------------

    if (closeNotificationButton) {

        closeNotificationButton.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                closeNotificationPanel();

            }
        );
    }


    // --------------------------------------------------------
    // PREVENT PANEL CLICK FROM CLOSING IT
    // --------------------------------------------------------

    notificationPanel.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

        }
    );


    // --------------------------------------------------------
    // CLICK OUTSIDE PANEL
    // --------------------------------------------------------

    document.addEventListener(
        "click",
        function() {

            closeNotificationPanel();

        }
    );


    // --------------------------------------------------------
    // INITIAL DATA LOAD
    // --------------------------------------------------------

    loadNotifications();


    console.log(
        "JalRakshak Notification System initialized."
    );
}


// ============================================================
// TOGGLE NOTIFICATION PANEL
// ============================================================

function toggleNotificationPanel() {

    const panel =
        document.getElementById(
            "notificationPanel"
        );

    if (!panel) {
        return;
    }


    if (
        panel.classList.contains(
            "show"
        )
    ) {

        closeNotificationPanel();

    } else {

        openNotificationPanel();

    }
}


// ============================================================
// OPEN PANEL
// ============================================================

function openNotificationPanel() {

    const panel =
        document.getElementById(
            "notificationPanel"
        );

    if (!panel) {
        return;
    }


    panel.classList.add(
        "show"
    );


    loadNotifications();

}


// ============================================================
// CLOSE PANEL
// ============================================================

function closeNotificationPanel() {

    const panel =
        document.getElementById(
            "notificationPanel"
        );

    if (!panel) {
        return;
    }


    panel.classList.remove(
        "show"
    );
}


// ============================================================
// LOAD ALL NOTIFICATIONS
// ============================================================

async function loadNotifications() {

    if (
        notificationRefreshInProgress
    ) {
        return;
    }


    notificationRefreshInProgress = true;


    showNotificationLoading();


    try {

        const results =
            await Promise.allSettled([

                fetchNotificationData(
                    "/alerts"
                ),

                fetchNotificationData(
                    "/responses"
                ),

                fetchNotificationData(
                    "/citizen-reports"
                )

            ]);


        const alerts =
            results[0].status === "fulfilled"
                ? results[0].value
                : [];


        const responses =
            results[1].status === "fulfilled"
                ? results[1].value
                : [];


        const citizenReports =
            results[2].status === "fulfilled"
                ? results[2].value
                : [];


        jalRakshakNotifications =
            buildNotificationList(
                alerts,
                responses,
                citizenReports
            );


        renderNotifications(
            jalRakshakNotifications
        );


        updateNotificationBadge(
            jalRakshakNotifications
        );


        console.log(
            "Notifications loaded:",
            jalRakshakNotifications
        );


    } catch (error) {

        console.error(
            "Failed to load notifications:",
            error
        );


        showNotificationError();

    } finally {

        notificationRefreshInProgress =
            false;

    }
}


// ============================================================
// FETCH API DATA
// ============================================================

async function fetchNotificationData(
    endpoint
) {

    const response =
        await fetch(
            NOTIFICATION_API_BASE_URL +
            endpoint
        );


    if (!response.ok) {

        throw new Error(
            `API request failed: ${response.status}`
        );

    }


    const data =
        await response.json();


    return Array.isArray(data)
        ? data
        : [];
}


// ============================================================
// BUILD NOTIFICATION LIST
// ============================================================

function buildNotificationList(
    alerts,
    responses,
    citizenReports
) {

    const notifications = [];


    // ========================================================
    // ALERT NOTIFICATIONS
    // ========================================================

    alerts.forEach(
        function(alert) {

            const severity =
                String(
                    alert.severity || ""
                ).toUpperCase();


            const status =
                String(
                    alert.status || ""
                ).toUpperCase();


            // Only active alerts
            if (
                status === "OPEN"
            ) {

                notifications.push({

                    type: "alert",

                    priority:
                        severity === "HIGH"
                            ? 1
                            : severity === "MEDIUM"
                                ? 2
                                : 3,

                    title:
                        severity === "HIGH"
                            ? "High Severity Water Alert"
                            : "Water Quality Alert",

                    message:
                        alert.message ||
                        "Water quality anomaly detected.",

                    time:
                        alert.detectedAt,

                    icon:
                        severity === "HIGH"
                            ? "bi-exclamation-octagon-fill"
                            : "bi-exclamation-triangle-fill",

                    severity:
                        severity,

                    targetPage:
                        "alerts"

                });

            }

        }
    );


    // ========================================================
    // RESPONSE NOTIFICATIONS
    // ========================================================

    responses.forEach(
        function(response) {

            const status =
                String(
                    response.responseStatus || ""
                ).toUpperCase();


            if (
                status === "PENDING" ||
                status === "IN_PROGRESS"
            ) {

                notifications.push({

                    type: "response",

                    priority:
                        status === "IN_PROGRESS"
                            ? 2
                            : 3,

                    title:
                        status === "IN_PROGRESS"
                            ? "Response In Progress"
                            : "Pending Response",

                    message:
                        response.actionTaken ||
                        "A response action requires attention.",

                    time:
                        response.assignedAt,

                    icon:
                        status === "IN_PROGRESS"
                            ? "bi-arrow-repeat"
                            : "bi-hourglass-split",

                    severity:
                        status === "IN_PROGRESS"
                            ? "MEDIUM"
                            : "LOW",

                    targetPage:
                        "responses"

                });

            }

        }
    );


    // ========================================================
    // CITIZEN REPORT NOTIFICATIONS
    // ========================================================

    citizenReports.forEach(
        function(report) {

            const status =
                String(
                    report.status || ""
                ).toUpperCase();


            if (
                status === "SUBMITTED" ||
                status === "UNDER_REVIEW"
            ) {

                notifications.push({

                    type: "citizen",

                    priority:
                        String(
                            report.priority || ""
                        ).toUpperCase() === "HIGH"
                            ? 2
                            : 3,

                    title:
                        status === "SUBMITTED"
                            ? "New Citizen Report"
                            : "Citizen Report Under Review",

                    message:
                        report.description ||
                        "A citizen report requires attention.",

                    time:
                        report.reportedAt,

                    icon:
                        "bi-people-fill",

                    severity:
                        String(
                            report.priority || "NORMAL"
                        ).toUpperCase(),

                    targetPage:
                        "citizenReports"

                });

            }

        }
    );


    // ========================================================
    // SORT BY PRIORITY
    // ========================================================

    notifications.sort(
        function(a, b) {

            return (
                a.priority -
                b.priority
            );

        }
    );


    return notifications;
}


// ============================================================
// RENDER NOTIFICATIONS
// ============================================================

function renderNotifications(
    notifications
) {

    const notificationList =
        document.getElementById(
            "notificationList"
        );


    if (!notificationList) {
        return;
    }


    if (
        !notifications.length
    ) {

        notificationList.innerHTML = `

            <div class="empty-notification">

                <i class="bi bi-bell-slash"></i>

                <p>
                    No new notifications
                </p>

            </div>

        `;

        return;
    }


    notificationList.innerHTML =
        notifications
            .map(
                function(notification) {

                    return createNotificationHTML(
                        notification
                    );

                }
            )
            .join("");


    attachNotificationClickHandlers();

}


// ============================================================
// CREATE NOTIFICATION HTML
// ============================================================

function createNotificationHTML(
    notification
) {

    const severityClass =
        getNotificationSeverityClass(
            notification.severity
        );


    return `

        <div
            class="notification-item ${severityClass}"
            data-target-page="${escapeNotificationHTML(
                notification.targetPage
            )}"
        >

            <div class="notification-icon">

                <i class="bi ${
                    notification.icon
                }"></i>

            </div>


            <div class="notification-content">

                <strong>
                    ${escapeNotificationHTML(
                        notification.title
                    )}
                </strong>

                <p>
                    ${escapeNotificationHTML(
                        notification.message
                    )}
                </p>

                <small>
                    ${formatNotificationTime(
                        notification.time
                    )}
                </small>

            </div>

        </div>

    `;

}


// ============================================================
// NOTIFICATION CLICK
// ============================================================

function attachNotificationClickHandlers() {

    const notificationItems =
        document.querySelectorAll(
            ".notification-item"
        );


    notificationItems.forEach(
        function(item) {

            item.addEventListener(
                "click",
                function() {

                    const targetPage =
                        item.dataset.targetPage;


                    closeNotificationPanel();


                    if (
                        targetPage &&
                        typeof window.showPage ===
                            "function"
                    ) {

                        window.showPage(
                            targetPage
                        );

                    }

                }
            );

        }
    );
}


// ============================================================
// UPDATE BADGE
// ============================================================

function updateNotificationBadge(
    notifications
) {

    const button =
        document.getElementById(
            "notificationButton"
        );


    if (!button) {
        return;
    }


    const dot =
        button.querySelector(
            ".notification-dot"
        );


    if (!dot) {
        return;
    }


    const count =
        notifications.length;


    let badgeEnabled = true;


    try {

        const savedSettings =
            localStorage.getItem(
                "jalrakshakSettings"
            );


        if (savedSettings) {

            const settings =
                JSON.parse(
                    savedSettings
                );


            badgeEnabled =
                settings.notificationBadge !== false;

        }

    } catch (error) {

        console.warn(
            "Unable to read notification badge setting."
        );

    }


    dot.style.display =
        badgeEnabled && count > 0
            ? ""
            : "none";

}


// ============================================================
// LOADING STATE
// ============================================================

function showNotificationLoading() {

    const list =
        document.getElementById(
            "notificationList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = `

        <div class="empty-notification">

            <i class="bi bi-arrow-repeat notification-loading-icon"></i>

            <p>
                Loading notifications...
            </p>

        </div>

    `;

}


// ============================================================
// ERROR STATE
// ============================================================

function showNotificationError() {

    const list =
        document.getElementById(
            "notificationList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = `

        <div class="empty-notification">

            <i class="bi bi-exclamation-triangle"></i>

            <p>
                Unable to load notifications
            </p>

            <button
                type="button"
                class="notification-retry-button"
                onclick="loadNotifications()"
            >
                Try Again
            </button>

        </div>

    `;

}


// ============================================================
// FORMAT TIME
// ============================================================

function formatNotificationTime(
    value
) {

    if (!value) {

        return "Time unavailable";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

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
// SEVERITY CLASS
// ============================================================

function getNotificationSeverityClass(
    severity
) {

    const value =
        String(
            severity || ""
        ).toUpperCase();


    if (value === "HIGH") {

        return "notification-high";

    }


    if (value === "MEDIUM") {

        return "notification-medium";

    }


    return "notification-normal";

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeNotificationHTML(
    value
) {

    return String(
        value ?? ""
    )
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
// PUBLIC FUNCTIONS
// ============================================================

window.loadNotifications =
    loadNotifications;

window.openNotificationPanel =
    openNotificationPanel;

window.closeNotificationPanel =
    closeNotificationPanel;


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initializeNotifications();

    }
);