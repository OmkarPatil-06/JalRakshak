package com.jalrakshak.backend.controller;

import com.jalrakshak.backend.model.CitizenReport;
import com.jalrakshak.backend.repository.CitizenReportRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/citizen-reports")
public class CitizenReportController {

    private final CitizenReportRepository citizenReportRepository;

    public CitizenReportController(CitizenReportRepository citizenReportRepository) {
        this.citizenReportRepository = citizenReportRepository;
    }

    // Get all citizen reports
    @GetMapping
    public List<CitizenReport> getAllReports() {
        return citizenReportRepository.findAll();
    }

    // Get report by ID
    @GetMapping("/{id}")
    public CitizenReport getReportById(@PathVariable Long id) {
        return citizenReportRepository.findById(id).orElse(null);
    }

    // Get reports submitted by a particular citizen
    @GetMapping("/user/{userId}")
    public List<CitizenReport> getReportsByUser(@PathVariable Long userId) {
        return citizenReportRepository.findByUserId(userId);
    }

    // Get reports for a particular location
    @GetMapping("/location/{locationId}")
    public List<CitizenReport> getReportsByLocation(@PathVariable Long locationId) {
        return citizenReportRepository.findByLocationId(locationId);
    }

    // Get reports by status
    @GetMapping("/status/{status}")
    public List<CitizenReport> getReportsByStatus(@PathVariable String status) {
        return citizenReportRepository.findByStatus(status);
    }

    // Get reports by priority
    @GetMapping("/priority/{priority}")
    public List<CitizenReport> getReportsByPriority(@PathVariable String priority) {
        return citizenReportRepository.findByPriority(priority);
    }

    // Create a new citizen report
    @PostMapping
    public CitizenReport createReport(@RequestBody CitizenReport report) {
        return citizenReportRepository.save(report);
    }

    // Update an existing citizen report
    @PutMapping("/{id}")
    public CitizenReport updateReport(
            @PathVariable Long id,
            @RequestBody CitizenReport updatedReport) {

        return citizenReportRepository.findById(id)
                .map(report -> {

                    report.setUserId(updatedReport.getUserId());
                    report.setLocationId(updatedReport.getLocationId());
                    report.setReportType(updatedReport.getReportType());
                    report.setDescription(updatedReport.getDescription());
                    report.setLatitude(updatedReport.getLatitude());
                    report.setLongitude(updatedReport.getLongitude());
                    report.setStatus(updatedReport.getStatus());
                    report.setPriority(updatedReport.getPriority());
                    report.setReportedAt(updatedReport.getReportedAt());
                    report.setResolvedAt(updatedReport.getResolvedAt());

                    return citizenReportRepository.save(report);
                })
                .orElse(null);
    }

    // Delete a citizen report
    @DeleteMapping("/{id}")
    public String deleteReport(@PathVariable Long id) {

        if (citizenReportRepository.existsById(id)) {
            citizenReportRepository.deleteById(id);
            return "Citizen report deleted successfully.";
        }

        return "Citizen report not found.";
    }
}