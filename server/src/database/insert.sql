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

INSERT INTO subscription_plans (name, description, price, duration_days, is_active) VALUES
('Daily', 'Gym access for one day', 50.00, 1, TRUE),
('Weekly', 'Gym access for seven days', 350.00, 7, TRUE),
('Monthly', 'Gym access for one month', 1400.00, 30, TRUE)
ON CONFLICT (name) DO NOTHING;


INSERT INTO product_categories (name, description)
VALUES 
  ('Supplements', 'Protein powders, creatine, and performance boosters'),
  ('Drinks', 'Beverages, water, and energy drinks'),
  ('Food', 'Ready-to-eat gym snacks'),
  ('Equipment', 'Gym gear and accessories');

INSERT INTO products (name, category_id, price, stocks)
VALUES 
    -- Supplements (Category 1)
('Whey Protein (27g)', 1, 55.00, 50),
('Creatine (5g)', 1, 45.00, 50),

-- Drinks (Category 2)
('Mineral Water', 2, 20.00, 100),
('C2 Iced Tea', 2, 30.00, 40),
('Sting Energy Drink', 2, 35.00, 40),
('Cobra Energy Drink', 2, 35.00, 40),
('Vitamilk', 2, 40.00, 30),
('Pocari Sweat', 2, 50.00, 30),

-- Food (Category 3)
('Hard Boiled Egg', 3, 25.00, 20),
('Saba Banana (Saging Saba)', 3, 20.00, 30),

  -- Equipment (Category 4)
('Barbell Foam Grip', 4, 80.00, 10);

INSERT INTO gym_details (gym_name, gcash_number) VALUES ('Careon Gym', '09123456789');