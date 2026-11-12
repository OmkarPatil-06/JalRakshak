package com.jalrakshak.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public String healthCheck() {
        return """
                {
                    "status": "UP",
                    "message": "JalRakshak Backend is running successfully!"
                }
                """;
    }
}