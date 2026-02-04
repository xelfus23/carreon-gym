import pool from "../config/pool.ts";

export const userQuery = async (userId: string | number) => {
    const query = `
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.username,
                u.email,
                u.role,
                u.phone_number,
                u.created_at,
                p.height_cm,
                p.gender,
                p.birth_date,
                p.goal,
                p.activity_level
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.id = $1
        `;
        
    return await pool.query(query, [userId]);
};

export const metricsQuery = async (userId: number | string) => {
    const query = `
            SELECT weight_kg, body_fat_percent, muscle_mass_kg, recorded_at
            FROM body_metrics
            WHERE user_id = $1
            ORDER BY recorded_at DESC
            LIMIT 1
        `;

    return await pool.query(query, [userId]);
};
