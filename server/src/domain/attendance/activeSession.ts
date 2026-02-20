import pool from "../../config/pool.ts";

export const getActiveSessionDomain = async (params: { userId: number }) => {
    const { userId } = params;

    const result = await pool.query(
        `SELECT 
            id as session_id,
            check_in_time,
            EXTRACT(EPOCH FROM (NOW() - check_in_time)) / 60 as current_duration_minutes,
            status
         FROM gym_attendance
         WHERE user_id = $1
         AND check_out_time IS NULL
         ORDER BY check_in_time DESC
         LIMIT 1`,
        [userId],
    );

    if (result.rowCount === 0) {
        return {
            has_active_session: false,
            session: null,
        };
    }

    return {
        has_active_session: true,
        session: {
            session_id: result.rows[0].session_id,
            checked_in_at: result.rows[0].check_in_time,
            current_duration_minutes: Math.round(
                result.rows[0].current_duration_minutes,
            ),
            status: result.rows[0].status,
        },
    };
};
