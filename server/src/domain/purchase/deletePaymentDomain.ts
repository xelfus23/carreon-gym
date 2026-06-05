import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";

export const deletePaymentDomain = async (paymentId: number) => {
  const res = await pool.query(
    `DELETE FROM payments
     WHERE id = $1
     RETURNING id`,
    [paymentId],
  );

  if (res.rowCount === 0) {
    throw new AppError("Transaction not found", 404, "PAYMENT_NOT_FOUND");
  }

  return res.rows[0];
};