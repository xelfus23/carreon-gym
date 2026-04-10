import pool from "../../config/pool.ts";

export const attendanceLogDomain = async () => {
    const query = `
    SELECT 
        ga.id,
        ga.user_id,
        u.first_name,
        u.last_name,
        ga.check_in_time,
        ga.check_out_time,
        ga.status,
        ga.method,
        -- Calculate duration in minutes if not already stored
        COALESCE(
            ga.duration_minutes, 
            EXTRACT(EPOCH FROM (ga.check_out_time - ga.check_in_time))/60
        )::INT AS duration
    FROM gym_attendance ga
    JOIN users u ON ga.user_id = u.id
    ORDER BY ga.check_in_time DESC;
  `;

    try {
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error("Error fetching attendance logs:", error);
        throw error;
    }
};
