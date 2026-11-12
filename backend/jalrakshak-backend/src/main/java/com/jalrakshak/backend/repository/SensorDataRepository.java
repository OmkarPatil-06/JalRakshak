package com.jalrakshak.backend.repository;

import com.jalrakshak.backend.model.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SensorDataRepository extends JpaRepository<SensorData, Long> {

    List<SensorData> findByLocationId(Long locationId);

    List<SensorData> findByVerificationStatusIgnoreCaseOrderByRecordedAtDesc(String verificationStatus);

    List<SensorData> findByLocationIdAndVerificationStatusIgnoreCaseOrderByRecordedAtAsc(
            Long locationId, String verificationStatus);
}