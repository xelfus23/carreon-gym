CREATE DATABASE careon_gym_db;

CREATE TABLE
    users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone_number INTEGER UNIQUE,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'trainer')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    user_profiles (
        user_id INT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
        height_cm INT CHECK (height_cm > 0),
        gender TEXT CHECK (gender IN ('male', 'female', 'other')),
        birth_date DATE,
        goal TEXT,
        activity_level TEXT CHECK (
            activity_level IN (
                'sedentary',
                'light',
                'moderate',
                'active',
                'very_active'
            )
        ),
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    body_metrics (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users (id) ON DELETE CASCADE,
        weight_kg NUMERIC(5, 2) CHECK (weight_kg > 0),
        body_fat_percent NUMERIC(5, 2) CHECK (body_fat_percent BETWEEN 0 AND 100),
        muscle_mass_kg NUMERIC(5, 2),
        recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    chat_sessions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users (id) ON DELETE CASCADE,
        type TEXT CHECK (type IN ('model', 'trainer')) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    chat_messages (
        id SERIAL PRIMARY KEY,
        session_id INT REFERENCES chat_sessions (id) ON DELETE CASCADE,
        role TEXT CHECK (sender IN ('user', 'model')) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

------------------------------------------------------------------------------------------

-- Categories table
CREATE TABLE equipment_category (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Muscle groups table
CREATE TABLE muscle_group (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Equipment table
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category_id INT NOT NULL REFERENCES equipment_category(id),
    type TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Linking equipment to muscle groups (many-to-many)
CREATE TABLE equipment_muscle (
    equipment_id INT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    muscle_group_id INT NOT NULL REFERENCES muscle_group(id) ON DELETE CASCADE,
    PRIMARY KEY (equipment_id, muscle_group_id)
);


INSERT INTO equipment_category (name) VALUES
('Free Weight'),
('Machine'),
('Accessory'),
('Cardio');

INSERT INTO muscle_group (name) VALUES
('Chest'),
('Back'),
('Legs'),
('Shoulders'),
('Arms'),
('Core'),
('Full Body'),
('Cardio');

INSERT INTO equipment (name, category_id, type, description) VALUES
-- Free weights
('Dumbbells', 1, 'Dumbbell', 'Adjustable or fixed dumbbells, used for various exercises'),
('Barbells', 1, 'Barbell', 'Standard or Olympic barbells for free weight exercises'),
('Curve Barbells', 1, 'Barbell', 'EZ curl bar for arms exercises'),
('Arm Bars', 1, 'Barbell Accessory', 'Used for arm-focused exercises'),
('Resistance Bands', 3, 'Band', 'Elastic bands for resistance training'),
('Yoga Ball', 3, 'Ball', 'Used for stability and core exercises'),

-- Machines
('Bench Press', 2, 'Press Machine', 'Flat bench press machine for chest'),
('Incline Press', 2, 'Press Machine', 'Incline press machine for upper chest'),
('Pec Deck', 2, 'Isolation Machine', 'Machine for chest isolation'),
('Cable Row', 2, 'Cable Machine', 'Seated cable row for back muscles'),
('Lat Machine', 2, 'Cable Machine', 'Lat machine for upper back'),
('Lat Pulldown', 2, 'Cable Machine', 'Lat pulldown machine for back'),
('Leg Press', 2, 'Leg Machine', 'Leg press machine for quadriceps and glutes'),
('Smith Machine', 2, 'Multipurpose', 'Barbell guided smith machine'),
('Calf Raise Machine', 2, 'Leg Machine', 'Machine targeting calves'),
('Leg Extension / Leg Curl Machine', 2, 'Leg Machine', 'Machine for quads and hamstrings'),
('Cardio Bike', 4, 'Cardio Machine', 'Stationary bike for cardio'),
('Treadmill', 4, 'Cardio Machine', 'Running machine for cardio'),
('Hack Squat Machine', 2, 'Leg Machine', 'Machine for leg squats'),
('Barbell Squat', 1, 'Barbell', 'Free weight barbell squat');


-- Dumbbells
INSERT INTO equipment_muscle (equipment_id, muscle_group_id) VALUES
(1, 1), -- chest
(1, 2), -- back
(1, 3), -- legs
(1, 4), -- shoulders
(1, 5), -- arms
(1, 6); -- core

-- Barbell
INSERT INTO equipment_muscle (equipment_id, muscle_group_id) VALUES
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 5);

-- Curve Barbells
INSERT INTO equipment_muscle (equipment_id, muscle_group_id) VALUES
(3, 5); -- arms

-- Arm Bars
INSERT INTO equipment_muscle (equipment_id, muscle_group_id) VALUES
(4, 5);

-- Resistance Bands
INSERT INTO equipment_muscle (equipment_id, muscle_group_id) VALUES
(5, 1),
(5, 2),
(5, 3),
(5, 4),
(5, 5),
(5, 6);

-- Yoga Ball
INSERT INTO equipment_muscle (equipment_id, muscle_group_id) VALUES
(6, 6); -- core

-- Machines (example)
INSERT INTO equipment_muscle (equipment_id, muscle_group_id) VALUES
(7,1), -- Bench Press → chest
(8,1), -- Incline Press → chest
(9,1),
(10,2),
(11,2),
(12,2),
(13,3),
(14,1), -- Smith Machine can vary
(14,3),
(15,3), -- Calf Raise
(16,3),
(17,4),
(18,3), -- Hack Squat
(19,3); -- Barbell Squat
