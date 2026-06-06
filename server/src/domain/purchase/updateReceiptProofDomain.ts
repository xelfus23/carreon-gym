import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";

export const updateReceiptProofDomain = async (
  paymentId: number,
  userId: number,
  receiptImageUrl: string
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Verify the transaction exists and belongs to this user before modifying it
    const checkRes = await client.query(
      `SELECT id, status FROM payments WHERE id = $1 AND user_id = $2`,
      [paymentId, userId]
    );

    if (!checkRes.rows.length) {
      throw new AppError("Payment request record not found.", 404);
    }

    const transaction = checkRes.rows[0];

    // 2. Safeguard against updating records that are already processed
    if (transaction.status !== "pending") {
      throw new AppError(
        `Cannot upload proof. This transaction has already been ${transaction.status}.`,
        400
      );
    }

    // 3. Update the receipt image URL field
    const updateRes = await client.query(
      `UPDATE payments 
       SET receipt_image_url = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING id, amount, status, transaction_type`,
      [receiptImageUrl, paymentId, userId]
    );

    // Fetch user details for the websocket notification payload
    const userRes = await client.query(
      "SELECT first_name || ' ' || last_name as full_name FROM users WHERE id = $1",
      [userId]
    );
    const memberName = userRes.rows[0]?.full_name || "Gym Member";

    await client.query("COMMIT");

    return {
      ...updateRes.rows[0],
      member_name: memberName,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};