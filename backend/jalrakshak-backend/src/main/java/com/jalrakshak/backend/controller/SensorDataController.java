package com.jalrakshak.backend.controller;

import com.jalrakshak.backend.model.SensorData;
import com.jalrakshak.backend.repository.SensorDataRepository;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.net.URI;

@RestController
@RequestMapping("/api/sensor-data")
public class SensorDataController {

    private final SensorDataRepository sensorDataRepository;

    public SensorDataController(SensorDataRepository sensorDataRepository) {
        this.sensorDataRepository = sensorDataRepository;
    }

    @GetMapping
    public List<SensorData> getAllSensorData() {
        return sensorDataRepository.findAll();
    }

    @GetMapping("/location/{locationId}")
    public List<SensorData> getSensorDataByLocation(
            @PathVariable Long locationId) {
        return sensorDataRepository.findByLocationId(locationId);
    }

    /**
     * Public intelligence views must use only observations that have passed
     * the administrator's provenance review. Unverified/demo rows remain
     * available to the verification queue through GET /api/sensor-data.
     */
    @GetMapping("/verified")
    public List<SensorData> getVerifiedSensorData() {
        return sensorDataRepository.findByVerificationStatusIgnoreCaseOrderByRecordedAtDesc("VERIFIED")
                .stream()
                .filter(this::hasCompleteProvenance)
                .toList();
    }

    @GetMapping("/location/{locationId}/verified")
    public List<SensorData> getVerifiedSensorDataByLocation(@PathVariable Long locationId) {
        return sensorDataRepository
                .findByLocationIdAndVerificationStatusIgnoreCaseOrderByRecordedAtAsc(locationId, "VERIFIED")
                .stream()
                .filter(this::hasCompleteProvenance)
                .toList();
    }

    private boolean hasCompleteProvenance(SensorData record) {
        if (record.getRecordedAt() == null
                || record.getSourceName() == null || record.getSourceName().isBlank()
                || record.getSourceUrl() == null || record.getSourceUrl().isBlank()
                || record.getSampleMethod() == null || record.getSampleMethod().isBlank()
                || record.getEvidenceReference() == null || record.getEvidenceReference().isBlank()) {
            return false;
        }
        try {
            URI uri = URI.create(record.getSourceUrl().trim());
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null;
        } catch (Exception ignored) {
            return false;
        }
    }
}