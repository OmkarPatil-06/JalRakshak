/* Run this script once (or safely again) against jalrakshak_db.
   It does NOT create or insert synthetic sensor measurements.
   It preserves existing database observations and marks blank statuses UNVERIFIED.
   Source/provenance columns are added by migration_sensor_data_provenance.sql.
*/
USE jalrakshak_db;

UPDATE sensor_data
SET verification_status = 'UNVERIFIED'
WHERE verification_status IS NULL OR TRIM(verification_status) = '';

CREATE TABLE IF NOT EXISTS sensor_verification_audit (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sensor_data_id BIGINT NOT NULL,
    action_status VARCHAR(30) NOT NULL,
    reviewed_by VARCHAR(150) NOT NULL,
    reviewer_user_id BIGINT NULL,
    reviewed_at DATETIME NOT NULL,
    source_name VARCHAR(200),
    source_url VARCHAR(1000),
    sample_method VARCHAR(200),
    evidence_reference VARCHAR(500),
    review_notes VARCHAR(1000),
    INDEX idx_verification_audit_sensor_date (sensor_data_id, reviewed_at),
    CONSTRAINT fk_direct_admin_audit_sensor
        FOREIGN KEY (sensor_data_id) REFERENCES sensor_data(sensor_data_id)
        ON DELETE CASCADE
);
