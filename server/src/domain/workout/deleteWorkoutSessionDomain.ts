import pool from "../../config/pool.ts";

export async function deleteWorkoutSessionDomain(params: {
  args: any;
  userId: string | number;
}) {
  const { args, userId } = params;

  if (!userId) throw new Error("Unauthorized");

  const { session_id } = args;

  if (!session_id) throw new Error("session_id is required");

  const result = await pool.query(
    `DELETE FROM workout_sessions 
     WHERE id = $1 AND user_id = $2 
     RETURNING id, title`,
    [session_id, userId]
  );

  if (result.rows.length === 0) {
    throw new Error("Workout session not found or access denied");
  }

  return {
    success: true,
    session_id: result.rows[0].id,
    message: `Session "${result.rows[0].title}" deleted successfully`,
  };
}