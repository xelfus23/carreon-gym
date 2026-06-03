import pool from "../../config/pool.ts";

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
  if (!recordedBy) {
    throw new Error("Unauthorized");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userCheck = await client.query(
      `SELECT id FROM users WHERE id = $1`,
      [userId],
    );

    if (userCheck.rows.length === 0) {
      throw new Error("User does not exist.");
    }

    // 1. Fetch the plan
    const planResult = await client.query(
      `SELECT id, name, price, duration_days
           FROM subscription_plans
           WHERE id = $1 AND is_active = TRUE`,
      [planId],
    );

    if (planResult.rows.length === 0) {
      throw new Error(
        `Subscription plan with id ${planId} not found or inactive.`,
      );
    }

    const plan = planResult.rows[0];

    // 2. Resolve final values (override wins over plan defaults)
    const finalAmount: number =
      options.amountOverride ?? Number(plan.price);
    const finalDurationDays: number =
      options.durationOverride ?? plan.duration_days;

    // const expiryDate = new Date();
    // expiryDate.setDate(expiryDate.getDate() + finalDurationDays);

    const existingSub = await client.query(
      `SELECT expiry_date FROM subscriptions WHERE user_id = $1`,
      [userId],
    );

    let baseDate = new Date();
    const now = new Date();

    if (existingSub.rows.length > 0) {
      const currentExpiry = new Date(existingSub.rows[0].expiry_date);
      if (currentExpiry > now) {
        baseDate = currentExpiry;
      }
    }

    baseDate.setDate(baseDate.getDate() + finalDurationDays);

    // 3. Upsert subscription
    const subResult = await client.query(
      `INSERT INTO subscriptions (user_id, plan_id, plan_name, status, start_date, expiry_date)
           VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, $4)
           ON CONFLICT (user_id)
           DO UPDATE SET
               plan_id    = $2,
               plan_name  = $3,
               status     = 'active',
               start_date = CURRENT_TIMESTAMP,
               expiry_date = $4,
               updated_at  = CURRENT_TIMESTAMP
           RETURNING *`,
      [userId, planId, plan.name, baseDate],
    );

    const subscription = subResult.rows[0];

    const paymentResult = await client.query(
      `INSERT INTO payments
               (user_id, subscription_id, plan_id, amount, status, method, recorded_by, reference_no, notes)
           VALUES ($1, $2, $3, $4, 'paid', $5, $6, $7, $8)
           RETURNING *`,
      [
        userId,
        subscription.id,
        planId,
        finalAmount,
        options.method ?? "cash",
        recordedBy,
        options.referenceNo ?? null,
        options.notes ?? null,
      ],
    );

    await client.query("COMMIT");

    return {
      subscription,
      payment: paymentResult.rows[0],
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}