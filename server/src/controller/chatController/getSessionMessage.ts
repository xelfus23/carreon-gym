import type { Request, Response } from "express";
import pool from "../../config/pool.ts";

const getSessionMessages = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { sessionId } = req.params;

        console.log("Fetching Session ID: ", sessionId);

        // Security Check: Ensure this session actually belongs to this user
        const sessionCheck = await pool.query(
            "SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2",
            [sessionId, userId],
        );

        if (sessionCheck.rows.length === 0) {
            return res
                .status(403)
                .json({ error: "Unauthorized access to this chat" });
        }

        const result = await pool.query(
            `SELECT * FROM chat_messages 
             WHERE session_id = $1 
             ORDER BY created_at ASC`,
            [sessionId],
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

export default getSessionMessages;
