/* =========================================================
   JALRAKSHAK SETTINGS
   Persistent settings + theme/notification/refresh controls.
   ========================================================= */

(() => {
    "use strict";

    const STORAGE_KEY = "jalrakshakSettings";

    const DEFAULT_SETTINGS = Object.freeze({
        darkMode: false,
        notifications: true,
        autoRefresh: true,
        refreshInterval: 60000,
        notificationBadge: true
    });

    let settings = { ...DEFAULT_SETTINGS };
    let autoRefreshTimer = null;

    function getSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return { ...DEFAULT_SETTINGS };

            const parsed = JSON.parse(saved);
            return {
                ...DEFAULT_SETTINGS,
                ...(parsed && typeof parsed === "object" ? parsed : {})
            };
        } catch (error) {
            console.error("Unable to read JalRakshak settings:", error);
            return { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error("Unable to save JalRakshak settings:", error);
            return false;
        }
    }

    function readSettingsFromUI() {
        const darkMode = document.getElementById("settingsDarkMode");
        const notifications = document.getElementById("settingsNotifications");
        const autoRefresh = document.getElementById("settingsAutoRefresh");
        const refreshInterval = document.getElementById("settingsRefreshInterval");
        const notificationBadge = document.getElementById("settingsNotificationBadge");

        if (darkMode) settings.darkMode = darkMode.checked;
        if (notifications) settings.notifications = notifications.checked;
        if (autoRefresh) settings.autoRefresh = autoRefresh.checked;
        if (notificationBadge) settings.notificationBadge = notificationBadge.checked;

        if (refreshInterval) {
            const value = Number(refreshInterval.value);
            settings.refreshInterval = Number.isFinite(value) && value >= 5000
                ? value
                : DEFAULT_SETTINGS.refreshInterval;
        }
    }

    function updateSettingsUI() {
        const darkMode = document.getElementById("settingsDarkMode");
        const notifications = document.getElementById("settingsNotifications");
        const autoRefresh = document.getElementById("settingsAutoRefresh");
        const refreshInterval = document.getElementById("settingsRefreshInterval");
        const notificationBadge = document.getElementById("settingsNotificationBadge");

        if (darkMode) darkMode.checked = Boolean(settings.darkMode);
        if (notifications) notifications.checked = Boolean(settings.notifications);
        if (autoRefresh) autoRefresh.checked = Boolean(settings.autoRefresh);
        if (notificationBadge) notificationBadge.checked = Boolean(settings.notificationBadge);

        if (refreshInterval) {
            const optionExists = Array.from(refreshInterval.options).some(
                option => Number(option.value) === Number(settings.refreshInterval)
            );
            refreshInterval.value = optionExists
                ? String(settings.refreshInterval)
                : String(DEFAULT_SETTINGS.refreshInterval);
        }
    }

    function applyDarkMode(enabled) {
        const isDark = Boolean(enabled);

        // theme.js is the single source of truth for the visual theme.
        if (isDark && typeof window.enableDarkMode === "function") {
            window.enableDarkMode();
        } else if (!isDark && typeof window.enableLightMode === "function") {
            window.enableLightMode();
        } else {
            document.body.classList.toggle("dark-theme", isDark);
            localStorage.setItem("jalrakshak-theme", isDark ? "dark" : "light");
        }

        const themeButton = document.getElementById("themeButton");
        if (themeButton) {
            themeButton.setAttribute("aria-pressed", String(isDark));
        }
    }

    function applyNotifications() {
        const notificationButton = document.getElementById("notificationButton");
        const notificationPanel = document.getElementById("notificationPanel");

        if (notificationButton) {
            notificationButton.disabled = !settings.notifications;
            notificationButton.classList.toggle(
                "settings-disabled",
                !settings.notifications
            );
            notificationButton.setAttribute(
                "aria-disabled",
                String(!settings.notifications)
            );
        }

        if (!settings.notifications && notificationPanel) {
            notificationPanel.classList.remove("open");
        }

        const dot = document.querySelector(".notification-dot");
        if (dot) {
            dot.style.display = settings.notifications && settings.notificationBadge
                ? ""
                : "none";
        }

        const badge = document.getElementById("sidebarAlertCount");
        if (badge && !settings.notificationBadge) {
            badge.style.display = "none";
        } else if (badge && settings.notificationBadge) {
            badge.style.removeProperty("display");
        }
    }

    function triggerWebsiteRefresh() {
        const refreshButton = document.getElementById("refreshButton");
        if (refreshButton && !refreshButton.disabled) {
            refreshButton.click();
        }
    }

    function setupAutoRefresh() {
        if (autoRefreshTimer !== null) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }

        if (!settings.autoRefresh) return;

        const interval = Math.max(5000, Number(settings.refreshInterval) || 60000);

        autoRefreshTimer = setInterval(() => {
            if (document.hidden) return;
            triggerWebsiteRefresh();
        }, interval);
    }

    function applyAllSettings() {
        applyDarkMode(settings.darkMode);
        applyNotifications();
        setupAutoRefresh();

        document.dispatchEvent(
            new CustomEvent("jalrakshak-settings-changed", {
                detail: { ...settings }
            })
        );
    }

    function showSettingsMessage(message, type = "success") {
        const element = document.getElementById("settingsMessage");
        if (!element) return;

        element.textContent = message;
        element.className = `settings-message ${type}`;

        clearTimeout(showSettingsMessage.timer);
        showSettingsMessage.timer = setTimeout(() => {
            element.textContent = "";
            element.className = "settings-message";
        }, 3000);
    }

    function handleSaveSettings() {
        readSettingsFromUI();

        if (!saveSettings()) {
            showSettingsMessage("Unable to save settings.", "error");
            return;
        }

        applyAllSettings();
        showSettingsMessage("Settings saved successfully.", "success");
    }

    function resetSettings() {
        settings = { ...DEFAULT_SETTINGS };
        updateSettingsUI();

        if (!saveSettings()) {
            showSettingsMessage("Unable to reset settings.", "error");
            return;
        }

        applyAllSettings();
        showSettingsMessage("Settings reset to default.", "success");
    }

    function connectSettingsControls() {
        const saveButton = document.getElementById("saveSettingsButton");
        const resetButton = document.getElementById("resetSettingsButton");
        const darkMode = document.getElementById("settingsDarkMode");
        const notifications = document.getElementById("settingsNotifications");
        const autoRefresh = document.getElementById("settingsAutoRefresh");
        const refreshInterval = document.getElementById("settingsRefreshInterval");
        const notificationBadge = document.getElementById("settingsNotificationBadge");

        if (saveButton) saveButton.addEventListener("click", handleSaveSettings);
        if (resetButton) resetButton.addEventListener("click", resetSettings);

        // Preview changes immediately. Save persists them.
        if (darkMode) {
            darkMode.addEventListener("change", () => {
                settings.darkMode = darkMode.checked;
                applyDarkMode(settings.darkMode);
            });
        }

        if (notifications) {
            notifications.addEventListener("change", () => {
                settings.notifications = notifications.checked;
                applyNotifications();
            });
        }

        if (notificationBadge) {
            notificationBadge.addEventListener("change", () => {
                settings.notificationBadge = notificationBadge.checked;
                applyNotifications();
            });
        }

        if (autoRefresh) {
            autoRefresh.addEventListener("change", () => {
                settings.autoRefresh = autoRefresh.checked;
                setupAutoRefresh();
            });
        }

        if (refreshInterval) {
            refreshInterval.addEventListener("change", () => {
                const value = Number(refreshInterval.value);
                settings.refreshInterval = Number.isFinite(value) && value >= 5000
                    ? value
                    : DEFAULT_SETTINGS.refreshInterval;
                setupAutoRefresh();
            });
        }
    }

    function syncWithThemeEvent() {
        document.addEventListener("jalrakshak-theme-changed", event => {
            if (!event.detail) return;

            settings.darkMode = Boolean(event.detail.isDark);
            const checkbox = document.getElementById("settingsDarkMode");
            if (checkbox) checkbox.checked = settings.darkMode;
        });
    }

    function initializeSettings() {
        settings = getSettings();
        updateSettingsUI();
        connectSettingsControls();
        syncWithThemeEvent();
        applyAllSettings();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeSettings);
    } else {
        initializeSettings();
    }
})();
