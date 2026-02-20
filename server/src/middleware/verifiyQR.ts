import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyQR = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const qrToken = req.body.qr_data;

    console.log("QR TOKEN SCAN VERIFYING");

    if (!qrToken) {
        console.error("No QR token provided");

        return res.status(400).json({
            message: "No QR token provided",
            success: false,
        });
    }

    try {
        const decoded = jwt.verify(qrToken, process.env.GYM_QR_SECRET!);

        if ((decoded as any).type !== "gym_checkin") {
            console.error("Invalid QR type");
            return res.status(400).json({
                success: false,
                message: "Invalid QR type",
            });
        }
        next();
    } catch (err) {
        console.error("QR expired or invalid");
        return res.status(400).json({
            message: "QR expired or invalid",
            success: false,
        });
    }
};
