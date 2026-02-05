import type { Request, Response } from "express";
import pool from "../../config/pool.ts";

const createSession = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { type } = req.body;

        const result = await pool.query(
            `INSERT INTO chat_sessions (user_id, type) 
             VALUES ($1, $2) 
             RETURNING id, created_at`,
            [userId, type || "model"],
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

export default createSession;