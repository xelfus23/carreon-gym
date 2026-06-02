import pool from "../../config/pool.ts";

export const deleteAccountDomain = async (userId: number) => {
  // Soft-delete to match admin UI filters and retain relational data.
  const res = await pool.query(
    `
      UPDATE users
      SET account_status = 'deleted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, account_status
    `,
    [userId],
  );

  if (res.rowCount === 0) {
    throw new Error("User not found");
  }

  return res.rows[0];
};
