import type { Request, Response } from "express";
import { checkInDomain } from "../../domain/attendance/checkIn.ts";
import { z } from "zod";
import { checkOutDomain } from "../../domain/attendance/checkOut.ts";
import { getActiveSessionDomain } from "../../domain/attendance/activeSession.ts";

const CheckInSchema = z.object({
    qr_data: z.string().min(1, "QR data required"),
});

export const checkIn = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // Validate request body
        const validation = CheckInSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR code data",
                errors: validation.error,
            });
        }

        const { qr_data } = validation.data;

        if (qr_data !== "GYM:main") {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid gym QR code. Please scan the correct QR code at the entrance.",
            });
        }

        const data = await checkInDomain({ userId });

        return res.status(200).json({
            success: true,
            message: "Check-in successful! 💪",
            data: data,
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error("Check-in Error:", err.message);

            const statusCode = err.message.includes("already checked in")
                ? 409
                : err.message.includes("subscription")
                  ? 403
                  : 500;

            return res.status(statusCode).json({
                success: false,
                message: err.message,
            });
        }
    }
};

export const checkOut = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const data = await checkOutDomain({ userId });

        return res.status(200).json({
            success: true,
            message: "Check-out successful! Great workout! 🎉",
            data: data,
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error("Check-out Error:", err.message);

            const statusCode = err.message.includes("No active session")
                ? 404
                : 500;

            return res.status(statusCode).json({
                success: false,
                message: err.message,
            });
        }
    }
};

export const getSessionStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const session = await getActiveSessionDomain({ userId });

        return res.status(200).json({
            success: true,
            data: session,
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error("Get Session Error:", err.message);
            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
};
