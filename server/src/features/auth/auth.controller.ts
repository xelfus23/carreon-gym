import type { Request, Response } from "express";
import { loginDomain } from "../../domain/auth/login.ts";
import { generateToken } from "../../utils/generateToken.ts";

export const loginController = async (req: Request, res: Response) => {
    try {
        console.log(req.body);

        const user = await loginDomain(req.body);
        const token = await generateToken(user.id);

        return res.status(200).json({
            success: true,
            message: "Login Success",
            data: {
                user: user,
                token: token,
            },
        });
    } catch (err) {
        if (err instanceof Error) {
            if (
                err.message === "Invalid credentials" ||
                err.message === "Incomplete details"
            ) {
                return res.status(401).json({
                    success: false,
                    message: err.message,
                });
            }

            return res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    }
};
