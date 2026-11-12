package com.jalrakshak.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_data")
public class SensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sensor_data_id")
    private Long sensorDataId;

    @Column(name = "location_id", nullable = false)
    private Long locationId;

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;

    @Column(name = "ph")
    private Double ph;

    @Column(name = "tds")
    private Double tds;

    @Column(name = "turbidity")
    private Double turbidity;

    @Column(name = "dissolved_oxygen")
    private Double dissolvedOxygen;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "conductivity")
    private Double conductivity;

    @Column(name = "bod")
    private Double bod;

    @Column(name = "cod")
    private Double cod;

    // Provenance fields: blank metadata is intentionally treated as unverified.
    @Column(name = "source_name", length = 200)
    private String sourceName;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "sample_method", length = 200)
    private String sampleMethod;

    @Column(name = "verification_status", length = 30)
    private String verificationStatus;

    @Column(name = "verified_by", length = 150)
    private String verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "evidence_reference", length = 500)
    private String evidenceReference;

    public SensorData() {
    }

    public Long getSensorDataId() {
        return sensorDataId;
    }

    public void setSensorDataId(Long sensorDataId) {
        this.sensorDataId = sensorDataId;
    }

    public Long getLocationId() {
        return locationId;
    }

    public void setLocationId(Long locationId) {
        this.locationId = locationId;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }

    public Double getPh() {
        return ph;
    }

    public void setPh(Double ph) {
        this.ph = ph;
    }

    public Double getTds() {
        return tds;
    }

    public void setTds(Double tds) {
        this.tds = tds;
    }

    public Double getTurbidity() {
        return turbidity;
    }

    public void setTurbidity(Double turbidity) {
        this.turbidity = turbidity;
    }

    public Double getDissolvedOxygen() {
        return dissolvedOxygen;
    }

    public void setDissolvedOxygen(Double dissolvedOxygen) {
        this.dissolvedOxygen = dissolvedOxygen;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getConductivity() {
        return conductivity;
    }

    public void setConductivity(Double conductivity) {
        this.conductivity = conductivity;
    }

    public Double getBod() {
        return bod;
    }

    public void setBod(Double bod) {
        this.bod = bod;
    }

    public Double getCod() {
        return cod;
    }

    public void setCod(Double cod) {
        this.cod = cod;
    }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public String getSampleMethod() { return sampleMethod; }
    public void setSampleMethod(String sampleMethod) { this.sampleMethod = sampleMethod; }
    public String getVerificationStatus() { return verificationStatus == null || verificationStatus.isBlank() ? "UNVERIFIED" : verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
    public String getEvidenceReference() { return evidenceReference; }
    public void setEvidenceReference(String evidenceReference) { this.evidenceReference = evidenceReference; }
}