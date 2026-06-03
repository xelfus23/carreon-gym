import pool from "../../config/pool.ts";

export const getStatsDomain = async () => {
  // ── Core stats ──────────────────────────────────────────────────────────
  const stats = await pool.query(`
        SELECT
            -- Members
            (SELECT COUNT(*) FROM users
                WHERE role = 'member' AND account_status = 'active'
            )::int AS total_members,

            -- Active subscriptions
            (SELECT COUNT(*) FROM subscriptions
                WHERE status = 'active'
            )::int AS active_subscriptions,

            -- Today's check-ins
            (SELECT COUNT(*) FROM gym_attendance
                WHERE check_in_time >= CURRENT_DATE
            )::int AS todays_checkins,

            -- New members this month
            (SELECT COUNT(*) FROM users
                WHERE role = 'member'
                AND account_status = 'active'
                AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
            )::int AS new_members_this_month,

            -- Revenue this month (from payments table)
            (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE status = 'paid'
                AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)
            )::numeric AS revenue_this_month,

            -- Revenue last month
            (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE status = 'paid'
                AND paid_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                AND paid_at <  DATE_TRUNC('month', CURRENT_DATE)
            )::numeric AS revenue_last_month,

            -- Revenue growth %
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

            -- Peak hour today (hour with most check-ins)
            (
                SELECT EXTRACT(HOUR FROM check_in_time)::int
                FROM gym_attendance
                WHERE check_in_time >= CURRENT_DATE
                GROUP BY EXTRACT(HOUR FROM check_in_time)
                ORDER BY COUNT(*) DESC
                LIMIT 1
            ) AS peak_hour_today,

            -- Avg session duration (minutes) across all time
            (
                SELECT ROUND(AVG(duration_minutes), 0)
                FROM gym_attendance
                WHERE duration_minutes IS NOT NULL
            )::int AS avg_daily_duration_minutes,

            -- Subscriptions expiring in next 7 days
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

  // ── Monthly revenue chart (last 6 months, from payments) ───────────────
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

  // ── Peak hours (hourly check-in distribution, last 30 days) ────────────
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

  return {
    stats: stats.rows[0],
    chartData,
    peakHourData,
  };
};
