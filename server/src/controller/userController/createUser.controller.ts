import type { Request, Response } from "express";
import pool from "../../config/db.ts";
import bcrypt from "bcrypt";

const createUser = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Missing Details" });
        }

        const hashedPW = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
            [username, email, hashedPW],
        );

        return res.status(201).json({
            success: true,
            user: newUser.rows[0],
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
    }
};

export default createUser;
