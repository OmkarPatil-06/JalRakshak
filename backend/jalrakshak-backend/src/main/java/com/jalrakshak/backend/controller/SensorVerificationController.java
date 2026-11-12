package com.jalrakshak.backend.controller;

import com.jalrakshak.backend.model.SensorData;
import com.jalrakshak.backend.model.VerificationAudit;
import com.jalrakshak.backend.repository.SensorDataRepository;
import com.jalrakshak.backend.repository.VerificationAuditRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Database-backed provenance review for JalRakshak's direct-admin demonstration mode.
 * The main application has no login screen, so review actions are attributed to the
 * fixed application actor "Administrator (direct access)". Do not expose this API
 * publicly; production deployment must restore authenticated role-based authorization.
 */
@RestController
@RequestMapping("/api/sensor-data")
public class SensorVerificationController {
    private static final String DIRECT_ADMIN = "Administrator (direct access)";
    private final SensorDataRepository sensorRepository;
    private final VerificationAuditRepository auditRepository;

    public SensorVerificationController(SensorDataRepository sensorRepository,
                                        VerificationAuditRepository auditRepository) {
        this.sensorRepository = sensorRepository;
        this.auditRepository = auditRepository;
    }

    public record ReviewRequest(String status, String sourceName, String sourceUrl,
                                String sampleMethod, String evidenceReference, String reviewNotes) {}

    @GetMapping("/{id}/verification-audit")
    public ResponseEntity<?> audit(@PathVariable Long id) {
        if (!sensorRepository.existsById(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(auditRepository.findBySensorDataIdOrderByReviewedAtDesc(id));
    }

    @PutMapping("/{id}/verification")
    @Transactional
    public ResponseEntity<?> review(@PathVariable Long id, @RequestBody(required = false) ReviewRequest request) {
        if (request == null) return bad("Review details are required.");
        String status = normalize(request.status());
        if (!status.equals("VERIFIED") && !status.equals("REJECTED"))
            return bad("Status must be VERIFIED or REJECTED.");
        if (blank(request.sourceName()) || blank(request.sourceUrl()) || blank(request.sampleMethod()) || blank(request.evidenceReference()))
            return bad("Source name, source URL, sample method and evidence reference are required.");
        try {
            URI uri = URI.create(request.sourceUrl().trim());
            if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) || uri.getHost() == null)
                throw new IllegalArgumentException();
        } catch (Exception ex) {
            return bad("Enter a valid http or https source URL.");
        }

        SensorData record = sensorRepository.findById(id).orElse(null);
        if (record == null) return ResponseEntity.notFound().build();

        record.setSourceName(request.sourceName().trim());
        record.setSourceUrl(request.sourceUrl().trim());
        record.setSampleMethod(request.sampleMethod().trim());
        record.setEvidenceReference(request.evidenceReference().trim());
        record.setVerificationStatus(status);
        record.setVerifiedBy(DIRECT_ADMIN);
        record.setVerifiedAt(LocalDateTime.now());
        sensorRepository.save(record);

        VerificationAudit audit = new VerificationAudit();
        audit.setSensorDataId(id);
        audit.setActionStatus(status);
        audit.setReviewedBy(DIRECT_ADMIN);
        audit.setReviewerUserId(null);
        audit.setReviewedAt(LocalDateTime.now());
        audit.setSourceName(record.getSourceName());
        audit.setSourceUrl(record.getSourceUrl());
        audit.setSampleMethod(record.getSampleMethod());
        audit.setEvidenceReference(record.getEvidenceReference());
        audit.setReviewNotes(trimToNull(request.reviewNotes()));
        auditRepository.save(audit);

        return ResponseEntity.ok(Map.of(
                "message", status.equals("VERIFIED")
                        ? "Database record marked VERIFIED; source metadata and audit history saved."
                        : "Database record marked REJECTED; source metadata and audit history saved.",
                "record", record,
                "audit", audit));
    }

    private ResponseEntity<Map<String, String>> bad(String message) {
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
    private boolean blank(String value) { return value == null || value.isBlank(); }
    private String trimToNull(String value) { return blank(value) ? null : value.trim(); }
    private String normalize(String value) { return value == null ? "" : value.trim().toUpperCase(Locale.ROOT); }
}
