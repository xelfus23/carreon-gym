import pool from "../../config/pool.ts";

export const deleteAccountDomain = async (userId: number) => {

  const res = await pool.query(`DELETE FROM users WHERE id = $1`,
    [userId],
  );

  if (res.rowCount === 0) {
    throw new Error("User not found");
  }

  return res.rows[0];
};
