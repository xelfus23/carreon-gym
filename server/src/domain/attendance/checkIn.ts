import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";

export const checkInDomain = async (params: { userId: number }) => {
    const { userId } = params;

    const user = await pool.query(
        `SELECT verified FROM users WHERE id = $1`,
        [userId],
    );

    if (user.rowCount === 0) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (!user.rows[0].verified) {
        throw new AppError("Unverified User", 403, "UNVERIFIED_USER");
    }

    // 1. Verify active subscription
    const sub = await pool.query(
        `SELECT 1 FROM subscriptions
       WHERE user_id = $1
       AND status = 'active'
       AND expiry_date > NOW()`,
        [userId],
    );

    if (sub.rowCount === 0) {
        throw new AppError("No Subscription", 403, "NO_SUBSCRIPTION");
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
        throw new AppError("Already Checked In", 409, "ALREADY_CHECKED_IN");
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
