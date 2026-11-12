package com.jalrakshak.backend.repository;

import com.jalrakshak.backend.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByLocationId(Long locationId);

    List<Alert> findByStatus(String status);

    List<Alert> findBySeverity(String severity);
}