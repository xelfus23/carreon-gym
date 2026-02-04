import type { Request, Response } from "express";
import pool from "../../config/pool.ts";

const getSessions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id; // From JWT middleware

        const result = await pool.query(
            `SELECT * FROM chat_sessions 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId],
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

export default getSessions;
