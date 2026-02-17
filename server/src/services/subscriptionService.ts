// services/subscriptionService.ts
import pool from "../config/pool.ts";

export const subscriptionService = {
    async createSubscription(
        userId: number,
        planName: string,
        durationDays: number,
    ) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + durationDays);

        const result = await pool.query(
            `INSERT INTO subscriptions (user_id, plan_name, status, expiry_date)
             VALUES ($1, $2, 'active', $3)
             ON CONFLICT (user_id) 
             DO UPDATE SET 
                plan_name = $2,
                status = 'active',
                start_date = CURRENT_TIMESTAMP,
                expiry_date = $3,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, planName, expiryDate],
        );

        return result.rows[0];
    },

    async cancelSubscription(userId: number) {
        const result = await pool.query(
            `UPDATE subscriptions
             SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1
             RETURNING *`,
            [userId],
        );

        return result.rows[0];
    },

    async checkExpiredSubscriptions() {
        // Run this periodically (cron job)
        await pool.query(
            `UPDATE subscriptions
             SET status = 'expired', updated_at = CURRENT_TIMESTAMP
             WHERE expiry_date < CURRENT_TIMESTAMP 
             AND status = 'active'`,
        );
    },

    async getSubscription(userId: number) {
        const result = await pool.query(
            `SELECT * FROM subscriptions WHERE user_id = $1`,
            [userId],
        );

        return result.rows[0] || null;
    },
};
