import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";
import { isSessionGenerating } from "./sessionGeneration.ts";

export const getSessionGenerationStatusDomain = async (params: {
  userId: number;
  sessionId: number;
}) => {
  const { sessionId, userId } = params;

  const sessionCheck = await pool.query(
    "SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2",
    [sessionId, userId],
  );

  if (sessionCheck.rows.length === 0) {
    throw new AppError("Chat session does not exist.", 401, "SESSION_MISSING");
  }

  const lastMessage = await pool.query(
    `SELECT id, role, created_at
     FROM chat_messages
     WHERE session_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [sessionId],
  );

  const last = lastMessage.rows[0] ?? null;

  return {
    isGenerating: isSessionGenerating(sessionId),
    lastMessageRole: last?.role ?? null,
    lastMessageId: last?.id ?? null,
    awaitingAssistant: last?.role === "user" && isSessionGenerating(sessionId),
  };
};
