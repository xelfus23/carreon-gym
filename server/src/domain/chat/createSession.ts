import pool from "../../config/pool.ts";

export const createSessionDomain = async (params: {
    userId: number;
    type: "model";
}) => {
    const { userId, type } = params;

    const result = await pool.query(
        `INSERT INTO chat_sessions (user_id, type) 
             VALUES ($1, $2) 
             RETURNING id, created_at`,
        [userId, type || "model"],
    );

    if (result.rowCount === 0) {
        throw new Error("Session not created");
    }

    return result.rows[0];
};
