package com.jalrakshak.backend.repository;

import com.jalrakshak.backend.model.CitizenReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CitizenReportRepository extends JpaRepository<CitizenReport, Long> {

    List<CitizenReport> findByUserId(Long userId);

    List<CitizenReport> findByLocationId(Long locationId);

    List<CitizenReport> findByStatus(String status);

    List<CitizenReport> findByPriority(String priority);
}