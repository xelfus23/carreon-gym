CREATE DATABASE careon_gym_db;

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

-- =====================================================================
-- ATTENDANCE ATTEMPTS (QR SCAN LOGS)
-- =====================================================================



ALTER TABLE gym_attendance
ADD COLUMN log_status TEXT
CHECK (log_status IN ('success', 'failed'));


ALTER TABLE gym_attendance
ADD COLUMN failure_reason TEXT;


--------- RECENT UPDATE ------------
CREATE TABLE attendance_attempts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,

    action TEXT NOT NULL, 
    -- 'check_in' | 'check_out'

    result TEXT NOT NULL,
    -- 'success' | 'failed'

    reason TEXT,
    -- NO_SUBSCRIPTION | ALREADY_CHECKED_IN | INVALID_QR | etc

    metadata JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

