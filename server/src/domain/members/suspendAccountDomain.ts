import pool from "../../config/pool.ts";

export const suspendAccountDomain = async (userId: number) => {
  const current = await pool.query(
    `SELECT account_status FROM users WHERE id = $1`,
    [userId],
  );

  if (current.rowCount === 0) throw new Error("User not found");

  const accountStatus = current.rows[0]?.account_status as
    | "active"
    | "suspended"
    | "banned"
    | "deleted"
    | undefined;

  if (accountStatus === "deleted" || accountStatus === "banned") {
    throw new Error(`Cannot suspend a ${accountStatus} account`);
  }

  const nextStatus = accountStatus === "suspended" ? "active" : "suspended";

  const res = await pool.query(
    `
      UPDATE users
      SET account_status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, account_status
    `,
    [userId, nextStatus],
  );

  return res.rows[0];
};

