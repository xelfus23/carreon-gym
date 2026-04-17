import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";

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
        throw new AppError(
            "No active subscription",
            401,
            "UNAUTHORIZED_ACCESS",
        );
    }

    // 2. Check active session
    const activeSession = await pool.query(
        `SELECT id FROM gym_attendance
       WHERE user_id = $1
       AND check_out_time IS NULL
       LIMIT 1`,
        [userId],
    );

    if (activeSession.rowCount) {
        throw new AppError("Already checked in", 409, "ALREADY_CHECKED_IN");
    }

    // 3. SINGLE INSERT ONLY (FIXED)
    const result = await pool.query(
        `INSERT INTO gym_attendance 
       (user_id, check_in_time, status, method, log_status)
       VALUES ($1, NOW(), 'checked_in', 'qr', 'success')
       RETURNING id, user_id, check_in_time, status, log_status`,
        [userId],
    );

    // 4. Update counters
    await pool.query(
        `UPDATE users
       SET total_visits_all_time = total_visits_all_time + 1,
           total_visits_this_month = total_visits_this_month + 1,
           last_check_in = NOW()
       WHERE id = $1`,
        [userId],
    );

    return result.rows[0];
};
