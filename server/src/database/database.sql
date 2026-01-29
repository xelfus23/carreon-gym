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