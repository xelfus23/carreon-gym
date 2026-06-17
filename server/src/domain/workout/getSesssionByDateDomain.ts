import pool from "../../config/pool.ts";


export const getSessionByDateDomain = async (params: {
  userId: number;
  session_date: string;
}) => {
  const { userId, session_date } = params;

  const result = await pool.query(
    `SELECT id, title, difficulty_level, is_rest_day, notes
     FROM workout_sessions
     WHERE user_id = $1 AND session_date = $2
     LIMIT 1`,
    [userId, session_date],
  );

  if (result.rows.length === 0) {
    return {
      found: false,
      session_id: null,
      message: `No session found for ${session_date}. Call create_workout_session to create one.`,
    };
  }

  const row = result.rows[0];
  
  return {
    found: true,
    session_id: Number(row.id),
    title: row.title,
    difficulty_level: row.difficulty_level,
    is_rest_day: row.is_rest_day,
    notes: row.notes,
    message: `Session found for ${session_date}. Use session_id ${Number(row.id)} to add exercises.`,
  };
};