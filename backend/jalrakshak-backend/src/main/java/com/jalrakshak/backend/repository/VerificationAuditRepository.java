package com.jalrakshak.backend.repository;
import com.jalrakshak.backend.model.VerificationAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface VerificationAuditRepository extends JpaRepository<VerificationAudit, Long> {
    List<VerificationAudit> findBySensorDataIdOrderByReviewedAtDesc(Long sensorDataId);
}
