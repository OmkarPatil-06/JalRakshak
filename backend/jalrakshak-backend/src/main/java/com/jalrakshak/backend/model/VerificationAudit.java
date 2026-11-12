package com.jalrakshak.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_verification_audit")
public class VerificationAudit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long auditId;
    @Column(name = "sensor_data_id", nullable = false)
    private Long sensorDataId;
    @Column(name = "action_status", nullable = false, length = 30)
    private String actionStatus;
    @Column(name = "reviewed_by", nullable = false, length = 150)
    private String reviewedBy;
    @Column(name = "reviewer_user_id")
    private Long reviewerUserId;
    @Column(name = "reviewed_at", nullable = false)
    private LocalDateTime reviewedAt;
    @Column(name = "source_name", length = 200)
    private String sourceName;
    @Column(name = "source_url", length = 1000)
    private String sourceUrl;
    @Column(name = "sample_method", length = 200)
    private String sampleMethod;
    @Column(name = "evidence_reference", length = 500)
    private String evidenceReference;
    @Column(name = "review_notes", length = 1000)
    private String reviewNotes;
    public VerificationAudit() {}
    public Long getAuditId(){return auditId;} public Long getSensorDataId(){return sensorDataId;} public void setSensorDataId(Long v){sensorDataId=v;}
    public String getActionStatus(){return actionStatus;} public void setActionStatus(String v){actionStatus=v;}
    public String getReviewedBy(){return reviewedBy;} public void setReviewedBy(String v){reviewedBy=v;}
    public Long getReviewerUserId(){return reviewerUserId;} public void setReviewerUserId(Long v){reviewerUserId=v;}
    public LocalDateTime getReviewedAt(){return reviewedAt;} public void setReviewedAt(LocalDateTime v){reviewedAt=v;}
    public String getSourceName(){return sourceName;} public void setSourceName(String v){sourceName=v;}
    public String getSourceUrl(){return sourceUrl;} public void setSourceUrl(String v){sourceUrl=v;}
    public String getSampleMethod(){return sampleMethod;} public void setSampleMethod(String v){sampleMethod=v;}
    public String getEvidenceReference(){return evidenceReference;} public void setEvidenceReference(String v){evidenceReference=v;}
    public String getReviewNotes(){return reviewNotes;} public void setReviewNotes(String v){reviewNotes=v;}
}
