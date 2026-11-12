package com.jalrakshak.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class DashboardStatsRepository {

    private final JdbcTemplate jdbcTemplate;

    public DashboardStatsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long getTotalLocations() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM locations",
                Long.class
        );
    }

    public long getTotalSensorReadings() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sensor_data " +
                "WHERE UPPER(COALESCE(verification_status, 'UNVERIFIED')) = 'VERIFIED' " +
                "AND TRIM(COALESCE(source_name, '')) <> '' " +
                "AND TRIM(COALESCE(source_url, '')) <> '' " +
                "AND TRIM(COALESCE(sample_method, '')) <> '' " +
                "AND TRIM(COALESCE(evidence_reference, '')) <> ''",
                Long.class
        );
    }

    public long getTotalAlerts() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM alerts",
                Long.class
        );
    }

    public long getOpenAlerts() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM alerts WHERE status = 'OPEN'",
                Long.class
        );
    }

    public long getHighSeverityAlerts() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM alerts WHERE severity = 'HIGH'",
                Long.class
        );
    }

    public long getTotalCitizenReports() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM citizen_reports",
                Long.class
        );
    }

    public long getPendingResponses() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM responses WHERE response_status = 'PENDING'",
                Long.class
        );
    }

    public long getInProgressResponses() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM responses WHERE response_status = 'IN_PROGRESS'",
                Long.class
        );
    }
}