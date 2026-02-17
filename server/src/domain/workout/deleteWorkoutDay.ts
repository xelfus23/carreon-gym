import pool from "../../config/pool.ts";

export async function deleteWorkoutDayDomain(params: {
    args: any;
    userId: string | number;
}) {
    const { args, userId } = params;

    if (!userId) throw new Error("Unauthorized");

    const { plan_id, day_order } = args;

    if (!plan_id || !day_order) {
        throw new Error("plan_id and day_order are required");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const plan = await client.query(
            `SELECT id FROM workout_plans WHERE id = $1 AND user_id = $2`,
            [plan_id, userId],
        );

        if (plan.rows.length === 0) {
            throw new Error("Workout plan not found or access denied");
        }

        const dayResult = await client.query(
            `
            SELECT id FROM workout_days
            WHERE plan_id = $1 AND day_order = $2
            `,
            [plan_id, day_order],
        );

        if (dayResult.rows.length === 0) {
            throw new Error("Workout day not found");
        }

        const workoutDayId = dayResult.rows[0].id;

        await client.query(`DELETE FROM workout_days WHERE id = $1`, [
            workoutDayId,
        ]);

        await client.query("COMMIT");

        return {
            success: true,
            workout_day_id: workoutDayId,
            message: `Day ${day_order} deleted successfully`,
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}
