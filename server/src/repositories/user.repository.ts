// repositories/user.repository.ts
import pool from "../config/pool.ts";

export const userQuery = async (userId: number) => {
    return await pool.query(
        `SELECT 
            u.id,
            u.username,
            u.first_name,
            u.last_name,
            u.phone_number,
            u.email,
            u.role,
            u.verified,
            u.profile_image_url,
            u.last_login,
            u.account_status,
            u.created_at,
            u.updated_at,
            p.height_cm,
            p.gender,
            p.birth_date,
            p.goal,
            p.activity_level
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.id = $1`,
        [userId],
    );
};

export const metricsQuery = async (userId: number) => {
    return await pool.query(
        `SELECT 
            weight_kg,
            body_fat_percent,
            muscle_mass_kg,
            recorded_at
        FROM body_metrics
        WHERE user_id = $1
        ORDER BY recorded_at DESC
        LIMIT 1`,
        [userId],
    );
};

export const subscriptionQuery = async (userId: number) => {
    return await pool.query(
        `SELECT 
            status,
            plan_name,
            start_date,
            expiry_date,
            auto_renew
        FROM subscriptions
        WHERE user_id = $1`,
        [userId],
    );
};

export const updateUserQuery = async (
    userId: number,
    updates: {
        firstName?: string;
        lastName?: string;
        username?: string;
        phoneNumber?: string;
        profileImageUrl?: string;
    },
) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.firstName !== undefined) {
        fields.push(`first_name = $${paramCount++}`);
        values.push(updates.firstName);
    }
    if (updates.lastName !== undefined) {
        fields.push(`last_name = $${paramCount++}`);
        values.push(updates.lastName);
    }
    if (updates.username !== undefined) {
        fields.push(`username = $${paramCount++}`);
        values.push(updates.username);
    }
    if (updates.phoneNumber !== undefined) {
        fields.push(`phone_number = $${paramCount++}`);
        values.push(updates.phoneNumber);
    }
    if (updates.profileImageUrl !== undefined) {
        fields.push(`profile_image_url = $${paramCount++}`);
        values.push(updates.profileImageUrl);
    }

    if (fields.length === 0) {
        throw new Error("No fields to update");
    }

    values.push(userId);

    return await pool.query(
        `UPDATE users 
         SET ${fields.join(", ")}
         WHERE id = $${paramCount}
         RETURNING *`,
        values,
    );
};

export const updateProfileQuery = async (
    userId: number,
    updates: {
        heightCm?: number;
        gender?: string;
        birthDate?: Date;
        goal?: string;
        activityLevel?: string;
    },
) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.heightCm !== undefined) {
        fields.push(`height_cm = $${paramCount++}`);
        values.push(updates.heightCm);
    }
    if (updates.gender !== undefined) {
        fields.push(`gender = $${paramCount++}`);
        values.push(updates.gender);
    }
    if (updates.birthDate !== undefined) {
        fields.push(`birth_date = $${paramCount++}`);
        values.push(updates.birthDate);
    }
    if (updates.goal !== undefined) {
        fields.push(`goal = $${paramCount++}`);
        values.push(updates.goal);
    }
    if (updates.activityLevel !== undefined) {
        fields.push(`activity_level = $${paramCount++}`);
        values.push(updates.activityLevel);
    }

    if (fields.length === 0) {
        throw new Error("No fields to update");
    }

    values.push(userId);

    // Upsert - insert if not exists, update if exists
    return await pool.query(
        `INSERT INTO user_profiles (user_id, ${Object.keys(updates)
            .map((k) => k.replace(/([A-Z])/g, "_$1").toLowerCase())
            .join(", ")})
         VALUES ($${paramCount}, ${fields.map((_, i) => `$${i + 1}`).join(", ")})
         ON CONFLICT (user_id) 
         DO UPDATE SET ${fields.join(", ")}
         RETURNING *`,
        values,
    );
};

export const addBodyMetricQuery = async (
    userId: number,
    metrics: {
        weightKg: number;
        bodyFatPercent: number;
        muscleMassKg: number;
    },
) => {
    return await pool.query(
        `INSERT INTO body_metrics (user_id, weight_kg, body_fat_percent, muscle_mass_kg)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
            userId,
            metrics.weightKg,
            metrics.bodyFatPercent,
            metrics.muscleMassKg,
        ],
    );
};

export const getBodyMetricsHistoryQuery = async (
    userId: number,
    limit = 30,
) => {
    return await pool.query(
        `SELECT 
            weight_kg,
            body_fat_percent,
            muscle_mass_kg,
            recorded_at
         FROM body_metrics
         WHERE user_id = $1
         ORDER BY recorded_at DESC
         LIMIT $2`,
        [userId, limit],
    );
};
