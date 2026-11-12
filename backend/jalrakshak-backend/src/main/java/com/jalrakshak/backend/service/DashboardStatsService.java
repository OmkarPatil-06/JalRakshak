package com.jalrakshak.backend.service;

import com.jalrakshak.backend.model.DashboardStats;
import com.jalrakshak.backend.repository.DashboardStatsRepository;

import org.springframework.stereotype.Service;

@Service
public class DashboardStatsService {

    private final DashboardStatsRepository dashboardStatsRepository;

    public DashboardStatsService(DashboardStatsRepository dashboardStatsRepository) {
        this.dashboardStatsRepository = dashboardStatsRepository;
    }

    public DashboardStats getDashboardStats() {

        long totalLocations =
                dashboardStatsRepository.getTotalLocations();

        long totalSensorReadings =
                dashboardStatsRepository.getTotalSensorReadings();

        long totalAlerts =
                dashboardStatsRepository.getTotalAlerts();

        long openAlerts =
                dashboardStatsRepository.getOpenAlerts();

        long highSeverityAlerts =
                dashboardStatsRepository.getHighSeverityAlerts();

        long totalCitizenReports =
                dashboardStatsRepository.getTotalCitizenReports();

        long pendingResponses =
                dashboardStatsRepository.getPendingResponses();

        long inProgressResponses =
                dashboardStatsRepository.getInProgressResponses();

        return new DashboardStats(
                totalLocations,
                totalSensorReadings,
                totalAlerts,
                openAlerts,
                highSeverityAlerts,
                totalCitizenReports,
                pendingResponses,
                inProgressResponses
        );
    }
}