import pool from "../../config/pool.ts";

export const getTransactionHistoryDomain = async (userId: number) => {
  const result = await pool.query(
    `SELECT
          p.*,
          sp.name AS plan_name,
          u.first_name || ' ' || u.last_name AS recorded_by_name
       FROM payments p
       LEFT JOIN subscription_plans sp ON p.plan_id = sp.id
       LEFT JOIN users u ON p.recorded_by = u.id
       WHERE p.user_id = $1
       ORDER BY p.paid_at DESC`,
    [userId],
  );

  return result.rows;
}