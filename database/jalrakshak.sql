CREATE DATABASE IF NOT EXISTS jalrakshak_db;

USE jalrakshak_db;

CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DESCRIBE users;

CREATE TABLE locations (
    location_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    location_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    water_source_type VARCHAR(50),
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DESCRIBE locations;

USE jalrakshak_db;

CREATE TABLE sensor_data (
    sensor_data_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    location_id BIGINT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    ph DECIMAL(5,2),
    tds DECIMAL(10,2),
    turbidity DECIMAL(10,2),
    dissolved_oxygen DECIMAL(10,2),
    temperature DECIMAL(6,2),
    conductivity DECIMAL(10,2),
    bod DECIMAL(10,2),
    cod DECIMAL(10,2),

    source_name VARCHAR(200),
    source_url VARCHAR(1000),
    sample_method VARCHAR(200),
    verification_status VARCHAR(30) DEFAULT 'UNVERIFIED',
    verified_by VARCHAR(150),
    verified_at DATETIME,
    evidence_reference VARCHAR(500),

    CONSTRAINT fk_sensor_location
        FOREIGN KEY (location_id)
        REFERENCES locations(location_id)
);

DESCRIBE sensor_data;


CREATE TABLE alerts (
    alert_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sensor_data_id BIGINT NULL,
    location_id BIGINT NOT NULL,

    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(30) NOT NULL,
    priority_score DECIMAL(5,2),

    message VARCHAR(500),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'OPEN',

    CONSTRAINT fk_alert_sensor
        FOREIGN KEY (sensor_data_id)
        REFERENCES sensor_data(sensor_data_id),

    CONSTRAINT fk_alert_location
        FOREIGN KEY (location_id)
        REFERENCES locations(location_id)
);

DESCRIBE alerts;


CREATE TABLE responses (
    response_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_id BIGINT NOT NULL,
    user_id BIGINT,
    
    action_taken VARCHAR(255) NOT NULL,
    response_notes VARCHAR(500),
    response_status VARCHAR(30) DEFAULT 'PENDING',
    
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    CONSTRAINT fk_response_alert
        FOREIGN KEY (alert_id)
        REFERENCES alerts(alert_id),

    CONSTRAINT fk_response_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

DESCRIBE responses;


CREATE TABLE citizen_reports (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    location_id BIGINT,

    report_type VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NOT NULL,

    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),

    status VARCHAR(30) DEFAULT 'SUBMITTED',
    priority VARCHAR(30) DEFAULT 'NORMAL',

    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,

    CONSTRAINT fk_report_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_report_location
        FOREIGN KEY (location_id)
        REFERENCES locations(location_id)
);

DESCRIBE citizen_reports;



INSERT INTO users
(full_name, email, password, role, phone)
VALUES
('Admin User', 'admin@jalrakshak.com', 'DISABLED_NO_LOGIN', 'ADMIN', '9876543210'),
('Water Officer', 'officer@jalrakshak.com', 'DISABLED_NO_LOGIN', 'OFFICER', '9876543211'),
('Rahul Sharma', 'rahul@gmail.com', 'DISABLED_NO_LOGIN', 'CITIZEN', '9876543212'),
('Priya Patil', 'priya@gmail.com', 'DISABLED_NO_LOGIN', 'CITIZEN', '9876543213');

SELECT * FROM users;


INSERT INTO locations
(location_name, city, state, latitude, longitude, water_source_type, description)
VALUES
('Mula-Mutha River Monitoring Point', 'Pune', 'Maharashtra',
 18.5204, 73.8567, 'RIVER',
 'Water quality monitoring point near Mula-Mutha River'),

('Pashan Lake Monitoring Point', 'Pune', 'Maharashtra',
 18.5380, 73.7960, 'LAKE',
 'Water quality monitoring point near Pashan Lake'),

('Pavana River Monitoring Point', 'Pimpri-Chinchwad', 'Maharashtra',
 18.6298, 73.7997, 'RIVER',
 'Water quality monitoring point near Pavana River'),

('Godavari River Monitoring Point', 'Nashik', 'Maharashtra',
 19.9975, 73.7898, 'RIVER',
 'Water quality monitoring point near Godavari River');

SELECT * FROM locations;



-- No demo sensor_data rows are seeded. Import actual records with source provenance and verify them before display.




-- No demo alerts rows are seeded. Import actual records with source provenance and verify them before display.




-- No demo responses rows are seeded. Import actual records with source provenance and verify them before display.




INSERT INTO citizen_reports
(user_id, location_id, report_type, description,
 latitude, longitude, status, priority)
VALUES

(3, 1,
 'Polluted Water',
 'Water appears unusually dark near the river bank.',
 18.5204000, 73.8567000,
 'SUBMITTED', 'HIGH'),

(4, 2,
 'Unusual Water Color',
 'The water appears different in color compared with previous observations.',
 18.5380000, 73.7960000,
 'UNDER_REVIEW', 'NORMAL'),

(3, 3,
 'Bad Water Smell',
 'An unusual smell was noticed near the water source.',
 18.6298000, 73.7997000,
 'SUBMITTED', 'NORMAL');

SELECT * FROM citizen_reports;



/*--------------------------------------------------------------10/10/2026----------------------------------*/

-- Authentication is disabled in this direct-administrator build; no login passwords or password hashes are seeded.

-- Audit history for Administrator / Data Verifier decisions.
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
    CONSTRAINT fk_verification_audit_sensor FOREIGN KEY (sensor_data_id) REFERENCES sensor_data(sensor_data_id) ON DELETE CASCADE,
    CONSTRAINT fk_verification_audit_user FOREIGN KEY (reviewer_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
