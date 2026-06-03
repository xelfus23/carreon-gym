import pool from "../../config/pool.ts";


// Get member subscription
export const getUserSubscriptionDomain = async (userId: number) => {

  const result = await pool.query(
    `SELECT
          s.*,
          sp.price AS plan_price,
          sp.duration_days AS plan_duration_days,
          CASE
              WHEN s.status = 'cancelled' THEN 'cancelled'
              WHEN s.status = 'pending' THEN 'pending'
              WHEN s.expiry_date < CURRENT_TIMESTAMP THEN 'expired'
              ELSE 'active'
          END AS display_status
       FROM subscriptions s
       LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1`,
    [userId],
  );

  return result.rows[0] ?? null;
}