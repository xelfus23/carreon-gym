import pool from "../../config/pool.ts";

export const getStatsDomain = async () => {
  // ── Core stats ──────────────────────────────────────────────────────────
  const stats = await pool.query(`
        SELECT
            (SELECT COUNT(*) FROM users
                WHERE role = 'member' AND account_status = 'active'
            )::int AS total_members,

            (SELECT COUNT(*) FROM subscriptions
                WHERE status = 'active'
            )::int AS active_subscriptions,

            (SELECT COUNT(*) FROM gym_attendance
                WHERE check_in_time >= CURRENT_DATE
            )::int AS todays_checkins,

            (SELECT COUNT(*) FROM users
                WHERE role = 'member'
                AND account_status = 'active'
                AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
            )::int AS new_members_this_month,

            (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE status = 'paid'
                AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)
            )::numeric AS revenue_this_month,

            (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE status = 'paid'
                AND paid_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                AND paid_at <  DATE_TRUNC('month', CURRENT_DATE)
            )::numeric AS revenue_last_month,

            (
                WITH r AS (
                    SELECT
                        COALESCE(SUM(CASE
                            WHEN paid_at >= DATE_TRUNC('month', CURRENT_DATE)
                            THEN amount END), 0) AS cur,
                        COALESCE(SUM(CASE
                            WHEN paid_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                            AND  paid_at <  DATE_TRUNC('month', CURRENT_DATE)
                            THEN amount END), 0) AS prev
                    FROM payments
                    WHERE status = 'paid'
                )
                SELECT CASE
                    WHEN prev = 0 THEN 0
                    ELSE ROUND(((cur - prev) / prev) * 100, 1)
                END
                FROM r
            )::numeric AS revenue_growth_percent,

            (
                SELECT EXTRACT(HOUR FROM check_in_time)::int
                FROM gym_attendance
                WHERE check_in_time >= CURRENT_DATE
                GROUP BY EXTRACT(HOUR FROM check_in_time)
                ORDER BY COUNT(*) DESC
                LIMIT 1
            ) AS peak_hour_today,

            (
                SELECT ROUND(AVG(duration_minutes), 0)
                FROM gym_attendance
                WHERE duration_minutes IS NOT NULL
            )::int AS avg_daily_duration_minutes,

            (
                SELECT COUNT(*)
                FROM subscriptions
                WHERE status = 'active'
                AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
            )::int AS expiring_soon
    `);

  // ── Monthly attendance chart (last 6 months) ────────────────────────────
  const chart = await pool.query(`
        SELECT
            TO_CHAR(DATE_TRUNC('month', check_in_time), 'Mon') AS month,
            COUNT(*)::int AS visits
        FROM gym_attendance
        WHERE check_in_time >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY DATE_TRUNC('month', check_in_time)
        ORDER BY DATE_TRUNC('month', check_in_time)
    `);

  // ── Weekly attendance chart (last 7 days) ───────────────────────────────
  const weeklyChart = await pool.query(`
        SELECT
            TO_CHAR(check_in_time::date, 'Dy') AS day,
            check_in_time::date AS date,
            COUNT(*)::int AS visits
        FROM gym_attendance
        WHERE check_in_time >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY check_in_time::date
        ORDER BY check_in_time::date
    `);

  // ── Monthly revenue chart (last 6 months) ───────────────────────────────
  const revenueChart = await pool.query(`
        SELECT
            TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon') AS month,
            COALESCE(SUM(amount), 0)::numeric AS revenue
        FROM payments
        WHERE status = 'paid'
        AND paid_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY DATE_TRUNC('month', paid_at)
        ORDER BY DATE_TRUNC('month', paid_at)
    `);

  // Merge visits + revenue into one chartData array keyed by month label
  const revenueMap = new Map(
    revenueChart.rows.map((r: { month: string; revenue: number }) => [
      r.month,
      r.revenue,
    ]),
  );
  const chartData = chart.rows.map(
    (row: { month: string; visits: number }) => ({
      month: row.month,
      visits: row.visits,
      revenue: Number(revenueMap.get(row.month) ?? 0),
    }),
  );

  // Weekly chart data: day label + visits
  const weeklyChartData = weeklyChart.rows.map(
    (row: { day: string; visits: number }) => ({
      month: row.day, // reuse "month" key so the front-end chart config is identical
      visits: row.visits,
    }),
  );

  // ── Peak hours (hourly distribution, last 30 days) ──────────────────────
  const peakHours = await pool.query(`
        SELECT
            EXTRACT(HOUR FROM check_in_time)::int AS hour_num,
            COUNT(*)::int AS checkins
        FROM gym_attendance
        WHERE check_in_time >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM check_in_time)
        ORDER BY hour_num
    `);

  const formatHour = (h: number): string => {
    if (h === 0) return "12AM";
    if (h < 12) return `${h}AM`;
    if (h === 12) return "12PM";
    return `${h - 12}PM`;
  };

  const peakHourData = peakHours.rows.map(
    (row: { hour_num: number; checkins: number }) => ({
      hour: formatHour(row.hour_num),
      checkins: row.checkins,
    }),
  );

  // ── Recent payments (last 10 paid/pending) ───────────────────────────────
  const recentPayments = await pool.query(`
        SELECT
            p.id,
            COALESCE(
                NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''),
                'Walk-in / Guest'
            ) AS member_name,
            -- Initials: first letter of each word, up to 2
            COALESCE(
                UPPER(LEFT(u.first_name, 1) || LEFT(u.last_name, 1)),
                'WG'
            ) AS initials,
            p.amount,
            p.method,
            p.transaction_type,
            p.status,
            p.paid_at,
            CASE
                WHEN p.transaction_type = 'plan' THEN sp.name
                ELSE (
                    SELECT STRING_AGG(prod.name, ', ')
                    FROM payment_items pi
                    JOIN products prod ON pi.product_id = prod.id
                    WHERE pi.payment_id = p.id
                )
            END AS item_name
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN subscription_plans sp ON p.plan_id = sp.id
        WHERE p.status IN ('paid', 'pending')
        ORDER BY p.created_at DESC
        LIMIT 10
    `);

  // ── New members (last 10 registered) ────────────────────────────────────
  const newMembers = await pool.query(`
        SELECT
            CONCAT_WS(' ', u.first_name, u.last_name) AS name,
            UPPER(LEFT(u.first_name, 1) || LEFT(u.last_name, 1)) AS initials,
            u.created_at,
            u.verified,
            COALESCE(sp.name, 'No plan') AS plan_name
        FROM users u
        LEFT JOIN LATERAL (
            SELECT s.plan_id, s.status
            FROM subscriptions s
            WHERE s.user_id = u.id
            ORDER BY
                CASE
                    WHEN s.status = 'active'
                      AND (s.expiry_date IS NULL OR s.expiry_date >= CURRENT_TIMESTAMP) THEN 0
                    WHEN s.status = 'pending' THEN 1
                    ELSE 2
                END,
                s.updated_at DESC,
                s.created_at DESC
            LIMIT 1
        ) s ON true
        LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE u.role = 'member'
        AND u.account_status = 'active'
        ORDER BY u.created_at DESC
        LIMIT 10
    `);

  // ── Subscriptions by plan ────────────────────────────────────────────────
  const planStats = await pool.query(`
        SELECT
            sp.name AS plan_name,
            COUNT(s.id)::int AS count,
            ROUND(
                COUNT(s.id)::numeric
                / NULLIF(SUM(COUNT(s.id)) OVER (), 0) * 100,
                1
            )::numeric AS percent
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE s.status = 'active'
        GROUP BY sp.id, sp.name
        ORDER BY count DESC
    `);

  return {
    stats: stats.rows[0],
    chartData,
    weeklyChartData,
    peakHourData,
    recentPayments: recentPayments.rows,
    newMembers: newMembers.rows,
    planStats: planStats.rows,
  };
};
