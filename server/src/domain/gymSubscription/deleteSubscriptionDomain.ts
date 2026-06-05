import pool from "../../config/pool.ts";

export const deleteSubscriptionDomain = async (id: number) => {
  await pool.query(`DELETE FROM gym_subscriptions WHERE id = $1;`, [id]);
};
