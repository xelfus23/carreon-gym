// domain/workout/addExercise.ts

import pool from "../../config/pool.ts";

export const createSessionExerciseDomain = async (params: {
  args: any;
  userId: number;
}) => {
  const { args, userId } = params;

  const {
    session_id,
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

  const finalReps = reps && reps > 0 ? reps : null;
  const finalDuration =
    !finalReps && duration_seconds && duration_seconds > 0
      ? duration_seconds
      : null;

  const ownership = await pool.query(
    `SELECT id FROM workout_sessions
     WHERE id = $1 AND user_id = $2`,
    [session_id, userId],
  );
  if (ownership.rows.length === 0) throw new Error("Session access denied");

  const result = await pool.query(
    `INSERT INTO session_exercises 
     (workout_session_id, exercise_order, exercise_name, equipment_id, sets, reps, 
      duration_seconds, rest_seconds, weight_guidance, tempo, description, 
      notes, is_warmup, is_superset, superset_group)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING id`,
    [
      session_id,
      exercise_order,
      exercise_name,
      equipment_id || null,
      sets || null,
      finalReps,
      finalDuration,
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

  return {
    success: true,
    exercise_id: result.rows[0].id,
    message: `Added ${exercise_name}`,
  };
};