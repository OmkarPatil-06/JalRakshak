-- JalRakshak operations/report queries (MySQL 8+)
USE jalrakshak_db;

-- 1. All waterbody reference locations with independent record counts.
-- Correlated subqueries prevent join fan-out from inflating totals.
SELECT l.location_id, l.location_name, l.city, l.state, l.water_source_type,
       (SELECT COUNT(*) FROM sensor_data s WHERE s.location_id=l.location_id) AS water_quality_readings,
       (SELECT COUNT(*) FROM alerts a WHERE a.location_id=l.location_id) AS alerts,
       (SELECT COUNT(*) FROM responses r JOIN alerts a ON a.alert_id=r.alert_id
          WHERE a.location_id=l.location_id) AS responses,
       (SELECT COUNT(*) FROM citizen_reports cr WHERE cr.location_id=l.location_id) AS citizen_reports
FROM locations l
ORDER BY l.state, l.location_name;

-- 2. Latest water-quality reading for every waterbody (including no-reading rows).
SELECT l.location_id, l.location_name, l.city, l.state, s.recorded_at,
       s.ph, s.tds, s.turbidity, s.dissolved_oxygen,
       s.temperature, s.conductivity, s.bod, s.cod
FROM locations l
LEFT JOIN sensor_data s ON s.sensor_data_id = (
  SELECT s2.sensor_data_id FROM sensor_data s2
  WHERE s2.location_id = l.location_id
  ORDER BY s2.recorded_at DESC, s2.sensor_data_id DESC LIMIT 1
)
ORDER BY l.state, l.location_name;

-- 3. Alert summary by waterbody, including zero-alert waterbodies.
SELECT l.location_id, l.location_name,
       COUNT(a.alert_id) AS total_alerts,
       SUM(CASE WHEN UPPER(a.status)='OPEN' THEN 1 ELSE 0 END) AS open_alerts,
       SUM(CASE WHEN UPPER(a.status)='RESOLVED' THEN 1 ELSE 0 END) AS resolved_alerts
FROM locations l
LEFT JOIN alerts a ON a.location_id=l.location_id
GROUP BY l.location_id, l.location_name
ORDER BY l.location_name;

-- 4. Response summary by waterbody, including zero-response waterbodies.
SELECT l.location_id, l.location_name,
       COUNT(r.response_id) AS total_responses,
       SUM(CASE WHEN UPPER(r.response_status)='PENDING' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN UPPER(r.response_status)='IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
       SUM(CASE WHEN UPPER(r.response_status)='COMPLETED' THEN 1 ELSE 0 END) AS completed
FROM locations l
LEFT JOIN alerts a ON a.location_id=l.location_id
LEFT JOIN responses r ON r.alert_id=a.alert_id
GROUP BY l.location_id, l.location_name
ORDER BY l.location_name;

-- 5. Citizen report summary by waterbody, including zero-report waterbodies.
SELECT l.location_id, l.location_name,
       COUNT(cr.report_id) AS total_citizen_reports,
       SUM(CASE WHEN UPPER(cr.status)='SUBMITTED' THEN 1 ELSE 0 END) AS submitted,
       SUM(CASE WHEN UPPER(cr.status)='UNDER_REVIEW' THEN 1 ELSE 0 END) AS under_review,
       SUM(CASE WHEN UPPER(cr.status)='RESOLVED' THEN 1 ELSE 0 END) AS resolved
FROM locations l
LEFT JOIN citizen_reports cr ON cr.location_id=l.location_id
GROUP BY l.location_id, l.location_name
ORDER BY l.location_name;

-- 6. Recent alert records for a selected location (replace ? with location_id).
SELECT * FROM alerts WHERE location_id=? ORDER BY detected_at DESC;

-- 7. Recent response records for a selected location (replace ? with location_id).
SELECT r.* FROM responses r
JOIN alerts a ON a.alert_id=r.alert_id
WHERE a.location_id=? ORDER BY r.assigned_at DESC;

-- 8. Recent citizen observations for a selected location (replace ? with location_id).
SELECT * FROM citizen_reports WHERE location_id=? ORDER BY reported_at DESC;
