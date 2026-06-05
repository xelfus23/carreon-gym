import pool from "../../config/pool.ts";

export const verifyPaymentDomain = async (
  paymentId: number,
  adminId: number,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Fetch and Lock the pending payment to prevent duplicate clicks
    const payRes = await client.query(
      "SELECT * FROM payments WHERE id = $1 AND status = 'pending' FOR UPDATE",
      [paymentId],
    );
    if (payRes.rowCount === 0) throw new Error("Pending transaction not found");
    const payment = payRes.rows[0];

    let dynamicItemSummaryName = "Subscription Plan Access Activation";

    // 2. Handle Inventory updates for Physical Products by matching through child table manifests
    if (payment.transaction_type === "product") {
      const itemsRes = await client.query(
        `SELECT pi.*, prod.name 
         FROM payment_items pi
         JOIN products prod ON pi.product_id = prod.id
         WHERE pi.payment_id = $1`,
        [paymentId],
      );

      if (itemsRes.rowCount === 0)
        throw new Error(
          "No cart item records linked to this product payment reference.",
        );

      // Iterate over item records to run warehouse reductions safely
      for (const item of itemsRes.rows) {
        const stockRes = await client.query(
          "UPDATE products SET stocks = stocks - $1 WHERE id = $2 AND stocks >= $1 RETURNING name",
          [item.quantity, item.product_id],
        );
        if (stockRes.rowCount === 0) {
          throw new Error(`Insufficient stock for product item: ${item.name}`);
        }
      }

      // Format clean summary naming contexts
      const itemRowsCount = itemsRes.rows.length;
      dynamicItemSummaryName =
        itemRowsCount > 1
          ? `${itemsRes.rows[0].name} (+${itemRowsCount - 1} other items)`
          : itemsRes.rows[0].name;
    }

    // 3. Handle Subscription Plan activations
    if (payment.transaction_type === "plan") {
      const planRes = await client.query(
        `SELECT id, name, duration_days FROM subscription_plans WHERE id = $1 AND is_active = TRUE`,
        [payment.plan_id],
      );
      if (planRes.rowCount === 0)
        throw new Error("Invalid or inactive subscription plan");

      const plan = planRes.rows[0];
      dynamicItemSummaryName = plan.name;

      const existingSub = await client.query(
        `SELECT expiry_date FROM subscriptions WHERE user_id = $1`,
        [payment.user_id],
      );

      let baseTime = Date.now();
      const now = Date.now();

      if (existingSub.rows.length > 0) {
        const currentExpiry = new Date(
          existingSub.rows[0].expiry_date,
        ).getTime();
        if (currentExpiry > now) baseTime = currentExpiry;
      }

      const expiryDate = new Date(
        baseTime + Number(plan.duration_days) * 24 * 60 * 60 * 1000,
      );

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
        [payment.user_id, plan.id, plan.name, expiryDate],
      );
    }

    // 4. Update the Master Payment Ticket status to 'paid'
    const updatedPayment = await client.query(
      `UPDATE payments 
       SET status = 'paid', recorded_by = $2, paid_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [paymentId, adminId],
    );

    await client.query("COMMIT");

    return {
      ...updatedPayment.rows[0],
      summary_item_name: dynamicItemSummaryName,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
