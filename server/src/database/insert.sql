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