package com.jalrakshak.backend.controller;

import com.jalrakshak.backend.model.Alert;
import com.jalrakshak.backend.model.Response;
import com.jalrakshak.backend.repository.AlertRepository;
import com.jalrakshak.backend.repository.ResponseRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/responses")
public class ResponseController {

    private static final Set<String> VALID_STATUSES =
            Set.of("PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED");

    private final ResponseRepository responseRepository;
    private final AlertRepository alertRepository;

    public ResponseController(ResponseRepository responseRepository,
                              AlertRepository alertRepository) {
        this.responseRepository = responseRepository;
        this.alertRepository = alertRepository;
    }

    @GetMapping
    public List<Response> getAllResponses() {
        return responseRepository.findAll();
    }

    @GetMapping("/{id}")
    public Response getResponseById(@PathVariable Long id) {
        return responseRepository.findById(id).orElse(null);
    }

    @GetMapping("/alert/{alertId}")
    public List<Response> getResponsesByAlert(@PathVariable Long alertId) {
        return responseRepository.findByAlertId(alertId);
    }

    @GetMapping("/user/{userId}")
    public List<Response> getResponsesByUser(@PathVariable Long userId) {
        return responseRepository.findByUserId(userId);
    }

    @GetMapping("/status/{status}")
    public List<Response> getResponsesByStatus(@PathVariable String status) {
        return responseRepository.findByResponseStatus(status);
    }

    /** Creates a response for an OPEN alert and synchronizes its status. */
    @PostMapping
    @Transactional
    public Response createResponse(@RequestBody Response response) {
        if (response.getAlertId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select an alert for this response.");
        }

        Alert alert = alertRepository.findById(response.getAlertId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "The selected alert does not exist."));

        if (!"OPEN".equalsIgnoreCase(safe(alert.getStatus()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A response can only be created for an OPEN alert.");
        }
        if (response.getActionTaken() == null || response.getActionTaken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Action taken is required.");
        }

        String status = normalizeResponseStatus(response.getResponseStatus());
        response.setResponseStatus(status);
        response.setActionTaken(response.getActionTaken().trim());
        response.setAssignedAt(response.getAssignedAt() == null ? LocalDateTime.now() : response.getAssignedAt());
        response.setCompletedAt("COMPLETED".equals(status)
                ? (response.getCompletedAt() == null ? LocalDateTime.now() : response.getCompletedAt())
                : null);

        Response saved = responseRepository.save(response);
        synchronizeAlertStatus(alert);
        return saved;
    }

    /** Updating a response to COMPLETED resolves its alert. Reverting the last
     * completed response reopens the alert. The alert link itself is immutable. */
    @PutMapping("/{id}")
    @Transactional
    public Response updateResponse(@PathVariable Long id, @RequestBody Response updatedResponse) {
        Response response = responseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Response not found."));
        Alert alert = alertRepository.findById(response.getAlertId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "The alert linked to this response was not found."));

        if (updatedResponse.getActionTaken() == null || updatedResponse.getActionTaken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Action taken is required.");
        }

        String status = normalizeResponseStatus(updatedResponse.getResponseStatus());
        response.setUserId(updatedResponse.getUserId());
        response.setActionTaken(updatedResponse.getActionTaken().trim());
        response.setResponseNotes(updatedResponse.getResponseNotes());
        response.setResponseStatus(status);
        response.setCompletedAt("COMPLETED".equals(status)
                ? (updatedResponse.getCompletedAt() == null ? LocalDateTime.now() : updatedResponse.getCompletedAt())
                : null);

        Response saved = responseRepository.save(response);
        synchronizeAlertStatus(alert);
        return saved;
    }

    private void synchronizeAlertStatus(Alert alert) {
        boolean hasCompletedResponse = responseRepository.findByAlertId(alert.getAlertId()).stream()
                .anyMatch(item -> "COMPLETED".equalsIgnoreCase(safe(item.getResponseStatus())));
        alert.setStatus(hasCompletedResponse ? "RESOLVED" : "OPEN");
        alertRepository.save(alert);
    }

    private String normalizeResponseStatus(String status) {
        String normalized = status == null || status.isBlank()
                ? "PENDING" : status.trim().toUpperCase().replace('-', '_').replace(' ', '_');
        if (!VALID_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid response status. Use PENDING, IN_PROGRESS, COMPLETED, or CANCELLED.");
        }
        return normalized;
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    @DeleteMapping("/{id}")
    @Transactional
    public String deleteResponse(@PathVariable Long id) {
        Response response = responseRepository.findById(id).orElse(null);
        if (response == null) return "Response not found.";
        Long alertId = response.getAlertId();
        responseRepository.delete(response);
        alertRepository.findById(alertId).ifPresent(this::synchronizeAlertStatus);
        return "Response deleted successfully.";
    }
}
