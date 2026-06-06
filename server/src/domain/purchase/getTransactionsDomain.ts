import pool from "../../config/pool.ts";

export const getTransactionsDomain = async (userId?: number) => {
  let query = `SELECT * FROM v_all_transactions`;
  const params: any[] = [];

  if (userId) {
    query += ` WHERE user_id = $1`;
    params.push(userId);
  }

  query += ` ORDER BY created_at DESC`;

  const res = await pool.query(query, params);
  return res.rows;
};