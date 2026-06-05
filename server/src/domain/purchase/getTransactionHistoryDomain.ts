import pool from "../../config/pool.ts";

export const getTransactionHistoryDomain = async (userId: number) => {
  const result = await pool.query(
    `SELECT
          p.*,
          CASE 
            WHEN p.transaction_type = 'plan' THEN sp.name 
            ELSE (
                SELECT string_agg(prod.name || ' (x' || pi.quantity || ')', ', ')
                FROM payment_items pi
                JOIN products prod ON pi.product_id = prod.id
                WHERE pi.payment_id = p.id
            )
          END AS plan_or_product_name,
          u.first_name || ' ' || u.last_name AS recorded_by_name
       FROM payments p
       LEFT JOIN subscription_plans sp ON p.plan_id = sp.id
       LEFT JOIN users u ON p.recorded_by = u.id
       WHERE p.user_id = $1
       ORDER BY COALESCE(p.paid_at, p.created_at) DESC`,
    [userId],
  );

  return result.rows;
};
