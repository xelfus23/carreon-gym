import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";

export const createPaymentDomain = async (
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
