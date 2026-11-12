/* =========================================================
   JALRAKSHAK - THEME JAVASCRIPT
   File: theme.js

   Handles:
   - Dark Mode
   - Light Mode
   - Theme button
   - Theme persistence using localStorage
   - Theme icon and text updates
   ========================================================= */


/* =========================================================
   THEME STATE
   ========================================================= */

const ThemeState = {

    isDarkMode: false

};


/* =========================================================
   INITIALIZE THEME
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("Theme JavaScript initialized.");

    initializeTheme();

    setupThemeButton();

});


/* =========================================================
   INITIALIZE SAVED THEME
   ========================================================= */

function initializeTheme() {

    const savedTheme =
        localStorage.getItem(
            "jalrakshak-theme"
        );


    /*
     * If the user has previously selected
     * dark mode, restore it.
     */

    if (savedTheme === "dark") {

        enableDarkMode();

    }

    /*
     * If no theme was saved, use light mode.
     */

    else {

        enableLightMode();

    }

}


/* =========================================================
   SETUP THEME BUTTON
   ========================================================= */

function setupThemeButton() {

    const themeButton =
        document.getElementById(
            "themeButton"
        );


    if (!themeButton) {

        console.warn(
            "Theme button not found."
        );

        return;

    }


    themeButton.addEventListener(
        "click",
        toggleTheme
    );

}


/* =========================================================
   TOGGLE THEME
   ========================================================= */

function toggleTheme() {

    if (
        ThemeState.isDarkMode
    ) {

        enableLightMode();

    }

    else {

        enableDarkMode();

    }

}


/* =========================================================
   ENABLE DARK MODE
   ========================================================= */

function enableDarkMode() {

    document.body.classList.add(
        "dark-theme"
    );


    ThemeState.isDarkMode =
        true;


    localStorage.setItem(
        "jalrakshak-theme",
        "dark"
    );


    updateThemeButton();

    updateChartTheme();

    document.dispatchEvent(new CustomEvent("jalrakshak-theme-changed", {
        detail: { isDark: true }
    }));


    /*
     * Keep AppState synchronized
     * if app.js has created it.
     */

    if (
        typeof AppState !==
        "undefined"
    ) {

        AppState.isDarkMode =
            true;

    }


    console.log(
        "Dark mode enabled."
    );

}


/* =========================================================
   ENABLE LIGHT MODE
   ========================================================= */

function enableLightMode() {

    document.body.classList.remove(
        "dark-theme"
    );


    ThemeState.isDarkMode =
        false;


    localStorage.setItem(
        "jalrakshak-theme",
        "light"
    );


    updateThemeButton();

    updateChartTheme();

    document.dispatchEvent(new CustomEvent("jalrakshak-theme-changed", {
        detail: { isDark: false }
    }));


    /*
     * Keep AppState synchronized
     * if app.js has created it.
     */

    if (
        typeof AppState !==
        "undefined"
    ) {

        AppState.isDarkMode =
            false;

    }


    console.log(
        "Light mode enabled."
    );

}


/* =========================================================
   UPDATE THEME BUTTON
   ========================================================= */

function updateThemeButton() {

    const themeButton =
        document.getElementById(
            "themeButton"
        );


    if (!themeButton) {
        return;
    }


    const icon =
        themeButton.querySelector(
           ("i")
        );


    if (
        ThemeState.isDarkMode
    ) {

        /*
         * Dark mode is active.
         * Show sun icon because clicking it
         * will switch back to light mode.
         */

        if (icon) {

            icon.className =
                "bi bi-sun-fill";

        }


        themeButton.setAttribute(
            "title",
            "Switch to Light Mode"
        );


        themeButton.setAttribute(
            "aria-label",
            "Switch to Light Mode"
        );

    }

    else {

        /*
         * Light mode is active.
         * Show moon icon because clicking it
         * will switch to dark mode.
         */

        if (icon) {

            icon.className =
                "bi bi-moon-fill";

        }


        themeButton.setAttribute(
            "title",
            "Switch to Dark Mode"
        );


        themeButton.setAttribute(
            "aria-label",
            "Switch to Dark Mode"
        );

    }

}


/* =========================================================
   UPDATE CHART THEME
   ========================================================= */

function updateChartTheme() {

    /*
     * Chart.js may not have been created yet.
     * Therefore we safely check whether the chart exists.
     */

    if (
        typeof waterQualityChart ===
        "undefined"
        ||
        !waterQualityChart
    ) {

        return;

    }


    const textColor =
        ThemeState.isDarkMode
            ? "#e5e7eb"
            : "#1f2937";


    const gridColor =
        ThemeState.isDarkMode
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.08)";


    /*
     * Update X-axis
     */

    if (
        waterQualityChart.options.scales &&
        waterQualityChart.options.scales.x
    ) {

        waterQualityChart.options.scales.x.ticks.color =
            textColor;


        waterQualityChart.options.scales.x.grid.color =
            gridColor;

    }


    /*
     * Update Y-axis
     */

    if (
        waterQualityChart.options.scales &&
        waterQualityChart.options.scales.y
    ) {

        waterQualityChart.options.scales.y.ticks.color =
            textColor;


        waterQualityChart.options.scales.y.grid.color =
            gridColor;

    }


    /*
     * Update secondary Y-axis if it exists.
     */

    if (
        waterQualityChart.options.scales &&
        waterQualityChart.options.scales.y1
    ) {

        waterQualityChart.options.scales.y1.ticks.color =
            textColor;


        waterQualityChart.options.scales.y1.grid.color =
            gridColor;

    }


    /*
     * Update legend text.
     */

    if (
        waterQualityChart.options.plugins &&
        waterQualityChart.options.plugins.legend
    ) {

        waterQualityChart.options.plugins.legend.labels.color =
            textColor;

    }


    waterQualityChart.update();

}


/* =========================================================
   GET CURRENT THEME
   ========================================================= */

function getCurrentTheme() {

    return ThemeState.isDarkMode
        ? "dark"
        : "light";

}


/* =========================================================
   CHECK DARK MODE
   ========================================================= */

function isDarkMode() {

    return ThemeState.isDarkMode;

}


/* =========================================================
   RESET TO LIGHT MODE
   ========================================================= */

function resetTheme() {

    enableLightMode();

}


/* =========================================================
   EXPORT FUNCTIONS
   ========================================================= */

window.ThemeState =
    ThemeState;

window.toggleTheme =
    toggleTheme;

window.enableDarkMode =
    enableDarkMode;

window.enableLightMode =
    enableLightMode;

window.getCurrentTheme =
    getCurrentTheme;

window.isDarkMode =
    isDarkMode;

window.resetTheme =
    resetTheme;