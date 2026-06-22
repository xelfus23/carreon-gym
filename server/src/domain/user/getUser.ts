import pool from "../../config/pool.ts";

// Define strict interfaces for better Type Safety in your Capstone Project
export interface SubscriptionItem {
  id: string;
  plan_name: string;
  category: string; // <-- Added this
  status: 'cancelled' | 'pending' | 'expired' | 'active';
  expiry_date: string | null;
  start_date: string;
}

export interface AttendanceLogItem {
  id: string;
  check_in: string;
  check_out: string | null;
}

export interface UserDomainRow {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  phone_number: string | null;
  account_status: string;
  verified: boolean;
  last_login: string | null;
  created_at: string;
  subscriptions: SubscriptionItem[];
  weight_kg: number | null;
  weight_recorded_at: string | null;
  last_check_in: string | null;
  total_visits_all_time: number;
  total_visits_this_month: number;
  attendance_logs: AttendanceLogItem[];
}

export const getUsersDomain = async (): Promise<UserDomainRow[]> => {
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

    -- One subscription per plan category: active first, otherwise most recent
    LEFT JOIN LATERAL (
        SELECT json_agg(
            json_build_object(
              'id',          picked.id,
              'plan_name',   picked.plan_name,
              'category',    picked.category,
              'status',      picked.computed_status,
              'expiry_date', picked.expiry_date,
              'start_date',  picked.start_date
            ) ORDER BY
              CASE picked.computed_status
                WHEN 'active' THEN 0
                WHEN 'pending' THEN 1
                WHEN 'expired' THEN 2
                ELSE 3
              END,
              picked.category
        ) AS list
        FROM (
            SELECT DISTINCT ON (COALESCE(sp.category::text, 'membership'))
                s.id,
                s.plan_name,
                COALESCE(sp.category::text, 'membership') AS category,
                s.expiry_date,
                s.start_date,
                CASE
                   WHEN s.status = 'cancelled' THEN 'cancelled'
                   WHEN s.status = 'pending'   THEN 'pending'
                   WHEN s.expiry_date IS NULL  THEN 'active'
                   WHEN s.expiry_date < CURRENT_TIMESTAMP THEN 'expired'
                   ELSE 'active'
                END AS computed_status
            FROM subscriptions s
            LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
            WHERE s.user_id = u.id
            ORDER BY
                COALESCE(sp.category::text, 'membership'),
                CASE
                   WHEN s.status = 'active'
                     AND (s.expiry_date IS NULL OR s.expiry_date >= CURRENT_TIMESTAMP) THEN 0
                   WHEN s.status = 'pending' THEN 1
                   ELSE 2
                END,
                s.updated_at DESC,
                s.created_at DESC
        ) picked
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