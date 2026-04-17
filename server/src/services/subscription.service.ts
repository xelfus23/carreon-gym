// services/subscriptionService.ts
import pool from "../config/pool.ts";

export const subscriptionService = {
    // ── Plans ────────────────────────────────────────────────────────────────

    /** Fetch all active plans for the admin dropdown. */
    async getPlans() {
        const result = await pool.query(
            `SELECT id, name, description, price, duration_days, is_custom
             FROM subscription_plans
             WHERE is_active = TRUE
             ORDER BY duration_days ASC`,
        );
        return result.rows;
    },

    // ── Subscriptions ────────────────────────────────────────────────────────

    async createSubscription(
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
    ) {
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
                `SELECT id, name, price, duration_days, is_custom
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

            // Custom plan requires explicit overrides
            if (plan.is_custom) {
                if (
                    options.durationOverride == null ||
                    options.durationOverride <= 0
                ) {
                    throw new Error(
                        "Custom plan requires a valid durationOverride (days).",
                    );
                }
                if (
                    options.amountOverride == null ||
                    options.amountOverride < 0
                ) {
                    throw new Error(
                        "Custom plan requires a valid amountOverride (amount).",
                    );
                }
            }

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

            // 4. Record payment
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
    },

    /** Cancel a subscription (does not reverse payment). */
    async cancelSubscription(userId: number) {
        const result = await pool.query(
            `UPDATE subscriptions
             SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1
             RETURNING *`,
            [userId],
        );

        if (result.rows.length === 0) {
            throw new Error(`No subscription found for user ${userId}.`);
        }

        return result.rows[0];
    },

    /** Reset a member subscription history reference (hard clear rows). */
    async resetSubscription(userId: number) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const existing = await client.query(
                `SELECT id FROM subscriptions WHERE user_id = $1`,
                [userId],
            );

            if (existing.rowCount === 0) {
                throw new Error(`No subscription found for user ${userId}.`);
            }

            // Keep payment history intact (subscription_id is SET NULL on delete).
            await client.query(`DELETE FROM subscriptions WHERE user_id = $1`, [
                userId,
            ]);

            await client.query("COMMIT");
            return { user_id: userId, cleared_count: existing.rowCount };
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    },

    /** Get current subscription for a member (with plan details). */
    async getSubscription(userId: number) {
        const result = await pool.query(
            `SELECT
                s.*,
                sp.price AS plan_price,
                sp.duration_days AS plan_duration_days,
                sp.is_custom AS plan_is_custom,
                CASE
                    WHEN s.status = 'cancelled' THEN 'cancelled'
                    WHEN s.status = 'pending' THEN 'pending'
                    WHEN s.expiry_date < CURRENT_TIMESTAMP THEN 'expired'
                    ELSE 'active'
                END AS display_status
             FROM subscriptions s
             LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
             WHERE s.user_id = $1`,
            [userId],
        );

        return result.rows[0] ?? null;
    },

    /** Get payment history for a member. */
    async getPaymentHistory(userId: number) {
        const result = await pool.query(
            `SELECT
                p.*,
                sp.name AS plan_name,
                u.first_name || ' ' || u.last_name AS recorded_by_name
             FROM payments p
             LEFT JOIN subscription_plans sp ON p.plan_id = sp.id
             LEFT JOIN users u ON p.recorded_by = u.id
             WHERE p.user_id = $1
             ORDER BY p.paid_at DESC`,
            [userId],
        );

        return result.rows;
    },
};
