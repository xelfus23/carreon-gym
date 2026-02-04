import type { Request, Response } from "express";
import pool from "../../config/pool.ts";

const deleteMessage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM chat_messages WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

export default deleteMessage;
