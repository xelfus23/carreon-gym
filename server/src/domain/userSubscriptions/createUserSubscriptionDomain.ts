import pool from "../../config/pool.ts";
import { generateReferenceNo } from "../../utils/generateReferenceNo.ts";
import { assertMembershipPurchaseAllowed } from "./assertMembershipPurchaseAllowed.ts";

export const createUserSubscriptionDomain = async (
  userId: number,
  planId: number,
  recordedBy: number,
  options: {
    amountOverride?: number | undefined;
    durationOverride?: number | undefined;
    method?: string | undefined;
    referenceNo?: string | undefined;
    notes?: string | undefined;
  } = {},
) => {

  if (!recordedBy) throw new Error("Unauthorized");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userCheck = await client.query(
      `SELECT id FROM users WHERE id = $1`, [userId]
    );
    if (userCheck.rows.length === 0) throw new Error("User does not exist.");

    const planResult = await client.query(
      `SELECT id, name, price, duration_days, category
       FROM subscription_plans
       WHERE id = $1 AND is_active = TRUE`,
      [planId],
    );
    if (planResult.rows.length === 0) {
      throw new Error(`Subscription plan with id ${planId} not found or inactive.`);
    }

    const plan = planResult.rows[0];
    const finalAmount: number = options.amountOverride ?? Number(plan.price);
    const finalDurationDays: number = options.durationOverride ?? plan.duration_days;
    const now = new Date();

    await assertMembershipPurchaseAllowed(client, userId, plan, finalDurationDays);

    await client.query(
      `UPDATE subscriptions
       SET status = 'expired',
           ended_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
         AND status = 'active'
         AND expiry_date <= CURRENT_TIMESTAMP`,
      [userId],
    );

    const activeSub = await client.query(
      `SELECT id, expiry_date
       FROM subscriptions
       WHERE user_id = $1
         AND plan_id = $2
         AND status = 'active'
         AND expiry_date > CURRENT_TIMESTAMP
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, planId],
    );

    let subscription: any;

    if (activeSub.rows.length > 0) {
      const currentExpiry = new Date(activeSub.rows[0].expiry_date);
      const base = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(base);
      newExpiry.setDate(newExpiry.getDate() + finalDurationDays);

      const updated = await client.query(
        `UPDATE subscriptions
         SET plan_id = $2,
             plan_name = $3,
             expiry_date = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [activeSub.rows[0].id, planId, plan.name, newExpiry],
      );
      subscription = updated.rows[0];
    } else {
      const newExpiry = new Date(now);
      newExpiry.setDate(newExpiry.getDate() + finalDurationDays);

      const inserted = await client.query(
        `INSERT INTO subscriptions (user_id, plan_id, plan_name, status, start_date, expiry_date)
         VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, $4)
         RETURNING *`,
        [userId, planId, plan.name, newExpiry],
      );
      subscription = inserted.rows[0];
    }

    const referenceNo = generateReferenceNo(
      "walk_in_pos",
      options.referenceNo ?? null,
    );

    const paymentResult = await client.query(
      `INSERT INTO payments
         (user_id, subscription_id, plan_id, transaction_type, origin, amount, status, method, recorded_by, reference_no, notes, paid_at)
       VALUES ($1, $2, $3, 'plan', 'walk_in_pos', $4, 'paid', $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        userId,
        subscription.id,
        planId,
        finalAmount,
        options.method ?? "cash",
        recordedBy,
        referenceNo,
        options.notes ?? null,
      ],
    );

    await client.query("COMMIT");
    return { subscription, payment: paymentResult.rows[0] };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}