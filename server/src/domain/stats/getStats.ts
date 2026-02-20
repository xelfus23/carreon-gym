import pool from "../../config/pool.ts";

export const getStatsDomain = async () => {
    const stats = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users WHERE role = 'member')::int AS total_members,
                (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')::int AS active_subscriptions,
                (SELECT COUNT(*) FROM gym_attendance
                    WHERE check_in_time >= CURRENT_DATE
                ) ::int AS todays_checkins,
                (SELECT COUNT(*) FROM users
                    WHERE role = 'member'
                    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
                )::int AS new_members_this_month
        `);

    const chart = await pool.query(`
            SELECT
                TO_CHAR(DATE_TRUNC('month', check_in_time), 'Mon') AS month,
                COUNT(*)::int AS visits
            FROM gym_attendance
            WHERE check_in_time >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', check_in_time)
            ORDER BY DATE_TRUNC('month', check_in_time)
        `);

    return {
        stats: stats.rows[0],
        chartData: chart.rows,
    };
};
