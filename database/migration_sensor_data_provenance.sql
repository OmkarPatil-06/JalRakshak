/* JalRakshak migration: source and verification metadata for sensor observations.
   Run once against jalrakshak_db. Existing rows remain UNVERIFIED until an
   administrator records and checks their actual provenance.
*/
USE jalrakshak_db;

ALTER TABLE sensor_data
    ADD COLUMN source_name VARCHAR(200) NULL,
    ADD COLUMN source_url VARCHAR(1000) NULL,
    ADD COLUMN sample_method VARCHAR(200) NULL,
    ADD COLUMN verification_status VARCHAR(30) NULL DEFAULT 'UNVERIFIED',
    ADD COLUMN verified_by VARCHAR(150) NULL,
    ADD COLUMN verified_at DATETIME NULL,
    ADD COLUMN evidence_reference VARCHAR(500) NULL;

UPDATE sensor_data
SET verification_status = 'UNVERIFIED'
WHERE verification_status IS NULL OR TRIM(verification_status) = '';

/* Example only — replace values with details supported by the actual report.
UPDATE sensor_data
SET source_name = 'Name of official agency / accredited laboratory',
    source_url = 'https://official-source.example/report',
    sample_method = 'Method stated in the source report',
    verification_status = 'VERIFIED',
    verified_by = 'Administrator name',
    verified_at = CURRENT_TIMESTAMP,
    evidence_reference = 'Report number / page / sample ID'
WHERE sensor_data_id = 123;
*/
