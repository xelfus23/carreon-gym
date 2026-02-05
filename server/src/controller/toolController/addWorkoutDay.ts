import pool from "../../config/pool.ts";

// API handler for add_workout_day
export async function addWorkoutDay(toolCall: any, userId: string | number) {
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

    // 1. Verify the plan belongs to this user
    const plan = await pool.query(
        "SELECT id FROM workout_plans WHERE id = $1 AND user_id = $2",
        [plan_id, userId],
    );

    if (plan.rows.length === 0) {
        throw new Error("Workout plan not found or access denied");
    }

    // 2. Insert the new day
    const dayResult = await pool.query(
        `INSERT INTO workout_days (plan_id, day_order, title, is_rest_day, rest_day_notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [plan_id, day_order, title, is_rest_day || false, rest_day_notes],
    );

    const workoutDayId = dayResult.rows[0].id;

    // 3. Insert exercises
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
}

// API handler for getting user's plans
export async function getUserWorkoutPlans(userId: number) {
    const result = await pool.query(
        `SELECT 
            wp.id,
            wp.title,
            wp.description,
            wp.duration_weeks,
            wp.days_per_week,
            wp.difficulty_level,
            wp.created_at,
            COUNT(wd.id) as total_days
         FROM workout_plans wp
         LEFT JOIN workout_days wd ON wp.id = wd.plan_id
         WHERE wp.user_id = $1
         GROUP BY wp.id
         ORDER BY wp.created_at DESC`,
        [userId],
    );

    return result.rows;
}
