import type { Request, Response } from "express";
import pool from "../../config/pool.ts";

const saveMessage = async (req: Request, res: Response) => {
    try {
        const { session_id, user_id, role, content, tool_calls, tool_call_id, name } =
            req.body;

        if (!session_id || !role || !user_id) {
            res.status(400).json({
                error: "Missing required fields: session_id, user_id, role",
            });
            return;
        }

        const toolCallsJson = tool_calls
            ? JSON.stringify(tool_calls)
            : null;

        const result = await pool.query(
            `INSERT INTO chat_messages (session_id, user_id, role, content, tool_calls, tool_call_id, name) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id, created_at`,
            [session_id, user_id, role, content, toolCallsJson, tool_call_id, name],
        );

        res.json({
            id: result.rows[0].id,
            created_at: result.rows[0].created_at,
        });
    } catch (err) {
        console.error("Error saving message:", err);
        res.status(500).json({ error: "Failed to save message" });
    }
};
export default saveMessage;
