import pool from "../../config/pool.ts";

export const getUsersDomain = async () => {
    const query = `
      SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.role, -- Added this so you can identify the user type
          u.email,
          u.phone_number,
          u.account_status,
          u.verified,
          u.last_login,
          u.created_at,

          s.plan_name,
          CASE
              WHEN s.status = 'cancelled' THEN 'cancelled'
              WHEN s.status = 'pending' THEN 'pending'
              WHEN s.expiry_date IS NULL THEN NULL
              WHEN s.expiry_date < CURRENT_TIMESTAMP THEN 'expired'
              ELSE 'active'
          END AS subscription_status,
          s.expiry_date,

          bm.weight_kg,
          bm.recorded_at AS weight_recorded_at,

          -- Attendance data
          att.last_check_in,
          att.total_visits_all_time,
          att.total_visits_this_month

      FROM users u

      LEFT JOIN subscriptions s 
          ON u.id = s.user_id

      -- Latest body metric
      LEFT JOIN LATERAL (
          SELECT weight_kg, recorded_at
          FROM body_metrics
          WHERE user_id = u.id
          ORDER BY recorded_at DESC
          LIMIT 1
      ) bm ON true

      -- Attendance aggregation
      LEFT JOIN LATERAL (
          SELECT 
              MAX(check_in_time) AS last_check_in,
              COUNT(*) AS total_visits_all_time,
              COUNT(*) FILTER (
                  WHERE DATE_TRUNC('month', check_in_time) = DATE_TRUNC('month', CURRENT_DATE)
              ) AS total_visits_this_month
          FROM gym_attendance
          WHERE user_id = u.id
      ) att ON true

      -- Removed WHERE u.role = 'member' to include everyone
      ORDER BY u.created_at DESC
  `;

    const result = await pool.query(query);

    return result.rows.map((row) => ({
        ...row,
        total_visits_all_time: Number(row.total_visits_all_time ?? 0),
        total_visits_this_month: Number(row.total_visits_this_month ?? 0),
    }));
};
