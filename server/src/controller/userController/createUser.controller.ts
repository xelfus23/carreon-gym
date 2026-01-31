import type { Request, Response } from "express";
import pool from "../../config/pool.ts";
import bcrypt from "bcrypt";
import { generateToken } from "../../services/GenerateJWT.ts";

const createUser = async (req: Request, res: Response) => {
    const { firstName, lastName, password, email, contactNumber } = req.body;

    console.log(email);

    try {
        if (!firstName || !lastName || !password || !email || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Missing details",
            });
        }

        const hashedPW = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            `INSERT INTO users (first_name, last_name, hashed_password, email, phone_number)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, first_name, last_name, email, phone_number, role, created_at
            `,
            [firstName, lastName, hashedPW, email, contactNumber],
        );

        const user = newUser.rows[0];
        const token = generateToken(user.id);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            data: {
                user: {
                    id: user.id,
                    firsName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    contactNumber: user.phone_number,
                    token,
                },
            },
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);

            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
};

export default createUser;
