import type { Request, Response } from "express";
import { checkInDomain } from "../../domain/attendance/checkIn.ts";
import { z } from "zod";
import { checkOutDomain } from "../../domain/attendance/checkOut.ts";
import { getActiveSessionDomain } from "../../domain/attendance/activeSession.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import { attendanceLogDomain } from "../../domain/attendance/attendanceLog.ts";
import { broadcastNotification } from "../../ai/websocketHandler.ts";
import pool from "../../config/pool.ts";

type AttendanceAction = "check_in" | "check_out";

const CheckInSchema = z.object({
    qr_data: z.string().min(1, "QR data required"),
});

const mapFailureReason = (err: any) => {
    if (err?.code === "UNAUTHORIZED_ACCESS") return "NO_SUBSCRIPTION";
    if (err?.code === "ALREADY_CHECKED_IN") return "ALREADY_CHECKED_IN";
    if (err?.code === "NOT_CHECKED_IN") return "NOT_CHECKED_IN";
    return "UNKNOWN_ERROR";
};

const logAttendanceAttempt = async (params: {
    userId: number;
    action: AttendanceAction;
    result: "success" | "failed";
    reason?: string;
    metadata?: Record<string, unknown>;
}) => {
    const { userId, action, result, reason = null, metadata = {} } = params;

    await pool.query(
        `INSERT INTO attendance_attempts
        (user_id, action, result, reason, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
        [userId, action, result, reason, JSON.stringify(metadata)],
    );
};

export const checkIn = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const metadata = {
        qr_data: req.body?.qr_data ?? null,
        source: "mobile_qr",
    };

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Invalid user ID provided.",
        });
    }

    const validation = CheckInSchema.safeParse(req.body);

    if (!validation.success) {
        await logAttendanceAttempt({
            userId,
            action: "check_in",
            result: "failed",
            reason: "INVALID_QR_DATA",
            metadata,
        });
        return res.status(400).json({
            success: false,
            message: "Invalid QR code data",
        });
    }

    const { qr_data } = validation.data;

    if (qr_data !== "GYM:in") {
        await logAttendanceAttempt({
            userId,
            action: "check_in",
            result: "failed",
            reason: "INVALID_QR",
            metadata,
        });

        broadcastNotification("ATTENDANCE_ATTEMPT", {
            type: "failed",
            action: "check_in",
            memberId: userId,
            reason: "INVALID_QR",
        });

        return res.status(400).json({
            success: false,
            message: "Invalid QR code",
        });
    }

    // =====================================================
    // 🚨 1. EARLY COOLDOWN CHECK (MUST BE FIRST)
    // =====================================================

    const lastAttempt = await pool.query(
        `SELECT log_status, check_in_time
       FROM gym_attendance
       WHERE user_id = $1
       ORDER BY check_in_time DESC
       LIMIT 1`,
        [userId],
    );

    if (lastAttempt.rowCount! > 0) {
        const last = lastAttempt.rows[0];

        const diff =
            (Date.now() - new Date(last.check_in_time).getTime()) / 1000;

        const COOLDOWN_SECONDS = 10;

        if (diff < COOLDOWN_SECONDS) {
            await logAttendanceAttempt({
                userId,
                action: "check_in",
                result: "failed",
                reason: "COOLDOWN_ACTIVE",
                metadata: {
                    ...metadata,
                    cooldown_seconds: COOLDOWN_SECONDS,
                },
            });
            return res.status(429).json({
                success: false,
                message: "Please wait before scanning again.",
            });
        }
    }

    try {
        // =====================================================
        // ✅ 2. MAIN LOGIC
        // =====================================================

        const data = await checkInDomain({ userId });

        await logAttendanceAttempt({
            userId,
            action: "check_in",
            result: "success",
            metadata,
        });

        broadcastNotification("ATTENDANCE_UPDATE", {
            type: "success",
            memberId: userId,
        });

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (err: any) {
        let failureReason = "UNKNOWN_ERROR";

        if (err.code === "UNAUTHORIZED_ACCESS") {
            failureReason = "NO_SUBSCRIPTION";
        }

        if (err.code === "ALREADY_CHECKED_IN") {
            failureReason = "ALREADY_CHECKED_IN";
        }

        await logAttendanceAttempt({
            userId,
            action: "check_in",
            result: "failed",
            reason: failureReason,
            metadata,
        });

        broadcastNotification("ATTENDANCE_UPDATE", {
            type: "failed",
            memberId: userId,
            reason: failureReason,
        });

        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
});

export const checkOut = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const metadata = {
        qr_data: req.body?.qr_data ?? null,
        source: "mobile_qr",
    };

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Invalid user ID provided.",
        });
    }

    const validation = CheckInSchema.safeParse(req.body);

    if (!validation.success) {
        await logAttendanceAttempt({
            userId,
            action: "check_out",
            result: "failed",
            reason: "INVALID_QR_DATA",
            metadata,
        });

        return res.status(400).json({
            success: false,
            message: "Invalid QR code data",
            errors: validation.error,
        });
    }

    const { qr_data } = validation.data;

    if (qr_data !== "GYM:out") {
        await logAttendanceAttempt({
            userId,
            action: "check_out",
            result: "failed",
            reason: "INVALID_QR",
            metadata,
        });

        broadcastNotification("ATTENDANCE_ATTEMPT", {
            type: "failed",
            action: "check_out",
            memberId: userId,
            reason: "INVALID_QR",
        });

        return res.status(400).json({
            success: false,
            message: "Invalid gym QR code. Please scan the correct QR code",
        });
    }

    try {
        const data = await checkOutDomain({ userId });

        await logAttendanceAttempt({
            userId,
            action: "check_out",
            result: "success",
            metadata,
        });

        broadcastNotification("ATTENDANCE_UPDATE", {
            memberId: userId,
            status: "checked_out",
        });

        return res.status(200).json({
            success: true,
            message: "Check-out successful! Great workout! 🎉",
            data: data,
        });
    } catch (err: any) {
        const failureReason = mapFailureReason(err);

        await logAttendanceAttempt({
            userId,
            action: "check_out",
            result: "failed",
            reason: failureReason,
            metadata,
        });

        broadcastNotification("ATTENDANCE_ATTEMPT", {
            type: "failed",
            action: "check_out",
            memberId: userId,
            reason: failureReason,
        });

        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || "Check-out failed",
        });
    }
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
