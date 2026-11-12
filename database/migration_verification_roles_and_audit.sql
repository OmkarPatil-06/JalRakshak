USE jalrakshak_db;

-- Ensure old sensor rows are explicitly unverified until reviewed.
UPDATE sensor_data
SET verification_status = 'UNVERIFIED'
WHERE verification_status IS NULL OR TRIM(verification_status) = '';

-- Audit trail for each approval/rejection. Existing sensor provenance columns
-- are already added by migration_sensor_data_provenance.sql.
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
    CONSTRAINT fk_verification_audit_sensor
        FOREIGN KEY (sensor_data_id) REFERENCES sensor_data(sensor_data_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_verification_audit_user
        FOREIGN KEY (reviewer_user_id) REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- Admins can assign DATA_VERIFIER to an existing account through the website.
-- Do not promote an account with this SQL unless you have confirmed its owner.
-- Example (replace with a real user ID after checking the users table):
-- UPDATE users SET role = 'DATA_VERIFIER' WHERE user_id = 123;
