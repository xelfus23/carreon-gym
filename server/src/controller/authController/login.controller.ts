import type { Request, Response } from "express";
import pool from "../../config/pool.ts";
import bcrypt from "bcrypt";

const loginController = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res.status(400).json({ error: "Missing Details" });
        }

        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username],
        );

        if (result.rows.length === 0) {
            return res
                .status(401)
                .json({ error: "Invalid username or password" });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res
                .status(401)
                .json({ error: "Invalid username or password" });
        }

        return res.status(200).json({
            success: true,
            user: { id: user.id, username: user.username },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export default loginController;
