import pool from "../../config/pool.ts";

export const getSessionMessagesDomain = async (params: {
    userId: number;
    sessionId: number;
}) => {
    const { sessionId, userId } = params;

    const sessionCheck = await pool.query(
        "SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2",
        [sessionId, userId],
    );

    if (sessionCheck.rows.length === 0) {
        throw new Error("Unauthorized access to this chat");
    }

    const result = await pool.query(
        `SELECT * FROM chat_messages 
             WHERE session_id = $1 
             ORDER BY created_at ASC`,
        [sessionId],
    );

    return result.rows;
};
