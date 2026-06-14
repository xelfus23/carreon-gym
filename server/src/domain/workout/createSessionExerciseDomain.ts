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
    exercise_type,
    met_value,
    equipment_id,
    sets,
    reps,
    duration_seconds,
    rest_seconds,
    weight_guidance,
    description,
    notes,
    is_warmup,
  } = args;

  console.log("EXERCISE_ARGS: ", args);

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

  const maxOrderResult = await pool.query(
    `SELECT COALESCE(MAX(exercise_order), 0) AS max_order
     FROM session_exercises
     WHERE workout_session_id = $1`,
    [session_id],
  );

  const maxOrder = maxOrderResult.rows[0].max_order;
  const safeOrder = Math.max(exercise_order, maxOrder + 1);

  const result = await pool.query(
    `INSERT INTO session_exercises 
     (workout_session_id, exercise_order, exercise_name, exercise_type, met_value equipment_id, sets, reps, 
      duration_seconds, rest_seconds, weight_guidance, description, 
      notes, is_warmup)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
     RETURNING id`,
    [
      session_id,
      safeOrder,
      exercise_name,
      exercise_type,
      met_value,
      equipment_id || null,
      sets || null,
      finalReps,
      finalDuration,
      rest_seconds || 0,
      weight_guidance || null,
      description || null,
      notes || null,
      !!is_warmup,
    ],
  );

  return {
    success: true,
    exercise_id: result.rows[0].id,
    message: `Added ${exercise_name}`,
  };
};
