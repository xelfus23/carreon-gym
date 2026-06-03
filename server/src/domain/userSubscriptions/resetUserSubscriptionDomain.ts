import pool from "../../config/pool.ts";

// reset member subscription
export const resetUserSubscriptionDomain = async (userId: number) => {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT id FROM subscriptions WHERE user_id = $1`,
      [userId],
    );

    if (existing.rowCount === 0) {
      throw new Error(`No subscription found for user ${userId}.`);
    }

    await client.query(`DELETE FROM subscriptions WHERE user_id = $1`, [
      userId,
    ]);

    await client.query("COMMIT");
    return { user_id: userId, cleared_count: existing.rowCount };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}