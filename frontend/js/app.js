const API_BASE_URL = window.location.protocol + "//" + window.location.hostname + ":8080/api";

/* =========================================================
   GLOBAL APP STATE
   ========================================================= */

const AppState = {
    currentPage: "dashboard",
    isDarkMode: false,
    notifications: [],
    backendOnline: false
};


/* =========================================================
   PAGE CONFIGURATION
   ========================================================= */

const pageConfig = {

    citizenPortal: {
        title: "Citizen Portal",
        subtitle: "Local water information and simple answers for everyone"
    },

    dashboard: {
        title: "Dashboard",
        subtitle: "Monitor water quality and system activity"
    },

    waterAnalysis: {
        title: "Water Quality Analysis",
        subtitle: "Analyze water quality parameters and trends"
    },

    map: {
        title: "Monitoring Map",
        subtitle: "View monitored water locations"
    },

    waterInsights: {
        title: "Waterbody History & Pollution Insights",
        subtitle: "Recorded sensor history, trend estimates and data provenance"
    },

    alerts: {
        title: "Alerts Management",
        subtitle: "Monitor and manage water quality alerts"
    },

    responses: {
        title: "Response Management",
        subtitle: "Track actions taken for water quality alerts"
    },

    citizenReports: {
        title: "Citizen Reports",
        subtitle: "Review reports submitted by citizens"
    },

    reports: {
        title: "Reports",
        subtitle: "Generate and view water quality reports"
    },

    settings: {
        title: "Settings",
        subtitle: "Manage application settings"
    },

    help: {
        title: "Help & Support",
        subtitle: "Get help using the JalRakshak system"
    }
};


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("JalRakshak frontend initialized.");

    initializeNavigation();
    initializeMobileMenu();
    initializeRefreshButton();
    initializeNotificationPanel();

    showPage("dashboard");

    checkBackendHealth();

    updateDateTime();

    setInterval(updateDateTime, 1000);
});


/* =========================================================
   SIDEBAR NAVIGATION
   ========================================================= */

function initializeNavigation() {

    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(function (item) {

        item.addEventListener("click", function (event) {

            event.preventDefault();

            const page = item.getAttribute("data-page");

            if (!page) {
                console.warn("No data-page found for navigation item.");
                return;
            }

            console.log("Navigating to:", page);

            showPage(page);

            // Close mobile sidebar after clicking
            const sidebar = document.querySelector(".sidebar");

            if (sidebar && window.innerWidth <= 992) {
                sidebar.classList.remove("mobile-open");
            }
        });
    });
}


/* =========================================================
   SHOW PAGE
   ========================================================= */

function showPage(pageName) {

    console.log("Showing page:", pageName);

    const pages = document.querySelectorAll(".page-section");

    if (pages.length === 0) {
        console.error("No .page-section elements found.");
        return;
    }

    let targetPage = document.getElementById(pageName + "Page");

    /*
     * Dashboard is sometimes written as dashboard-section
     * in HTML. This fallback makes navigation safer.
     */
    if (!targetPage && pageName === "dashboard") {
        targetPage = document.getElementById("dashboardPage");
    }

    if (!targetPage) {
        console.error(
            "Page not found:",
            pageName + "Page"
        );
        return;
    }


    /* Hide every page */

    pages.forEach(function (page) {
        page.style.display = "none";
        page.classList.remove("active");
    });


    /* Show selected page */

    targetPage.style.display = "block";
    targetPage.classList.add("active");


    /* Update active sidebar item */

    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(function (item) {

        const itemPage = item.getAttribute("data-page");

        if (itemPage === pageName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });


    /* Update top navbar */

    updatePageHeader(pageName);


    /* Save current page */

    AppState.currentPage = pageName;


    /* Run page-specific loading */

    runPageLoader(pageName);
}


/* =========================================================
   PAGE HEADER
   ========================================================= */

function updatePageHeader(pageName) {

    const config = pageConfig[pageName];

    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");

    if (!config) {
        console.warn("No page configuration for:", pageName);
        return;
    }

    if (pageTitle) {
        pageTitle.textContent = config.title;
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = config.subtitle;
    }
}


/* =========================================================
   PAGE-SPECIFIC LOADING
   ========================================================= */
function runPageLoader(pageName) {

    console.log("Loading page content:", pageName);

    switch (pageName) {

        case "citizenPortal":
            if (typeof initializeCitizenPortal === "function") {
                initializeCitizenPortal();
            }
            break;

        case "dashboard":

            if (typeof loadDashboardStats === "function") {
                loadDashboardStats();
            }

            if (typeof loadRecentAlerts === "function") {
                loadRecentAlerts();
            }

            if (typeof loadWaterQualityChart === "function") {
                loadWaterQualityChart();
            }

            break;


        case "waterInsights":

            if (typeof initializeJalRakshakWaterInsights === "function") {
                initializeJalRakshakWaterInsights();
            }

            break;


        case "waterbodies":

            // Waterbody Intelligence loads locations and verified observations from the backend.
            // Initialize it only after the section is visible so Leaflet can measure its map.
            if (typeof initializeWaterbodyIntelligence === "function") {
                requestAnimationFrame(function () {
                    initializeWaterbodyIntelligence();
                });
            }

            break;


        case "waterAnalysis":

            if (typeof initializeWaterAnalysis === "function") {
                initializeWaterAnalysis();
            }

            if (typeof loadWaterQualityChart === "function") {
                loadWaterQualityChart();
            }

            break;


        case "alerts":

            if (typeof loadAlerts === "function") {
                loadAlerts();
            }

            break;


        case "map":

            if (typeof initializeMap === "function") {
                initializeMap();
            }

            break;


        case "responses":

            if (typeof loadResponseManagementData === "function") {
                loadResponseManagementData();
            }

            break;


        case "citizenReports":

            if (typeof loadCitizenReports === "function") {
                loadCitizenReports();
            }

            break;


        case "reports":

            if (typeof loadReportsOverview === "function") {
                loadReportsOverview();
            }

            break;


        case "settings":

            console.log("Settings page opened.");

            break;


        case "help":

            console.log("Help & Support page opened.");

            break;


        default:

            console.warn(
                "No loader defined for page:",
                pageName
            );
    }
}



/* =========================================================
   MOBILE MENU
   ========================================================= */

function initializeMobileMenu() {

    const menuButton = document.getElementById("menuButton");
    const sidebar = document.querySelector(".sidebar");

    if (!menuButton || !sidebar) {
        return;
    }

    menuButton.addEventListener("click", function () {

        sidebar.classList.toggle("mobile-open");

    });
}


/* =========================================================
   REFRESH BUTTON
   ========================================================= */

function initializeRefreshButton() {

    const refreshButton =
        document.getElementById("refreshButton");

    if (!refreshButton) {
        return;
    }

    refreshButton.addEventListener("click", function () {

        refreshCurrentPage();

    });
}


function refreshCurrentPage() {

    console.log(
        "Refreshing page:",
        AppState.currentPage
    );

    runPageLoader(AppState.currentPage);

    showToast(
        "Page refreshed successfully.",
        "success"
    );
}


/* =========================================================
   NOTIFICATION PANEL
   ========================================================= */

function initializeNotificationPanel() {

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationPanel =
        document.getElementById("notificationPanel");

    const overlay =
        document.getElementById("pageOverlay");

    if (!notificationButton || !notificationPanel) {
        return;
    }


    notificationButton.addEventListener(
        "click",
        function () {

            notificationPanel.classList.toggle("open");

            if (overlay) {
                overlay.classList.toggle(
                    "active",
                    notificationPanel.classList.contains("open")
                );
            }
        }
    );


    if (overlay) {

        overlay.addEventListener(
            "click",
            function () {

                notificationPanel.classList.remove("open");
                overlay.classList.remove("active");

            }
        );
    }
}


/* =========================================================
   BACKEND HEALTH CHECK
   ========================================================= */

async function checkBackendHealth() {

    try {

        const response =
            await fetch(
                API_BASE_URL + "/health"
            );

        if (!response.ok) {
            throw new Error("Backend returned an error.");
        }

        const data =
            await response.json();

        console.log(
            "Backend health:",
            data
        );

        AppState.backendOnline = true;

        updateSystemStatus(true);

    } catch (error) {

        console.error(
            "Backend health check failed:",
            error
        );

        AppState.backendOnline = false;

        updateSystemStatus(false);
    }
}


/* =========================================================
   SYSTEM STATUS
   ========================================================= */

function updateSystemStatus(isOnline) {

    const statusDot =
        document.querySelector(".status-dot");

    const statusText =
        document.querySelector(
            ".system-status span"
        );

    if (statusDot) {

        if (isOnline) {
            statusDot.classList.add("online");
        } else {
            statusDot.classList.remove("online");
        }
    }

    if (statusText) {

        statusText.textContent =
            isOnline
                ? "System Online"
                : "System Offline";
    }
}


/* =========================================================
   ALERT BADGE
   ========================================================= */

function updateAlertBadge(count) {

    const badge =
        document.getElementById(
            "sidebarAlertCount"
        );

    if (!badge) {
        return;
    }

    const number =
        Number(count) || 0;

    badge.textContent = number;

    if (number > 0) {
        badge.style.display = "inline-flex";
    } else {
        badge.style.display = "none";
    }
}


/* =========================================================
   API GET
   ========================================================= */

async function apiGet(endpoint) {

    const response =
        await fetch(
            API_BASE_URL + endpoint
        );

    if (!response.ok) {

        throw new Error(
            "GET request failed: " +
            response.status
        );
    }

    return await response.json();
}


/* =========================================================
   API POST
   ========================================================= */

async function apiPost(endpoint, data) {

    const response =
        await fetch(
            API_BASE_URL + endpoint,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(data)
            }
        );

    if (!response.ok) {

        throw new Error(
            "POST request failed: " +
            response.status
        );
    }

    return await response.json();
}


/* =========================================================
   API PUT
   ========================================================= */

async function apiPut(endpoint, data) {

    const response =
        await fetch(
            API_BASE_URL + endpoint,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(data)
            }
        );

    if (!response.ok) {

        throw new Error(
            "PUT request failed: " +
            response.status
        );
    }

    return await response.json();
}


/* =========================================================
   API DELETE
   ========================================================= */

async function apiDelete(endpoint) {

    const response =
        await fetch(
            API_BASE_URL + endpoint,
            {
                method: "DELETE"
            }
        );

    if (!response.ok) {

        throw new Error(
            "DELETE request failed: " +
            response.status
        );
    }

    return true;
}


/* =========================================================
   TOAST MESSAGE
   ========================================================= */

function showToast(message, type = "info") {

    let container =
        document.getElementById(
            "toastContainer"
        );

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "toastContainer";

        container.style.position =
            "fixed";

        container.style.top =
            "90px";

        container.style.right =
            "25px";

        container.style.zIndex =
            "9999";

        document.body.appendChild(
            container
        );
    }


    const toast =
        document.createElement("div");

    toast.className =
        "app-toast " + type;

    toast.textContent = message;


    toast.style.padding =
        "12px 18px";

    toast.style.marginBottom =
        "10px";

    toast.style.borderRadius =
        "10px";

    toast.style.background =
        "#ffffff";

    toast.style.boxShadow =
        "0 5px 20px rgba(0,0,0,0.15)";

    toast.style.fontWeight =
        "500";


    container.appendChild(toast);


    setTimeout(function () {

        toast.remove();

    }, 3000);
}


/* =========================================================
   DATE / TIME
   ========================================================= */

function updateDateTime() {

    const elements =
        document.querySelectorAll(
            "[data-current-time]"
        );

    if (elements.length === 0) {
        return;
    }

    const now =
        new Date();

    const formatted =
        now.toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    elements.forEach(function (element) {
        element.textContent = formatted;
    });
}


/* =========================================================
   DATE FORMATTING
   ========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    const date =
        new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatDateTime(dateValue) {

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


/* =========================================================
   TEXT HELPERS
   ========================================================= */

function capitalizeText(text) {

    if (!text) {
        return "";
    }

    return String(text)
        .toLowerCase()
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
}


/* =========================================================
   NUMBER HELPER
   ========================================================= */

function safeNumber(value, decimals = 0) {

    const number =
        Number(value);

    if (isNaN(number)) {
        return "—";
    }

    return number.toFixed(decimals);
}


/* =========================================================
   EXPORT GLOBAL FUNCTIONS
   ========================================================= */

window.AppState = AppState;

window.pageConfig = pageConfig;

window.showPage = showPage;

window.refreshCurrentPage = refreshCurrentPage;

window.checkBackendHealth =
    checkBackendHealth;

window.updateAlertBadge =
    updateAlertBadge;

window.apiGet = apiGet;

window.apiPost = apiPost;

window.apiPut = apiPut;

window.apiDelete = apiDelete;

window.showToast = showToast;

window.formatDate = formatDate;

window.formatDateTime =
    formatDateTime;

window.capitalizeText =
    capitalizeText;

window.safeNumber =
    safeNumber;