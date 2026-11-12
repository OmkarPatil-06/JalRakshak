package com.jalrakshak.backend.model;

public class DashboardStats {

    private long totalLocations;
    private long totalSensorReadings;
    private long totalAlerts;
    private long openAlerts;
    private long highSeverityAlerts;
    private long totalCitizenReports;
    private long pendingResponses;
    private long inProgressResponses;

    public DashboardStats() {
    }

    public DashboardStats(
            long totalLocations,
            long totalSensorReadings,
            long totalAlerts,
            long openAlerts,
            long highSeverityAlerts,
            long totalCitizenReports,
            long pendingResponses,
            long inProgressResponses) {

        this.totalLocations = totalLocations;
        this.totalSensorReadings = totalSensorReadings;
        this.totalAlerts = totalAlerts;
        this.openAlerts = openAlerts;
        this.highSeverityAlerts = highSeverityAlerts;
        this.totalCitizenReports = totalCitizenReports;
        this.pendingResponses = pendingResponses;
        this.inProgressResponses = inProgressResponses;
    }

    public long getTotalLocations() {
        return totalLocations;
    }

    public void setTotalLocations(long totalLocations) {
        this.totalLocations = totalLocations;
    }

    public long getTotalSensorReadings() {
        return totalSensorReadings;
    }

    public void setTotalSensorReadings(long totalSensorReadings) {
        this.totalSensorReadings = totalSensorReadings;
    }

    public long getTotalAlerts() {
        return totalAlerts;
    }

    public void setTotalAlerts(long totalAlerts) {
        this.totalAlerts = totalAlerts;
    }

    public long getOpenAlerts() {
        return openAlerts;
    }

    public void setOpenAlerts(long openAlerts) {
        this.openAlerts = openAlerts;
    }

    public long getHighSeverityAlerts() {
        return highSeverityAlerts;
    }

    public void setHighSeverityAlerts(long highSeverityAlerts) {
        this.highSeverityAlerts = highSeverityAlerts;
    }

    public long getTotalCitizenReports() {
        return totalCitizenReports;
    }

    public void setTotalCitizenReports(long totalCitizenReports) {
        this.totalCitizenReports = totalCitizenReports;
    }

    public long getPendingResponses() {
        return pendingResponses;
    }

    public void setPendingResponses(long pendingResponses) {
        this.pendingResponses = pendingResponses;
    }

    public long getInProgressResponses() {
        return inProgressResponses;
    }

    public void setInProgressResponses(long inProgressResponses) {
        this.inProgressResponses = inProgressResponses;
    }
}