import pool from "../../config/pool.ts";

export const addWorkoutDayDomain = async (params: {
    toolCall: any;
    userId: string | number;
}) => {
    const { userId, toolCall } = params;

    if (!userId) throw new Error("Unauthorized");

    let args = toolCall.arguments;

    if (typeof args === "string") {
        args = JSON.parse(args);
    }

    const {
        plan_id,
        day_order,
        title,
        is_rest_day,
        rest_day_notes,
        exercises,
    } = args;

    const plan = await pool.query(
        "SELECT id FROM workout_plans WHERE id = $1 AND user_id = $2",
        [plan_id, userId],
    );

    if (plan.rows.length === 0) {
        throw new Error("Workout plan not found or access denied");
    }

    const dayResult = await pool.query(
        `INSERT INTO workout_days (plan_id, day_order, title, is_rest_day, rest_day_notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [plan_id, day_order, title, is_rest_day || false, rest_day_notes],
    );

    const workoutDayId = dayResult.rows[0].id;

    for (const exercise of exercises) {
        await pool.query(
            `INSERT INTO workout_exercises (
                workout_day_id, exercise_order, exercise_name, equipment_id,
                sets, reps, duration_minutes, rest_seconds, weight_guidance,
                tempo, description, notes, is_warmup, is_superset, superset_group
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
                workoutDayId,
                exercise.exercise_order,
                exercise.exercise_name,
                exercise.equipment_id,
                exercise.sets,
                exercise.reps,
                exercise.duration_minutes,
                exercise.rest_seconds,
                exercise.weight_guidance,
                exercise.tempo,
                exercise.description,
                exercise.notes,
                exercise.is_warmup || false,
                exercise.is_superset || false,
                exercise.superset_group,
            ],
        );
    }

    return { success: true, workout_day_id: workoutDayId };
};
