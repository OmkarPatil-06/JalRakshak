-- JalRakshak 51-waterbody location catalogue seed (MySQL 8+)
-- Inserts reference metadata only. Does NOT fabricate sensor readings, alerts, responses, or citizen reports.
USE jalrakshak_db;

UPDATE locations SET location_name='Mula-Mutha River', city='Pune', state='Maharashtra', latitude=18.5204, longitude=73.8567, water_source_type='RIVER', description='Urban sewage and mixed municipal discharge' WHERE location_name='Mula-Mutha River Monitoring Point';
UPDATE locations SET location_name='Pashan Lake', city='Pune', state='Maharashtra', latitude=18.538, longitude=73.796, water_source_type='LAKE', description='Urban runoff, nutrient enrichment and seasonal algal growth' WHERE location_name='Pashan Lake Monitoring Point';
UPDATE locations SET location_name='Pavana River', city='Pimpri-Chinchwad', state='Maharashtra', latitude=18.6298, longitude=73.7997, water_source_type='RIVER', description='Urban discharge and catchment runoff' WHERE location_name='Pavana River Monitoring Point';
UPDATE locations SET location_name='Godavari River – Ramkund', city='Nashik', state='Maharashtra', latitude=20.006, longitude=73.79, water_source_type='RIVER', description='High bathing load, sewage inputs and festival-related waste' WHERE location_name='Godavari River Monitoring Point';

INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Mula-Mutha River', 'Pune', 'Maharashtra', 18.5204, 73.8567, 'RIVER', 'Urban sewage and mixed municipal discharge'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Mula-Mutha River');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Pashan Lake', 'Pune', 'Maharashtra', 18.538, 73.796, 'LAKE', 'Urban runoff, nutrient enrichment and seasonal algal growth'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Pashan Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Pavana River', 'Pimpri-Chinchwad', 'Maharashtra', 18.6298, 73.7997, 'RIVER', 'Urban discharge and catchment runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Pavana River');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Godavari River – Ramkund', 'Nashik', 'Maharashtra', 20.006, 73.79, 'RIVER', 'High bathing load, sewage inputs and festival-related waste'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Godavari River – Ramkund');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Rankala Lake', 'Kolhapur', 'Maharashtra', 16.705, 74.233, 'LAKE', 'Urban runoff and nutrient loading'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Rankala Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Powai Lake', 'Mumbai', 'Maharashtra', 19.125, 72.905, 'LAKE', 'Urban runoff, nutrient loading and local wastewater pressure'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Powai Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Vihar Lake', 'Mumbai', 'Maharashtra', 19.155, 72.935, 'LAKE', 'Catchment runoff and seasonal organic loading'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Vihar Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Ulhas River', 'Thane', 'Maharashtra', 19.2183, 73.1631, 'RIVER', 'Urban and industrial catchment pressures'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Ulhas River');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Panchganga River', 'Kolhapur', 'Maharashtra', 16.705, 74.243, 'RIVER', 'Municipal sewage and agricultural runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Panchganga River');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Jayakwadi Reservoir', 'Chhatrapati Sambhajinagar', 'Maharashtra', 19.482, 75.383, 'RESERVOIR', 'Agricultural runoff and seasonal nutrient inputs'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Jayakwadi Reservoir');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Ganga River – Haridwar', 'Haridwar', 'Uttarakhand', 29.9457, 78.1642, 'RIVER', 'High human use, wastewater and seasonal runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Ganga River – Haridwar');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Ganga River – Varanasi', 'Varanasi', 'Uttar Pradesh', 25.3176, 83.0104, 'RIVER', 'Urban wastewater, drains and high bathing activity'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Ganga River – Varanasi');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Yamuna River – Delhi', 'New Delhi', 'Delhi', 28.6139, 77.209, 'RIVER', 'Untreated/partly treated wastewater and drain inflows'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Yamuna River – Delhi');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Yamuna River – Mathura', 'Mathura', 'Uttar Pradesh', 27.4924, 77.6737, 'RIVER', 'Urban wastewater and religious activity'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Yamuna River – Mathura');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Hindon River', 'Ghaziabad', 'Uttar Pradesh', 28.6692, 77.4538, 'RIVER', 'Urban and industrial wastewater pressures'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Hindon River');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Gomti River', 'Lucknow', 'Uttar Pradesh', 26.8467, 80.9462, 'RIVER', 'Municipal wastewater and stormwater runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Gomti River');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Ramgarh Tal', 'Gorakhpur', 'Uttar Pradesh', 26.746, 83.373, 'LAKE', 'Urban runoff and nutrient enrichment'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Ramgarh Tal');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Sukhna Lake', 'Chandigarh', 'Chandigarh', 30.742, 76.818, 'LAKE', 'Catchment erosion and nutrient runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Sukhna Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Dal Lake', 'Srinagar', 'Jammu and Kashmir', 34.0837, 74.8723, 'LAKE', 'Houseboat sewage, catchment runoff and nutrient loading'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Dal Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Wular Lake', 'Bandipora', 'Jammu and Kashmir', 34.356, 74.59, 'LAKE', 'Catchment sediment and nutrient inputs'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Wular Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Brahmaputra River – Guwahati', 'Guwahati', 'Assam', 26.1445, 91.7362, 'RIVER', 'Urban drains, bank-side waste and monsoon runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Brahmaputra River – Guwahati');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Deepor Beel', 'Guwahati', 'Assam', 26.111, 91.656, 'WETLAND', 'Urban runoff, solid waste pressure and nutrient enrichment'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Deepor Beel');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Loktak Lake', 'Bishnupur', 'Manipur', 24.553, 93.784, 'LAKE', 'Catchment runoff and organic matter accumulation'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Loktak Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Rudrasagar Lake', 'Melaghar', 'Tripura', 23.495, 91.315, 'LAKE', 'Catchment runoff and seasonal nutrient loading'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Rudrasagar Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Chilika Lake', 'Puri', 'Odisha', 19.7, 85.32, 'LAGOON', 'Catchment runoff, tourism pressure and salinity variability'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Chilika Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Mahanadi River – Cuttack', 'Cuttack', 'Odisha', 20.4625, 85.883, 'RIVER', 'Urban wastewater and agricultural runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Mahanadi River – Cuttack');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Bhitarkanika creeks', 'Kendrapara', 'Odisha', 20.72, 86.87, 'ESTUARY', 'Tidal mixing, runoff and local settlement pressures'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Bhitarkanika creeks');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Hussain Sagar', 'Hyderabad', 'Telangana', 17.4239, 78.4738, 'LAKE', 'Urban wastewater, nutrient enrichment and algal blooms'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Hussain Sagar');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Musi River', 'Hyderabad', 'Telangana', 17.385, 78.4867, 'RIVER', 'Municipal wastewater and urban runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Musi River');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Kolleru Lake', 'Eluru', 'Andhra Pradesh', 16.615, 81.23, 'LAKE', 'Agricultural runoff and aquaculture-related nutrient pressure'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Kolleru Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Krishna River – Vijayawada', 'Vijayawada', 'Andhra Pradesh', 16.5062, 80.648, 'RIVER', 'Urban runoff, sewage and seasonal agricultural inputs'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Krishna River – Vijayawada');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Godavari River – Rajahmundry', 'Rajamahendravaram', 'Andhra Pradesh', 17.0005, 81.804, 'RIVER', 'Urban discharge and agricultural runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Godavari River – Rajahmundry');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Pulicat Lake', 'Tirupati region', 'Andhra Pradesh/Tamil Nadu', 13.56, 80.23, 'LAGOON', 'Tidal salinity, catchment runoff and local wastewater'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Pulicat Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Vembanad Lake', 'Alappuzha', 'Kerala', 9.598, 76.43, 'LAKE', 'Household wastewater, tourism and agricultural runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Vembanad Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Ashtamudi Lake', 'Kollam', 'Kerala', 8.951, 76.55, 'LAKE', 'Urban discharge and seasonal nutrient loading'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Ashtamudi Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Periyar River – Aluva', 'Kochi region', 'Kerala', 10.1076, 76.3516, 'RIVER', 'Urban/industrial catchment pressure and runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Periyar River – Aluva');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Sasthamkotta Lake', 'Kollam', 'Kerala', 9.035, 76.625, 'LAKE', 'Catchment disturbance and local runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Sasthamkotta Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Bhojtal (Upper Lake)', 'Bhopal', 'Madhya Pradesh', 23.2599, 77.4126, 'LAKE', 'Urban runoff and nutrient inputs'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Bhojtal (Upper Lake)');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Lower Lake', 'Bhopal', 'Madhya Pradesh', 23.25, 77.42, 'LAKE', 'Urban runoff and organic loading'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Lower Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Narmada River – Jabalpur', 'Jabalpur', 'Madhya Pradesh', 23.1815, 79.9864, 'RIVER', 'Urban runoff and high-use riverfront activity'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Narmada River – Jabalpur');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Shipra River – Ujjain', 'Ujjain', 'Madhya Pradesh', 23.1765, 75.7885, 'RIVER', 'Sewage inputs and high bathing load'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Shipra River – Ujjain');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Sabarmati Riverfront', 'Ahmedabad', 'Gujarat', 23.0225, 72.5714, 'RIVER', 'Urban drains and seasonal low-flow concentration'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Sabarmati Riverfront');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Kankaria Lake', 'Ahmedabad', 'Gujarat', 23.007, 72.602, 'LAKE', 'Urban runoff and recreation-related pressure'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Kankaria Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Lakhota Lake', 'Jamnagar', 'Gujarat', 22.4707, 70.0577, 'LAKE', 'Urban runoff and nutrient enrichment'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Lakhota Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Pichola Lake', 'Udaipur', 'Rajasthan', 24.576, 73.683, 'LAKE', 'Tourism, urban runoff and wastewater pressure'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Pichola Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Fateh Sagar Lake', 'Udaipur', 'Rajasthan', 24.601, 73.677, 'LAKE', 'Catchment runoff and seasonal algal growth'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Fateh Sagar Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Pushkar Lake', 'Ajmer', 'Rajasthan', 26.489, 74.551, 'LAKE', 'High bathing activity and local wastewater'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Pushkar Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Brahma Sarovar', 'Kurukshetra', 'Haryana', 29.969, 76.878, 'LAKE', 'High visitor use and nutrient inputs'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Brahma Sarovar');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Hauz Khas Lake', 'New Delhi', 'Delhi', 28.5535, 77.194, 'LAKE', 'Urban runoff and nutrient accumulation'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Hauz Khas Lake');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Ropar Wetland', 'Rupnagar', 'Punjab', 31.0, 76.5, 'WETLAND', 'Catchment runoff and sediment inputs'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Ropar Wetland');
INSERT INTO locations (location_name, city, state, latitude, longitude, water_source_type, description)
SELECT 'Beas River – Pong Reservoir', 'Kangra', 'Himachal Pradesh', 31.958, 76.05, 'RESERVOIR', 'Catchment erosion and seasonal runoff'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_name = 'Beas River – Pong Reservoir');

-- Verify catalogue count and identify entries with no sensor readings.
SELECT COUNT(*) AS waterbody_location_count FROM locations;
SELECT l.location_id, l.location_name, l.state,
       COUNT(s.sensor_data_id) AS stored_reading_count
FROM locations l
LEFT JOIN sensor_data s ON s.location_id = l.location_id
GROUP BY l.location_id, l.location_name, l.state
ORDER BY l.state, l.location_name;
