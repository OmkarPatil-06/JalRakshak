/* =========================================================
   JALRAKSHAK MONITORING MAP
   Leaflet + Spring Boot Backend
   ========================================================= */

const MAP_API_BASE_URL = window.location.protocol + "//" + window.location.hostname + ":8080/api";

let jalRakshakMap = null;
let mapMarkers = [];
let mapInitialized = false;


/* =========================================================
   INITIALIZE MAP
   ========================================================= */

function initializeMonitoringMap() {

    const mapContainer =
        document.getElementById("map");

    if (!mapContainer) {
        console.error(
            "Monitoring map container (#map) was not found."
        );

        return;
    }


    /*
     * Prevent Leaflet from being initialized
     * multiple times.
     */

    if (mapInitialized && jalRakshakMap) {

        setTimeout(() => {
            jalRakshakMap.invalidateSize();
        }, 200);

        return;
    }


    /*
     * Default center:
     * Pune region.
     *
     * This is only the initial map position.
     * Actual monitoring locations are loaded
     * from the backend.
     */

    jalRakshakMap =
        L.map("map", {
            center: [18.5204, 73.8567],
            zoom: 11
        });


    /*
     * OpenStreetMap tiles
     */

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(jalRakshakMap);


    mapInitialized = true;


    console.log(
        "JalRakshak Monitoring Map initialized."
    );


    /*
     * Load monitoring locations
     */

    loadMonitoringLocations();


    /*
     * Fix map rendering when page becomes visible.
     */

    setTimeout(() => {

        if (jalRakshakMap) {
            jalRakshakMap.invalidateSize();
        }

    }, 300);
}


/* =========================================================
   LOAD MONITORING LOCATIONS
   ========================================================= */

async function loadMonitoringLocations() {

    if (!jalRakshakMap) {
        return;
    }


    try {

        console.log(
            "Loading monitoring locations..."
        );


        const response =
            await fetch(
                MAP_API_BASE_URL + "/locations"
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load monitoring locations. HTTP " +
                response.status
            );
        }


        const locations =
            await response.json();


        console.log(
            "Monitoring locations received:",
            locations
        );


        if (!Array.isArray(locations) ||
            locations.length === 0) {

            console.warn(
                "No monitoring locations found."
            );

            showMapMessage(
                "No monitoring locations are available."
            );

            return;
        }


        /*
         * Load alerts as well.
         */

        let alerts = [];


        try {

            const alertResponse =
                await fetch(
                    MAP_API_BASE_URL + "/alerts"
                );


            if (alertResponse.ok) {

                alerts =
                    await alertResponse.json();

            }

        } catch (alertError) {

            console.warn(
                "Unable to load alerts for map markers:",
                alertError
            );

        }


        /*
         * Remove old markers before
         * drawing new ones.
         */

        clearMapMarkers();


        /*
         * Add location markers.
         */

        locations.forEach(
            location => {
                addMonitoringMarker(location, alerts);
            }
        );

        /* Automatically fit map to all displayed monitoring/reference sites. */
        fitMapToMarkers();


        console.log(
            locations.length +
            " monitoring locations displayed on map."
        );

    } catch (error) {

        console.error(
            "Monitoring map loading error:",
            error
        );


        // Fail closed: do not replace missing database data with a static catalogue.
        clearMapMarkers();
        showMapMessage(
            "Database monitoring locations could not load. No reference or generated locations are displayed."
        );

    }
}


/* =========================================================
   ADD MONITORING MARKER
   ========================================================= */

function addMonitoringMarker(
    location,
    alerts
) {

    /*
     * Support several possible backend
     * coordinate field names.
     */

    const latitude =
        Number(
            location.latitude ??
            location.lat ??
            location.locationLatitude
        );


    const longitude =
        Number(
            location.longitude ??
            location.lng ??
            location.locationLongitude
        );


    /*
     * Skip locations without valid
     * geographical coordinates.
     */

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        console.warn(
            "Skipping location because latitude/longitude " +
            "is missing:",
            location
        );

        return;
    }


    /*
     * Find alerts belonging to this location.
     */

    const locationAlerts =
        Array.isArray(alerts)
            ? alerts.filter(
                alert =>
                    String(
                        alert.locationId
                    ) ===
                    String(
                        location.locationId
                    )
            )
            : [];


    /*
     * Determine marker status.
     */

    const status =
        getLocationStatus(
            locationAlerts
        );


    /*
     * Create custom marker.
     */

    const markerIcon =
        createMapMarkerIcon(
            status
        );


    const marker =
        L.marker(
            [
                latitude,
                longitude
            ],
            {
                icon: markerIcon
            }
        );


    /*
     * Popup content.
     */

    const locationName =
        escapeMapHtml(
            location.locationName ||
            "Monitoring Location"
        );


    const city =
        escapeMapHtml(
            location.city ||
            "—"
        );


    const locationId =
        location.locationId ??
        "—";


    const statusLabel =
        status.label;


    const statusClass =
        status.className;


    marker.bindPopup(
        `
        <div class="monitoring-map-popup">

            <div class="map-popup-header">

                <div class="map-popup-icon ${statusClass}">
                    <i class="bi bi-geo-alt-fill"></i>
                </div>

                <div>
                    <h4>
                        ${locationName}
                    </h4>

                    <span>
                        Monitoring Point
                    </span>
                </div>

            </div>


            <div class="map-popup-details">

                <div class="map-popup-detail">

                    <span>
                        Location ID
                    </span>

                    <strong>
                        ${locationId}
                    </strong>

                </div>


                <div class="map-popup-detail">

                    <span>
                        City
                    </span>

                    <strong>
                        ${city}
                    </strong>

                </div>


                <div class="map-popup-detail">

                    <span>
                        Status
                    </span>

                    <strong class="${statusClass}">
                        ${statusLabel}
                    </strong>

                </div>


                <div class="map-popup-detail">

                    <span>
                        Active Alerts
                    </span>

                    <strong>
                        ${locationAlerts.length}
                    </strong>

                </div>

            </div>


            ${
                locationAlerts.length > 0
                    ? createAlertSummary(
                        locationAlerts
                    )
                    : `
                    <div class="map-popup-normal">
                        <i class="bi bi-check-circle-fill"></i>
                        No active alerts at this location.
                    </div>
                    `
            }

        </div>
        `
    );


    marker.addTo(
        jalRakshakMap
    );


    mapMarkers.push(
        marker
    );
}


/* =========================================================
   LOCATION STATUS
   ========================================================= */

function getLocationStatus(
    alerts
) {

    if (!alerts.length) {

        return {
            label: "NORMAL",
            className: "status-normal"
        };

    }


    const severities =
        alerts.map(
            alert =>
                String(
                    alert.severity || ""
                ).toUpperCase()
        );


    if (
        severities.includes("HIGH")
    ) {

        return {
            label: "HIGH ALERT",
            className: "status-high"
        };

    }


    if (
        severities.includes("MEDIUM")
    ) {

        return {
            label: "MEDIUM ALERT",
            className: "status-medium"
        };

    }


    return {
        label: "LOW ALERT",
        className: "status-low"
    };
}


/* =========================================================
   CREATE CUSTOM MAP MARKER
   ========================================================= */

function createMapMarkerIcon(
    status
) {

    let markerColor =
        "#198754";


    if (
        status.className ===
        "status-high"
    ) {

        markerColor =
            "#dc3545";

    } else if (
        status.className ===
        "status-medium"
    ) {

        markerColor =
            "#fd7e14";

    } else if (
        status.className ===
        "status-low"
    ) {

        markerColor =
            "#ffc107";
    }


    return L.divIcon({

        className:
            "jalrakshak-map-marker-wrapper",

        html:
            `
            <div
                class="jalrakshak-map-marker"
                style="--marker-color:${markerColor};"
            >
                <i class="bi bi-droplet-fill"></i>
            </div>
            `,

        iconSize: [
            40,
            40
        ],

        iconAnchor: [
            20,
            40
        ],

        popupAnchor: [
            0,
            -40
        ]

    });
}


/* =========================================================
   CREATE ALERT SUMMARY
   ========================================================= */

function createAlertSummary(
    alerts
) {

    const highestAlert =
        [...alerts].sort(
            (a, b) =>
                getSeverityRank(
                    b.severity
                ) -
                getSeverityRank(
                    a.severity
                )
        )[0];


    const severity =
        String(
            highestAlert.severity ||
            "UNKNOWN"
        ).toUpperCase();


    const message =
        highestAlert.message ||
        "Water quality anomaly detected.";


    return `
        <div class="map-popup-alert">

            <div class="map-popup-alert-title">

                <i class="bi bi-exclamation-triangle-fill"></i>

                <strong>
                    ${escapeMapHtml(
                        severity
                    )}
                    ALERT
                </strong>

            </div>

            <p>
                ${escapeMapHtml(
                    message
                )}
            </p>

        </div>
    `;
}


/* =========================================================
   SEVERITY RANK
   ========================================================= */

function getSeverityRank(
    severity
) {

    const value =
        String(
            severity || ""
        ).toUpperCase();


    if (value === "HIGH") {
        return 3;
    }


    if (value === "MEDIUM") {
        return 2;
    }


    if (value === "LOW") {
        return 1;
    }


    return 0;
}


/* =========================================================
   CLEAR MARKERS
   ========================================================= */

function clearMapMarkers() {

    mapMarkers.forEach(
        marker => {

            if (jalRakshakMap) {

                jalRakshakMap.removeLayer(
                    marker
                );

            }

        }
    );


    mapMarkers = [];
}


/* =========================================================
   FIT MAP TO MARKERS
   ========================================================= */

function fitMapToMarkers() {

    if (
        !jalRakshakMap ||
        mapMarkers.length === 0
    ) {
        return;
    }


    const markerGroup =
        L.featureGroup(
            mapMarkers
        );


    jalRakshakMap.fitBounds(
        markerGroup.getBounds(),
        {
            padding: [
                40,
                40
            ],
            maxZoom: 13
        }
    );
}


/* =========================================================
   MAP MESSAGE
   ========================================================= */

function showMapMessage(
    message
) {

    const mapContainer =
        document.getElementById(
            "map"
        );


    if (!mapContainer) {
        return;
    }


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        "map-message";


    messageElement.innerHTML =
        `
        <i class="bi bi-info-circle"></i>
        <span>
            ${escapeMapHtml(
                message
            )}
        </span>
        `;


    mapContainer.appendChild(
        messageElement
    );

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeMapHtml(
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


/* =========================================================
   MONITORING MAP NAVIGATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const mapNavigation =
            document.querySelector(
                '.nav-item[data-page="map"]'
            );


        if (mapNavigation) {

            mapNavigation.addEventListener(
                "click",
                () => {

                    setTimeout(
                        () => {

                            initializeMonitoringMap();

                        },
                        150
                    );

                }
            );

        }

    }
);


/* =========================================================
   GLOBAL MAP REFRESH
   ========================================================= */

window.refreshMonitoringMap =
    function () {

        if (!jalRakshakMap) {

            initializeMonitoringMap();

            return;
        }


        loadMonitoringLocations();

    };
// Compatibility alias: app.js navigates to the map using initializeMap().
window.initializeMap = initializeMonitoringMap;
