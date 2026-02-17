// domain/workout/addExercise.ts

import pool from "../../config/pool.ts";

export const addExerciseDomain = async (params: {
    args: any;
    userId: number;
}) => {
    const { args, userId } = params;

    // 1. Destructure with defaults
    const {
        day_id,
        exercise_order,
        exercise_name,
        equipment_id,
        sets,
        reps,
        duration_seconds,
        rest_seconds,
        weight_guidance,
        tempo,
        description,
        notes,
        is_warmup,
        is_superset,
        superset_group,
    } = args;

    // 2. Logic Check: Force "Reps OR Duration"
    // If reps is provided, duration must be null. If duration is provided, reps must be null.
    // We also treat 0 or undefined as null to satisfy the DB constraint.
    const finalReps = reps && reps > 0 ? reps : null;
    const finalDuration =
        !finalReps && duration_seconds && duration_seconds > 0
            ? duration_seconds
            : null;

    // Security check...
    const ownership = await pool.query(
        `SELECT d.id FROM workout_days d 
         JOIN workout_plans p ON d.plan_id = p.id 
         WHERE d.id = $1 AND p.user_id = $2`,
        [day_id, userId],
    );
    if (ownership.rows.length === 0) throw new Error("Day access denied");

    // 3. Insert using sanitized values
    await pool.query(
        `INSERT INTO workout_exercises 
         (workout_day_id, exercise_order, exercise_name, equipment_id, sets, reps, 
          duration_seconds, rest_seconds, weight_guidance, tempo, description, 
          notes, is_warmup, is_superset, superset_group)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
            day_id,
            exercise_order,
            exercise_name,
            equipment_id || null,
            sets || null,
            finalReps, // Sanitized
            finalDuration, // Sanitized
            rest_seconds || 0,
            weight_guidance || null,
            tempo || "2-0-2-0",
            description || null,
            notes || null,
            !!is_warmup,
            !!is_superset,
            superset_group || null,
        ],
    );

    return { success: true, message: `Added ${exercise_name}` };
};
