import pool from "../../config/pool.ts";

export const verifyPaymentDomain = async (
  paymentId: number,
  adminId: number,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const payRes = await client.query(
      "SELECT * FROM payments WHERE id = $1 AND status = 'pending' FOR UPDATE",
      [paymentId],
    );
    if (payRes.rowCount === 0) throw new Error("Pending transaction not found");
    const payment = payRes.rows[0];

    let dynamicItemSummaryName = "Subscription Plan Access Activation";

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

      for (const item of itemsRes.rows) {
        const stockRes = await client.query(
          "UPDATE products SET stocks = stocks - $1 WHERE id = $2 AND stocks >= $1 RETURNING name",
          [item.quantity, item.product_id],
        );
        if (stockRes.rowCount === 0) {
          throw new Error(`Insufficient stock for product item: ${item.name}`);
        }
      }

      const itemRowsCount = itemsRes.rows.length;
      dynamicItemSummaryName =
        itemRowsCount > 1
          ? `${itemsRes.rows[0].name} (+${itemRowsCount - 1} other items)`
          : itemsRes.rows[0].name;
    }

    if (payment.transaction_type === "plan") {
      const planRes = await client.query(
        `SELECT id, name, duration_days, category 
         FROM subscription_plans 
         WHERE id = $1 AND is_active = TRUE`,
        [payment.plan_id],
      );


      if (planRes.rowCount === 0)
        throw new Error("Invalid or inactive subscription plan");

      const plan = planRes.rows[0];

      const existingSub = await client.query(
        `SELECT s.id, s.expiry_date 
         FROM subscriptions s
         JOIN subscription_plans sp ON s.plan_id = sp.id
         WHERE s.user_id = $1 
           AND s.status = 'active'
           AND sp.category = $2
         LIMIT 1`,
        [payment.user_id, plan.category],
      );

      let baseTime = Date.now();
      const now = Date.now();


      if (existingSub.rows.length > 0) {
        const currentExpiry = new Date(existingSub.rows[0].expiry_date).getTime();
        if (currentExpiry > now) baseTime = currentExpiry;
      }

      const expiryDate = new Date(
        baseTime + Number(plan.duration_days) * 24 * 60 * 60 * 1000,
      );

      if (existingSub.rows.length > 0) {
        await client.query(
          `UPDATE subscriptions
           SET plan_id = $2,
               plan_name = $3,
               status = 'active',
               start_date = CURRENT_TIMESTAMP,
               expiry_date = $4,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [existingSub.rows[0].id, plan.id, plan.name, expiryDate],
        );
      } else {
        await client.query(
          `INSERT INTO subscriptions (user_id, plan_id, plan_name, status, start_date, expiry_date)
           VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, $4)`,
          [payment.user_id, plan.id, plan.name, expiryDate],
        );
      }
    }

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
