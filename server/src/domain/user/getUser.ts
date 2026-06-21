import pool from "../../config/pool.ts";

export const getUsersDomain = async () => {
  const query = `
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.role,
        u.email,
        u.phone_number,
        u.account_status,
        u.verified,
        u.last_login,
        u.created_at,

        -- Isolated lateral fetch for clean subscription records arrays without duplicating roots
        COALESCE(sub.list, '[]'::json) AS subscriptions,

        bm.weight_kg,
        bm.recorded_at AS weight_recorded_at,

        att.last_check_in,
        att.total_visits_all_time,
        att.total_visits_this_month,
        
        -- Pull down detailed log objects array for our visualization modules
        COALESCE(att_logs.logs, '[]'::json) AS attendance_logs

    FROM users u

    -- Clean Isolated Aggregation of Subscriptions
    LEFT JOIN LATERAL (
        SELECT json_agg(
            json_build_object(
              'id',          s.id,
              'plan_name',   s.plan_name,
              'status',      CASE
                               WHEN s.status = 'cancelled' THEN 'cancelled'
                               WHEN s.status = 'pending'   THEN 'pending'
                               WHEN s.expiry_date IS NULL  THEN 'active' -- If open-ended plan
                               WHEN s.expiry_date < CURRENT_TIMESTAMP THEN 'expired'
                               ELSE 'active'
                             END,
              'expiry_date', s.expiry_date,
              'start_date',  s.start_date
            ) ORDER BY s.updated_at DESC, s.created_at DESC
        ) AS list
        FROM subscriptions s 
        WHERE s.user_id = u.id
    ) sub ON true

    -- Fetch Last Body Composition Data
    LEFT JOIN LATERAL (
        SELECT weight_kg, recorded_at
        FROM body_metrics
        WHERE user_id = u.id
        ORDER BY recorded_at DESC
        LIMIT 1
    ) bm ON true

    -- Gather Attendance Aggregates
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

    -- Gather Raw Attendance Logs Array for Chart Distribution Rendering
    LEFT JOIN LATERAL (
        SELECT json_agg(
            json_build_object(
                'id', id,
                'check_in', check_in_time,
                'check_out', check_out_time
            ) ORDER BY check_in_time DESC
        ) AS logs
        FROM gym_attendance
        WHERE user_id = u.id
    ) att_logs ON true

    ORDER BY u.created_at DESC;
  `;

  const result = await pool.query(query);

  return result.rows.map((row) => ({
    ...row,
    subscriptions: row.subscriptions ?? [],
    attendance_logs: row.attendance_logs ?? [],
    total_visits_all_time: Number(row.total_visits_all_time ?? 0),
    total_visits_this_month: Number(row.total_visits_this_month ?? 0),
  }));
};