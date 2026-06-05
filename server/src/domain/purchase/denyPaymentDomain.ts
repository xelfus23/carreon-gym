import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";

export const denyPaymentDomain = async (
  paymentId: number,
  adminId: number,
) => {
  const res = await pool.query(
    `UPDATE payments
     SET status = 'cancelled',
         recorded_by = $2,
         updated_at = CURRENT_TIMESTAMP -- 🟢 Tracks when it was denied without touching paid_at
     WHERE id = $1
       AND status = 'pending'
     RETURNING *`,
    [paymentId, adminId],
  );

  if (res.rowCount === 0) {
    throw new AppError("Pending transaction not found", 404, "PAYMENT_NOT_FOUND");
  }

  return res.rows[0];
};