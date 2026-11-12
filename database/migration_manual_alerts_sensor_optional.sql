-- Required migration for manual alerts at waterbodies without sensor readings.
-- Back up jalrakshak_db before running.
USE jalrakshak_db;
ALTER TABLE alerts MODIFY COLUMN sensor_data_id BIGINT NULL;

-- Optional verification:
SHOW COLUMNS FROM alerts LIKE 'sensor_data_id';
