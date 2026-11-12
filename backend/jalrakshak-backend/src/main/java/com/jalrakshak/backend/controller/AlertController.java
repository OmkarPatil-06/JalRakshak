package com.jalrakshak.backend.controller;

import com.jalrakshak.backend.model.Alert;
import com.jalrakshak.backend.repository.AlertRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.jalrakshak.backend.repository.LocationRepository;
import com.jalrakshak.backend.repository.SensorDataRepository;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertRepository alertRepository;
    private final LocationRepository locationRepository;
    private final SensorDataRepository sensorDataRepository;

    public AlertController(AlertRepository alertRepository,
                           LocationRepository locationRepository,
                           SensorDataRepository sensorDataRepository) {
        this.alertRepository = alertRepository;
        this.locationRepository = locationRepository;
        this.sensorDataRepository = sensorDataRepository;
    }

    // Get all alerts
    @GetMapping
    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    // Get alerts by location
    @GetMapping("/location/{locationId}")
    public List<Alert> getAlertsByLocation(@PathVariable Long locationId) {
        return alertRepository.findByLocationId(locationId);
    }

    // Get alerts by status
    @GetMapping("/status/{status}")
    public List<Alert> getAlertsByStatus(@PathVariable String status) {
        return alertRepository.findByStatus(status);
    }

    // Get alerts by severity
    @GetMapping("/severity/{severity}")
    public List<Alert> getAlertsBySeverity(@PathVariable String severity) {
        return alertRepository.findBySeverity(severity);
    }

    // Get alert by ID
    @GetMapping("/{id}")
    public Alert getAlertById(@PathVariable Long id) {
        return alertRepository.findById(id).orElse(null);
    }

    // Create a new alert
    @PostMapping
    public Alert createAlert(@RequestBody Alert alert) {
        if (alert.getLocationId() == null ||
                !locationRepository.existsById(alert.getLocationId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Select a valid waterbody/monitoring location.");
        }

        if (alert.getSensorDataId() != null) {
            var reading = sensorDataRepository.findById(alert.getSensorDataId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "The selected sensor reading does not exist."));
            if (!alert.getLocationId().equals(reading.getLocationId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "The sensor reading must belong to the selected location.");
            }
        }

        if (alert.getAlertType() == null || alert.getAlertType().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Alert type is required.");
        }
        if (alert.getSeverity() == null || alert.getSeverity().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Severity is required.");
        }
        if (alert.getMessage() == null || alert.getMessage().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Alert description is required.");
        }
        if (alert.getPriorityScore() != null &&
                (alert.getPriorityScore() < 0 || alert.getPriorityScore() > 100)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Priority score must be between 0 and 100.");
        }

        alert.setDetectedAt(alert.getDetectedAt() == null
                ? LocalDateTime.now() : alert.getDetectedAt());
        alert.setStatus(alert.getStatus() == null || alert.getStatus().isBlank()
                ? "OPEN" : alert.getStatus().trim().toUpperCase());
        alert.setAlertType(alert.getAlertType().trim());
        alert.setSeverity(alert.getSeverity().trim().toUpperCase());
        alert.setMessage(alert.getMessage().trim());

        return alertRepository.save(alert);
    }

    // Update an existing alert
    @PutMapping("/{id}")
    public Alert updateAlert(@PathVariable Long id, @RequestBody Alert updatedAlert) {

        return alertRepository.findById(id)
                .map(alert -> {

                    alert.setSensorDataId(updatedAlert.getSensorDataId());
                    alert.setLocationId(updatedAlert.getLocationId());
                    alert.setAlertType(updatedAlert.getAlertType());
                    alert.setSeverity(updatedAlert.getSeverity());
                    alert.setPriorityScore(updatedAlert.getPriorityScore());
                    alert.setMessage(updatedAlert.getMessage());
                    alert.setDetectedAt(updatedAlert.getDetectedAt());
                    alert.setStatus(updatedAlert.getStatus());

                    return alertRepository.save(alert);
                })
                .orElse(null);
    }

    // Delete an alert
    @DeleteMapping("/{id}")
    public String deleteAlert(@PathVariable Long id) {

        if (alertRepository.existsById(id)) {
            alertRepository.deleteById(id);
            return "Alert deleted successfully.";
        }

        return "Alert not found.";
    }
}