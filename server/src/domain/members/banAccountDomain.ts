import pool from "../../config/pool.ts";

export const banAccountDomain = async (userId: number) => {
  // Also cancel active/pending subscriptions for safety.
  const res = await pool.query(
    `
      WITH updated_user AS (
        UPDATE users
        SET account_status = 'banned', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, account_status
      ),
      cancelled_subs AS (
        UPDATE subscriptions
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND status IN ('active', 'pending')
        RETURNING id
      )
      SELECT * FROM updated_user
    `,
    [userId],
  );

  if (res.rowCount === 0) throw new Error("User not found");

  return res.rows[0];
};

