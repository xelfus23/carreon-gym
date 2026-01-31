import type { Request, Response } from "express";
import pool from "../../config/pool.ts";

const meController = async (req: Request, res: Response) => {
    try {
        if (!req.user)
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });

        const userId = req.user.id;

        const result = await pool.query(
            `SELECT u.id, u.first_name, u.last_name, u.username, u.email, u.role, u.phone_number,
                p.height_cm, p.weight_kg, p.gender, p.birth_date, p.goal, p.activity_level
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                WHERE u.id = $1`,
            [userId],
        );

        if (result.rowCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        const user = result.rows[0];

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                email: user.email,
                role: user.role,
                phoneNumber: user.phone_number,
            },
        });
    } catch (err) {
        if (err instanceof Error) {
            return res
                .status(500)
                .json({ success: false, message: err.message });
        }
    }
};

export default meController;
