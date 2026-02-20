import pool from "../../config/pool.ts";

export const checkInDomain = async (params: { userId: number }) => {
    const { userId } = params;

    // 1. Verify active subscription
    const sub = await pool.query(
        `SELECT 1 FROM subscriptions
         WHERE user_id = $1
         AND status = 'active'
         AND expiry_date > NOW()`,
        [userId],
    );

    if (sub.rowCount === 0) {
        throw new Error(
            "No active subscription. Please renew your plan to access the gym.",
        );
    }

    // 2. Check if user already has an active session (not checked out)
    const activeSession = await pool.query(
        `SELECT id, check_in_time FROM gym_attendance
         WHERE user_id = $1
         AND check_out_time IS NULL
         ORDER BY check_in_time DESC
         LIMIT 1`,
        [userId],
    );

    if (activeSession.rowCount && activeSession.rowCount > 0) {
        throw new Error("You are already checked in. Please check out first.");
    }

    // 3. Insert new check-in record
    const result = await pool.query(
        `INSERT INTO gym_attendance (user_id, check_in_time, status, method)
         VALUES ($1, NOW(), 'checked_in', 'qr')
         RETURNING id, user_id, check_in_time, status`,
        [userId],
    );

    // 4. Update user visit counters
    await pool.query(
        `UPDATE users
         SET total_visits_all_time = total_visits_all_time + 1,
             total_visits_this_month = total_visits_this_month + 1,
             last_check_in = NOW()
         WHERE id = $1`,
        [userId],
    );

    return {
        session_id: result.rows[0].id,
        checked_in_at: result.rows[0].check_in_time,
        status: result.rows[0].status,
    };
};
