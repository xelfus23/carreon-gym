-- CREATE DATABASE careon_gym_db;
-- -- ============================================================================
-- -- USER MANAGEMENT
-- -- ============================================================================
-- CREATE TYPE user_role AS ENUM ('member', 'admin');
-- CREATE TABLE users (
--     id SERIAL PRIMARY KEY,
--     username TEXT UNIQUE,
--     first_name TEXT,
--     last_name TEXT,
--     phone_number TEXT UNIQUE,
--     email TEXT UNIQUE NOT NULL,
--     hashed_password TEXT NOT NULL,
--     role user_role DEFAULT 'member',
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE TABLE user_profiles (
--     user_id INT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
--     profile_picture_url TEXT,
--     height_cm INT CHECK (height_cm > 0),
--     gender TEXT CHECK (gender IN ('male', 'female', 'other')),
--     birth_date DATE,
--     goal TEXT,
--     activity_level TEXT CHECK (
--         activity_level IN (
--             'sedentary',
--             'light',
--             'moderate',
--             'active',
--             'very_active'
--         )
--     ),
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE TABLE body_metrics (
--     id SERIAL PRIMARY KEY,
--     user_id INT REFERENCES users (id) ON DELETE CASCADE,
--     weight_kg NUMERIC(5, 2) CHECK (weight_kg > 0),
--     body_fat_percent NUMERIC(5, 2) CHECK (body_fat_percent BETWEEN 0 AND 100),
--     muscle_mass_kg NUMERIC(5, 2),
--     recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- -- ============================================================================
-- -- CHAT SYSTEM
-- -- ============================================================================
-- CREATE TABLE chat_sessions (
--     id SERIAL PRIMARY KEY,
--     user_id INT REFERENCES users (id) ON DELETE CASCADE,
--     type TEXT CHECK (type IN ('model', 'trainer')) NOT NULL,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE TABLE chat_messages (
--     id SERIAL PRIMARY KEY,
--     session_id INT REFERENCES chat_sessions (id) ON DELETE CASCADE,
--     user_id INT REFERENCES users (id) ON DELETE CASCADE,
--     role TEXT CHECK (role IN ('user', 'assistant', 'system', 'tool')) NOT NULL,
--     content TEXT,
--     tool_calls JSONB, -- Stores array of tool calls from assistant
--     tool_call_id TEXT, -- Links tool result to the tool call
--     name TEXT, -- Tool name for tool role messages
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- -- ============================================================================
-- -- GYM EQUIPMENT INVENTORY
-- -- ============================================================================
-- CREATE TABLE equipment_category (
--     id SERIAL PRIMARY KEY,
--     name TEXT UNIQUE NOT NULL
-- );
-- CREATE TABLE muscle_group (
--     id SERIAL PRIMARY KEY,
--     name TEXT UNIQUE NOT NULL
-- );
-- CREATE TABLE equipment (
--     id SERIAL PRIMARY KEY,
--     name TEXT NOT NULL,
--     category_id INT NOT NULL REFERENCES equipment_category (id),
--     type TEXT,
--     description TEXT,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );
-- -- Many-to-many: Equipment can target multiple muscle groups
-- CREATE TABLE equipment_muscle (
--     equipment_id INT NOT NULL REFERENCES equipment (id) ON DELETE CASCADE,
--     muscle_group_id INT NOT NULL REFERENCES muscle_group (id) ON DELETE CASCADE,
--     PRIMARY KEY (equipment_id, muscle_group_id)
-- );
-- -- ============================================================================
-- -- WORKOUT PLANS & PROGRAMMING
-- -- ============================================================================
CREATE TABLE workout_plans (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT, -- Program overview and methodology
    duration_weeks INT, -- How many weeks the program runs
    days_per_week INT, -- Training frequency
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE workout_days (
    id SERIAL PRIMARY KEY,
    plan_id INT REFERENCES workout_plans(id) ON DELETE CASCADE,
    day_order INT NOT NULL, -- Sequential day number (1, 2, 3...)
    title TEXT NOT NULL, -- e.g., "Upper Body Push", "Leg Day"
    is_rest_day BOOLEAN DEFAULT FALSE, -- Flag for rest/recovery days
    rest_day_notes TEXT -- Instructions for rest days (stretching, light cardio, etc.)
);
CREATE TABLE
    workout_exercises (
        id SERIAL PRIMARY KEY,
        workout_day_id INT NOT NULL REFERENCES workout_days (id) ON DELETE CASCADE,
        exercise_order INT NOT NULL, -- Order within the workout (1, 2, 3...)
        exercise_name TEXT NOT NULL, -- e.g. "Barbell Back Squat"
        equipment_id INT REFERENCES equipment (id),
        -- Volume parameters (choose reps OR duration)
        sets INT CHECK (
            sets IS NULL
            OR sets > 0
        ),
        reps INT CHECK (
            reps IS NULL
            OR reps > 0
        ),
        duration_seconds INT CHECK (
            duration_seconds IS NULL
            OR duration_seconds > 0
        ),
        rest_seconds INT CHECK (
            rest_seconds IS NULL
            OR rest_seconds >= 0
        ),
        -- Intensity & technique
        weight_guidance TEXT, -- "RPE 7-8", "70% 1RM", "Bodyweight"
        tempo TEXT, -- "3-0-1-0"
        -- Instructions
        description TEXT,
        notes TEXT,
        -- Exercise classification
        is_warmup BOOLEAN DEFAULT FALSE,
        is_superset BOOLEAN DEFAULT FALSE,
        superset_group INT,
        -- 🔐 Data integrity rules
        CONSTRAINT reps_or_duration_only CHECK (
            (
                reps IS NOT NULL
                AND duration_seconds IS NULL
            )
            OR (
                reps IS NULL
                AND duration_seconds IS NOT NULL
            )
            OR (
                reps IS NULL
                AND duration_seconds IS NULL
            )
        ),
        CONSTRAINT superset_consistency CHECK (
            (
                is_superset = FALSE
                AND superset_group IS NULL
            )
            OR (
                is_superset = TRUE
                AND superset_group IS NOT NULL
            )
        )
    );

-- -- ============================================================================
-- -- WORKOUT LOGGING & TRACKING
-- -- ============================================================================
CREATE TABLE workout_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    workout_exercise_id INT REFERENCES workout_exercises(id) ON DELETE CASCADE,
    -- What the user actually completed
    completed_sets INT CHECK (completed_sets >= 0),
    completed_reps INT CHECK (completed_reps >= 0),
    weight_used_kg NUMERIC(6, 2), -- Actual weight used
    duration_minutes INT, -- For cardio
    -- User feedback
    difficulty_rating INT CHECK (difficulty_rating BETWEEN 1 AND 10), -- RPE or subjective difficulty
    notes TEXT, -- User's notes about the workout
    logged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- -- ============================================================================
-- -- INDEXES FOR PERFORMANCE
-- -- ============================================================================
-- -- User lookups
-- CREATE INDEX idx_users_email ON users(email);
-- CREATE INDEX idx_users_username ON users(username);
-- -- Workout plan queries
-- CREATE INDEX idx_workout_plans_user ON workout_plans(user_id);
-- CREATE INDEX idx_workout_days_plan ON workout_days(plan_id);
-- CREATE INDEX idx_workout_exercises_day ON workout_exercises(workout_day_id);
-- -- Workout logging queries
-- CREATE INDEX idx_workout_logs_user ON workout_logs(user_id);
-- CREATE INDEX idx_workout_logs_exercise ON workout_logs(workout_exercise_id);
-- CREATE INDEX idx_workout_logs_date ON workout_logs(logged_at);
-- -- Equipment queries
-- CREATE INDEX idx_equipment_category ON equipment(category_id);
-- CREATE INDEX idx_equipment_muscle_equipment ON equipment_muscle(equipment_id);
-- CREATE INDEX idx_equipment_muscle_group ON equipment_muscle(muscle_group_id);
-- -- Chat queries
-- CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
-- CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
-- -- ============================================================================
-- -- SEED DATA: GYM EQUIPMENT INVENTORY
-- -- ============================================================================
-- -- Clear existing data
-- TRUNCATE TABLE 
--     equipment_muscle,
--     equipment,
--     muscle_group,
--     equipment_category 
-- RESTART IDENTITY CASCADE;
-- -- Categories
-- INSERT INTO equipment_category (name) VALUES
--     ('Free Weight'),    -- ID 1
--     ('Machine'),        -- ID 2
--     ('Accessory'),      -- ID 3
--     ('Cardio');         -- ID 4
-- -- Muscle Groups
-- INSERT INTO muscle_group (name) VALUES
--     ('Chest'),          -- ID 1
--     ('Back'),           -- ID 2
--     ('Legs'),           -- ID 3
--     ('Shoulders'),      -- ID 4
--     ('Arms'),           -- ID 5
--     ('Core'),           -- ID 6
--     ('Cardio');         -- ID 7
-- -- Equipment Inventory
-- INSERT INTO equipment (name, category_id, type, description) VALUES
--     -- Free Weights
--     ('Dumbbells', 1, 'Free Weight', 'Standard adjustable or fixed dumbbells'),
--     ('Barbells', 1, 'Free Weight', 'Olympic or standard straight bars'),
--     ('Curve Barbells', 1, 'Free Weight', 'EZ-Curl bars for arm isolation'),
--     ('Arm Bars', 1, 'Free Weight', 'Specialized bars for triceps/biceps'),
--     ('Barbell Squat Station', 1, 'Station', 'Squat rack or power cage'),
--     -- Accessories
--     ('Yoga Ball', 3, 'Accessory', 'Stability ball for core and balance'),
--     ('Resistance Bands', 3, 'Accessory', 'Elastic bands for warming up or resistance'),
--     -- Machines - Upper Body
--     ('Bench Press Station', 2, 'Station', 'Flat bench rack for chest press'),
--     ('Pec Deck', 2, 'Isolation Machine', 'Seated fly machine for chest definition'),
--     ('Incline Press Machine', 2, 'Press Machine', 'Upper chest press machine'),
--     ('Cable Row', 2, 'Cable Machine', 'Seated row for back thickness'),
--     ('Lat Machine', 2, 'Cable Machine', 'General cable machine for back/arms'),
--     ('Lat Pulldown', 2, 'Cable Machine', 'Vertical pulldown for back width'),
--     -- Machines - Lower Body
--     ('Leg Press', 2, 'Leg Machine', 'Sled machine for heavy leg pressing'),
--     ('Calf Raise Machine', 2, 'Leg Machine', 'Isolation machine for calves'),
--     ('Leg Extension Machine', 2, 'Leg Machine', 'Seated machine for quadriceps'),
--     ('Leg Curl Machine', 2, 'Leg Machine', 'Seated or lying machine for hamstrings'),
--     ('Hack Squat Machine', 2, 'Leg Machine', 'Angled squat machine for legs'),
--     -- Multipurpose
--     ('Smith Machine', 2, 'Multipurpose', 'Guided barbell system for safety'),
--     -- Cardio
--     ('Cardio Bike', 4, 'Cardio', 'Stationary bicycle'),
--     ('Treadmill', 4, 'Cardio', 'Running/Walking machine');
-- -- Equipment to Muscle Group Mapping
-- INSERT INTO equipment_muscle (equipment_id, muscle_group_id) VALUES
--     -- Dumbbells (1) - Full body
--     (1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
--     -- Barbells (2) - Full body
--     (2, 1), (2, 2), (2, 3), (2, 4), (2, 5),
--     -- Curve Barbells (3) - Arms
--     (3, 5),
--     -- Arm Bars (4) - Arms
--     (4, 5),
--     -- Barbell Squat Station (5) - Legs, Core
--     (5, 3), (5, 6),
--     -- Yoga Ball (6) - Core
--     (6, 6),
--     -- Resistance Bands (7) - Full body
--     (7, 1), (7, 2), (7, 3), (7, 4), (7, 5),
--     -- Bench Press Station (8) - Chest, Shoulders, Arms
--     (8, 1), (8, 4), (8, 5),
--     -- Pec Deck (9) - Chest
--     (9, 1),
--     -- Incline Press Machine (10) - Chest, Shoulders
--     (10, 1), (10, 4),
--     -- Cable Row (11) - Back, Arms
--     (11, 2), (11, 5),
--     -- Lat Machine (12) - Back, Arms
--     (12, 2), (12, 5),
--     -- Lat Pulldown (13) - Back
--     (13, 2),
--     -- Leg Press (14) - Legs
--     (14, 3),
--     -- Calf Raise Machine (15) - Legs
--     (15, 3),
--     -- Leg Extension Machine (16) - Legs
--     (16, 3),
--     -- Leg Curl Machine (17) - Legs
--     (17, 3),
--     -- Hack Squat Machine (18) - Legs
--     (18, 3),
--     -- Smith Machine (19) - Chest, Legs, Shoulders
--     (19, 1), (19, 3), (19, 4),
--     -- Cardio Bike (20) - Cardio, Legs
--     (20, 7), (20, 3),
--     -- Treadmill (21) - Cardio, Legs
--     (21, 7), (21, 3);
-- -- ============================================================================
-- -- HELPFUL VIEWS FOR COMMON QUERIES
-- -- ============================================================================
-- -- View: Complete workout plan with all details
-- CREATE VIEW v_workout_plan_details AS
-- SELECT 
--     wp.id as plan_id,
--     wp.user_id,
--     wp.title as plan_title,
--     wp.description,
--     wp.duration_weeks,
--     wp.days_per_week,
--     wp.difficulty_level,
--     wp.created_at as plan_created_at,
--     wd.id as day_id,
--     wd.day_order,
--     wd.title as day_title,
--     wd.is_rest_day,
--     wd.rest_day_notes,
--     we.id as exercise_id,
--     we.exercise_order,
--     we.exercise_name,
--     e.name as equipment_name,
--     e.type as equipment_type,
--     we.sets,
--     we.reps,
--     we.duration_minutes,
--     we.rest_seconds,
--     we.weight_guidance,
--     we.tempo,
--     we.description as exercise_description,
--     we.notes as exercise_notes,
--     we.is_warmup,
--     we.is_superset,
--     we.superset_group
-- FROM workout_plans wp
-- LEFT JOIN workout_days wd ON wp.id = wd.plan_id
-- LEFT JOIN workout_exercises we ON wd.id = we.workout_day_id
-- LEFT JOIN equipment e ON we.equipment_id = e.id
-- ORDER BY wp.id, wd.day_order, we.exercise_order;
-- -- View: User workout history with performance metrics
-- CREATE VIEW v_workout_history AS
-- SELECT 
--     wl.id as log_id,
--     wl.user_id,
--     u.first_name,
--     u.last_name,
--     wp.title as plan_title,
--     wd.title as day_title,
--     we.exercise_name,
--     e.name as equipment_name,
--     we.sets as prescribed_sets,
--     we.reps as prescribed_reps,
--     wl.completed_sets,
--     wl.completed_reps,
--     wl.weight_used_kg,
--     wl.difficulty_rating,
--     wl.notes as workout_notes,
--     wl.logged_at
-- FROM workout_logs wl
-- JOIN users u ON wl.user_id = u.id
-- JOIN workout_exercises we ON wl.workout_exercise_id = we.id
-- JOIN workout_days wd ON we.workout_day_id = wd.id
-- JOIN workout_plans wp ON wd.plan_id = wp.id
-- LEFT JOIN equipment e ON we.equipment_id = e.id
-- ORDER BY wl.logged_at DESC;
-- -- View: Equipment availability by muscle group
-- CREATE VIEW v_equipment_by_muscle AS
-- SELECT 
--     mg.name as muscle_group,
--     e.id as equipment_id,
--     e.name as equipment_name,
--     e.type as equipment_type,
--     ec.name as category,
--     e.description
-- FROM equipment e
-- JOIN equipment_category ec ON e.category_id = ec.id
-- JOIN equipment_muscle em ON e.id = em.equipment_id
-- JOIN muscle_group mg ON em.muscle_group_id = mg.id
-- ORDER BY mg.name, e.name;
-- -- ============================================================================
-- -- COMMENTS FOR DOCUMENTATION
-- -- ============================================================================
-- COMMENT ON TABLE workout_plans IS 'User-specific workout programs with metadata about duration and difficulty';
-- COMMENT ON TABLE workout_days IS 'Individual training days within a workout plan, can be rest days';
-- COMMENT ON TABLE workout_exercises IS 'Specific exercises with detailed programming including sets, reps, tempo, and form cues';
-- COMMENT ON TABLE workout_logs IS 'User completion records for tracking progress and adherence';
-- COMMENT ON COLUMN workout_exercises.tempo IS 'Format: eccentric-pause-concentric-pause (e.g., 3-0-1-0 means 3sec down, no pause, 1sec up, no pause)';
-- COMMENT ON COLUMN workout_exercises.weight_guidance IS 'Intensity prescription: RPE scale, percentage of 1RM, or descriptive guidance';
-- COMMENT ON COLUMN workout_exercises.superset_group IS 'Groups exercises to be performed back-to-back without rest';