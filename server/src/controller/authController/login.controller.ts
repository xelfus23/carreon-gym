import type { Request, Response } from "express";
import pool from "../../config/pool.ts";
import bcrypt from "bcrypt";
import { generateToken } from "../../services/GenerateJWT.ts";

const loginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Missing Details",
            });
        }

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email],
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid Credentials",
                success: false,
            });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.hashed_password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }

        const token = generateToken(user.id);

        return res.status(200).json({
            success: true,
            message: "Login Success",
            data: {
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    contactNumber: user.phone_number,
                    token,
                },
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export default loginController;
