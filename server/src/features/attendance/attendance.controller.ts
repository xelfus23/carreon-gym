import type { Request, Response } from "express";
import { checkInDomain } from "../../domain/attendance/checkIn.ts";
import { z } from "zod";
import { checkOutDomain } from "../../domain/attendance/checkOut.ts";
import { getActiveSessionDomain } from "../../domain/attendance/activeSession.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import { attendanceLogDomain } from "../../domain/attendance/attendanceLog.ts";

const CheckInSchema = z.object({
    qr_data: z.string().min(1, "QR data required"),
});

export const checkIn = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Invalid user ID provided.",
        });
    }

    const validation = CheckInSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid QR code data",
            errors: validation.error,
        });
    }

    const { qr_data } = validation.data;

    if (qr_data !== "GYM:in") {
        return res.status(400).json({
            success: false,
            message: "Invalid gym QR code. Please scan the correct QR code",
        });
    }

    const data = await checkInDomain({ userId });

    return res.status(200).json({
        success: true,
        message: "Check-in successful! 💪",
        data: data,
    });
});

export const checkOut = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Invalid user ID provided.",
        });
    }

    const validation = CheckInSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            success: false,
            message: "Invalid QR code data",
            errors: validation.error,
        });
    }

    const { qr_data } = validation.data;

    if (qr_data !== "GYM:out") {
        return res.status(400).json({
            success: false,
            message: "Invalid gym QR code. Please scan the correct QR code",
        });
    }

    const data = await checkOutDomain({ userId });

    return res.status(200).json({
        success: true,
        message: "Check-out successful! Great workout! 🎉",
        data: data,
    });
});

export const getAttendanceLog = catchAsync(
    async (req: Request, res: Response) => {
        const attendanceLog = await attendanceLogDomain();

        return res.status(200).json({
            success: true,
            data: attendanceLog,
        });
    },
);

export const getSessionStatus = catchAsync(
    async (req: Request, res: Response) => {
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
    },
);
