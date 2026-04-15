-- -- CREATE DATABASE careon_gym_db;

-- -- ============================================================================
-- -- ENUMS
-- -- ============================================================================

-- CREATE TYPE user_role AS ENUM ('member', 'admin', 'trainer');
-- CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'pending', 'cancelled');
-- CREATE TYPE attendance_status AS ENUM ('checked_in', 'checked_out');

-- -- ============================================================================
-- -- USER MANAGEMENT
-- -- ============================================================================

-- CREATE TABLE users (
--     id SERIAL PRIMARY KEY,
--     username TEXT UNIQUE,
--     first_name TEXT NOT NULL,
--     last_name TEXT NOT NULL,
--     phone_number TEXT UNIQUE,
--     email TEXT UNIQUE NOT NULL,
--     hashed_password TEXT NOT NULL,
--     role user_role DEFAULT 'member',
--     verified BOOLEAN DEFAULT false,
--     profile_image_url TEXT,
    
--     -- Session & attendance tracking
--     last_login TIMESTAMPTZ,
--     last_check_in TIMESTAMPTZ,
--     total_visits_all_time INT DEFAULT 0 NOT NULL,
--     total_visits_this_month INT DEFAULT 0 NOT NULL,
    
--     -- Account management
--     account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
    
--     -- Timestamps
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE user_profiles (
--     user_id INT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
--     height_cm INT CHECK (height_cm > 0 AND height_cm < 300),
--     gender TEXT CHECK (gender IN ('male', 'female', 'other')),
--     birth_date DATE CHECK (birth_date <= CURRENT_DATE),
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
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE body_metrics (
--     id SERIAL PRIMARY KEY,
--     user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
--     weight_kg NUMERIC(5, 2) CHECK (weight_kg > 0 AND weight_kg < 500),
--     body_fat_percent NUMERIC(5, 2) CHECK (body_fat_percent BETWEEN 0 AND 100),
--     muscle_mass_kg NUMERIC(5, 2) CHECK (muscle_mass_kg > 0),
--     recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE INDEX idx_body_metrics_user_recorded ON body_metrics(user_id, recorded_at DESC);

-- CREATE TABLE subscriptions (
--     id SERIAL PRIMARY KEY,
--     user_id INT UNIQUE NOT NULL REFERENCES users (id) ON DELETE CASCADE,
--     plan_name TEXT NOT NULL,
--     status subscription_status DEFAULT 'pending',
--     start_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     expiry_date TIMESTAMPTZ NOT NULL,
--     auto_renew BOOLEAN DEFAULT false,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE user_sessions (
--     id SERIAL PRIMARY KEY,
--     user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
--     refresh_token_hash TEXT NOT NULL,
--     device_info TEXT,
--     ip_address INET,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     expires_at TIMESTAMPTZ NOT NULL,
--     last_used_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
-- CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- -- ============================================================================
-- -- GYM ATTENDANCE (CHECK-IN/CHECK-OUT)
-- -- ============================================================================

-- CREATE TABLE gym_attendance (
--     id SERIAL PRIMARY KEY,
--     user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
--     -- Time tracking
--     check_in_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     check_out_time TIMESTAMPTZ,
--     duration_minutes INT,
    
--     -- Status
--     status attendance_status DEFAULT 'checked_in' NOT NULL,
    
--     -- Check-in method
--     method TEXT DEFAULT 'qr' CHECK (method IN ('qr', 'manual', 'admin')),
    
--     -- Optional fields
--     location_id TEXT,
--     verified_by INT REFERENCES users(id),
    
--     -- Timestamps
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
--     -- Constraints
--     CONSTRAINT valid_checkout CHECK (
--         check_out_time IS NULL OR check_out_time > check_in_time
--     ),
--     CONSTRAINT valid_duration CHECK (
--         duration_minutes IS NULL OR duration_minutes >= 0
--     )
-- );

-- CREATE INDEX idx_attendance_user_checkin ON gym_attendance(user_id, check_in_time DESC);
-- CREATE INDEX idx_attendance_active_sessions ON gym_attendance(user_id, status, check_in_time DESC) WHERE check_out_time IS NULL;
-- CREATE UNIQUE INDEX idx_attendance_user_date ON gym_attendance(user_id, DATE(check_in_time)) WHERE check_out_time IS NULL;
-- CREATE INDEX idx_attendance_current_occupancy ON gym_attendance(check_in_time DESC) WHERE check_out_time IS NULL;
-- CREATE INDEX idx_attendance_date_range ON gym_attendance(check_in_time, check_out_time);

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
--     tool_calls JSONB,
--     tool_call_id TEXT,
--     name TEXT,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
-- CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);

-- -- ============================================================================
-- -- GYM EQUIPMENT INVENTORY
-- -- ============================================================================

-- CREATE TABLE equipment_category (
--     id SERIAL PRIMARY KEY,
--     name TEXT UNIQUE NOT NULL,
--     description TEXT,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE muscle_group (
--     id SERIAL PRIMARY KEY,
--     name TEXT UNIQUE NOT NULL,
--     description TEXT,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE equipment (
--     id SERIAL PRIMARY KEY,
--     name TEXT NOT NULL,
--     category_id INT NOT NULL REFERENCES equipment_category (id),
--     type TEXT,
--     description TEXT,
    
--     -- Equipment tracking
--     quantity INT DEFAULT 1 CHECK (quantity >= 0),
--     is_available BOOLEAN DEFAULT TRUE,
--     maintenance_notes TEXT,
--     last_maintenance_date DATE,
    
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Many-to-many: Equipment can target multiple muscle groups
-- CREATE TABLE equipment_muscle (
--     equipment_id INT NOT NULL REFERENCES equipment (id) ON DELETE CASCADE,
--     muscle_group_id INT NOT NULL REFERENCES muscle_group (id) ON DELETE CASCADE,
--     PRIMARY KEY (equipment_id, muscle_group_id)
-- );

-- CREATE INDEX idx_equipment_category ON equipment(category_id);
-- CREATE INDEX idx_equipment_available ON equipment(is_available);
-- CREATE INDEX idx_equipment_muscle_equipment ON equipment_muscle(equipment_id);
-- CREATE INDEX idx_equipment_muscle_group ON equipment_muscle(muscle_group_id);

-- -- ============================================================================
-- -- WORKOUT PLANS & PROGRAMMING
-- -- ============================================================================

-- CREATE TABLE workout_plans (
--     id SERIAL PRIMARY KEY,
--     user_id INT REFERENCES users(id) ON DELETE CASCADE,
--     title TEXT NOT NULL,
--     description TEXT,
--     duration_weeks INT,
--     days_per_week INT,
--     difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
--     is_active BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE workout_days (
--     id SERIAL PRIMARY KEY,
--     plan_id INT REFERENCES workout_plans(id) ON DELETE CASCADE,
--     day_order INT NOT NULL,
--     title TEXT NOT NULL,
--     is_rest_day BOOLEAN DEFAULT FALSE,
--     rest_day_notes TEXT
-- );

-- CREATE TABLE workout_exercises (
--     id SERIAL PRIMARY KEY,
--     workout_day_id INT NOT NULL REFERENCES workout_days (id) ON DELETE CASCADE,
--     exercise_order INT NOT NULL,
--     exercise_name TEXT NOT NULL,
--     equipment_id INT REFERENCES equipment (id),
    
--     -- Volume parameters
--     sets INT CHECK (sets IS NULL OR sets > 0),
--     reps INT CHECK (reps IS NULL OR reps > 0),
--     duration_seconds INT CHECK (duration_seconds IS NULL OR duration_seconds > 0),
--     rest_seconds INT CHECK (rest_seconds IS NULL OR rest_seconds >= 0),
    
--     -- Intensity & technique
--     weight_guidance TEXT,
--     tempo TEXT,
    
--     -- Instructions
--     description TEXT,
--     notes TEXT,
    
--     -- Exercise classification
--     is_warmup BOOLEAN DEFAULT FALSE,
--     is_superset BOOLEAN DEFAULT FALSE,
--     superset_group INT,
    
--     -- Constraints
--     CONSTRAINT reps_or_duration_only CHECK (
--         (reps IS NOT NULL AND duration_seconds IS NULL) OR
--         (reps IS NULL AND duration_seconds IS NOT NULL) OR
--         (reps IS NULL AND duration_seconds IS NULL)
--     ),
--     CONSTRAINT superset_consistency CHECK (
--         (is_superset = FALSE AND superset_group IS NULL) OR
--         (is_superset = TRUE AND superset_group IS NOT NULL)
--     )
-- );

-- CREATE INDEX idx_workout_plans_user ON workout_plans(user_id);
-- CREATE INDEX idx_workout_plans_active ON workout_plans(user_id, is_active);
-- CREATE INDEX idx_workout_days_plan ON workout_days(plan_id);
-- CREATE INDEX idx_workout_exercises_day ON workout_exercises(workout_day_id);
-- CREATE INDEX idx_workout_exercises_equipment ON workout_exercises(equipment_id);

-- -- ============================================================================
-- -- WORKOUT LOGGING & TRACKING
-- -- ============================================================================

-- CREATE TABLE workout_logs (
--     id SERIAL PRIMARY KEY,
--     user_id INT REFERENCES users(id) ON DELETE CASCADE,
--     workout_exercise_id INT REFERENCES workout_exercises(id) ON DELETE CASCADE,
    
--     -- Completed metrics
--     completed_sets INT CHECK (completed_sets >= 0),
--     completed_reps INT CHECK (completed_reps >= 0),
--     weight_used_kg NUMERIC(6, 2),
--     duration_minutes INT,
    
--     -- User feedback
--     difficulty_rating INT CHECK (difficulty_rating BETWEEN 1 AND 10),
--     notes TEXT,
    
--     logged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE INDEX idx_workout_logs_user ON workout_logs(user_id);
-- CREATE INDEX idx_workout_logs_exercise ON workout_logs(workout_exercise_id);
-- CREATE INDEX idx_workout_logs_date ON workout_logs(logged_at);

-- -- ============================================================================
-- -- USER INDEXES
-- -- ============================================================================

-- CREATE INDEX idx_users_email ON users(email);
-- CREATE INDEX idx_users_username ON users(username);
-- CREATE INDEX idx_users_role ON users(role);
-- CREATE INDEX idx_users_last_check_in ON users(last_check_in DESC);
-- CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
-- CREATE INDEX idx_subscriptions_expiry ON subscriptions(expiry_date) WHERE status = 'active';

-- -- ============================================================================
-- -- TRIGGERS
-- -- ============================================================================

-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER update_users_updated_at 
-- BEFORE UPDATE ON users
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_user_profiles_updated_at 
-- BEFORE UPDATE ON user_profiles
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_subscriptions_updated_at 
-- BEFORE UPDATE ON subscriptions
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_equipment_updated_at 
-- BEFORE UPDATE ON equipment
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_workout_plans_updated_at 
-- BEFORE UPDATE ON workout_plans
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -- ============================================================================
-- -- UTILITY FUNCTIONS
-- -- ============================================================================

-- -- Reset monthly visit counters
-- CREATE OR REPLACE FUNCTION reset_monthly_visits()
-- RETURNS void AS $$
-- BEGIN
--     UPDATE users SET total_visits_this_month = 0;
--     RAISE NOTICE 'Monthly visit counters reset for all users';
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Get current gym occupancy
-- CREATE OR REPLACE FUNCTION get_current_occupancy()
-- RETURNS TABLE(
--     total_checked_in BIGINT,
--     member_names TEXT[]
-- ) AS $$
-- BEGIN
--     RETURN QUERY
--     SELECT 
--         COUNT(*)::BIGINT,
--         ARRAY_AGG(u.first_name || ' ' || u.last_name ORDER BY ga.check_in_time DESC)
--     FROM gym_attendance ga
--     JOIN users u ON ga.user_id = u.id
--     WHERE ga.check_out_time IS NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Get user workout stats
-- CREATE OR REPLACE FUNCTION get_user_workout_stats(p_user_id INT)
-- RETURNS TABLE(
--     total_workouts BIGINT,
--     total_duration_hours NUMERIC,
--     avg_duration_minutes NUMERIC,
--     longest_workout_minutes INT
-- ) AS $$
-- BEGIN
--     RETURN QUERY
--     SELECT 
--         COUNT(*)::BIGINT,
--         ROUND(SUM(duration_minutes) / 60.0, 2),
--         ROUND(AVG(duration_minutes), 0),
--         MAX(duration_minutes)
--     FROM gym_attendance
--     WHERE user_id = p_user_id
--     AND check_out_time IS NOT NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- ============================================================================
-- -- SEED DATA: GYM EQUIPMENT INVENTORY
-- -- ============================================================================

-- -- Categories
-- INSERT INTO equipment_category (name, description) VALUES
--     ('Free Weight', 'Barbells, dumbbells, and free weight accessories'),
--     ('Machine', 'Weight machines and cable systems'),
--     ('Accessory', 'Yoga balls, resistance bands, and other accessories'),
--     ('Cardio', 'Treadmills, bikes, and cardio equipment');

-- -- Muscle Groups
-- INSERT INTO muscle_group (name, description) VALUES
--     ('Chest', 'Pectoralis major and minor'),
--     ('Back', 'Latissimus dorsi, rhomboids, trapezius'),
--     ('Legs', 'Quadriceps, hamstrings, glutes, calves'),
--     ('Shoulders', 'Deltoids (anterior, lateral, posterior)'),
--     ('Arms', 'Biceps, triceps, forearms'),
--     ('Core', 'Abdominals, obliques, lower back'),
--     ('Cardio', 'Cardiovascular system and endurance');

-- -- Equipment Inventory
-- INSERT INTO equipment (name, category_id, type, description, quantity) VALUES
--     -- Free Weights
--     ('Dumbbells', 1, 'Free Weight', 'Standard adjustable or fixed dumbbells', 20),
--     ('Barbells', 1, 'Free Weight', 'Olympic or standard straight bars', 5),
--     ('Curve Barbells', 1, 'Free Weight', 'EZ-Curl bars for arm isolation', 3),
--     ('Arm Bars', 1, 'Free Weight', 'Specialized bars for triceps/biceps', 2),
--     ('Barbell Squat Station', 1, 'Station', 'Squat rack or power cage', 2),
    
--     -- Accessories
--     ('Yoga Ball', 3, 'Accessory', 'Stability ball for core and balance', 10),
--     ('Resistance Bands', 3, 'Accessory', 'Elastic bands for warming up or resistance', 15),
    
--     -- Machines - Upper Body
--     ('Bench Press Station', 2, 'Station', 'Flat bench rack for chest press', 3),
--     ('Pec Deck', 2, 'Isolation Machine', 'Seated fly machine for chest definition', 1),
--     ('Incline Press Machine', 2, 'Press Machine', 'Upper chest press machine', 1),
--     ('Cable Row', 2, 'Cable Machine', 'Seated row for back thickness', 2),
--     ('Lat Machine', 2, 'Cable Machine', 'General cable machine for back/arms', 2),
--     ('Lat Pulldown', 2, 'Cable Machine', 'Vertical pulldown for back width', 2),
    
--     -- Machines - Lower Body
--     ('Leg Press', 2, 'Leg Machine', 'Sled machine for heavy leg pressing', 2),
--     ('Calf Raise Machine', 2, 'Leg Machine', 'Isolation machine for calves', 1),
--     ('Leg Extension Machine', 2, 'Leg Machine', 'Seated machine for quadriceps', 1),
--     ('Leg Curl Machine', 2, 'Leg Machine', 'Seated or lying machine for hamstrings', 1),
--     ('Hack Squat Machine', 2, 'Leg Machine', 'Angled squat machine for legs', 1),
    
--     -- Multipurpose
--     ('Smith Machine', 2, 'Multipurpose', 'Guided barbell system for safety', 1),
    
--     -- Cardio
--     ('Cardio Bike', 4, 'Cardio', 'Stationary bicycle', 10),
--     ('Treadmill', 4, 'Cardio', 'Running/Walking machine', 8);

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
--     wp.is_active,
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
--     e.is_available as equipment_available,
--     we.sets,
--     we.reps,
--     we.duration_seconds,
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
--     e.quantity,
--     e.is_available,
--     e.description
-- FROM equipment e
-- JOIN equipment_category ec ON e.category_id = ec.id
-- JOIN equipment_muscle em ON e.id = em.equipment_id
-- JOIN muscle_group mg ON em.muscle_group_id = mg.id
-- ORDER BY mg.name, e.name;

-- -- View: Current gym status
-- CREATE VIEW v_gym_status AS
-- SELECT 
--     (SELECT COUNT(*) FROM users WHERE role = 'member' AND account_status = 'active') as total_members,
--     (SELECT COUNT(*) FROM gym_attendance WHERE check_out_time IS NULL) as currently_checked_in,
--     (SELECT COUNT(*) FROM equipment WHERE is_available = true) as available_equipment,
--     (SELECT COUNT(*) FROM workout_plans WHERE is_active = true) as active_workout_plans;

-- -- ============================================================================
-- -- COMMENTS FOR DOCUMENTATION
-- -- ============================================================================

-- COMMENT ON TABLE users IS 'Core user accounts with authentication and profile data';
-- COMMENT ON TABLE gym_attendance IS 'Check-in/check-out records with duration tracking';
-- COMMENT ON TABLE equipment IS 'Gym equipment inventory with availability status';
-- COMMENT ON TABLE workout_plans IS 'User-specific workout programs with metadata';
-- COMMENT ON TABLE workout_exercises IS 'Specific exercises with programming details';
-- COMMENT ON TABLE workout_logs IS 'User completion records for progress tracking';

-- COMMENT ON COLUMN users.total_visits_all_time IS 'Lifetime visit counter for gamification';
-- COMMENT ON COLUMN users.total_visits_this_month IS 'Monthly visit counter, reset on 1st of each month';
-- COMMENT ON COLUMN gym_attendance.duration_minutes IS 'Auto-calculated on checkout';
-- COMMENT ON COLUMN gym_attendance.status IS 'checked_in or checked_out';
-- COMMENT ON COLUMN equipment.quantity IS 'Number of this equipment available';
-- COMMENT ON COLUMN equipment.is_available IS 'false if under maintenance';
-- COMMENT ON COLUMN workout_exercises.tempo IS 'Format: eccentric-pause-concentric-pause (e.g., 3-0-1-0)';
-- COMMENT ON COLUMN workout_exercises.weight_guidance IS 'Intensity prescription: RPE, %1RM, or descriptive';

-- -- ═══════════════════════════════════════════════════════════════════════════
-- -- SCHEMA COMPLETE ✅
-- -- ═══════════════════════════════════════════════════════════════════════════




-- --------------------------------



-- -- ============================================================================
-- -- MIGRATION: Add subscription plans + payments
-- -- ============================================================================

-- -- ── 1. Subscription Plans (price templates) ──────────────────────────────────
-- -- Stores the gym's available plans so admins pick from a list instead of
-- -- manually typing a price each time. Prices can be updated over time without
-- -- breaking historical payment records.

-- CREATE TABLE subscription_plans (
--     id          SERIAL PRIMARY KEY,
--     name        TEXT NOT NULL UNIQUE,          -- e.g. "Monthly", "Quarterly", "Annual"
--     description TEXT,
--     price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
--     duration_days INT NOT NULL CHECK (duration_days > 0), -- 30, 90, 365, etc.
--     is_active   BOOLEAN DEFAULT TRUE,          -- hide retired plans without deleting
--     created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- -- ── 2. Link subscriptions to a plan (optional but recommended) ──────────────
-- -- Adds a reference to subscription_plans on the existing subscriptions table.
-- -- plan_name is kept for display; plan_id is the FK for joins.
-- ALTER TABLE subscriptions
--     ADD COLUMN plan_id INT REFERENCES subscription_plans(id) ON DELETE SET NULL;

-- -- ── 3. Payments ───────────────────────────────────────────────────────────────
-- -- One payment record per transaction. Admin creates this manually when a member
-- -- pays. Linked to a subscription so you know what was paid for.

-- CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'refunded', 'cancelled');
-- CREATE TYPE payment_method AS ENUM ('cash', 'gcash', 'maya', 'bank_transfer', 'card', 'other');

-- CREATE TABLE payments (
--     id              SERIAL PRIMARY KEY,
--     user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     subscription_id INT REFERENCES subscriptions(id) ON DELETE SET NULL,
--     plan_id         INT REFERENCES subscription_plans(id) ON DELETE SET NULL,

--     -- The actual amount collected (admin can override plan price if needed,
--     -- e.g. for discounts or prorated payments)
--     amount          NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
--     currency        TEXT DEFAULT 'PHP',

--     status          payment_status DEFAULT 'paid',
--     method          payment_method DEFAULT 'cash',

--     -- Admin who recorded the payment
--     recorded_by     INT REFERENCES users(id) ON DELETE SET NULL,

--     -- Optional reference number (GCash ref, bank ref, receipt no.)
--     reference_no    TEXT,
--     notes           TEXT,

--     paid_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE INDEX idx_payments_user       ON payments(user_id);
-- CREATE INDEX idx_payments_status     ON payments(status);
-- CREATE INDEX idx_payments_paid_at    ON payments(paid_at DESC);
-- CREATE INDEX idx_payments_sub        ON payments(subscription_id);

-- -- Trigger for updated_at
-- CREATE TRIGGER update_subscription_plans_updated_at
-- BEFORE UPDATE ON subscription_plans
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_payments_updated_at
-- BEFORE UPDATE ON payments
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -- ── 4. Seed: default plans ────────────────────────────────────────────────────
-- -- Adjust prices to match your gym's actual rates.

-- INSERT INTO subscription_plans (name, description, price, duration_days) VALUES
--     ('Monthly',    '1-month gym access',   799.00,  30),
--     ('Quarterly',  '3-month gym access',  2199.00,  90),
--     ('Semi-Annual','6-month gym access',  3999.00, 180),
--     ('Annual',     '12-month gym access', 6999.00, 365);

-- -- ============================================================================
-- -- MIGRATION: Product Inventory System
-- -- ============================================================================

-- -- ── 1. Product Categories ────────────────────────────────────────────────────
-- CREATE TABLE product_categories (
--     id SERIAL PRIMARY KEY,
--     name TEXT UNIQUE NOT NULL, -- e.g., 'Beverages', 'Supplements', 'Accessories'
--     description TEXT,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- -- ── 2. Product Status Enum ───────────────────────────────────────────────────
-- -- Using an ENUM ensures the 'status' field stays consistent
-- CREATE TYPE product_status AS ENUM ('available', 'out_of_stock', 'unavailable');

-- -- ── 3. Products Table ────────────────────────────────────────────────────────
-- CREATE TABLE products (
--     id SERIAL PRIMARY KEY,
--     name TEXT NOT NULL,
--     category_id INT NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
--     price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
--     stocks INT DEFAULT 0 CHECK (stocks >= 0),
--     status product_status DEFAULT 'available',
--     is_active BOOLEAN DEFAULT TRUE, -- Corresponds to your "available: true/false"
--     last_restock_at TIMESTAMPTZ,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- -- ── 4. Indexes for performance ──────────────────────────────────────────────
-- CREATE INDEX idx_products_category ON products(category_id);
-- CREATE INDEX idx_products_status ON products(status);

-- -- ── 5. Trigger for updated_at ────────────────────────────────────────────────
-- CREATE TRIGGER update_products_updated_at
-- BEFORE UPDATE ON products
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -- ── 6. Seed Data ─────────────────────────────────────────────────────────────
-- INSERT INTO product_categories (name) VALUES 
--     ('Supplements'), 
--     ('Accessories'), 
--     ('Beverages');

-- -- Note: In a real migration, you'd find the IDs first, but for seed:
-- INSERT INTO products (name, category_id, price, stocks, status, is_active, last_restock_at) VALUES
--     ('Whey Protein (5lbs)', 1, 2450.00, 15, 'available', true, '2024-03-10'),
--     ('Foam Grip Rolls', 2, 350.00, 0, 'out_of_stock', true, '2024-03-12'),
--     ('Pocari Sweat', 3, 55.00, 0, 'unavailable', false, '2024-04-06');


-- CREATE VIEW v_product_inventory AS

-- SELECT 
--     p.id,
--     p.name AS product_name,
--     p.price,
--     p.last_restock_at AS last_restock,
--     p.is_active AS available,
--     p.stocks,
--     p.status,
--     c.name AS category
-- FROM products p
-- JOIN product_categories c ON p.category_id = c.id;


-- -- ==================================================================================

-- -- 1. Add Type Enum
-- CREATE TYPE trans_type AS ENUM ('plan', 'product');

-- -- 2. Modify Payments Table
-- ALTER TABLE payments ADD COLUMN transaction_type trans_type DEFAULT 'plan';
-- ALTER TABLE payments ADD COLUMN product_id INT REFERENCES products(id) ON DELETE SET NULL;

-- -- 3. Create the Unified View
-- CREATE OR REPLACE VIEW v_all_transactions AS
-- SELECT 
--     p.id AS transaction_id,
--     p.user_id,
--     u.first_name || ' ' || u.last_name AS member_name,
--     p.transaction_type,
--     CASE 
--         WHEN p.transaction_type = 'plan' THEN sp.name 
--         WHEN p.transaction_type = 'product' THEN prod.name
--     END AS item_name,
--     p.amount,
--     p.method,
--     p.status,
--     p.paid_at,
--     p.reference_no
-- FROM payments p
-- JOIN users u ON p.user_id = u.id
-- LEFT JOIN subscription_plans sp ON p.plan_id = sp.id
-- LEFT JOIN products prod ON p.product_id = prod.id;


-- ALTER TABLE payments ADD COLUMN quantity INT DEFAULT 1;

-- CREATE DATABASE careon_gym_db;

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('member', 'admin', 'trainer');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'pending', 'cancelled');
CREATE TYPE attendance_status AS ENUM ('checked_in', 'checked_out');
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'refunded', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'gcash', 'maya', 'bank_transfer', 'card', 'other');
CREATE TYPE product_status AS ENUM ('available', 'out_of_stock', 'unavailable');
CREATE TYPE trans_type AS ENUM ('plan', 'product');

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role user_role DEFAULT 'member',
    verified BOOLEAN DEFAULT false,
    profile_image_url TEXT,

    last_login TIMESTAMPTZ,
    last_check_in TIMESTAMPTZ,
    total_visits_all_time INT DEFAULT 0 NOT NULL,
    total_visits_this_month INT DEFAULT 0 NOT NULL,

    account_status TEXT DEFAULT 'active'
        CHECK (account_status IN ('active', 'suspended', 'deleted')),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    height_cm INT CHECK (height_cm > 0 AND height_cm < 300),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    birth_date DATE CHECK (birth_date <= CURRENT_DATE),
    goal TEXT,
    activity_level TEXT CHECK (
        activity_level IN ('sedentary','light','moderate','active','very_active')
    ),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BODY METRICS
-- ============================================================================

CREATE TABLE body_metrics (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_kg NUMERIC(5,2) CHECK (weight_kg > 0 AND weight_kg < 500),
    body_fat_percent NUMERIC(5,2) CHECK (body_fat_percent BETWEEN 0 AND 100),
    muscle_mass_kg NUMERIC(5,2) CHECK (muscle_mass_kg > 0),
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_body_metrics_user_recorded 
ON body_metrics(user_id, recorded_at DESC);

-- ============================================================================
-- SUBSCRIPTION SYSTEM
-- ============================================================================

CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    duration_days INT NOT NULL CHECK (duration_days > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INT REFERENCES subscription_plans(id) ON DELETE SET NULL,

    plan_name TEXT NOT NULL,
    status subscription_status DEFAULT 'pending',

    start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,

    auto_renew BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_status 
ON subscriptions(user_id, status);

CREATE INDEX idx_subscriptions_expiry 
ON subscriptions(expiry_date) WHERE status = 'active';

-- ============================================================================
-- PAYMENTS
-- ============================================================================

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INT REFERENCES subscriptions(id) ON DELETE SET NULL,
    plan_id INT REFERENCES subscription_plans(id) ON DELETE SET NULL,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,

    transaction_type trans_type DEFAULT 'plan',

    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    quantity INT DEFAULT 1,
    currency TEXT DEFAULT 'PHP',

    status payment_status DEFAULT 'paid',
    method payment_method DEFAULT 'cash',

    recorded_by INT REFERENCES users(id) ON DELETE SET NULL,
    reference_no TEXT,
    notes TEXT,

    paid_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_transaction CHECK (
        (transaction_type = 'plan' AND plan_id IS NOT NULL AND product_id IS NULL)
        OR
        (transaction_type = 'product' AND product_id IS NOT NULL)
    )
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at DESC);

-- ============================================================================
-- PRODUCT INVENTORY
-- ============================================================================

CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category_id INT NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    stocks INT DEFAULT 0 CHECK (stocks >= 0),
    status product_status DEFAULT 'available',
    is_active BOOLEAN DEFAULT TRUE,
    last_restock_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);

-- ============================================================================
-- USER SESSIONS
-- ============================================================================

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    device_info TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================================================
-- ATTENDANCE
-- ============================================================================

CREATE TABLE gym_attendance (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMPTZ,
    duration_minutes INT,
    status attendance_status DEFAULT 'checked_in',
    method TEXT DEFAULT 'qr' CHECK (method IN ('qr','manual','admin')),
    verified_by INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_user_checkin 
ON gym_attendance(user_id, check_in_time DESC);

-- ============================================================================
-- CHAT SYSTEM (AI READY)
-- ============================================================================

CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('model','trainer')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user','assistant','system','tool')) NOT NULL,
    content TEXT,
    tool_calls JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_tool_calls ON chat_messages USING GIN (tool_calls);

-- ============================================================================
-- EQUIPMENT SYSTEM (FULL)
-- ============================================================================

CREATE TABLE equipment_category (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE muscle_group (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category_id INT REFERENCES equipment_category(id),
    type TEXT,
    description TEXT,
    quantity INT DEFAULT 1,
    is_available BOOLEAN DEFAULT TRUE,
    maintenance_notes TEXT,
    last_maintenance_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipment_muscle (
    equipment_id INT REFERENCES equipment(id) ON DELETE CASCADE,
    muscle_group_id INT REFERENCES muscle_group(id) ON DELETE CASCADE,
    PRIMARY KEY (equipment_id, muscle_group_id)
);

-- ============================================================================
-- WORKOUT SYSTEM
-- ============================================================================

CREATE TABLE workout_plans (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    duration_weeks INT,
    days_per_week INT,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner','intermediate','advanced')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workout_days (
    id SERIAL PRIMARY KEY,
    plan_id INT REFERENCES workout_plans(id) ON DELETE CASCADE,
    day_order INT,
    title TEXT,
    is_rest_day BOOLEAN DEFAULT FALSE
);

CREATE TABLE workout_exercises (
    id SERIAL PRIMARY KEY,
    workout_day_id INT REFERENCES workout_days(id) ON DELETE CASCADE,
    exercise_name TEXT,
    equipment_id INT REFERENCES equipment(id),
    sets INT,
    reps INT,
    duration_seconds INT
);

CREATE TABLE workout_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    workout_exercise_id INT REFERENCES workout_exercises(id),
    completed_sets INT,
    completed_reps INT,
    duration_seconds INT,
    weight_used_kg NUMERIC(6,2),
    logged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON subscription_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE VIEW v_all_transactions AS
SELECT 
    p.id AS transaction_id,
    p.user_id,
    u.first_name || ' ' || u.last_name AS member_name,
    p.transaction_type,
    CASE 
        WHEN p.transaction_type = 'plan' THEN sp.name 
        WHEN p.transaction_type = 'product' THEN prod.name
    END AS item_name,
    p.amount,
    p.quantity,
    p.method,
    p.status,
    p.paid_at,
    p.reference_no
FROM payments p
JOIN users u ON p.user_id = u.id
LEFT JOIN subscription_plans sp ON p.plan_id = sp.id
LEFT JOIN products prod ON p.product_id = prod.id;



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