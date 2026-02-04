import pool from "../config/pool.ts";

export async function handleToolCall(toolCall: any, userId: number) {
    if (toolCall.name !== "save_workout_plan") return null;
    if (!userId) throw new Error("Unauthorized");

    console.log(toolCall, userId)

    // 1. Parse Arguments (Handle potential string parsing if LLM messes up)
    let args = toolCall.arguments;
    if (typeof args === "string") {
        args = JSON.parse(args);
    }
    const { title, days } = args;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 2. Fetch Equipment Map to translate Strings -> IDs
        // We do this dynamically so if you add equipment later, it still works.
        const equipResult = await client.query(
            "SELECT id, name FROM equipment",
        );

        // Create a map: { "dumbbells": 1, "barbells": 2, ... }
        const equipmentMap = new Map<string, number>();
        equipResult.rows.forEach((row: any) => {
            equipmentMap.set(row.name.toLowerCase().trim(), row.id);
        });

        // 3. Create the Plan
        const planResult = await client.query(
            `INSERT INTO workout_plans (user_id, title) VALUES ($1, $2) RETURNING id`,
            [userId, title],
        );
        const planId = planResult.rows[0].id;

        // 4. Loop Days
        for (const day of days) {
            const dayResult = await client.query(
                `INSERT INTO workout_days (plan_id, day_order, title) VALUES ($1, $2, $3) RETURNING id`,
                [planId, day.day_order, day.title],
            );
            const dayId = dayResult.rows[0].id;

            // 5. Loop Exercises & LOOKUP ID
            for (const exercise of day.exercises) {
                const equipNameClean = exercise.equipment_name
                    ?.toLowerCase()
                    .trim();

                // Find ID from map, default to 'Bodyweight' or NULL if not found
                let equipId = equipmentMap.get(equipNameClean);

                // Fallback: If AI made up a name, try to find 'Bodyweight', otherwise allow NULL
                if (!equipId) {
                    equipId = equipmentMap.get("bodyweight") || undefined;
                }

                await client.query(
                    `
                    INSERT INTO workout_exercises 
                    (workout_day_id, equipment_id, sets, reps, notes)
                    VALUES ($1, $2, $3, $4, $5)
                    `,
                    [
                        dayId,
                        equipId,
                        exercise.sets,
                        exercise.reps, // ensure DB column is INT, or cast to string if it's VARCHAR
                        exercise.notes,
                    ],
                );
            }
        }

        await client.query("COMMIT");

        // Return a clean message for the frontend to display
        return {
            success: true,
            plan_id: planId,
            message: `Successfully saved "${title}" to your plans!`,
        };
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Save Plan Error:", err);
        throw new Error("Failed to save workout plan.");
    } finally {
        client.release();
    }
}
