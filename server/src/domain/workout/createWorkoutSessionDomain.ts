import pool from "../../config/pool.ts";

export const createWorkoutSessionDomain = async (params: {
  args: any;
  userId: number;
}) => {
  const { args, userId } = params;

  const { title, session_date, difficulty_level, is_rest_day, rest_day_notes, notes } = args;

  // Return existing session if one already exists for that date
  const existing = await pool.query(
    `SELECT id FROM workout_sessions WHERE user_id = $1 AND session_date = $2`,
    [userId, session_date]
  );

  if (existing.rows.length > 0) {
    return {
      success: true,
      session_id: Number(existing.rows[0].id),
      created: false,
      message: `Session already exists for ${session_date}. Use session_id ${Number(existing.rows[0].id)} to add exercises.`,
    };
  }

  const result = await pool.query(
    `INSERT INTO workout_sessions 
     (user_id, title, session_date, difficulty_level, is_rest_day, rest_day_notes, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      userId,
      title || "Workout",
      session_date,
      difficulty_level || null,
      is_rest_day || false,
      rest_day_notes || null,
      notes || null,
    ]
  );

  return {
    success: true,
    session_id: result.rows[0].id,
    created: true,
    message: `Created session: ${title || "Workout"} for ${session_date}`,
  };
};