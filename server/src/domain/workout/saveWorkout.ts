import pool from "../../config/pool.ts";

export const saveWorkoutPlanDomain = async (params: {
    args: any;
    userId: number;
}) => {
    const { args, userId } = params;
    const client = await pool.connect();

    try {
        const {
            title,
            description,
            duration_weeks,
            days_per_week,
            difficulty_level,
            days,
        } = args;

        if (!title) {
            throw new Error("Workout plan must have a title");
        }

        if (!days || days.length === 0) {
            throw new Error("Workout plan must have at least one day");
        }

        await client.query("BEGIN");

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

        for (let i = 0; i < days.length; i++) {
            const day = days[i];

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

            if (day.exercises && day.exercises.length > 0) {
                for (let j = 0; j < day.exercises.length; j++) {
                    const exercise = day.exercises[j];

                    try {
                        await client.query(
                            `INSERT INTO workout_exercises 
                             (workout_day_id, exercise_order, exercise_name, equipment_id, 
                              sets, reps, duration_seconds, rest_seconds, weight_guidance, 
                              tempo, description, notes, is_warmup, is_superset, superset_group)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                            [
                                dayId,
                                exercise.exercise_order,
                                exercise.exercise_name,
                                exercise.equipment_id,
                                exercise.sets,
                                exercise.reps,
                                exercise.duration_seconds,
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
                    } catch (exerciseErr) {
                        throw exerciseErr;
                    }
                }
            } else {
                console.log("⚠️ No exercises for this day (rest day?)");
            }
        }

        await client.query("COMMIT");

        const result = {
            success: true,
            plan_id: planId,
            message: `Successfully saved "${title}" to your plans!`,
        };

        return result;
    } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(
            `Failed to save workout plan: ${(err as Error).message}`,
        );
    } finally {
        client.release();
    }
};
