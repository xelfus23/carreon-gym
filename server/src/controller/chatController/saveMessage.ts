import type { Request, Response } from "express";
import pool from "../../config/pool.ts";

const saveMessage = async (req: Request, res: Response) => {
    try {
        const { session_id, role, content } = req.body;

        const result = await pool.query(
            `INSERT INTO chat_messages (session_id, role, content) 
             VALUES ($1, $2, $3) 
             RETURNING id`,
            [session_id, role, content],
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};
export default saveMessage;
