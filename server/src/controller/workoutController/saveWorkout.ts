import pool from "../../config/pool.ts";

export const saveWorkoutPlan = async (
    toolCall: any,
    userId: string | number,
) => {
    console.log("\n========================================");
    console.log("💾 SAVE WORKOUT PLAN - START");
    console.log("========================================");
    console.log("User ID:", userId);
    console.log("Raw toolCall:", JSON.stringify(toolCall, null, 2));

    if (!userId) {
        console.error("❌ No userId provided");
        throw new Error("Unauthorized");
    }

    const client = await pool.connect();
    console.log("✅ Database client connected");

    try {
        let args = toolCall.arguments;
        console.log("Arguments type:", typeof args);
        console.log("Raw arguments:", JSON.stringify(args));

        if (typeof args === "string") {
            console.log("🔄 Parsing arguments from string...");
            args = JSON.parse(args);
        }

        console.log("✅ Parsed arguments:", JSON.stringify(args, null, 2));

        const {
            title,
            description,
            duration_weeks,
            days_per_week,
            difficulty_level,
            days,
        } = args;

        console.log("\n--- Plan Details ---");
        console.log("Title:", title);
        console.log("Description:", description);
        console.log("Duration (weeks):", duration_weeks);
        console.log("Days per week:", days_per_week);
        console.log("Difficulty:", difficulty_level);
        console.log("Number of days:", days?.length);

        // Validate required fields
        if (!title) {
            console.error("❌ Missing title");
            throw new Error("Workout plan must have a title");
        }

        if (!days || days.length === 0) {
            console.error("❌ No days provided");
            throw new Error("Workout plan must have at least one day");
        }

        console.log("\n🔄 Starting database transaction...");
        await client.query("BEGIN");

        // Create the plan with all fields
        console.log("\n📝 Inserting workout plan into database...");
        const planResult = await client.query(
            `INSERT INTO workout_plans 
             (user_id, title, description, duration_weeks, days_per_week, difficulty_level) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id`,
            [
                userId,
                title,
                description,
                duration_weeks,
                days_per_week,
                difficulty_level,
            ],
        );
        const planId = planResult.rows[0].id;
        console.log("✅ Workout plan created with ID:", planId);

        // Loop Days
        console.log("\n🔄 Processing", days.length, "days...");
        for (let i = 0; i < days.length; i++) {
            const day = days[i];
            console.log(`\n--- Day ${i + 1}/${days.length} ---`);
            console.log("Day order:", day.day_order);
            console.log("Title:", day.title);
            console.log("Is rest day:", day.is_rest_day);
            console.log("Exercises:", day.exercises?.length || 0);

            const dayResult = await client.query(
                `INSERT INTO workout_days 
                 (plan_id, day_order, title, is_rest_day, rest_day_notes) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING id`,
                [
                    planId,
                    day.day_order,
                    day.title,
                    day.is_rest_day || false,
                    day.rest_day_notes,
                ],
            );
            const dayId = dayResult.rows[0].id;
            console.log("✅ Day created with ID:", dayId);

            // Loop Exercises
            if (day.exercises && day.exercises.length > 0) {
                console.log(
                    `🔄 Processing ${day.exercises.length} exercises for day ${i + 1}...`,
                );

                for (let j = 0; j < day.exercises.length; j++) {
                    const exercise = day.exercises[j];
                    console.log(
                        `\n  Exercise ${j + 1}/${day.exercises.length}:`,
                    );
                    console.log("  - Name:", exercise.exercise_name);
                    console.log("  - Order:", exercise.exercise_order);
                    console.log("  - Equipment ID:", exercise.equipment_id);
                    console.log("  - Sets:", exercise.sets);
                    console.log("  - Reps:", exercise.reps);
                    console.log("  - Rest:", exercise.rest_seconds, "sec");

                    try {
                        await client.query(
                            `INSERT INTO workout_exercises 
                             (workout_day_id, exercise_order, exercise_name, equipment_id, 
                              sets, reps, duration_minutes, rest_seconds, weight_guidance, 
                              tempo, description, notes, is_warmup, is_superset, superset_group)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                            [
                                dayId,
                                exercise.exercise_order,
                                exercise.exercise_name,
                                exercise.equipment_id,
                                exercise.sets,
                                exercise.reps,
                                exercise.duration_minutes,
                                exercise.rest_seconds,
                                exercise.weight_guidance,
                                exercise.tempo || "2-0-2-0",
                                exercise.description,
                                exercise.notes,
                                exercise.is_warmup || false,
                                exercise.is_superset || false,
                                exercise.superset_group,
                            ],
                        );
                        console.log("  ✅ Exercise saved successfully");
                    } catch (exerciseErr) {
                        console.error(
                            "  ❌ Failed to save exercise:",
                            exerciseErr,
                        );
                        console.error(
                            "  Exercise data:",
                            JSON.stringify(exercise, null, 2),
                        );
                        throw exerciseErr;
                    }
                }
                console.log(
                    `✅ All ${day.exercises.length} exercises saved for day ${i + 1}`,
                );
            } else {
                console.log("⚠️ No exercises for this day (rest day?)");
            }
        }

        console.log("\n✅ Committing transaction...");
        await client.query("COMMIT");
        console.log("✅ Transaction committed successfully");

        const result = {
            success: true,
            plan_id: planId,
            message: `Successfully saved "${title}" to your plans!`,
        };

        console.log("\n========================================");
        console.log("✅ SAVE WORKOUT PLAN - SUCCESS");
        console.log("========================================");
        console.log("Result:", result);

        return result;
    } catch (err) {
        console.error("\n========================================");
        console.error("❌ SAVE WORKOUT PLAN - ERROR");
        console.error("========================================");
        console.error("Error:", err);
        console.error("Error message:", (err as Error).message);
        console.error("Error stack:", (err as Error).stack);

        console.log("🔄 Rolling back transaction...");
        await client.query("ROLLBACK");
        console.log("✅ Transaction rolled back");

        throw new Error(
            `Failed to save workout plan: ${(err as Error).message}`,
        );
    } finally {
        client.release();
        console.log("🔌 Database client released");
    }
};
