import type { Request, Response } from "express";
import { meDomain } from "../../domain/user/me.ts";
import { createUserDomain } from "../../domain/user/createUser.ts";
import { generateToken } from "../../utils/generateToken.ts";

export const meController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        
        const data = await meDomain({ userId: userId });

        return res.status(200).json({
            success: true,
            message: "User Retrieved",
            data: {
                user: data,
            },
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res
                .status(500)
                .json({ success: false, message: "Server Error" });
        }
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const user = await createUserDomain(req.body);
        const token = await generateToken(user.id);

        return res.status(200).json({
            success: true,
            message: "Registration Compelete",
            data: {
                user: user,
                token: token,
            },
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res
                .status(500)
                .json({ success: false, message: "Server Error" });
        }
    }
};

export const uploadPicture = async (req: Request, res: Response) => {
    try {
        return res
            .status(200)
            .json({ success: true, message: "Upload Success" });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res
                .status(500)
                .json({ success: false, message: "Server Error" });
        }
    }
};
