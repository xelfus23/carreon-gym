import { WebSocket } from "ws";
import { createSessionExerciseDomain } from "../../../domain/workout/createSessionExerciseDomain.ts";
import pool from "../../../config/pool.ts";

export const createSessionExercise = async (ws: WebSocket, args: any, userId: number) => {

  let { session_id } = args;


  console.log("EXERCISE AI RESPONSE: ", args)


  if (!session_id || typeof session_id !== "number") {
    const fallback = await pool.query(
      `SELECT id FROM workout_sessions 
       WHERE user_id = $1 AND session_date = CURRENT_DATE`,
      [userId],
    );

    if (fallback.rows.length === 0) {
      throw new Error("No session found for today. Call create_workout_session first.");
    }

    session_id = fallback.rows[0].id;
  }

  return createSessionExerciseDomain({
    args: { ...args, session_id },
    userId,
  });
};
