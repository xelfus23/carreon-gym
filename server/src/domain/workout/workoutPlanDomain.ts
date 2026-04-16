import pool from "../../config/pool.ts";

export const activatePlan = async (userId: number, planId: string) => {
    await pool.query(
        "UPDATE workout_plans SET is_active = false WHERE user_id = $1",
        [userId],
    );

    // 2. Activate the specific plan
    const result = await pool.query(
        "UPDATE workout_plans SET is_active = true WHERE id = $2 AND user_id = $1 RETURNING *",
        [userId, planId],
    );

    return result.rows[0];
};


export const deactivatePlan = async (userId: number, planId: string) => {
    const result = await pool.query(
        "UPDATE workout_plans SET is_active = false WHERE id = $2 AND user_id = $1 RETURNING *",
        [userId, planId],
    );
    return result.rows[0];
};
