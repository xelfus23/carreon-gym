import pool from "../../config/pool.ts";

export const cancelUserSubscriptionDomain = async (userId: number) => {
  const result = await pool.query(
    `UPDATE subscriptions
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
    [userId],
  );

  if (result.rows.length === 0) {
    throw new Error(`No subscription found for user ${userId}.`);
  }

  return result.rows[0];
}