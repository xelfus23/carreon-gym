import pool from "../../config/pool.ts";

export const deleteWorkoutPlan = async (
    toolCall: any,
    userId: string | number,
) => {
    console.log("🗑️ DELETE WORKOUT PLAN");

    if (!userId) throw new Error("Unauthorized");

    let args = toolCall.arguments;
    
    if (typeof args === "string") args = JSON.parse(args);

    const { plan_id } = args;

    if (!plan_id) {
        throw new Error("plan_id is required for deletion");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `
      DELETE FROM workout_plans
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
            [plan_id, userId],
        );

        if (result.rowCount === 0) {
            throw new Error("Workout plan not found or not owned by user");
        }

        await client.query("COMMIT");

        return {
            success: true,
            plan_id,
            message: "Workout plan deleted successfully",
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};
