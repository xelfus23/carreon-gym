-----------------------------------------------------------------------
--INSERT

-- ============================================================================
-- ENSURE CATEGORIES EXIST
-- ============================================================================

INSERT INTO equipment_category (name, description) VALUES
('Free Weight', 'Barbells, dumbbells, and manually controlled weight equipment'),
('Machine', 'Fixed-path machines for controlled resistance training'),
('Accessory', 'Support equipment for flexibility, balance, and light resistance'),
('Cardio', 'Equipment designed for cardiovascular endurance')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ENSURE MUSCLE GROUPS EXIST
-- ============================================================================

INSERT INTO muscle_group (name, description) VALUES
('Chest', 'Pectoralis major and minor muscles'),
('Back', 'Latissimus dorsi, rhomboids, and trapezius'),
('Legs', 'Quadriceps, hamstrings, glutes, and calves'),
('Shoulders', 'Deltoid muscle group'),
('Arms', 'Biceps, triceps, and forearms'),
('Core', 'Abdominals, obliques, and lower back'),
('Cardio', 'Heart and cardiovascular system')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- INSERT EQUIPMENT WITH DESCRIPTIONS
-- ============================================================================

INSERT INTO equipment (name, category_id, type, description, quantity)
VALUES
-- FREE WEIGHTS
('Dumbbells',
 (SELECT id FROM equipment_category WHERE name='Free Weight'),
 'Free Weight',
 'Handheld weights used for a wide range of exercises targeting all major muscle groups',
 20),

('Barbells',
 (SELECT id FROM equipment_category WHERE name='Free Weight'),
 'Free Weight',
 'Long bar used for compound lifts such as squats, deadlifts, and bench press',
 5),

('Curve Barbells',
 (SELECT id FROM equipment_category WHERE name='Free Weight'),
 'Free Weight',
 'EZ curl bars designed to reduce wrist strain during arm exercises',
 3),

('Arm Bars',
 (SELECT id FROM equipment_category WHERE name='Free Weight'),
 'Free Weight',
 'Specialized bars for bicep curls and tricep extensions',
 2),

-- ACCESSORIES
('Yoga Ball',
 (SELECT id FROM equipment_category WHERE name='Accessory'),
 'Accessory',
 'Stability ball used for core strengthening, balance, and flexibility exercises',
 10),

('Resistance Bands',
 (SELECT id FROM equipment_category WHERE name='Accessory'),
 'Accessory',
 'Elastic bands used for resistance training, stretching, and rehabilitation',
 15),

-- MACHINES (UPPER BODY)
('Bench Press',
 (SELECT id FROM equipment_category WHERE name='Machine'),
 'Machine',
 'Station for performing chest press exercises using a barbell or weights',
 3),

('Pec Deck',
 (SELECT id FROM equipment_category WHERE name='Machine'),
 'Machine',
 'Machine used for chest fly movements to isolate the chest muscles',
 1),

('Incline Press',
 (SELECT id FROM equipment_category WHERE name='Machine'),
 'Machine',
 'Machine designed to target the upper chest through incline pressing movement',
 1),

('Cable Row',
 (SELECT id FROM equipment_category WHERE name='Machine'),
 'Machine',
 'Seated machine for rowing exercises to strengthen the back muscles',
 2),

('Lat Machine',
 (SELECT id FROM equipment_category WHERE name='Machine'),
 'Machine',
 'Cable-based machine for various pulling exercises targeting back and arms',
 2),

('Lat Pulldown',
 (SELECT id FROM equipment_category WHERE name='Machine'),
 'Machine',
 'Machine used to perform vertical pulling movements for back development',
 2),

-- LOWER BODY MACHINES
('Leg Press',
 (SELECT id FROM equipment_category WHERE name='Machine'),
 'Machine',
 'Machine used to perform leg pressing movements targeting quadriceps and glutes',
 2),

('Smith Machine',
 (SELECT id FROM equipment_category WHERE name='Machine'),
 'Machine',
 'Guided barbell system providing stability and safety for various lifts',
 1),

('Calf Raise Machine',
 (SELECT id FROM equipment_category WHERE name='Machine'),
 'Machine',
 'Machine designed to isolate and strengthen the calf muscles',
 1),

('Leg Extension Machine',
 (SELECT id FROM equipment_category WHERE name='Machine'),
 'Machine',
 'Machine used to isolate and strengthen the quadriceps',
 1),

('Leg Curl Machine',
 (SELECT id FROM equipment_category WHERE name='Machine'),
 'Machine',
 'Machine used to target the hamstrings through curling motion',
 1),

('Hack Squat Machine',
 (SELECT id FROM equipment_category WHERE name='Machine'),
 'Machine',
 'Machine used for squat movements with added support and stability',
 1),

-- SPECIAL STATION
('Barbell Squat Rack',
 (SELECT id FROM equipment_category WHERE name='Free Weight'),
 'Station',
 'Rack used for safely performing barbell squats and other heavy lifts',
 2),

-- CARDIO
('Cardio Bike',
 (SELECT id FROM equipment_category WHERE name='Cardio'),
 'Cardio',
 'Stationary bike used for cardiovascular workouts and leg endurance',
 10),

('Treadmill',
 (SELECT id FROM equipment_category WHERE name='Cardio'),
 'Cardio',
 'Machine used for walking, jogging, or running indoors',
 8);

-- ============================================================================
-- MAP EQUIPMENT TO TARGET MUSCLE GROUPS
-- ============================================================================

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Arms'
WHERE e.name = 'Dumbbells'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Shoulders'
WHERE e.name = 'Dumbbells'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Chest'
WHERE e.name = 'Barbells'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Back'
WHERE e.name = 'Barbells'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Arms'
WHERE e.name = 'Curve Barbells'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Arms'
WHERE e.name = 'Arm Bars'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Core'
WHERE e.name = 'Yoga Ball'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Arms'
WHERE e.name = 'Resistance Bands'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Chest'
WHERE e.name = 'Bench Press'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Chest'
WHERE e.name = 'Pec Deck'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Chest'
WHERE e.name = 'Incline Press'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Back'
WHERE e.name = 'Cable Row'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Back'
WHERE e.name = 'Lat Machine'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Back'
WHERE e.name = 'Lat Pulldown'
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Legs'
WHERE e.name IN (
    'Leg Press',
    'Smith Machine',
    'Calf Raise Machine',
    'Leg Extension Machine',
    'Leg Curl Machine',
    'Hack Squat Machine',
    'Barbell Squat Rack'
)
ON CONFLICT DO NOTHING;

INSERT INTO equipment_muscle (equipment_id, muscle_group_id)
SELECT e.id, mg.id FROM equipment e
JOIN muscle_group mg ON mg.name = 'Cardio'
WHERE e.name IN ('Cardio Bike', 'Treadmill')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUBSCRIPTION PLANS (Daily / Weekly / Monthly)
-- ============================================================================

INSERT INTO subscription_plans (name, description, price, duration_days, is_active, icon, category) VALUES
('Daily Pass', 'Full access to gym facilities for 24 hours', 50.00, 1, TRUE, 'clock', 'membership'),
('Weekly Pass', 'Full access to gym facilities for 7 days', 200.00, 7, TRUE, NULL, 'membership'),
('Monthly Membership', 'Our standard 30-day unlimited access plan', 600.00, 30, TRUE, NULL, 'membership'),
('3 Months Pass', 'Full access to gym facilities for 3 months', 1500.00, 90, TRUE, NULL, 'membership'),
('Boxing (Single Session)', 'One-time boxing class pass', 200.00, 1, TRUE, NULL, 'class'),
('Boxing (Monthly)', 'Unlimited boxing for 30 days', 2000.00, 30, TRUE, NULL, 'class'),
('Personal Trainer (Single Session)', '1-on-1 session with a trainer', 300.00, 1, TRUE, NULL, 'personal_training'),
('Personal Trainer (Monthly)', 'Personal training package for 30 days', 3000.00, 30, TRUE, NULL, 'personal_training'),
('Treadmill', 'Unlimited treadmill use', 100.00, 30, TRUE, NULL, 'add_on')
ON CONFLICT (name) DO NOTHING;


INSERT INTO product_categories (name, description) VALUES 
('Supplements', 'Protein powders, creatine, and performance boosters'),
('Drinks', 'Beverages, water, and energy drinks'),
('Food', 'Ready-to-eat gym snacks'),
('Equipment', 'Gym gear and accessories');

INSERT INTO products (name, category_id, price, stocks) VALUES 
('Whey Protein (27g)', 1, 55.00, 50),
('Creatine (5g)', 1, 45.00, 50),
('Mineral Water', 2, 20.00, 100),
('C2 Iced Tea', 2, 30.00, 40),
('Sting Energy Drink', 2, 35.00, 40),
('Cobra Energy Drink', 2, 35.00, 40),
('Vitamilk', 2, 40.00, 30),
('Pocari Sweat', 2, 50.00, 30),
('Hard Boiled Egg', 3, 25.00, 20),
('Saba Banana (Saging Saba)', 3, 20.00, 30),
('Barbell Foam Grip', 4, 80.00, 10);

INSERT INTO gym_details (gym_name, contact_number, email, gcash_name, gcash_number) VALUES ('Careon Gym', '09123456789', 'carreon.gym@email.com', 'Carreon Gym', '09123234345');

-- 1. Insert 10 Users
INSERT INTO users (first_name, last_name, phone_number, email, hashed_password, role, verified) VALUES
('Alex', 'Rivers', '555-0101', 'alex.rivers@example.com', 'password123', 'member', true),
('Casey', 'Morgan', '555-0102', 'casey.m@example.com', 'mypassword', 'member', true),
('Jordan', 'Lee', '555-0103', 'jlee_fitness@example.com', '123456', 'member', true),
('Taylor', 'Swift', '555-0104', 'taylor.s@example.com', 'swiftie2026', 'member', false),
('Riley', 'Reid', '555-0105', 'riley.r@example.com', 'gymrat99', 'member', true),
('Quinn', 'Fabray', '555-0106', 'q.fabray@example.com', 'cheer2026', 'member', true),
('Skyler', 'White', '555-0107', 'skyler.w@example.com', 'bluebird', 'member', true),
('Charlie', 'Day', '555-0108', 'wildcard@example.com', 'ratprowess', 'member', false),
('Morgan', 'Freeman', '555-0109', 'voice.god@example.com', 'narration1', 'member', true),
('Jules', 'Winnfield', '555-0110', 'badmother@example.com', 'ezekiel2517', 'member', true);

-- 2. Insert Profiles (Linking via Email lookup to ensure IDs match)
INSERT INTO user_profiles (user_id, height_cm, gender, birth_date, goal, activity_level)
SELECT id, 170 + (id % 20), 
       CASE WHEN id % 2 = 0 THEN 'male' ELSE 'female' END,
       '1990-01-01'::DATE + (id * 100),
       'General fitness and health improvement',
       'moderate'
FROM users WHERE email LIKE '%@example.com';

-- 3. Insert Initial Body Metrics
INSERT INTO body_metrics (user_id, weight_kg, body_fat_percent, muscle_mass_kg)
SELECT id, 70.5 + id, 15.0 + (id % 10), 30.0 + (id % 5)
FROM users WHERE email LIKE '%@example.com';

-- ============================================================================
-- ATTENDANCE DATA
-- ============================================================================

-- USER 2
INSERT INTO gym_attendance (user_id, check_in_time, check_out_time, duration_minutes, status, log_status, method, created_at) VALUES
(2, NOW() - INTERVAL '142 days 4 hours', NOW() - INTERVAL '142 days 4 hours' + INTERVAL '75 minutes', 75, 'checked_out', 'success', 'qr', NOW() - INTERVAL '142 days 4 hours');
INSERT INTO attendance_attempts (user_id, action, result, reason, metadata, created_at) VALUES
(2, 'check_in', 'success', NULL, '{"source": "mobile_qr", "qr_data": "GYM:in"}', NOW() - INTERVAL '142 days 4 hours');

-- USER 3
INSERT INTO gym_attendance (user_id, check_in_time, check_out_time, duration_minutes, status, log_status, method, created_at) VALUES
(3, NOW() - INTERVAL '88 days 12 hours', NOW() - INTERVAL '88 days 12 hours' + INTERVAL '60 minutes', 60, 'checked_out', 'success', 'manual', NOW() - INTERVAL '88 days 12 hours');
INSERT INTO attendance_attempts (user_id, action, result, reason, metadata, created_at) VALUES
(3, 'check_in', 'success', NULL, '{"source": "manual"}', NOW() - INTERVAL '88 days 12 hours');

-- USER 4
INSERT INTO gym_attendance (user_id, check_in_time, check_out_time, duration_minutes, status, log_status, method, created_at) VALUES
(4, NOW() - INTERVAL '10 days 2 hours', NOW() - INTERVAL '10 days 2 hours' + INTERVAL '120 minutes', 120, 'checked_out', 'success', 'qr', NOW() - INTERVAL '10 days 2 hours');
INSERT INTO attendance_attempts (user_id, action, result, reason, metadata, created_at) VALUES
(4, 'check_in', 'success', NULL, '{"source": "mobile_qr", "qr_data": "GYM:in"}', NOW() - INTERVAL '10 days 2 hours');

-- USER 5
INSERT INTO gym_attendance (user_id, check_in_time, check_out_time, duration_minutes, status, log_status, method, created_at) VALUES
(5, NOW() - INTERVAL '165 days 5 hours', NOW() - INTERVAL '165 days 5 hours' + INTERVAL '45 minutes', 45, 'checked_out', 'success', 'admin', NOW() - INTERVAL '165 days 5 hours');
INSERT INTO attendance_attempts (user_id, action, result, reason, metadata, created_at) VALUES
(5, 'check_in', 'success', NULL, '{"source": "admin"}', NOW() - INTERVAL '165 days 5 hours');

-- USER 6
INSERT INTO gym_attendance (user_id, check_in_time, check_out_time, duration_minutes, status, log_status, method, created_at) VALUES
(6, NOW() - INTERVAL '45 days 8 hours', NOW() - INTERVAL '45 days 8 hours' + INTERVAL '90 minutes', 90, 'checked_out', 'success', 'qr', NOW() - INTERVAL '45 days 8 hours');
INSERT INTO attendance_attempts (user_id, action, result, reason, metadata, created_at) VALUES
(6, 'check_in', 'success', NULL, '{"source": "mobile_qr", "qr_data": "GYM:in"}', NOW() - INTERVAL '45 days 8 hours');

-- USER 7
INSERT INTO gym_attendance (user_id, check_in_time, check_out_time, duration_minutes, status, log_status, method, created_at) VALUES
(7, NOW() - INTERVAL '120 days 1 hour', NOW() - INTERVAL '120 days 1 hour' + INTERVAL '55 minutes', 55, 'checked_out', 'success', 'manual', NOW() - INTERVAL '120 days 1 hour');
INSERT INTO attendance_attempts (user_id, action, result, reason, metadata, created_at) VALUES
(7, 'check_in', 'success', NULL, '{"source": "manual"}', NOW() - INTERVAL '120 days 1 hour');

-- USER 8
INSERT INTO gym_attendance (user_id, check_in_time, check_out_time, duration_minutes, status, log_status, method, created_at) VALUES
(8, NOW() - INTERVAL '32 days 10 hours', NOW() - INTERVAL '32 days 10 hours' + INTERVAL '80 minutes', 80, 'checked_out', 'success', 'qr', NOW() - INTERVAL '32 days 10 hours');
INSERT INTO attendance_attempts (user_id, action, result, reason, metadata, created_at) VALUES
(8, 'check_in', 'success', NULL, '{"source": "mobile_qr", "qr_data": "GYM:in"}', NOW() - INTERVAL '32 days 10 hours');

-- USER 9
INSERT INTO gym_attendance (user_id, check_in_time, check_out_time, duration_minutes, status, log_status, method, created_at) VALUES
(9, NOW() - INTERVAL '15 days 3 hours', NOW() - INTERVAL '15 days 3 hours' + INTERVAL '110 minutes', 110, 'checked_out', 'success', 'admin', NOW() - INTERVAL '15 days 3 hours');
INSERT INTO attendance_attempts (user_id, action, result, reason, metadata, created_at) VALUES
(9, 'check_in', 'success', NULL, '{"source": "admin"}', NOW() - INTERVAL '15 days 3 hours');

-- USER 10
INSERT INTO gym_attendance (user_id, check_in_time, check_out_time, duration_minutes, status, log_status, method, created_at) VALUES
(10, NOW() - INTERVAL '75 days 15 hours', NOW() - INTERVAL '75 days 15 hours' + INTERVAL '65 minutes', 65, 'checked_out', 'success', 'qr', NOW() - INTERVAL '75 days 15 hours');
INSERT INTO attendance_attempts (user_id, action, result, reason, metadata, created_at) VALUES
(10, 'check_in', 'success', NULL, '{"source": "mobile_qr", "qr_data": "GYM:in"}', NOW() - INTERVAL '75 days 15 hours');

-- USER 11
INSERT INTO gym_attendance (user_id, check_in_time, check_out_time, duration_minutes, status, log_status, method, created_at) VALUES
(11, NOW() - INTERVAL '150 days 6 hours', NOW() - INTERVAL '150 days 6 hours' + INTERVAL '50 minutes', 50, 'checked_out', 'success', 'manual', NOW() - INTERVAL '150 days 6 hours');
INSERT INTO attendance_attempts (user_id, action, result, reason, metadata, created_at) VALUES
(11, 'check_in', 'success', NULL, '{"source": "manual"}', NOW() - INTERVAL '150 days 6 hours');

-- USER 12
INSERT INTO gym_attendance (user_id, check_in_time, check_out_time, duration_minutes, status, log_status, method, created_at) VALUES
(12, NOW() - INTERVAL '2 days 20 hours', NOW() - INTERVAL '2 days 20 hours' + INTERVAL '100 minutes', 100, 'checked_out', 'success', 'qr', NOW() - INTERVAL '2 days 20 hours');
INSERT INTO attendance_attempts (user_id, action, result, reason, metadata, created_at) VALUES
(12, 'check_in', 'success', NULL, '{"source": "mobile_qr", "qr_data": "GYM:in"}', NOW() - INTERVAL '2 days 20 hours');


-- ============================================================================
-- PAYMENT DATA
-- ============================================================================


INSERT INTO payments (user_id, plan_id, transaction_type, amount, method, reference_no, paid_at) VALUES
(2, 1, 'plan', 1500.00, 'gcash', 'REF-2026-001', NOW() - INTERVAL '5 months');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, notes, paid_at) VALUES
(3, 5, 'product', 120.00, 2, 'cash', 'Pre-workout drinks', NOW() - INTERVAL '4 months 10 days');
INSERT INTO payments (user_id, plan_id, transaction_type, amount, method, reference_no, paid_at) VALUES
(4, 3, 'plan', 3500.00, 'bank_transfer', 'BNK-99218', NOW() - INTERVAL '3 months 15 days');
INSERT INTO payments (user_id, plan_id, transaction_type, amount, method, paid_at) VALUES
(5, 1, 'plan', 1500.00, 'cash', NOW() - INTERVAL '3 months');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, paid_at) VALUES
(6, 8, 'product', 95.00, 1, 'cash', NOW() - INTERVAL '2 months 5 days');
INSERT INTO payments (user_id, plan_id, transaction_type, amount, method, reference_no, paid_at) VALUES
(7, 2, 'plan', 1200.00, 'gcash', 'GC-882100', NOW() - INTERVAL '1 month 20 days');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, paid_at) VALUES
(8, 10, 'product', 25.00, 1, 'cash', NOW() - INTERVAL '1 month');
INSERT INTO payments (user_id, plan_id, transaction_type, amount, method, reference_no, paid_at) VALUES
(9, 3, 'plan', 3500.00, 'bank_transfer', 'BNK-77122', NOW() - INTERVAL '25 days');
INSERT INTO payments (user_id, plan_id, transaction_type, amount, method, paid_at) VALUES
(10, 1, 'plan', 1500.00, 'cash', NOW() - INTERVAL '12 days');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, notes, paid_at) VALUES
(11, 15, 'product', 550.00, 1, 'gcash', 'Official Gym Merch', NOW() - INTERVAL '5 days');
INSERT INTO payments (user_id, plan_id, transaction_type, amount, method, reference_no, paid_at) VALUES
(12, 2, 'plan', 1200.00, 'gcash', 'GC-441092', NOW() - INTERVAL '1 day');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, notes, paid_at) VALUES
(2, 1, 'product', 2400.00, 1, 'bank_transfer', 'Whey Protein 5lbs', NOW() - INTERVAL '5 months 2 days');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, reference_no, paid_at) VALUES
(3, 2, 'product', 450.00, 1, 'gcash', 'REF-GC-1029', NOW() - INTERVAL '4 months 15 days');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, paid_at) VALUES
(4, 3, 'product', 1800.00, 1, 'cash', NOW() - INTERVAL '4 months');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, paid_at) VALUES
(5, 4, 'product', 350.00, 1, 'cash', NOW() - INTERVAL '3 months 10 days');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, paid_at) VALUES
(6, 5, 'product', 250.00, 2, 'cash', NOW() - INTERVAL '3 months');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, paid_at) VALUES
(7, 6, 'product', 90.00, 3, 'cash', NOW() - INTERVAL '2 months 20 days');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, reference_no, paid_at) VALUES
(8, 7, 'product', 150.00, 1, 'gcash', 'REF-GC-9921', NOW() - INTERVAL '2 months');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, paid_at) VALUES
(9, 8, 'product', 1100.00, 1, 'bank_transfer', NOW() - INTERVAL '1 month 15 days');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, notes, paid_at) VALUES
(10, 9, 'product', 1350.00, 1, 'gcash', 'Intra-workout supplement', NOW() - INTERVAL '1 month');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, paid_at) VALUES
(11, 10, 'product', 400.00, 1, 'cash', NOW() - INTERVAL '15 days');
INSERT INTO payments (user_id, product_id, transaction_type, amount, quantity, method, paid_at) VALUES
(12, 11, 'product', 110.00, 2, 'cash', NOW() - INTERVAL '2 days');