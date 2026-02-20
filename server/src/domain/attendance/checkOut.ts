import pool from "../../config/pool.ts";

export const checkOutDomain = async (params: { userId: number }) => {
    const { userId } = params;

    // 1. Find active session
    const activeSession = await pool.query(
        `SELECT id, check_in_time FROM gym_attendance
         WHERE user_id = $1
         AND check_out_time IS NULL
         ORDER BY check_in_time DESC
         LIMIT 1`,
        [userId],
    );

    if (activeSession.rowCount === 0) {
        throw new Error(
            "No active session found. You are not currently checked in.",
        );
    }

    const sessionId = activeSession.rows[0].id;

    // 2. Update session with check-out time and calculate duration
    const result = await pool.query(
        `UPDATE gym_attendance
         SET check_out_time = NOW(),
             duration_minutes = EXTRACT(EPOCH FROM (NOW() - check_in_time)) / 60,
             status = 'checked_out'
         WHERE id = $1
         RETURNING id, check_in_time, check_out_time, duration_minutes, status`,
        [sessionId],
    );

    return {
        session_id: result.rows[0].id,
        checked_in_at: result.rows[0].check_in_time,
        checked_out_at: result.rows[0].check_out_time,
        duration_minutes: Math.round(result.rows[0].duration_minutes),
        status: result.rows[0].status,
    };
};
