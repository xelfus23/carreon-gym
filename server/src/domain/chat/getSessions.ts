import pool from "../../config/pool.ts";

export const getSessionsDomain = async (params: { userId: number }) => {
    const { userId } = params;

    const result = await pool.query(
        `SELECT * FROM chat_sessions 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
        [userId],
    );

    return result.rows;
};
