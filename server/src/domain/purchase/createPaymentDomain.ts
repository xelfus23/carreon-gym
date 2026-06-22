import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";
import { generateReferenceNo } from "../../utils/generateReferenceNo.ts";

export const createPaymentDomain = async (
  userId: number,
  planId: number | undefined,
  planName: string | undefined,
  method: string,
  receiptImageUrl?: string,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Check for concurrent pending payment requests
    const pendingRes = await client.query(
      `SELECT id FROM payments WHERE user_id = $1 AND status = 'pending' LIMIT 1`,
      [userId],
    );

    if (pendingRes.rowCount && pendingRes.rowCount > 0) {
      throw new AppError(
        "You already have a pending payment request. Please wait for approval or cancellation.",
        409,
        "PENDING_PAYMENT_EXISTS",
      );
    }

    // 2. Find target subscription plan data using explicit type casting for $2
    const planRes = await client.query(
      `SELECT id, name, price FROM subscription_plans 
       WHERE (id = $1) OR ($1 IS NULL AND $2::text IS NOT NULL AND LOWER(name) = LOWER($2::text))`,
      [planId ?? null, planName ?? null],
    );

    if (!planRes.rows.length) {
      throw new AppError("Target subscription plan reference invalid.", 404);
    }

    const targetPlan = planRes.rows[0];
    const finalAmount = Number(targetPlan.price);
    const resolvedItemName = targetPlan.name;
    const referenceNo = generateReferenceNo("mobile_online");

    // 3. Insert transaction ledger entry exclusively for plan
    const masterResPlan = await client.query(
      `INSERT INTO payments (user_id, plan_id, transaction_type, origin, amount, status, method, reference_no, receipt_image_url)
       VALUES ($1, $2, 'plan', 'mobile_online', $3, 'pending', $4, $5, $6) RETURNING id, reference_no`,
      [
        userId,
        targetPlan.id,
        finalAmount,
        method,
        referenceNo,
        receiptImageUrl || null,
      ],
    );
    const masterPaymentId = masterResPlan.rows[0].id;
    const insertedReferenceNo = masterResPlan.rows[0].reference_no;

    // 4. Resolve full name safely
    const userRes = await client.query(
      "SELECT first_name || ' ' || last_name as full_name FROM users WHERE id = $1",
      [userId],
    );
    const memberName = userRes.rows[0]?.full_name || "Gym Member";

    await client.query("COMMIT");

    return {
      id: masterPaymentId,
      amount: finalAmount,
      item_name: resolvedItemName,
      member_name: memberName,
      reference_no: insertedReferenceNo,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};