import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";

export const createPendingPurchaseDomain = async (
  userId: number,
  productId: number | undefined,
  planId: number | undefined,
  planName: string | undefined,
  qty: number,
  method: string,
  receiptImageUrl?: string,
) => {
  const pendingRes = await pool.query(
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

  let res;

  if (productId) {
    res = await pool.query(
      `WITH inserted_payment AS (
              INSERT INTO payments (
                user_id,
                product_id,
                quantity,
                amount,
                transaction_type,
                method,
                status,
                receipt_image_url,
                paid_at
              )
              SELECT
                $1::INT,
                $2::INT,
                $3::INT,
                (price * $3::INT),
                'product',
                $4,
                'pending',
                $5,
                NULL
              FROM products WHERE id = $2
              RETURNING *
          )
          SELECT
              p.*,
              u.first_name || ' ' || u.last_name as member_name,
              prod.name as item_name
          FROM inserted_payment p
          JOIN users u ON p.user_id = u.id
          JOIN products prod ON p.product_id = prod.id`,
      [userId, productId, qty, method, receiptImageUrl ?? null],
    );
  } else {
    res = await pool.query(
      `WITH inserted_payment AS (
            INSERT INTO payments (
              user_id,
              plan_id,
              quantity,
              amount,
              transaction_type,
              method,
              status,
              receipt_image_url,
              paid_at
            )
            SELECT
              $1::INT,
              sp.id,
              1,
              sp.price,
              'plan',
              $4,
              'pending',
              $5,
              NULL
            FROM subscription_plans sp
            WHERE ($2::INT IS NOT NULL AND sp.id = $2)
               OR ($2::INT IS NULL AND $3::TEXT IS NOT NULL AND LOWER(sp.name) = LOWER($3::TEXT))
            RETURNING *
        )
        SELECT
            p.*,
            u.first_name || ' ' || u.last_name as member_name,
            sp.name as item_name
        FROM inserted_payment p
        JOIN users u ON p.user_id = u.id
        JOIN subscription_plans sp ON p.plan_id = sp.id`,
      [userId, planId ?? null, planName ?? null, method, receiptImageUrl ?? null],
    );
  }

  if (!res?.rows?.length) {
    throw new Error("Failed to create pending payment. Invalid plan/product.");
  }

  return res.rows[0];
};

export const denyPendingPurchaseDomain = async (
  paymentId: number,
  adminId: number,
) => {
  const res = await pool.query(
    `UPDATE payments
     SET status = 'cancelled',
         recorded_by = $2,
         paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP)
     WHERE id = $1
       AND status = 'pending'
     RETURNING *`,
    [paymentId, adminId],
  );

  if (!res.rowCount) {
    throw new AppError("Pending transaction not found", 404, "PAYMENT_NOT_FOUND");
  }

  return res.rows[0];
};

export const deleteTransactionDomain = async (paymentId: number) => {
  const res = await pool.query(
    `DELETE FROM payments
     WHERE id = $1
     RETURNING id`,
    [paymentId],
  );

  if (!res.rowCount) {
    throw new AppError("Transaction not found", 404, "PAYMENT_NOT_FOUND");
  }

  return res.rows[0];
};

export const verifyPendingPurchaseDomain = async (
  paymentId: number,
  adminId: number,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get transaction details
    const payRes = await client.query(
      "SELECT * FROM payments WHERE id = $1 AND status = 'pending'",
      [paymentId],
    );
    if (payRes.rowCount === 0) throw new Error("Pending transaction not found");
    const payment = payRes.rows[0];

    if (payment.transaction_type === "product") {
      const stockRes = await client.query(
        "UPDATE products SET stocks = stocks - $1 WHERE id = $2 AND stocks >= $1 RETURNING name",
        [payment.quantity, payment.product_id],
      );
      if (stockRes.rowCount === 0)
        throw new Error("Insufficient stock to complete purchase");
    }

    if (payment.transaction_type === "plan") {
      const planRes = await client.query(
        `SELECT id, name, duration_days FROM subscription_plans WHERE id = $1 AND is_active = TRUE`,
        [payment.plan_id],
      );
      if (planRes.rowCount === 0) {
        throw new Error("Invalid or inactive subscription plan");
      }

      const plan = planRes.rows[0];
      const existingSub = await client.query(
        `SELECT expiry_date FROM subscriptions WHERE user_id = $1`,
        [payment.user_id],
      );

      let baseDate = new Date();
      const now = new Date();
      if (existingSub.rows.length > 0) {
        const currentExpiry = new Date(existingSub.rows[0].expiry_date);
        if (currentExpiry > now) baseDate = currentExpiry;
      }
      baseDate.setDate(baseDate.getDate() + Number(plan.duration_days));

      await client.query(
        `INSERT INTO subscriptions (user_id, plan_id, plan_name, status, start_date, expiry_date)
         VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, $4)
         ON CONFLICT (user_id)
         DO UPDATE SET
           plan_id = EXCLUDED.plan_id,
           plan_name = EXCLUDED.plan_name,
           status = 'active',
           start_date = CURRENT_TIMESTAMP,
           expiry_date = EXCLUDED.expiry_date,
           updated_at = CURRENT_TIMESTAMP`,
        [payment.user_id, plan.id, plan.name, baseDate],
      );
    }

    // 3. Set Payment to Paid
    const updatedPayment = await client.query(
      `UPDATE payments 
           SET status = 'paid', recorded_by = $2, paid_at = CURRENT_TIMESTAMP 
           WHERE id = $1 RETURNING *`,
      [paymentId, adminId],
    );

    await client.query("COMMIT");
    return updatedPayment.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
