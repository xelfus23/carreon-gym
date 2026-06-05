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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Maintain blockades against concurrent pending operations per individual user
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

    let masterPaymentId: number;
    let finalAmount = 0;
    let resolvedItemName = "";

    // 2. Branch processing execution paths by target type selection
    if (productId) {
      // Look up target product specifications to fetch price and inventory verification data
      const prodRes = await client.query(
        "SELECT name, price FROM products WHERE id = $1",
        [productId],
      );
      if (!prodRes.rows.length)
        throw new AppError("Target product reference invalid.", 404);

      const targetProduct = prodRes.rows[0];
      finalAmount = Number(targetProduct.price) * qty;
      resolvedItemName = targetProduct.name;

      // Insert master entry header parameters
      const masterRes = await client.query(
        `INSERT INTO payments (user_id, transaction_type, origin, amount, status, method, receipt_image_url)
         VALUES ($1, 'product', 'mobile_online', $2, 'pending', $3, $4) RETURNING id`,
        [userId, finalAmount, method, receiptImageUrl ?? null],
      );
      masterPaymentId = masterRes.rows[0].id;

      // Register product target configuration inside child collection table arrays
      await client.query(
        `INSERT INTO payment_items (payment_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [masterPaymentId, productId, qty, targetProduct.price],
      );
    } else {
      // Find target plan data constraints using fallback evaluation logic paths
      const planRes = await client.query(
        `SELECT id, name, price FROM subscription_plans 
         WHERE (id = $1) OR ($1 IS NULL AND $2 IS NOT NULL AND LOWER(name) = LOWER($2))`,
        [planId ?? null, planName ?? null],
      );
      if (!planRes.rows.length)
        throw new AppError("Target subscription plan reference invalid.", 404);

      const targetPlan = planRes.rows[0];
      finalAmount = Number(targetPlan.price);
      resolvedItemName = targetPlan.name;

      const masterRes = await client.query(
        `INSERT INTO payments (user_id, plan_id, transaction_type, origin, amount, status, method, receipt_image_url)
         VALUES ($1, $2, 'plan', 'mobile_online', $3, 'pending', $4, $5) RETURNING id`,
        [userId, targetPlan.id, finalAmount, method, receiptImageUrl ?? null],
      );
      masterPaymentId = masterRes.rows[0].id;
    }

    // Resolve structural payload username identity values safely
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
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
