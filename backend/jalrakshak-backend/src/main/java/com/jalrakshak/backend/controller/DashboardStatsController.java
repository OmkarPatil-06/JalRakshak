package com.jalrakshak.backend.controller;

import com.jalrakshak.backend.model.DashboardStats;
import com.jalrakshak.backend.service.DashboardStatsService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardStatsController {

    private final DashboardStatsService dashboardStatsService;

    public DashboardStatsController(DashboardStatsService dashboardStatsService) {
        this.dashboardStatsService = dashboardStatsService;
    }

    @GetMapping("/stats")
    public DashboardStats getDashboardStats() {
        return dashboardStatsService.getDashboardStats();
    }
}