import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";

export const getSessionMessagesDomain = async (params: {
  userId: number;
  sessionId: number;
  limit?: number;
  beforeId?: number;
}) => {
  const { sessionId, userId, limit = 50, beforeId } = params;

  const sessionCheck = await pool.query(
    "SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2",
    [sessionId, userId],
  );

  if (sessionCheck.rows.length === 0) {
    throw new AppError("Chat session does not exist.", 401, "SESSION_MISSING");
  }

  const queryParams: (number)[] = [sessionId];
  let query = `SELECT * FROM chat_messages WHERE session_id = $1`;

  if (beforeId) {
    queryParams.push(beforeId);
    query += ` AND id < $${queryParams.length}`;
  }

  queryParams.push(limit);
  query += ` ORDER BY created_at DESC LIMIT $${queryParams.length}`;

  const result = await pool.query(query, queryParams);

  return result.rows.reverse();
};
